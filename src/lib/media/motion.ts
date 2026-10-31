import type { CameraMove } from './types';

export type CameraFrame = { scale: number; translateX: number; translateY: number };

/**
 * Ken Burns framing for a camera move at progress t (0→1) over a w×h frame.
 * Always zoomed enough that panning never reveals an edge. Runs on the UI thread.
 */
export function cameraFrame(camera: CameraMove, intensity: number, t: number, w: number, h: number): CameraFrame {
  'worklet';
  const k = Math.min(1, Math.max(0, intensity));
  const zoom = 0.1 * k;
  switch (camera) {
    case 'push-in':
      return { scale: 1 + zoom * t, translateX: 0, translateY: 0 };
    case 'pull-out':
      return { scale: 1 + zoom * (1 - t), translateX: 0, translateY: 0 };
    case 'pan-left':
    case 'pan-right': {
      const scale = 1 + zoom;
      const travel = ((scale - 1) * w) / 2; // the overflow on each side
      const dir = camera === 'pan-left' ? -1 : 1;
      return { scale, translateX: dir * travel * (2 * t - 1), translateY: 0 };
    }
    case 'drift': {
      const scale = 1 + zoom * 0.6;
      return { scale, translateX: ((scale - 1) * w * (t - 0.5)) / 2, translateY: ((scale - 1) * h * (0.5 - t)) / 2 };
    }
    default:
      return { scale: 1, translateX: 0, translateY: 0 };
  }
}
