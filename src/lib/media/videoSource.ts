import type { VideoSource } from 'expo-video';

import { BUNDLED_VIDEOS } from '@/assets/videos';
import { ASSET_PREFIX } from './sceneVideo';
import type { SceneVideo } from './types';

/** Playable source for a scene video, or null when there is nothing (valid) to play. */
export function videoSource(video: SceneVideo | undefined): VideoSource | null {
  if (!video || video.status !== 'ready' || !video.uri) return null;
  if (video.uri.startsWith(ASSET_PREFIX)) return BUNDLED_VIDEOS[video.uri.slice(ASSET_PREFIX.length)] ?? null;
  return { uri: video.uri };
}
