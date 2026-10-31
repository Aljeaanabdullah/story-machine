import type { Ambience } from '@/lib/audio/sfx';
import type { StoryDraft } from '@/lib/story/types';

/** Layered weather over a scene image: drifting fog bands and floating light motes. */
export type Atmosphere = {
  /** Fog band opacity, 0 = clear. */
  fog: number;
  fogTint: string;
  /** Number of light motes (fireflies, dust, sparks); 0 = none. */
  motes: number;
  moteTint: string;
};

const BY_AMBIENCE: Record<Ambience, Atmosphere> = {
  ocean: { fog: 0.22, fogTint: '#E6F6FF', motes: 5, moteTint: '#FFFFFF' },
  rain: { fog: 0.32, fogTint: '#C9D3E6', motes: 0, moteTint: '#FFFFFF' },
  storm: { fog: 0.38, fogTint: '#B7C2D9', motes: 0, moteTint: '#FFFFFF' },
  wind: { fog: 0.26, fogTint: '#F2D9A6', motes: 8, moteTint: '#F2D9A6' },
  forest: { fog: 0.2, fogTint: '#DDEBD0', motes: 9, moteTint: '#E8FFB0' },
  suspense: { fog: 0.4, fogTint: '#8F8AB8', motes: 4, moteTint: '#B9A7FF' },
};

const DEFAULT: Atmosphere = { fog: 0.15, fogTint: '#E9E2D0', motes: 6, moteTint: '#D6B477' };
const BEDTIME: Atmosphere = { fog: 0.15, fogTint: '#9DB8FF', motes: 10, moteTint: '#FFF3C4' };

export function atmosphereFor(draft: StoryDraft, ambience: Ambience | null): Atmosphere {
  if (draft.mode === 'bedtime') return BEDTIME;
  return ambience ? BY_AMBIENCE[ambience] : DEFAULT;
}
