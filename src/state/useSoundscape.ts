import { useEffect, useRef, useState } from 'react';

import { cueFor, type Ambience } from '@/lib/audio/sfx';
import { ensureAudioMode, expoAudioBackend } from '@/lib/audio/sfxBackend';
import { Soundscape } from '@/lib/audio/soundscape';
import type { VoiceSegment } from '@/lib/audio/types';
import type { NarrationState } from '@/lib/audio/player';
import { useSettings } from '@/state/settings';

/**
 * Follows the narration: the scene's ambience starts with Listen, ducks under
 * narration and dialogue, fires effects on the sentences that mention them, and
 * stops with the narration. Nothing plays without the user pressing Listen.
 */
export function useSoundscape(state: NarrationState, segments: VoiceSegment[], ambience: Ambience | null) {
  const { settings } = useSettings();
  const [mixer] = useState(() => new Soundscape(expoAudioBackend));
  const lastCue = useRef(-1);

  useEffect(() => {
    mixer.setLevels({ ambience: settings.ambienceVolume, sfx: settings.sfxVolume });
  }, [mixer, settings.ambienceVolume, settings.sfxVolume]);

  useEffect(() => {
    if (state.status === 'playing') {
      ensureAudioMode();
      mixer.start(ambience);
      const seg = segments[state.index];
      mixer.setDuck(seg ? seg.kind : 'none');
      if (seg && lastCue.current !== state.index) {
        lastCue.current = state.index;
        mixer.cue(cueFor(seg.text));
      }
    } else if (state.status === 'paused') {
      mixer.pause();
    } else if (state.status === 'loading') {
      lastCue.current = -1;
    } else if (state.status === 'done') {
      // Let the bed breathe for a moment after the last line, then fade away.
      mixer.setDuck('none');
      const t = setTimeout(() => mixer.stop(), 2500);
      return () => clearTimeout(t);
    } else {
      mixer.stop();
    }
  }, [mixer, state.status, state.index, segments, ambience]);

  useEffect(() => () => mixer.stop(), [mixer]);
}
