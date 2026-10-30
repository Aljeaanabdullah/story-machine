import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { makeProseStory, touch } from '@/lib/story/factory';
import { loadSettings, loadStories } from '@/lib/storage';
import { SettingsProvider, useSettings } from '@/state/settings';
import { StoriesProvider, useStories } from '@/state/stories';
import { draftFor } from './helpers';

// Native worklets can't load in Jest; the settings provider only needs this hook.
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => false }));

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('StoriesProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <StoriesProvider>{children}</StoriesProvider>;

  it('persists saved stories, keeps unsaved ones in memory only, and deletes', async () => {
    const { result } = await renderHook(() => useStories(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    const unsaved = makeProseStory(draftFor('short'), 'Draft', 'c');
    const saved = touch(makeProseStory(draftFor('short'), 'Saved', 'c'), { saved: true });
    await act(async () => {
      result.current.upsert(unsaved);
      result.current.upsert(saved);
    });

    expect(result.current.stories.map((s) => s.title).sort()).toEqual(['Draft', 'Saved']);
    await waitFor(async () => expect((await loadStories()).map((s) => s.title)).toEqual(['Saved']));

    await act(async () => {
      result.current.remove(saved.id);
    });
    await waitFor(async () => expect(await loadStories()).toEqual([]));
    expect(result.current.get(saved.id)).toBeUndefined();
  });

  it('loads previously saved stories on start', async () => {
    const saved = touch(makeProseStory(draftFor('bedtime', 'ar'), 'محفوظة', 'c'), { saved: true });
    await AsyncStorage.setItem('storyverse.stories.v1', JSON.stringify([saved]));
    const { result } = await renderHook(() => useStories(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.get(saved.id)?.title).toBe('محفوظة');
  });
});

describe('SettingsProvider language selection', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <SettingsProvider>{children}</SettingsProvider>;

  it('switches UI strings and layout direction to Arabic and persists it', async () => {
    const { result } = await renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      result.current.update({ uiLanguage: 'en' });
    });
    expect(result.current.s.createStory).toBe('Create Your Story');
    expect(result.current.dir.isRTL).toBe(false);

    await act(async () => {
      result.current.update({ uiLanguage: 'ar', storyLanguage: 'ar' });
    });
    expect(result.current.s.createStory).toBe('اصنع قصتك');
    expect(result.current.dir).toMatchObject({ isRTL: true, row: 'row-reverse', textAlign: 'right', writingDirection: 'rtl' });
    await waitFor(async () => expect((await loadSettings())?.uiLanguage).toBe('ar'));
  });
});
