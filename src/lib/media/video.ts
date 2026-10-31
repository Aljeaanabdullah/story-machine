import type { VoiceRole } from '@/lib/audio/types';
import { wordCount } from '@/lib/ai/json';
import type { ScenePresentation } from './present';
import type { CameraMove, SceneTransition, SceneVideo } from './types';

/**
 * A service that turns one scene (image + motion + narration) into a video clip.
 * Expensive generation must live behind a backend; the app only requests and polls.
 */
export interface SceneVideoProvider {
  readonly id: string;
  isAvailable(): boolean;
  request(scene: ScenePresentation, signal?: AbortSignal): Promise<SceneVideo>;
}

/** Default: no video generation. Scenes are presented as animated stills instead. */
export const noVideoProvider: SceneVideoProvider = {
  id: 'none',
  isAvailable: () => false,
  request: async () => ({ status: 'none' }),
};

export type TimelineClip = {
  key: string;
  startMs: number;
  durationMs: number;
  camera: CameraMove;
  intensity: number;
  transition: SceneTransition;
  image: { slot: string; uri?: string; prompt: string };
  videoUri?: string;
  audio: { role: VoiceRole; text: string }[];
};

export type StoryTimeline = { totalMs: number; clips: TimelineClip[] };

const WORDS_PER_SECOND = 2.6;
const PAUSE_MS = 250;
const MIN_CLIP_MS = 4000;

/** Rough spoken length of a scene at the given speech rate. */
export function estimateSpeechMs(scene: Pick<ScenePresentation, 'segments'>, rate = 1): number {
  const words = scene.segments.reduce((n, s) => n + wordCount(s.text), 0);
  return Math.round((words / (WORDS_PER_SECOND * rate)) * 1000 + scene.segments.length * PAUSE_MS);
}

/** Lays scenes end to end, each lasting as long as its narration — an edit decision list for a future renderer. */
export function buildTimeline(scenes: ScenePresentation[], rate = 1): StoryTimeline {
  let cursor = 0;
  const clips = scenes.map((s): TimelineClip => {
    const durationMs = Math.max(MIN_CLIP_MS, estimateSpeechMs(s, rate));
    const clip: TimelineClip = {
      key: s.key,
      startMs: cursor,
      durationMs,
      camera: s.motion.camera,
      intensity: s.motion.intensity,
      transition: s.motion.transition,
      image: { slot: s.visual.slot, uri: s.visual.uri, prompt: s.visual.prompt },
      videoUri: s.video.status === 'ready' ? s.video.uri : undefined,
      audio: s.segments.map(({ role, text }) => ({ role, text })),
    };
    cursor += durationMs;
    return clip;
  });
  return { totalMs: cursor, clips };
}
