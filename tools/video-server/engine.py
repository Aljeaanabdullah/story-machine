"""
Local image-to-video engine: Wan2.2 TI2V-5B (Apache-2.0) on an 8 GB GPU.

Memory plan for 8 GB VRAM / 16 GB RAM:
  1. The UMT5-XXL text encoder is loaded in 4-bit (bitsandbytes), encodes the prompts,
     then is freed. Embeddings are cached by prompt so repeats skip this step.
  2. The diffusion transformer is a Q6_K GGUF quantisation (about 4.2 GB) and the
     pipeline uses model CPU offload, so only the active model sits on the GPU.
  3. The VAE decodes in tiles to avoid the end-of-run memory spike.
"""

from __future__ import annotations

import gc
import hashlib
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

import torch
from PIL import Image

HERE = Path(__file__).resolve().parent
MODELS = HERE / "models"
BASE = MODELS / "wan22"
GGUF = MODELS / os.environ.get("WAN_GGUF", "Wan2.2-TI2V-5B-Q6_K.gguf")

DTYPE = torch.bfloat16
FPS = 24

NEGATIVE = (
    "text, subtitles, watermark, logo, signature, static, still image, frozen, slideshow, "
    "blurry, low quality, jpeg artifacts, overexposed, oversaturated, deformed, distorted, "
    "flicker, jitter, morphing faces, extra limbs, ugly"
)


class Cancelled(Exception):
    pass


@dataclass
class Job:
    image: Path
    prompt: str
    out: Path
    width: int = 832
    height: int = 480
    frames: int = 81  # 4k+1; 81 frames at 24 fps is about 3.4 s
    steps: int = 30
    guidance: float = 5.0
    seed: int = 7
    negative: str = NEGATIVE


@dataclass
class Result:
    out: Path
    seconds: float
    peak_vram_gb: float
    frames: int
    width: int
    height: int


def _fit(image: Image.Image, width: int, height: int) -> Image.Image:
    """Center-crop the artwork to the target aspect ratio, then resize."""
    image = image.convert("RGB")
    w, h = image.size
    target = width / height
    if w / h > target:
        nw = int(h * target)
        image = image.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / target)
        image = image.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return image.resize((width, height), Image.LANCZOS)


def compress(src: Path, dst: Path) -> None:
    """Phone-friendly H.264 (about 1 MB per second) with the index up front for streaming."""
    import subprocess

    import imageio_ffmpeg

    subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(src), "-c:v", "libx264", "-preset", "slow",
         "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(dst)],
        check=True,
    )


