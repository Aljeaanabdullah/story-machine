# StoryVerse AI

**Your Imagination. Your World. Your Story. — خيالك يصنع عالمك وقصتك**

A cinematic, bilingual (English / Arabic) interactive storytelling app built with Expo, TypeScript and
Expo Router. Stories are generated with free OpenRouter models. Built for the CODED Weekend Challenge — The Story Machine.

## Modes

- **Interactive Adventure**: 5–6 scenes, exactly 3 choices per scene, with a compact story state that keeps your choices, location, companions and discoveries consistent.
- **Short Story**: an original 400–600 word tale.
- **Bedtime Story**: gentle, age-appropriate stories for children.

## Version 2: audio and cinematic scenes

- **Listen to Story / Scene**: device text-to-speech (`expo-speech`, free, works in Expo Go) with pause / resume / stop, progress and paragraph highlight. It never autoplays.
- **Character voices**: quoted dialogue is split from narration and voiced as narrator, hero, villain or a generic character (English and Arabic). It can be switched to narrator-only in Settings.
- **Scene model** (`src/lib/media`): each scene has an image slot (world art placeholder plus an image prompt), motion hints, a video slot, and a timeline builder for future video rendering.
- **Motion**: a slow Ken Burns camera move over scene art, turned off by reduced motion.
- **Premium voices**: ElevenLabs is stubbed behind a provider interface and stays disabled (see Version 3). Never put an ElevenLabs key in an `EXPO_PUBLIC_*` variable.

Details (Arabic): [docs/REPORT-V2-ar.md](docs/REPORT-V2-ar.md).

## Version 3: free cinematic upgrade

Everything here is free. There are no subscriptions, no card, and no paid API calls.

- **Neural voices**: [tools/tts-server](tools/tts-server/README.md) runs open-source Piper on your PC (`npm run tts`), with a different voice per role in English, one Arabic voice with pitch-shifted roles, and emotion hints. Audio is cached on the phone. Device speech is the automatic fallback. Samples: [docs/voice-samples](docs/voice-samples).
- **Sound**: 10 original synthesised ambience loops and effects (`npm run sfx`) that duck under voices. Voice, ambience and effects volumes are set separately.
- **Scene video**: MP4 playback with expo-video (watch, pause, replay, error, and image fallback) and MP4 import. A 5 s demo clip is rendered free with FFmpeg ([scripts/make-demo-video.js](scripts/make-demo-video.js)). It is not AI video, because no free, card-free image-to-video API exists today.
- **Motion**: parallax fog, light motes and a scene light sweep, all off with reduced motion.

Details (Arabic): [docs/REPORT-V3-ar.md](docs/REPORT-V3-ar.md).

## Version 4: real local AI video

- **Generate AI Video** turns the scene's world painting into a real image-to-video clip using **Wan2.2 TI2V-5B** (Apache-2.0) on your own NVIDIA GPU, through [tools/video-server](tools/video-server/README.md) (`npm run video`). It is free, uses no cloud, and never renders automatically.
- On an 8 GB RTX 5070 Laptop: 832×480, 81 frames (3.4 s), about 6.5–7 minutes per clip, 6.84 GB peak VRAM. Sample: [docs/ai-video](docs/ai-video).
- Prompts are built from the world, location, scene moment, the player's last choice, the ambience motion and the camera move. One seed per story keeps the look consistent.
- The app has a queue, progress, cancel and a cache. If the GPU runs out of memory it retries at a smaller size, and if the server is down it falls back to the image. The server answers home-network clients only.

Details (Arabic): [docs/REPORT-V4-ar.md](docs/REPORT-V4-ar.md).

## Setup

```bash
npm install
cp .env.example .env.local   # then put your OpenRouter key in .env.local
npm start                     # Expo dev server; scan the QR code with Expo Go
```

`.env.local`:

```
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
EXPO_PUBLIC_OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
EXPO_PUBLIC_OPENROUTER_FALLBACK_MODELS=google/gemma-4-31b-it:free,nvidia/nemotron-3.5-lightning:free
```

Only models ending in `:free` are accepted. The model can also be changed in **Settings**.

## Security

> **Prototype only.** `EXPO_PUBLIC_*` values are embedded in the app bundle, so the key can be
> extracted from any build. Do **not** publish this build. A backend proxy must hold the key before any public release.

- `.env.local` is git-ignored. `npm run check:secrets` fails if a key or env file is ever tracked.
- Errors shown to users never include the key or raw API responses.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Sync artwork slots, then start Expo |
| `npm test` | 186 unit/integration tests (mocked network, no key needed) |
| `npm run test:live` | Real OpenRouter run: 3 stories + a full Arabic adventure (needs `.env.local`; ~10 free requests) |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm run check:secrets` | Verify no keys are tracked by git |
| `npm run art` | Re-scan `assets/art/` after adding illustrations |
| `npm run tts` / `npm run video` | Local Piper voice server / local Wan2.2 video server |

## Artwork

Illustrations go in `assets/art/` using the slot names in [assets/art/README.md](assets/art/README.md).
Missing slots fall back to built-in vector art.

## Project structure

```
src/app/          screens (Expo Router)
src/components/   UI kit and artwork components
src/lib/ai/       OpenRouter client, prompts, JSON extraction, config
src/lib/story/    story engine, validation, generation, factories
src/state/        settings, stories (persisted), creation draft
src/i18n/         EN/AR strings and RTL direction helpers
tests/            Jest tests; tests/live = real API tests
```
