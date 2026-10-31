import type { Story } from '@/lib/story/types';
import type { SceneMedia, SceneVideo } from './types';

/** Bundled clips are referenced as `asset:<name>` so stories stay plain JSON. */
export const ASSET_PREFIX = 'asset:';

/**
 * Attaches (or with `null`, removes) a video for one scene. Works purely on the
 * optional media overrides, so the story engine and scene text are untouched.
 * `sceneNumber` is ignored for short and bedtime stories (a single scene).
 */
export function setSceneVideo(story: Story, sceneNumber: number, video: SceneVideo | null): Story {
  const apply = (media: SceneMedia | undefined): SceneMedia | undefined => {
    const next: SceneMedia = { ...(media ?? {}) };
    if (video) next.video = video;
    else delete next.video;
    return Object.keys(next).length ? next : undefined;
  };
  if (story.mode !== 'adventure' || !story.adventure) return { ...story, media: apply(story.media) };
  return {
    ...story,
    adventure: {
      ...story.adventure,
      scenes: story.adventure.scenes.map((s) => (s.number === sceneNumber ? { ...s, media: apply(s.media) } : s)),
    },
  };
}

/** A ready video record for an imported or bundled file. */
export function readyVideo(uri: string, provider: SceneVideo['provider'] = 'import'): SceneVideo {
  return { status: 'ready', uri, provider };
}

export function isMp4Name(name: string | undefined, mimeType?: string | null): boolean {
  return mimeType === 'video/mp4' || /\.(mp4|m4v|mov)$/i.test(name ?? '');
}
