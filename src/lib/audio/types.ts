import type { Language } from '@/i18n/strings';

/**
 * Voice roles a segment can be spoken in. To add a role later, append it here
 * and give it a profile in `voices.ts`; everything else picks it up.
 */
export const VOICE_ROLES = ['narrator', 'hero', 'villain', 'companion'] as const;
export type VoiceRole = (typeof VOICE_ROLES)[number];

/** Delivery hints. Engines that cannot act them out simply ignore them. */
export const EMOTIONS = ['neutral', 'excited', 'fearful', 'whisper', 'calm'] as const;
export type Emotion = (typeof EMOTIONS)[number];

/** One spoken unit: a sentence of narration or a line of dialogue. */
export type VoiceSegment = {
  role: VoiceRole;
  kind: 'narration' | 'dialogue';
  text: string;
  /** Paragraph the segment belongs to, so the reader can highlight it. */
  paragraph: number;
  emotion?: Emotion;
};

export type SpeakOptions = {
  language: Language;
  role: VoiceRole;
  emotion: Emotion;
  pitch: number;
  rate: number;
  /** 0–1. */
  volume: number;
  voice?: string;
};
export type SpeakCallbacks = { onDone: () => void; onError: (e: unknown) => void };

export type TTSProviderId = 'device' | 'neural' | 'elevenlabs';

/** A text-to-speech engine. The player only ever talks to this interface. */
export interface SpeechProvider {
  readonly id: TTSProviderId;
  isAvailable(): boolean;
  /** Optional async readiness check (e.g. reach a server) before playback starts. */
  prepare?(): Promise<boolean>;
  /** Speaks one segment; exactly one callback fires unless `stop()` interrupts it. */
  speak(text: string, options: SpeakOptions, callbacks: SpeakCallbacks): void;
  /** Optional warm-up for the next segment so playback has no gaps. */
  prefetch?(text: string, options: SpeakOptions): void;
  stop(): void;
  /** Voice identifiers for a language, best first. Empty means "system default". */
  listVoices(language: Language): Promise<string[]>;
  /** The engine actually speaking right now (differs when a provider fell back). */
  activeId?(): TTSProviderId;
}
