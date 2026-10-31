import type { VideoSource } from 'expo-video';

/**
 * Video clips bundled with the app, referenced from scenes as `asset:<name>`.
 * Imported clips are stored on the device instead (see lib/media/importVideo).
 */
export const BUNDLED_VIDEOS: Record<string, VideoSource> = {
  // 5 s photo animation of the Lost Island artwork, rendered for free with FFmpeg
  // (scripts/make-demo-video.js). It is NOT AI-generated video.
  'demo-lost-island': require('../../assets/video/demo-lost-island.mp4'),
};

/** Demo clip offered for scenes in a given world. */
export const DEMO_FOR_WORLD: Record<string, string> = {
  'lost-island': 'demo-lost-island',
};
