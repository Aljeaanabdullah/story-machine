import { cameraFrame } from '@/lib/media/motion';
import type { CameraMove } from '@/lib/media/types';

const W = 400;
const H = 200;

/** True when the scaled, shifted image still covers the whole frame. */
function covers(camera: CameraMove, intensity: number, t: number) {
  const f = cameraFrame(camera, intensity, t, W, H);
  const overflowX = ((f.scale - 1) * W) / 2;
  const overflowY = ((f.scale - 1) * H) / 2;
  return f.scale >= 1 && Math.abs(f.translateX) <= overflowX + 1e-9 && Math.abs(f.translateY) <= overflowY + 1e-9;
}

describe('cameraFrame (Ken Burns)', () => {
  it('push-in zooms in over time and pull-out zooms back out', () => {
    expect(cameraFrame('push-in', 1, 0, W, H).scale).toBe(1);
    expect(cameraFrame('push-in', 1, 1, W, H).scale).toBeCloseTo(1.1);
    expect(cameraFrame('pull-out', 1, 0, W, H).scale).toBeCloseTo(1.1);
    expect(cameraFrame('pull-out', 1, 1, W, H).scale).toBe(1);
  });

  it('pans travel in opposite directions', () => {
    expect(cameraFrame('pan-left', 1, 1, W, H).translateX).toBeLessThan(0);
    expect(cameraFrame('pan-right', 1, 1, W, H).translateX).toBeGreaterThan(0);
    expect(cameraFrame('pan-left', 1, 0.5, W, H).translateX).toBeCloseTo(0);
  });

  it('never reveals an edge of the image, for any move, intensity or time', () => {
    const cameras: CameraMove[] = ['still', 'push-in', 'pull-out', 'pan-left', 'pan-right', 'drift'];
    for (const c of cameras) for (const k of [0, 0.35, 1, 3]) for (const t of [0, 0.25, 0.5, 1]) expect(covers(c, k, t)).toBe(true);
  });

  it('still and zero intensity do not move', () => {
    expect(cameraFrame('still', 1, 0.7, W, H)).toEqual({ scale: 1, translateX: 0, translateY: 0 });
    expect(cameraFrame('pan-left', 0, 1, W, H)).toMatchObject({ scale: 1 });
  });
});
