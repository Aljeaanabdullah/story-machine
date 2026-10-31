/**
 * Scene-level media model. Stories persist only optional overrides (`SceneMedia`);
 * everything else is derived, so stories saved before V2 keep working unchanged.
 */

export type CameraMove = 'still' | 'push-in' | 'pull-out' | 'pan-left' | 'pan-right' | 'drift';
export type SceneTransition = 'fade' | 'dissolve' | 'rise';

/** How a scene's still image should move — and later, how a video clip should be shot. */
export type MotionHint = {
  camera: CameraMove;
  /** 0 = barely moving, 1 = dramatic. */
  intensity: number;
  /** How this scene enters after the previous one. */
  transition: SceneTransition;
  /** One full camera move, in milliseconds. */
  durationMs: number;
};

export type SceneVisual = {
  /** Art slot used while no generated image exists (world painting or vector art). */
  slot: string;
  status: 'placeholder' | 'ready';
  /** Generated or uploaded image for this scene, once available. */
  uri?: string;
  /** Text prompt a future image model can render this scene from. */
  prompt: string;
};

export type SceneVideoStatus = 'none' | 'queued' | 'rendering' | 'ready' | 'failed';

export type SceneVideo = {
  status: SceneVideoStatus;
  uri?: string;
  posterUri?: string;
  /** Which video provider produced (or is producing) the clip. */
  provider?: string;
};

/** Optional per-scene overrides stored on a Scene (adventure) or Story (prose). */
export type SceneMedia = {
  visual?: Partial<Pick<SceneVisual, 'uri' | 'prompt'>>;
  motion?: Partial<MotionHint>;
  video?: SceneVideo;
};
