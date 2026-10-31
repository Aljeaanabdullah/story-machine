import { findWorld, GENRES, MOODS, nameOf } from '@/data/catalog';
import { buildSegments } from '@/lib/audio/dialogue';
import { splitParagraphs, splitSentences } from '@/lib/audio/segment';
import { pickAmbience, type Ambience } from '@/lib/audio/sfx';
import { atmosphereFor, type Atmosphere } from './atmosphere';
import type { VoiceSegment } from '@/lib/audio/types';
import type { Scene, Story, StoryDraft } from '@/lib/story/types';
import type { CameraMove, MotionHint, SceneMedia, SceneTransition, SceneVideo, SceneVisual } from './types';

/** Everything needed to show, voice, and (later) film one scene. */
export type ScenePresentation = {
  key: string;
  number: number;
  title: string;
  isEnding: boolean;
  paragraphs: string[];
  segments: VoiceSegment[];
  /** Background sound bed while the scene is narrated. */
  ambience: Ambience | null;
  /** Fog and light motes layered over the image. */
  atmosphere: Atmosphere;
  visual: SceneVisual;
  motion: MotionHint;
  video: SceneVideo;
};

const CAMERAS: CameraMove[] = ['still', 'push-in', 'pull-out', 'pan-left', 'pan-right', 'drift'];
const TRANSITIONS: SceneTransition[] = ['fade', 'dissolve', 'rise'];
const VIDEO_STATUSES: SceneVideo['status'][] = ['none', 'queued', 'rendering', 'ready', 'failed'];
const STORY_CYCLE: CameraMove[] = ['push-in', 'pan-left', 'drift', 'pan-right'];

/** Mirrors StoryArt: bedtime art, a preset world's painting, or custom-world art. */
export function artSlotFor(draft: StoryDraft): string {
  if (draft.mode === 'bedtime') return 'bedtime';
  const world = draft.world.kind === 'preset' ? findWorld(draft.world.id) : undefined;
  return world ? `world-${world.id}` : 'custom';
}

/** Deterministic camera work: opens pushing in, varies through the middle, pulls out on the ending. */
export function defaultMotion(draft: StoryDraft, number: number, isEnding: boolean): MotionHint {
  if (draft.mode === 'bedtime') return { camera: 'drift', intensity: 0.35, transition: 'dissolve', durationMs: 16000 };
  if (isEnding) return { camera: 'pull-out', intensity: 0.6, transition: 'dissolve', durationMs: 14000 };
  const camera = STORY_CYCLE[(Math.max(number, 1) - 1) % STORY_CYCLE.length];
  return { camera, intensity: draft.mood === 'tense' || draft.mood === 'epic' ? 0.75 : 0.6, transition: number === 1 ? 'rise' : 'fade', durationMs: 12000 };
}

/** English prompt a future image model can render the scene from; scene text is quoted as-is in any language. */
export function imagePrompt(draft: StoryDraft, title: string, text: string): string {
  const firstSentence = splitSentences(splitParagraphs(text)[0] ?? '')[0] ?? '';
  const world =
    draft.mode === 'bedtime'
      ? 'a cozy moonlit dreamland for children'
      : draft.world.kind === 'preset'
        ? (findWorld(draft.world.id)?.description.en ?? draft.world.id)
        : draft.world.description;
  const style = draft.mode === 'bedtime' ? 'soft pastel storybook illustration' : `${nameOf(MOODS, draft.mood, 'en').toLowerCase()} cinematic ${nameOf(GENRES, draft.genre, 'en').toLowerCase()} concept art`;
  return [`Scene "${title}"`, `Setting: ${world}`, firstSentence && `Moment: ${firstSentence}`, `Style: ${style}, dramatic lighting, no text`].filter(Boolean).join('. ');
}

const clamp = (n: unknown, min: number, max: number, fallback: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback);

/** Applies stored overrides on top of the derived defaults, ignoring anything malformed. */
export function resolveMedia(base: { visual: SceneVisual; motion: MotionHint }, media: SceneMedia | undefined) {
  const m = media && typeof media === 'object' ? media : {};
  const uri = typeof m.visual?.uri === 'string' && m.visual.uri ? m.visual.uri : undefined;
  const visual: SceneVisual = {
    ...base.visual,
    prompt: typeof m.visual?.prompt === 'string' && m.visual.prompt.trim() ? m.visual.prompt : base.visual.prompt,
    ...(uri ? { uri, status: 'ready' as const } : {}),
  };
  const o = m.motion ?? {};
  const motion: MotionHint = {
    camera: CAMERAS.includes(o.camera as CameraMove) ? (o.camera as CameraMove) : base.motion.camera,
    intensity: clamp(o.intensity, 0, 1, base.motion.intensity),
    transition: TRANSITIONS.includes(o.transition as SceneTransition) ? (o.transition as SceneTransition) : base.motion.transition,
    durationMs: clamp(o.durationMs, 4000, 30000, base.motion.durationMs),
  };
  const v = m.video;
  const video: SceneVideo = v && VIDEO_STATUSES.includes(v.status) ? { ...v, ...(v.status === 'ready' && !v.uri ? { status: 'failed' as const } : {}) } : { status: 'none' };
  return { visual, motion, video };
}

function present(story: Story, key: string, number: number, title: string, text: string, isEnding: boolean, media: SceneMedia | undefined, multiVoice: boolean): ScenePresentation {
  const base = {
    visual: { slot: artSlotFor(story.draft), status: 'placeholder' as const, prompt: imagePrompt(story.draft, title, text) },
    motion: defaultMotion(story.draft, number, isEnding),
  };
  const ambience = pickAmbience(text, story.draft);
  return {
    key,
    number,
    title,
    isEnding,
    paragraphs: splitParagraphs(text),
    segments: buildSegments(text, story.draft, multiVoice),
    ambience,
    atmosphere: atmosphereFor(story.draft, ambience),
    ...resolveMedia(base, media),
  };
}

export function presentScene(story: Story, scene: Scene, multiVoice: boolean): ScenePresentation {
  return present(story, `${story.id}:${scene.number}`, scene.number, scene.title, scene.text, scene.isEnding, scene.media, multiVoice);
}

/** Short and bedtime stories are a single scene. */
export function presentProse(story: Story, multiVoice: boolean): ScenePresentation {
  return present(story, `${story.id}:1`, 1, story.title, story.content ?? '', true, story.media, multiVoice);
}

/** Every scene of a story in order — the input for a future video export. */
export function storyScenes(story: Story, multiVoice: boolean): ScenePresentation[] {
  if (story.mode === 'adventure') return (story.adventure?.scenes ?? []).map((s) => presentScene(story, s, multiVoice));
  return [presentProse(story, multiVoice)];
}
