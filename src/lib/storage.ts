import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Language } from '@/i18n/strings';
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
};

export const DEFAULT_SETTINGS: Settings = {
  uiLanguage: 'en',
  storyLanguage: 'en',
  reduceMotion: false,
  haptics: true,
  model: '',
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
    };
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
