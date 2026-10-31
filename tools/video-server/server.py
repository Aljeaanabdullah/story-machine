"""
StoryVerse local AI video server: one GPU job at a time, on your own PC.

  GET    /health             model + queue status
  POST   /jobs               {"slot": "world-lost-island", "prompt": "...", "seed": 7}
  GET    /jobs/<id>          status, stage and progress
  DELETE /jobs/<id>          cancel a queued or running job
  GET    /videos/<name>.mp4  finished clip (supports Range requests for video players)

Only loopback and private-network clients (home Wi-Fi) are answered; anything
else gets 403. Never port-forward this server to the internet.
"""

from __future__ import annotations

import hashlib
import ipaddress
import json
import os
import queue
import re
import sys
import threading
import time
import traceback
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
ART = ROOT / "assets" / "art"
OUT = HERE / "outputs"
PORT = int(os.environ.get("VIDEO_PORT", "5003"))

# Generation presets. "safe" is the fallback after a GPU out-of-memory error.
PRESETS = {
    "standard": dict(width=832, height=480, frames=81, steps=30),
    "safe": dict(width=640, height=352, frames=49, steps=25),
}
MODEL = "Wan2.2-TI2V-5B (Q6_K GGUF)"
MAX_PROMPT = 1200
IDLE_UNLOAD_S = 600
SLOT = re.compile(r"^[a-z0-9-]{1,64}$")


