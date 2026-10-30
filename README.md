# StoryVerse AI

**Your Imagination. Your World. Your Story. — خيالك يصنع عالمك وقصتك**

A cinematic, bilingual (English / Arabic) interactive storytelling app built with Expo, TypeScript and
Expo Router. Stories are generated with free OpenRouter models. Built for the CODED Weekend Challenge — The Story Machine.

## Modes

- **Interactive Adventure**: 5–6 scenes, exactly 3 choices per scene, with a compact story state that keeps your choices, location, companions and discoveries consistent.
- **Short Story**: an original 400–600 word tale.
- **Bedtime Story**: gentle, age-appropriate stories for children.

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
| `npm test` | 91 unit/integration tests (mocked network, no key needed) |
| `npm run test:live` | Real OpenRouter run: 3 stories + a full Arabic adventure (needs `.env.local`; ~10 free requests) |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm run check:secrets` | Verify no keys are tracked by git |
| `npm run art` | Re-scan `assets/art/` after adding illustrations |

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
