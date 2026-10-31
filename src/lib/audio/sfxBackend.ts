import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import type { Ambience, Cue } from './sfx';
import type { AudioBackend } from './soundscape';

const SOURCES: Record<Ambience | Cue, number> = {
  ocean: require('../../../assets/sfx/ocean.wav'),
  rain: require('../../../assets/sfx/rain.wav'),
  storm: require('../../../assets/sfx/storm.wav'),
  wind: require('../../../assets/sfx/wind.wav'),
  forest: require('../../../assets/sfx/forest.wav'),
  suspense: require('../../../assets/sfx/suspense.wav'),
  thunder: require('../../../assets/sfx/thunder.wav'),
  footsteps: require('../../../assets/sfx/footsteps.wav'),
  door: require('../../../assets/sfx/door.wav'),
  magic: require('../../../assets/sfx/magic.wav'),
};

let modeSet = false;

/** Let ambience mix with narration (and play with the iPhone ring switch on silent). */
export function ensureAudioMode() {
  if (modeSet) return;
  modeSet = true;
  setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {
    modeSet = false;
  });
}

export const expoAudioBackend: AudioBackend = {
  load(sound) {
    const p = createAudioPlayer(SOURCES[sound]);
    return {
      play: () => p.play(),
      pause: () => p.pause(),
      setVolume: (v) => {
        p.volume = Math.max(0, Math.min(1, v));
      },
      setLoop: (loop) => {
        p.loop = loop;
      },
      release: () => {
        try {
          p.pause();
          p.remove();
        } catch {
          // already released
        }
      },
    };
  },
};