# Home-network ranges only (Python's is_private also covers documentation ranges).
LOCAL_NETS = [ipaddress.ip_network(n) for n in ("127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "169.254.0.0/16", "::1/128", "fc00::/7", "fe80::/10")]


def allowed(host: str) -> bool:
    try:
        ip = ipaddress.ip_address(host.split("%")[0])
    except ValueError:
        return False
    if getattr(ip, "ipv4_mapped", None):
        ip = ip.ipv4_mapped
    return any(ip in net for net in LOCAL_NETS)


def cache_name(slot: str, prompt: str, seed: int, preset: str) -> str:
    raw = json.dumps([slot, prompt, seed, PRESETS[preset], MODEL], ensure_ascii=False)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:20]


class Queue:
    def __init__(self) -> None:
        self.jobs: dict[str, dict] = {}
        self.lock = threading.Lock()
        self.pending: "queue.Queue[str]" = queue.Queue()
        self.engine = None
        threading.Thread(target=self._worker, daemon=True).start()

    def submit(self, slot: str, prompt: str, seed: int) -> dict:
        name = cache_name(slot, prompt, seed, "standard")
        with self.lock:
            # Same request already running or queued: share it.
            for j in self.jobs.values():
                if j["name"] == name and j["status"] in ("queued", "rendering"):
                    return self._public(j)
            job = dict(id=uuid.uuid4().hex[:12], name=name, slot=slot, prompt=prompt, seed=seed,
                       status="queued", stage="queued", progress=0.0, error=None, cancel=False,
                       created=time.time(), seconds=None, preset="standard")
            if (OUT / f"{name}.mp4").exists():
                job.update(status="ready", stage="cached", progress=1.0)
            self.jobs[job["id"]] = job
        if job["status"] == "queued":
            self.pending.put(job["id"])
        return self._public(job)

    def get(self, job_id: str) -> dict | None:
        with self.lock:
            j = self.jobs.get(job_id)
            return self._public(j) if j else None

    def cancel(self, job_id: str) -> dict | None:
        with self.lock:
            j = self.jobs.get(job_id)
            if not j:
                return None
            if j["status"] in ("queued", "rendering"):
                j["cancel"] = True
                if j["status"] == "queued":
                    j.update(status="cancelled", stage="cancelled")
            return self._public(j)

    def stats(self) -> dict:
        with self.lock:
            active = [j for j in self.jobs.values() if j["status"] in ("queued", "rendering")]
        return dict(queued=len(active), busy=any(j["status"] == "rendering" for j in active))

    def _public(self, j: dict) -> dict:
        out = {k: j[k] for k in ("id", "status", "stage", "progress", "error", "seconds")}
        if j["status"] == "ready":
            out["video"] = f"/videos/{j['name']}.mp4"
        return out

    def _worker(self) -> None:
        while True:
            try:
                job_id = self.pending.get(timeout=IDLE_UNLOAD_S)
            except queue.Empty:
                # Give the GPU back (games, other apps) when nobody has asked for a clip in a while.
                if self.engine is not None:
                    self.engine.unload()
                    self.engine = None
                    print("[video] idle: model unloaded from GPU", flush=True)
                continue
            with self.lock:
                job = self.jobs.get(job_id)
                if not job or job["cancel"]:
                    continue
                job.update(status="rendering", stage="starting")
            self._run(job)

    def _run(self, job: dict) -> None:
        import torch
        from engine import Cancelled, Job, WanEngine

        if self.engine is None:
            self.engine = WanEngine()

        def progress(stage: str, p: float) -> None:
            with self.lock:
                job.update(stage=stage, progress=round(p, 3))

        for preset in ("standard", "safe"):
            try:
                job["preset"] = preset
                tmp = OUT / f"{job['name']}.part.mp4"
                r = self.engine.generate(
                    Job(image=ART / f"{job['slot']}.webp", prompt=job["prompt"], out=tmp, seed=job["seed"], **PRESETS[preset]),
                    on_progress=progress, cancelled=lambda: job["cancel"],
                )
                tmp.replace(OUT / f"{job['name']}.mp4")
                with self.lock:
                    job.update(status="ready", stage="done", progress=1.0, seconds=round(r.seconds))
                print(f"[video] {job['id']} ready in {r.seconds:.0f}s ({preset}), peak {r.peak_vram_gb:.2f} GB", flush=True)
                return
            except Cancelled:
                with self.lock:
                    job.update(status="cancelled", stage="cancelled")
                return
            except torch.cuda.OutOfMemoryError:
                print(f"[video] {job['id']} GPU out of memory on '{preset}'", flush=True)
                self.engine.unload()
                if preset == "safe":
                    with self.lock:
                        job.update(status="failed", stage="failed", error="gpu_out_of_memory")
                    return
                progress("retrying-smaller", 0.0)
            except Exception as e:  # noqa: BLE001 - report any engine failure to the app
                traceback.print_exc()
                self.engine.unload()
                with self.lock:
                    job.update(status="failed", stage="failed", error=type(e).__name__)
                return


Q: Queue
GPU: str | None = None


class Handler(BaseHTTPRequestHandler):
    server_version = "StoryVerseVideo/1"

    def log_message(self, fmt, *args):  # quieter log
        if "/jobs/" not in (args[0] if args else ""):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _guard(self) -> bool:
        if allowed(self.client_address[0]):
            return True
        self.send_error(403)
        return False

    def _json(self, code: int, body: dict) -> None:
        data = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        if not self._guard():
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")
        self.end_headers()

    def do_GET(self):
        if not self._guard():
            return
        path = self.path.split("?")[0]
        if path == "/health":
            return self._json(200, dict(ok=GPU is not None, model=MODEL, gpu=GPU, **Q.stats()))
        m = re.fullmatch(r"/jobs/([0-9a-f]{12})", path)
        if m:
            j = Q.get(m.group(1))
            return self._json(200, j) if j else self._json(404, dict(error="not_found"))
        m = re.fullmatch(r"/videos/([0-9a-f]{20})\.mp4", path)
        if m:
            return self._video(OUT / f"{m.group(1)}.mp4")
        self._json(404, dict(error="not_found"))

    def do_POST(self):
        if not self._guard():
            return
        if self.path != "/jobs":
            return self._json(404, dict(error="not_found"))
        try:
            n = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(min(n, 16384)) or b"{}")
            slot, prompt, seed = str(body.get("slot", "")), str(body.get("prompt", "")).strip(), int(body.get("seed", 7))
        except (ValueError, TypeError):
            return self._json(400, dict(error="bad_request"))
        if not SLOT.match(slot) or not (ART / f"{slot}.webp").exists():
            return self._json(400, dict(error="unknown_image"))
        if not prompt or len(prompt) > MAX_PROMPT:
            return self._json(400, dict(error="bad_prompt"))
        self._json(202, Q.submit(slot, prompt, seed % 2**31))

    def do_DELETE(self):
        if not self._guard():
            return
        m = re.fullmatch(r"/jobs/([0-9a-f]{12})", self.path)
        j = Q.cancel(m.group(1)) if m else None
        self._json(200, j) if j else self._json(404, dict(error="not_found"))

    def _video(self, f: Path) -> None:
        if not f.exists():
            return self._json(404, dict(error="not_found"))
        size = f.stat().st_size
        start, end = 0, size - 1
        rng = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", "") or "")
        if rng and (rng.group(1) or rng.group(2)):
            if rng.group(1):
                start = int(rng.group(1))
                end = min(int(rng.group(2)), size - 1) if rng.group(2) else size - 1
            else:
                start = max(0, size - int(rng.group(2)))
            if start > end:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{size}")
                self.end_headers()
                return
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        else:
            self.send_response(200)
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.end_headers()
        with open(f, "rb") as fh:
            fh.seek(start)
            left = end - start + 1
            while left > 0:
                chunk = fh.read(min(1 << 16, left))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    return
                left -= len(chunk)


if __name__ == "__main__":
    sys.path.insert(0, str(HERE))
    OUT.mkdir(exist_ok=True)
    import torch

    GPU = torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    Q = Queue()
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"StoryVerse video server on :{PORT} ({MODEL}); private-network clients only", flush=True)
    srv.serve_forever()
