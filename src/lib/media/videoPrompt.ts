import { findWorld, GENRES, MOODS, nameOf } from '@/data/catalog';
import { hashKey } from '@/lib/audio/cache';
import { splitSentences } from '@/lib/audio/segment';
import { pickAmbience, type Ambience } from '@/lib/audio/sfx';
import type { Story } from '@/lib/story/types';
import type { ScenePresentation } from './present';
import type { CameraMove } from './types';

/** What moves in the frame for each sound bed — real motion, not a pan over a still. */
const MOTION_FOR: Record<Ambience, string> = {
  ocean: 'waves roll in and break into white foam, water glistens and moves, sea mist drifts low over the shore',
  rain: 'rain falls steadily, ripples spread across puddles, droplets run down leaves, mist drifts',
  storm: 'wind-driven rain sweeps across the frame, lightning flickers in the clouds, foliage whips in the wind',
  wind: 'strong wind bends grass and branches, dust and leaves blow past, clouds race across the sky',
  forest: 'leaves sway gently, shafts of sunlight shift through the canopy, small particles float in the air',
  suspense: 'thin mist creeps along the ground, shadows shift, faint light flickers, dust motes drift slowly',
};
const DEFAULT_MOTION = 'mist drifts slowly through the scene, water and foliage move naturally, light shimmers softly';

const CAMERA_FOR: Record<CameraMove, string> = {
  still: 'locked-off camera with subtle handheld breathing',
  'push-in': 'slow cinematic dolly-in toward the center',
  'pull-out': 'slow cinematic dolly-out revealing more of the scene',
  'pan-left': 'slow smooth camera pan to the left',
  'pan-right': 'slow smooth camera pan to the right',
  drift: 'gentle floating camera drift',
};

/** Seed shared by every scene of a story so clips keep a consistent look. */
export function videoSeed(story: Pick<Story, 'id'>): number {
  return parseInt(hashKey(story.id).slice(0, 7), 36) % 2147483647;
}

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
/** Parts are joined with ". ", so drop their own closing punctuation. */
const bare = (s: string) => s.trim().replace(/[.!?؟…。]+$/u, '');

/**
 * English prompt for a local image-to-video model, built from the scene, world,
 * hero, mood and the player's previous choice. The scene image is the first frame,
 * so the prompt describes motion and atmosphere and asks the model to keep the
 * painting's style. Scene text in Arabic is quoted as-is (the text encoder is multilingual).
 */
export function buildVideoPrompt(story: Story, scene: Pick<ScenePresentation, 'number' | 'title' | 'paragraphs' | 'ambience' | 'motion'>): string {
  const d = story.draft;
  const world = d.world.kind === 'preset' ? (findWorld(d.world.id)?.description.en ?? d.world.id) : d.world.description;
  const mood = nameOf(MOODS, d.mood, 'en').toLowerCase();
  const genre = nameOf(GENRES, d.genre, 'en').toLowerCase();
  const moment = splitSentences(scene.paragraphs[0] ?? '')[0]?.trim() ?? '';

  const adv = story.adventure;
  const lastChoice = (adv?.choices ?? []).filter((c) => c.scene < scene.number).at(-1);
  // The adventure memory only knows where the hero is now, so only the latest scene uses it.
  const isLatest = !!adv && scene.number === adv.scenes.at(-1)?.number;
  const place = isLatest ? adv.memory.location?.trim() : undefined;
  // What the shot shows matters more than the scene's overall sound bed.
  const ambience = (moment && pickAmbience(moment, d)) || scene.ambience;

  return [
    `A ${mood} cinematic ${genre} shot. Setting: ${bare(world)}`,
    place && `Location: ${bare(clip(place, 80))}`,
    moment && `Moment: ${bare(clip(moment, 200))}`,
    lastChoice && `Just after the hero chose: ${bare(clip(lastChoice.text, 100))}`,
    `Motion: ${(ambience && MOTION_FOR[ambience]) || DEFAULT_MOTION}`,
    `Camera: ${CAMERA_FOR[scene.motion.camera]}`,
    'Keep the exact painted art style, colors, lighting and composition of the first frame. No text, no watermark',
  ]
    .filter(Boolean)
    .join('. ');
}

/** Only scenes illustrated by a bundled world painting can be animated locally. */
export function videoImageSlot(scene: Pick<ScenePresentation, 'visual'>): string | null {
  return /^world-[a-z-]+$/.test(scene.visual.slot) ? scene.visual.slot : null;
}
