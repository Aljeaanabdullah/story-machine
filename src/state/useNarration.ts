import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import type { Language } from '@/i18n/strings';
import { getSpeechProvider } from '@/lib/audio';
import { NarrationPlayer } from '@/lib/audio/player';
import type { VoiceSegment } from '@/lib/audio/types';
import { useSettings } from '@/state/settings';

/**
 * Narration for one screen. Playback only ever starts from `play()` (a user tap),
 * and stops when the content changes, the screen loses focus, or it unmounts.
 */
export function useNarration(segments: VoiceSegment[], language: Language) {
  const { settings } = useSettings();
  const [player] = useState(() => new NarrationPlayer(getSpeechProvider(settings.voiceProvider)));
  const state = useSyncExternalStore(player.subscribe, player.getState, player.getState);

  useEffect(() => {
    player.load(segments, { language, multiVoice: settings.multiVoice, rate: settings.speechRate, volume: settings.voiceVolume }, getSpeechProvider(settings.voiceProvider));
  }, [player, segments, language, settings.multiVoice, settings.speechRate, settings.voiceVolume, settings.voiceProvider]);

  useEffect(() => () => player.stop(), [player]);
  useFocusEffect(useCallback(() => () => player.stop(), [player]));

  return {
    state,
    active: state.status === 'loading' || state.status === 'playing' || state.status === 'paused',
    play: useCallback(() => player.play(), [player]),
    pause: useCallback(() => player.pause(), [player]),
    resume: useCallback(() => player.resume(), [player]),
    stop: useCallback(() => player.stop(), [player]),
  };
}

export type Narration = ReturnType<typeof useNarration>;