class WanEngine:
    def __init__(self) -> None:
        self.pipe = None
        self._embeds: dict[str, torch.Tensor] = {}

    # ---- text encoding -------------------------------------------------
    def _encode(self, texts: list[str]) -> list[torch.Tensor]:
        missing = [t for t in texts if self._key(t) not in self._embeds]
        if missing:
            from transformers import AutoTokenizer, BitsAndBytesConfig, UMT5EncoderModel

            tok = AutoTokenizer.from_pretrained(BASE / "tokenizer")
            enc = UMT5EncoderModel.from_pretrained(
                BASE / "text_encoder",
                quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=DTYPE),
                torch_dtype=DTYPE,
                device_map={"": 0},
                low_cpu_mem_usage=True,
            )
            with torch.no_grad():
                for t in missing:
                    ids = tok([t], padding="max_length", max_length=512, truncation=True, add_special_tokens=True, return_attention_mask=True, return_tensors="pt")
                    mask = ids.attention_mask.to(0)
                    hidden = enc(ids.input_ids.to(0), mask).last_hidden_state.to(DTYPE)
                    n = int(mask.sum())
                    # Same layout as WanPipeline._get_t5_prompt_embeds: real tokens, then zeros to 512.
                    padded = torch.zeros_like(hidden)
                    padded[:, :n] = hidden[:, :n]
                    self._embeds[self._key(t)] = padded.cpu()
            del enc, tok
            self._free()
        return [self._embeds[self._key(t)] for t in texts]

    @staticmethod
    def _key(text: str) -> str:
        return hashlib.sha1(text.encode("utf-8")).hexdigest()

    # ---- diffusion pipeline -------------------------------------------
    def _load(self) -> None:
        if self.pipe is not None:
            return
        from diffusers import AutoencoderKLWan, GGUFQuantizationConfig, WanImageToVideoPipeline, WanTransformer3DModel

        transformer = WanTransformer3DModel.from_single_file(
            str(GGUF),
            quantization_config=GGUFQuantizationConfig(compute_dtype=DTYPE),
            config=str(BASE),
            subfolder="transformer",
            torch_dtype=DTYPE,
        )
        # bf16 VAE: 1.4 GB instead of 2.8 GB. It stays on the GPU next to the transformer
        # after encoding the first frame, so fp32 would push the 8 GB card into shared memory.
        vae = AutoencoderKLWan.from_pretrained(BASE / "vae", torch_dtype=DTYPE)
        pipe = WanImageToVideoPipeline.from_pretrained(
            BASE, transformer=transformer, vae=vae, text_encoder=None, tokenizer=None,
            image_encoder=None, image_processor=None, torch_dtype=DTYPE,
        )
        pipe.enable_model_cpu_offload()
        try:
            pipe.vae.enable_tiling()
        except Exception:
            pass
        pipe.set_progress_bar_config(disable=True)
        self.pipe = pipe

    def unload(self) -> None:
        self.pipe = None
        self._embeds.clear()
        self._free()

    @staticmethod
    def _free() -> None:
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    # ---- generation ----------------------------------------------------
    def generate(
        self,
        job: Job,
        on_progress: Optional[Callable[[str, float], None]] = None,
        cancelled: Optional[Callable[[], bool]] = None,
    ) -> Result:
        from diffusers.utils import export_to_video

        report = on_progress or (lambda stage, p: None)
        start = time.time()
        torch.cuda.reset_peak_memory_stats()

        report("encoding", 0.0)
        pos, neg = self._encode([job.prompt, job.negative])
        if cancelled and cancelled():
            raise Cancelled()

        report("loading", 0.0)
        self._load()
        image = _fit(Image.open(job.image), job.width, job.height)

        def step_end(pipe, i, t, kwargs):
            report("rendering", (i + 1) / job.steps)
            if cancelled and cancelled():
                pipe._interrupt = True
            return kwargs

        try:
            frames = self.pipe(
                image=image,
                prompt_embeds=pos.to(0),
                negative_prompt_embeds=neg.to(0),
                width=job.width,
                height=job.height,
                num_frames=job.frames,
                num_inference_steps=job.steps,
                guidance_scale=job.guidance,
                generator=torch.Generator("cpu").manual_seed(job.seed),
                callback_on_step_end=step_end,
            ).frames[0]
        finally:
            self._free()
        if cancelled and cancelled():
            raise Cancelled()

        report("encoding-video", 1.0)
        job.out.parent.mkdir(parents=True, exist_ok=True)
        raw = job.out.with_suffix(".raw.mp4")
        export_to_video(frames, str(raw), fps=FPS, quality=9)
        compress(raw, job.out)
        raw.unlink(missing_ok=True)
        peak = torch.cuda.max_memory_allocated() / 1024**3
        return Result(job.out, time.time() - start, peak, job.frames, job.width, job.height)


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Generate one image-to-video clip with Wan2.2 TI2V-5B.")
    ap.add_argument("image")
    ap.add_argument("prompt")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=832)
    ap.add_argument("--height", type=int, default=480)
    ap.add_argument("--frames", type=int, default=81)
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()

    eng = WanEngine()
    last = [-1]

    def prog(stage: str, p: float) -> None:
        pct = int(p * 100)
        if pct != last[0] and (pct % 10 == 0 or stage != "rendering"):
            last[0] = pct
            print(f"[{time.strftime('%H:%M:%S')}] {stage} {pct}%", flush=True)

    r = eng.generate(Job(Path(a.image), a.prompt, Path(a.out), a.width, a.height, a.frames, a.steps, seed=a.seed), prog)
    print(f"done: {r.out} in {r.seconds:.0f}s, peak VRAM (torch) {r.peak_vram_gb:.2f} GB, {r.frames} frames {r.width}x{r.height}")
