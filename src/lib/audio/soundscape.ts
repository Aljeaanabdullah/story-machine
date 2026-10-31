import { DUCK, type Ambience, type Cue, type DuckLevel } from './sfx';

/** Minimal audio surface the mixer needs; implemented with expo-audio in the app and faked in tests. */
export interface AudioHandle {
  play(): void;
  pause(): void;
  setVolume(v: number): void;
  setLoop(loop: boolean): void;
  release(): void;
}
export interface AudioBackend {
  load(sound: Ambience | Cue): AudioHandle;
}

export type MixLevels = { ambience: number; sfx: number };

const FADE_MS = 400;
const FADE_STEPS = 8;

/**
 * Background ambience plus one-shot effects. The bed ducks under narration and
 * further under dialogue, fades in and out, and never plays unless started.
 */
export class Soundscape {
  private bed: { name: Ambience; handle: AudioHandle } | null = null;
  private shots: AudioHandle[] = [];
  private levels: MixLevels = { ambience: 0.5, sfx: 0.75 };
  private duck: DuckLevel = 'none';
  private current = 0;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private backend: AudioBackend) {}

  setLevels(levels: MixLevels) {
    this.levels = levels;
    this.fadeTo(this.target(), 0);
  }

  /** Starts (or switches to) a bed. Same bed again is a no-op, so scenes in one place don't restart it. */
  start(name: Ambience | null) {
    if (this.bed?.name === name) {
      this.bed.handle.play();
      this.fadeTo(this.target());
      return;
    }
    this.stopBed();
    if (!name || this.levels.ambience <= 0) return;
    const handle = this.backend.load(name);
    handle.setLoop(true);
    handle.setVolume(0);
    handle.play();
    this.bed = { name, handle };
    this.current = 0;
    this.fadeTo(this.target());
  }

  /** Lower the bed while someone speaks. */
  setDuck(level: DuckLevel) {
    this.duck = level;
    this.fadeTo(this.target());
  }

  cue(name: Cue | null) {
    if (!name || this.levels.sfx <= 0) return;
    const shot = this.backend.load(name);
    shot.setLoop(false);
    shot.setVolume(this.levels.sfx);
    shot.play();
    this.shots.push(shot);
    // Release finished one-shots lazily; effects are all under 5 seconds.
    setTimeout(() => {
      shot.release();
      this.shots = this.shots.filter((s) => s !== shot);
    }, 6000);
  }

  pause() {
    this.clearFade();
    this.bed?.handle.pause();
  }

  stop() {
    this.stopBed();
    this.shots.forEach((s) => s.release());
    this.shots = [];
  }

  /** The bed's volume right now (for tests and debugging). */
  volume(): number {
    return this.current;
  }

  get playing(): Ambience | null {
    return this.bed?.name ?? null;
  }

  private target() {
    return this.levels.ambience * DUCK[this.duck];
  }

  private stopBed() {
    this.clearFade();
    this.bed?.handle.release();
    this.bed = null;
    this.current = 0;
  }

  private clearFade() {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }

  private fadeTo(target: number, ms = FADE_MS) {
    const bed = this.bed;
    if (!bed) return;
    this.clearFade();
    if (ms <= 0) {
      this.current = target;
      bed.handle.setVolume(target);
      return;
    }
    const from = this.current;
    let step = 0;
    this.fadeTimer = setInterval(() => {
      step++;
      this.current = from + ((target - from) * step) / FADE_STEPS;
      bed.handle.setVolume(this.current);
      if (step >= FADE_STEPS) this.clearFade();
    }, ms / FADE_STEPS);
  }
}
