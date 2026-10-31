import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { cachedAudio } from '../cache';
import { getTTSServerUrl } from '../config';
import type { SpeakOptions, SpeechProvider } from '../types';
import { EMOTION_SHAPES, VOICE_PROFILES } from '../voices';

const HEALTH_TIMEOUT_MS = 2500;
const TTS_TIMEOUT_MS = 30000;

function requestBody(text: string, o: SpeakOptions) {
  // The server picks the voice per role and acts out the emotion itself, so only the user's speed is sent.
  const userRate = o.rate / (VOICE_PROFILES[o.role].rate * EMOTION_SHAPES[o.emotion].rate);
  return JSON.stringify({ text, language: o.language, role: o.role, emotion: o.emotion, rate: Math.round(userRate * 100) / 100 });
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function audioUri(base: string, text: string, o: SpeakOptions): Promise<string> {
  const body = requestBody(text, o);
  return cachedAudio(`${base}|${body}`, async () => {
    const res = await fetchWithTimeout(`${base}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }, TTS_TIMEOUT_MS);
    if (!res.ok) throw new Error(`tts ${res.status}`);
    return res.arrayBuffer();
  });
}

/**
 * Realistic neural voices from the free local Piper server on your PC
 * (tools/tts-server). Audio is cached on the phone, so replays work offline.
 */
export function createNeuralSpeech(baseUrl: () => string = getTTSServerUrl): SpeechProvider {
  let player: AudioPlayer | null = null;
  let generation = 0;

  const release = () => {
    if (!player) return;
    try {
      player.pause();
      player.remove();
    } catch {
      // already released
    }
    player = null;
  };

  return {
    id: 'neural',
    isAvailable: () => baseUrl() !== '',

    async prepare() {
      if (!baseUrl()) return false;
      try {
        const res = await fetchWithTimeout(`${baseUrl()}/health`, {}, HEALTH_TIMEOUT_MS);
        return res.ok;
      } catch {
        return false;
      }
    },

    speak(text, options, callbacks) {
      const mine = ++generation;
      release();
      audioUri(baseUrl(), text, options)
        .then((uri) => {
          if (mine !== generation) return;
          const p = createAudioPlayer({ uri });
          player = p;
          // The server already renders whispers quieter, so apply only the user's voice volume here.
          p.volume = Math.min(1, options.volume / EMOTION_SHAPES[options.emotion].volume);
          let finished = false;
          p.addListener('playbackStatusUpdate', (status) => {
            if (mine !== generation || finished) return;
            if (status.didJustFinish) {
              finished = true;
              release();
              callbacks.onDone();
            } else if (status.error) {
              finished = true;
              release();
              callbacks.onError(new Error(status.error));
            }
          });
          p.play();
        })
        .catch((e) => {
          if (mine === generation) callbacks.onError(e);
        });
    },

    prefetch(text, options) {
      if (baseUrl()) audioUri(baseUrl(), text, options).catch(() => {});
    },

    stop() {
      generation++;
      release();
    },

    listVoices: async () => [],
  };
}

/**
 * Uses `primary` while it works and silently switches to `fallback` (device speech)
 * for the rest of the session the moment it is unreachable or fails.
 */
export function withFallback(primary: SpeechProvider, fallback: SpeechProvider): SpeechProvider {
  let degraded = !primary.isAvailable();
  const active = () => (degraded ? fallback : primary);
  return {
    id: primary.id,
    isAvailable: () => true,
    activeId: () => active().id,
    async prepare() {
      degraded = !primary.isAvailable() || !(await (primary.prepare?.() ?? Promise.resolve(true)));
      return true;
    },
    speak(text, options, callbacks) {
      if (degraded) return fallback.speak(text, options, callbacks);
      primary.speak(text, options, {
        onDone: callbacks.onDone,
        onError: () => {
          degraded = true;
          fallback.speak(text, options, callbacks);
        },
      });
    },
    prefetch(text, options) {
      if (!degraded) primary.prefetch?.(text, options);
    },
    stop() {
      primary.stop();
      fallback.stop();
    },
    listVoices: (language) => fallback.listVoices(language),
  };
}
