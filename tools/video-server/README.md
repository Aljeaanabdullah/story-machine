# Local AI scene video (free, on your own GPU)

Turns a scene's world painting into a short **AI-generated** clip with real motion
(water, mist, foliage, camera move) using **Wan2.2 TI2V-5B** image-to-video.
Everything runs on your PC. There are no API keys, no cloud, and no cost.

| | |
|---|---|
| Model | [Wan-AI/Wan2.2-TI2V-5B](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B-Diffusers) (Apache-2.0) |
| Transformer | [QuantStack Q6_K GGUF](https://huggingface.co/QuantStack/Wan2.2-TI2V-5B-GGUF) (Apache-2.0), about 4.2 GB |
| Text encoder | UMT5-XXL, loaded 4-bit (bitsandbytes) only while encoding |
| Default clip | 832×480, 81 frames, 24 fps (about 3.4 s), 30 steps |
| Fallback on GPU out-of-memory | 640×352, 49 frames, 25 steps |
| Tested on | RTX 5070 Laptop (8 GB VRAM), 16 GB RAM, Windows 11, PyTorch 2.11 cu128 |

## Setup (one time, about 17 GB download)

```powershell
powershell -ExecutionPolicy Bypass -File tools/video-server/setup.ps1
```

## Run

```bash
npm run video
```

Then put `EXPO_PUBLIC_VIDEO_SERVER_URL=http://<your-PC-LAN-IP>:5003` in `.env.local` and restart Expo.
In a story, tap **Generate AI Video**. Clips are rendered one at a time, cached by
prompt and seed, and saved with the story on the phone.

Command line (single clip):

```bash
tools/video-server/.venv/Scripts/python tools/video-server/engine.py assets/art/world-lost-island.webp "prompt…" out.mp4
```

## Safety

- The server answers only loopback and private-network (home Wi-Fi) addresses. Others get 403.
  **Never port-forward it.** It has no authentication.
- Model weights (`models/`), outputs and the virtualenv are git-ignored.
- Generation happens only when the player taps the button. Nothing renders automatically.

## Licences

Wan2.2 weights: Apache-2.0. You are responsible for how generated content is used, as
the model card states. LTX-Video was considered too: its licence is free only for
entities under US$10M annual revenue, which is why Wan2.2 is the default.
