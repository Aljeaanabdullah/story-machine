import type { Language } from '@/i18n/strings';

/**
 * Voice roles a segment can be spoken in. To add a role later, append it here
 * and give it a profile in `voices.ts`; everything else picks it up.
 */
export const VOICE_ROLES = ['narrator', 'hero', 'villain', 'companion'] as const;
export type VoiceRole = (typeof VOICE_ROLES)[number];

/** One spoken unit: a sentence of narration or a line of dialogue. */
export type VoiceSegment = {
  role: VoiceRole;
  kind: 'narration' | 'dialogue';
  text: string;
  /** Paragraph the segment belongs to, so the reader can highlight it. */
  paragraph: number;
};

export type SpeakOptions = { language: Language; pitch: number; rate: number; voice?: string };
export type SpeakCallbacks = { onDone: () => void; onError: (e: unknown) => void };

export type TTSProviderId = 'device' | 'elevenlabs';

/** A text-to-speech engine. The player only ever talks to this interface. */
export interface SpeechProvider {
  readonly id: TTSProviderId;
  isAvailable(): boolean;
  /** Speaks one segment; exactly one callback fires unless `stop()` interrupts it. */
  speak(text: string, options: SpeakOptions, callbacks: SpeakCallbacks): void;
  stop(): void;
  /** Voice identifiers for a language, best first. Empty means "system default". */
  listVoices(language: Language): Promise<string[]>;
}
