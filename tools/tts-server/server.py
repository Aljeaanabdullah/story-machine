"""
StoryVerse local neural TTS server — free, offline, no API keys.

Runs Piper (open-source neural TTS) on your own PC and serves WAV audio to the
app over your Wi-Fi. Nothing leaves your network and nothing costs money.

    tools/tts-server/.venv/Scripts/python tools/tts-server/server.py   (Windows)

Then set EXPO_PUBLIC_TTS_SERVER_URL=http://<your-PC-LAN-IP>:5002 in .env.local
and choose "Neural voices (local PC)" in the app's Settings.

Endpoints:
  GET  /health   -> {"ok": true, "engine": "piper", "voices": {...}}
  POST /tts      {"text", "language": "en"|"ar", "role", "emotion"?, "rate"?} -> audio/wav
"""

from __future__ import annotations

import io
import json
import os
import sys
import threading
import wave
from collections import OrderedDict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

HERE = Path(__file__).resolve().parent
VOICE_DIR = HERE / "voices"
PORT = int(os.environ.get("TTS_PORT", "5002"))
MAX_CHARS = 800

# Role -> (Piper voice, pitch factor). Arabic has one good Piper voice, so roles
# are separated by pitch; English uses a different speaker per role.
ROLES: dict[str, dict[str, tuple[str, float]]] = {
    "en": {
        "narrator": ("en_US-ryan-high", 1.0),
        "hero": ("en_US-lessac-medium", 1.0),
        "villain": ("en_GB-alan-medium", 0.84),
        "companion": ("en_US-amy-medium", 1.04),
    },
    "ar": {
        "narrator": ("ar_JO-kareem-medium", 1.0),
        "hero": ("ar_JO-kareem-medium", 1.1),
        "villain": ("ar_JO-kareem-medium", 0.82),
        "companion": ("ar_JO-kareem-medium", 1.28),
    },
}

# Emotion -> (length scale multiplier, noise scale, volume)
EMOTIONS: dict[str, tuple[float, float, float]] = {
    "neutral": (1.0, 0.667, 1.0),
    "excited": (0.9, 0.8, 1.0),
    "fearful": (0.95, 0.85, 0.9),
    "whisper": (1.1, 0.5, 0.6),
    "calm": (1.08, 0.55, 0.95),
}

_voices: dict[str, PiperVoice] = {}
_voice_lock = threading.Lock()
_cache: OrderedDict[str, bytes] = OrderedDict()
_cache_lock = threading.Lock()


def voice(name: str) -> PiperVoice:
    with _voice_lock:
        if name not in _voices:
            v = PiperVoice.load(str(VOICE_DIR / f"{name}.onnx"))
            if name.startswith("ar_"):
                v.use_tashkeel = True  # automatic Arabic diacritics for better pronunciation
            _voices[name] = v
        return _voices[name]


def synthesize(text: str, language: str, role: str, emotion: str, rate: float) -> bytes:
    lang = ROLES.get(language, ROLES["en"])
    name, pitch = lang.get(role, lang["narrator"])
    length_mul, noise, volume = EMOTIONS.get(emotion, EMOTIONS["neutral"])
    # Pitch shift without changing duration: render slower by `pitch`, then play
    # back faster by the same factor via the WAV sample rate.
    length_scale = length_mul * pitch / max(0.5, min(2.0, rate))
    v = voice(name)
    raw = io.BytesIO()
    with wave.open(raw, "wb") as w:
        v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=length_scale, noise_scale=noise, volume=volume))
    raw.seek(0)
    with wave.open(raw, "rb") as r:
        params, frames = r.getparams(), r.readframes(r.getnframes())
    out = io.BytesIO()
    with wave.open(out, "wb") as w:
        w.setnchannels(params.nchannels)
        w.setsampwidth(params.sampwidth)
        w.setframerate(int(params.framerate * pitch))
        w.writeframes(frames)
    return out.getvalue()


class Handler(BaseHTTPRequestHandler):
    server_version = "StoryVerseTTS/1.0"

    def _headers(self, status: int, ctype: str, length: int) -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(length))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _json(self, status: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode()
        self._headers(status, "application/json; charset=utf-8", len(data))
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:  # CORS preflight for the web build
        self._headers(204, "text/plain", 0)

    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/health":
            self._json(200, {"ok": True, "engine": "piper", "voices": {k: {r: n for r, (n, _) in v.items()} for k, v in ROLES.items()}})
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/tts":
            self._json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(min(length, 16_384)) or b"{}")
            text = str(body.get("text", "")).strip()[:MAX_CHARS]
            if not text:
                self._json(400, {"error": "text is required"})
                return
            language = "ar" if body.get("language") == "ar" else "en"
            role = str(body.get("role", "narrator"))
            emotion = str(body.get("emotion", "neutral"))
            rate = float(body.get("rate", 1) or 1)
            key = json.dumps([text, language, role, emotion, round(rate, 2)], ensure_ascii=False)
            with _cache_lock:
                audio = _cache.get(key)
                if audio is not None:
                    _cache.move_to_end(key)
            if audio is None:
                audio = synthesize(text, language, role, emotion, rate)
                with _cache_lock:
                    _cache[key] = audio
                    while len(_cache) > 300:
                        _cache.popitem(last=False)
            self._headers(200, "audio/wav", len(audio))
            self.wfile.write(audio)
        except Exception as e:  # noqa: BLE001 — report, never crash the server
            self._json(500, {"error": type(e).__name__})

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[tts] " + (fmt % args) + "\n")


def main() -> None:
    missing = [n for lang in ROLES.values() for n, _ in lang.values() if not (VOICE_DIR / f"{n}.onnx").exists()]
    if missing:
        sys.exit(f"Missing voices in {VOICE_DIR}: {sorted(set(missing))}. Run tools/tts-server/setup.ps1 first.")
    print(f"[tts] StoryVerse neural TTS on http://0.0.0.0:{PORT}  (Ctrl+C to stop)")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
