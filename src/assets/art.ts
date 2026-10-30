import { ART } from './art.generated';
import type { ArtSlot } from './slots';

/** Bundled image for a slot, or undefined when the artwork hasn't been added yet. */
export function art(slot: ArtSlot): number | undefined {
  return ART[slot];
}
