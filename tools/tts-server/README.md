# Local neural TTS server (free)

Realistic voices for StoryVerse generated **on your own PC** by [Piper](https://github.com/OHF-Voice/piper1-gpl)
(open source, runs offline on CPU). No accounts, no API keys, no cost. The phone fetches audio over your Wi-Fi
and caches it, so replays work offline.

## Setup (once)

```powershell
powershell -ExecutionPolicy Bypass -File tools/tts-server/setup.ps1
```

This downloads about 370 MB of voice models into `tools/tts-server/voices/` (git-ignored).

## Run

```bash
npm run tts
```

Add the server to `.env.local` (no secret: it is a LAN address), then restart Expo:

```
EXPO_PUBLIC_TTS_SERVER_URL=http://<your-PC-LAN-IP>:5002
```

In the app, go to **Settings → Narration → Neural voices (your PC, free)**. If Windows Firewall asks, allow
Python on **private networks**, or the phone cannot reach the server. When the PC is off, the app falls back to
device speech automatically.

## Voices

| Role | English | Arabic |
|---|---|---|
| Narrator | en_US-ryan-high | ar_JO-kareem-medium |
| Hero | en_US-lessac-medium | kareem, pitch ×1.10 |
| Villain | en_GB-alan-medium, pitch ×0.84 | kareem, pitch ×0.82 |
| Character | en_US-amy-medium | kareem, pitch ×1.28 |

Piper has only one Arabic voice (kareem), so the Arabic roles differ by pitch. Arabic text is diacritized
automatically (tashkeel) before synthesis. Emotions (excited, fearful, whisper, calm) change pace, expressiveness
and volume.

## Licences

The Piper engine is GPL-3.0. It runs only on your PC and is not bundled in the app. Voice licences differ:
`en_US-ryan-high` is **CC BY-NC-SA 4.0** (non-commercial), `lessac` uses the Blizzard 2013 licence (research),
and `amy`, `alan` and `kareem` point to their dataset sources. Fine for this educational prototype. Review each
voice's `MODEL_CARD` before any commercial release.
