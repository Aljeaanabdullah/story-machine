import type { SpeechProvider, TTSProviderId, VoiceRole, VoiceSegment } from './types';
import { speakOptionsFor, type VoiceSettings } from './voices';

export type NarrationStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'done' | 'error';

export type NarrationState = {
  status: NarrationStatus;
  /** Segment being spoken (or where playback will resume). */
  index: number;
  total: number;
  role?: VoiceRole;
  paragraph?: number;
  /** Engine speaking the current segment (device speech when a neural provider fell back). */
  engine?: TTSProviderId;
};

/**
 * Plays a list of segments one utterance at a time. Pause is implemented as
 * "stop and remember the segment", because Android's TTS has no native pause;
 * resume replays that sentence, which behaves the same on every platform.
 */
export class NarrationPlayer {
  private segments: VoiceSegment[] = [];
  private settings: VoiceSettings = { language: 'en', multiVoice: true, rate: 1 };
  private voices: string[] = [];
  /** Bumped on every interruption so stale engine callbacks are ignored. */
  private token = 0;
  private state: NarrationState = { status: 'idle', index: 0, total: 0 };
  private listeners = new Set<() => void>();
  private loadedKey = '';

  constructor(private provider: SpeechProvider) {}

  getState = (): NarrationState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Replaces what will be read and with which engine. Stops anything playing. */
  load(segments: VoiceSegment[], settings: VoiceSettings, provider: SpeechProvider = this.provider) {
    // Re-rendering with identical content (e.g. after saving the story) must not interrupt playback.
    const key = JSON.stringify([segments, settings, provider.id]);
    if (key === this.loadedKey && provider === this.provider) return;
    this.loadedKey = key;
    this.halt();
    this.provider = provider;
    this.segments = segments;
    this.settings = settings;
    this.set({ status: 'idle', index: 0, total: segments.length });
  }

  async play() {
    if (!this.segments.length || !this.provider.isAvailable()) {
      this.set({ ...this.state, status: 'error' });
      return;
    }
    const token = ++this.token;
    this.set({ status: 'loading', index: 0, total: this.segments.length });
    try {
      await this.provider.prepare?.();
      this.voices = await this.provider.listVoices(this.settings.language);
    } catch {
      this.voices = [];
    }
    if (token === this.token) this.speakAt(0);
  }

  pause() {
    if (this.state.status !== 'playing') return;
    this.halt();
    this.set({ ...this.state, status: 'paused' });
  }

  resume() {
    if (this.state.status === 'paused') this.speakAt(this.state.index);
  }

  stop() {
    const wasActive = this.state.status !== 'idle';
    this.halt();
    if (wasActive) this.set({ status: 'idle', index: 0, total: this.segments.length });
  }

  private halt() {
    this.token++;
    if (this.state.status === 'playing' || this.state.status === 'loading') this.provider.stop();
  }

  private speakAt(index: number) {
    const segment = this.segments[index];
    if (!segment) {
      this.set({ status: 'done', index: this.segments.length, total: this.segments.length });
      return;
    }
    const token = ++this.token;
    const options = (s: VoiceSegment) => speakOptionsFor(s.role, this.voices, this.settings, s.emotion);
    this.set({ status: 'playing', index, total: this.segments.length, role: segment.role, paragraph: segment.paragraph, engine: this.provider.activeId?.() ?? this.provider.id });
    const next = this.segments[index + 1];
    if (next) this.provider.prefetch?.(next.text, options(next));
    this.provider.speak(segment.text, options(segment), {
      onDone: () => {
        if (token === this.token) this.speakAt(index + 1);
      },
      onError: () => {
        if (token !== this.token) return;
        this.token++;
        this.set({ ...this.state, status: 'error' });
      },
    });
  }

  private set(next: NarrationState) {
    this.state = next;
    this.listeners.forEach((l) => l());
  }
}
