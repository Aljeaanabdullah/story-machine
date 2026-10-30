import type { ArtSlot } from './slots';

/**
 * How to frame a slot's image inside its container, in fractions of the source image:
 *  - x / w: the horizontal band to show (fills the container width);
 *  - y: where the visible window starts vertically (clamped so the frame stays covered);
 *  - ratio: source width / height.
 * Slots without an entry use plain "cover".
 */
export type Framing = { x: number; w: number; y: number; ratio: number };

// The character portraits have blurred pillarbox bars; the painting is the middle 600 of 900px.
const portrait = (y: number): Framing => ({ x: 150 / 900, w: 600 / 900, y, ratio: 900 / 1200 });

export const FRAMING: Partial<Record<ArtSlot, Framing>> = {
  'hero-warrior': portrait(0.07),
  'hero-mage': portrait(0.09),
  'hero-explorer': portrait(0.08),
  'hero-detective': portrait(0.045),
  'hero-sailor': portrait(0.09),
  'hero-inventor': portrait(0.08),
};
