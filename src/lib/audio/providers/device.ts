import * as Speech from 'expo-speech';

import type { Language } from '@/i18n/strings';
import type { SpeakCallbacks, SpeakOptions, SpeechProvider } from '../types';

const LOCALE: Record<Language, string> = { en: 'en-US', ar: 'ar-SA' };
const PREFERRED: Record<Language, string[]> = { en: ['en-us', 'en-gb', 'en-au'], ar: ['ar-sa', 'ar-ae', 'ar-eg'] };
const cache = new Map<Language, Promise<string[]>>();

/** Voices for the language, enhanced quality and common locales first. */
export function rankVoices(voices: Pick<Speech.Voice, 'identifier' | 'language' | 'quality'>[], language: Language): string[] {
  const locale = (v: { language: string }) => v.language.replace('_', '-').toLowerCase();
  const score = (v: (typeof voices)[number]) => {
    const idx = PREFERRED[language].indexOf(locale(v));
    return (v.quality === Speech.VoiceQuality.Enhanced ? 0 : 10) + (idx === -1 ? 5 : idx);
  };
  return voices
    .filter((v) => locale(v).startsWith(language))
    .sort((a, b) => score(a) - score(b))
    .map((v) => v.identifier);
}

function say(text: string, options: SpeakOptions, callbacks: SpeakCallbacks, retried: boolean) {
  Speech.speak(text, {
    language: LOCALE[options.language],
    pitch: options.pitch,
    rate: options.rate,
    voice: options.voice,
    onDone: callbacks.onDone,
    onError: (e: unknown) => {
      // A listed voice can still be missing its data; retry once with the system default.
      if (options.voice && !retried) say(text, { ...options, voice: undefined }, callbacks, true);
      else callbacks.onError(e);
    },
  });
}

/** Free system speech: iOS AVSpeechSynthesizer, Android TextToSpeech, Web Speech API. */
export const deviceSpeech: SpeechProvider = {
  id: 'device',
  isAvailable: () => true,
  speak: (text, options, callbacks) => say(text, options, callbacks, false),
  stop: () => {
    Speech.stop().catch(() => {});
  },
  listVoices(language) {
    let voices = cache.get(language);
    if (!voices) {
      voices = Speech.getAvailableVoicesAsync()
        .then((all) => rankVoices(all, language))
        .catch(() => []);
      cache.set(language, voices);
    }
    return voices;
  },
};
