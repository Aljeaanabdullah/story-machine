import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAdventure } from '@/lib/story/engine';
import { makeAdventureStory, makeProseStory, touch } from '@/lib/story/factory';
import { DEFAULT_SETTINGS, loadSettings, loadStories, saveSettings, saveStories } from '@/lib/storage';
import { storyProgress } from '@/lib/story/types';
import { draftFor } from './helpers';

const STORIES_KEY = 'storyverse.stories.v1';
const SETTINGS_KEY = 'storyverse.settings.v1';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('story persistence', () => {
  it('saves and loads only stories marked as saved', async () => {
    const kept = touch(makeProseStory(draftFor('short'), 'Kept', 'content'), { saved: true });
    const dropped = makeProseStory(draftFor('short'), 'Unsaved', 'content');
    await saveStories([kept, dropped]);
    const loaded = await loadStories();
    expect(loaded.map((s) => s.title)).toEqual(['Kept']);
    expect(loaded[0]).toEqual(kept);
  });

  it('round-trips an in-progress adventure with choices and character info', async () => {
    const adv = { ...createAdventure('Lost Island'), choices: [{ scene: 1, index: 2, text: 'Enter the cave' }] };
    const story = makeAdventureStory(draftFor('adventure', 'ar'), adv);
    await saveStories([story]);
    const [loaded] = await loadStories();
    expect(loaded.adventure?.choices).toEqual(adv.choices);
    expect(loaded.draft.character.name).toBe('Faisal');
    expect(loaded.language).toBe('ar');
    expect(loaded.saved).toBe(true);
    expect(storyProgress(loaded)).toEqual({ current: 0, total: 6, done: false });
  });

  it('returns an empty library for missing or corrupt data', async () => {
    expect(await loadStories()).toEqual([]);
    await AsyncStorage.setItem(STORIES_KEY, '{not json');
    expect(await loadStories()).toEqual([]);
    await AsyncStorage.setItem(STORIES_KEY, JSON.stringify({ not: 'an array' }));
    expect(await loadStories()).toEqual([]);
  });

  it('drops individual corrupt entries but keeps valid ones', async () => {
    const good = touch(makeProseStory(draftFor('bedtime'), 'Good', 'c'), { saved: true });
    await AsyncStorage.setItem(STORIES_KEY, JSON.stringify([good, { id: 1 }, null, { id: 'x', title: 'bad mode', mode: 'poem', createdAt: 1 }]));
    expect((await loadStories()).map((s) => s.title)).toEqual(['Good']);
  });
});

describe('settings persistence and language selection', () => {
  it('returns null when nothing is saved', async () => {
    expect(await loadSettings()).toBeNull();
  });

  it('round-trips Arabic language settings', async () => {
    const s = { ...DEFAULT_SETTINGS, uiLanguage: 'ar' as const, storyLanguage: 'ar' as const, reduceMotion: true, model: 'x/y:free' };
    await saveSettings(s);
    expect(await loadSettings()).toEqual(s);
  });

  it('sanitises unknown values', async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ uiLanguage: 'fr', storyLanguage: 42, reduceMotion: 'yes', haptics: false, model: 7 }));
    expect(await loadSettings()).toEqual({ uiLanguage: 'en', storyLanguage: 'en', reduceMotion: false, haptics: false, model: '' });
  });

  it('survives corrupt settings', async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, 'oops');
    expect(await loadSettings()).toBeNull();
  });
});
