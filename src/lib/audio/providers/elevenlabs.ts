import type { SpeechProvider } from '../types';

/**
 * Placeholder for premium ElevenLabs voices. It reports itself unavailable, so
 * the app always falls back to device speech until this is implemented.
 *
 * To implement: POST { text, voiceId, language } to `${getPremiumVoiceConfig().proxyUrl}/tts`
 * (a backend holding the ElevenLabs key), receive audio, play it with expo-audio,
 * and call onDone when playback ends. Then return true from isAvailable when proxyUrl is set.
 */
export const elevenLabsSpeech: SpeechProvider = {
  id: 'elevenlabs',
  isAvailable: () => false,
  speak: (_text, _options, callbacks) => callbacks.onError(new Error('Premium voices are not available yet')),
  stop: () => {},
  listVoices: async () => [],
};
