import type { Language } from '@/i18n/strings';
import type { Emotion, SpeakOptions, VoiceRole } from './types';

export type VoiceProfile = {
  pitch: number;
  rate: number;
  /** Which of the device's voices for the language this role prefers (wraps around). */
  voiceSlot: number;
};

/** Tuned so roles stay distinguishable even when the device has a single voice. */
export const VOICE_PROFILES: Record<VoiceRole, VoiceProfile> = {
  narrator: { pitch: 1, rate: 0.95, voiceSlot: 0 },
  hero: { pitch: 1.12, rate: 1.02, voiceSlot: 1 },
  villain: { pitch: 0.72, rate: 0.88, voiceSlot: 2 },
  companion: { pitch: 1.3, rate: 1.05, voiceSlot: 3 },
};

/** How each emotion bends a device voice (pitch, rate, volume multipliers). */
export const EMOTION_SHAPES: Record<Emotion, { pitch: number; rate: number; volume: number }> = {
  neutral: { pitch: 1, rate: 1, volume: 1 },
  excited: { pitch: 1.05, rate: 1.08, volume: 1 },
  fearful: { pitch: 1.06, rate: 1.05, volume: 0.9 },
  whisper: { pitch: 0.98, rate: 0.92, volume: 0.6 },
  calm: { pitch: 0.98, rate: 0.92, volume: 0.95 },
};

export const SPEECH_RATES = [0.85, 1, 1.15] as const;
export const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

export type VoiceSettings = { language: Language; multiVoice: boolean; rate: number; volume?: number };

const round = (n: number) => Math.round(n * 100) / 100;

export function speakOptionsFor(role: VoiceRole, voices: string[], settings: VoiceSettings, emotion: Emotion = 'neutral'): SpeakOptions {
  const effective = settings.multiVoice ? role : 'narrator';
  const profile = VOICE_PROFILES[effective];
  const shape = EMOTION_SHAPES[emotion];
  return {
    language: settings.language,
    role: effective,
    emotion,
    pitch: round(profile.pitch * shape.pitch),
    rate: round(profile.rate * settings.rate * shape.rate),
    volume: round((settings.volume ?? 1) * shape.volume),
    voice: voices.length ? voices[profile.voiceSlot % voices.length] : undefined,
  };
}
