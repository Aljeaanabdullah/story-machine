import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Language } from '@/i18n/strings';
import type { TTSProviderId } from '@/lib/audio/types';
import { SPEECH_RATES } from '@/lib/audio/voices';
import type { Story } from '@/lib/story/types';

const STORIES_KEY = 'storyverse.stories.v1';
const SETTINGS_KEY = 'storyverse.settings.v1';

export type Settings = {
  uiLanguage: Language;
  storyLanguage: Language;
  reduceMotion: boolean;
  haptics: boolean;
  /** Empty string means "use the model from .env.local". */
  model: string;
  /** Reading text size multiplier for story text. */
  textScale: number;
  /** Text-to-speech engine for narration; falls back to device speech when unavailable. */
  voiceProvider: TTSProviderId;
  /** Distinct hero / villain / character voices instead of narrator only. */
  multiVoice: boolean;
  /** Narration speed multiplier. */
  speechRate: number;
};

export const TEXT_SCALES = [1, 1.15, 1.3] as const;

export const DEFAULT_SETTINGS: Settings = {
  uiLanguage: 'en',
  storyLanguage: 'en',
  reduceMotion: false,
  haptics: true,
  model: '',
  textScale: 1,
  voiceProvider: 'device',
  multiVoice: true,
  speechRate: 1,
};

function isStory(x: unknown): x is Story {
  if (!x || typeof x !== 'object') return false;
  const s = x as Partial<Story>;
  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    (s.mode === 'short' || s.mode === 'adventure' || s.mode === 'bedtime') &&
    typeof s.createdAt === 'number'
  );
}

/** Loads saved stories, silently dropping corrupt entries instead of failing the whole library. */
export async function loadStories(): Promise<Story[]> {
  try {
    const raw = await AsyncStorage.getItem(STORIES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStory);
  } catch {
    return [];
  }
}

export async function saveStories(stories: Story[]): Promise<void> {
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories.filter((s) => s.saved)));
}

export async function loadSettings(): Promise<Settings | null> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const lang = (v: unknown): Language => (v === 'ar' ? 'ar' : 'en');
    return {
      uiLanguage: lang(parsed.uiLanguage),
      storyLanguage: lang(parsed.storyLanguage),
      reduceMotion: parsed.reduceMotion === true,
      haptics: parsed.haptics !== false,
      model: typeof parsed.model === 'string' ? parsed.model : '',
      textScale: (TEXT_SCALES as readonly number[]).includes(parsed.textScale as number) ? (parsed.textScale as number) : 1,
      voiceProvider: parsed.voiceProvider === 'elevenlabs' ? 'elevenlabs' : 'device',
      multiVoice: parsed.multiVoice !== false,
      speechRate: (SPEECH_RATES as readonly number[]).includes(parsed.speechRate as number) ? (parsed.speechRate as number) : 1,
    };
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
