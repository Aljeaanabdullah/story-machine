import { router } from 'expo-router';
import { useCallback } from 'react';

import type { StoryMode } from '@/lib/story/types';
import { useDraft } from './draft';
import { useSettings } from './settings';

/** Resets the draft for a mode and routes to its first creation step. */
export function useStartMode() {
  const { start } = useDraft();
  const { settings } = useSettings();
  return useCallback(
    (mode: StoryMode) => {
      start(mode, settings.storyLanguage);
      router.push(mode === 'bedtime' ? '/setup' : '/character');
    },
    [start, settings.storyLanguage],
  );
}
