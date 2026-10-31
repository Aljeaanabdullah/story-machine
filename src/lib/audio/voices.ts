import type { Language } from '@/i18n/strings';
import type { SpeakOptions, VoiceRole } from './types';

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

export const SPEECH_RATES = [0.85, 1, 1.15] as const;

export type VoiceSettings = { language: Language; multiVoice: boolean; rate: number };

export function speakOptionsFor(role: VoiceRole, voices: string[], settings: VoiceSettings): SpeakOptions {
  const profile = VOICE_PROFILES[settings.multiVoice ? role : 'narrator'];
  return {
    language: settings.language,
    pitch: profile.pitch,
    rate: Math.round(profile.rate * settings.rate * 100) / 100,
    voice: voices.length ? voices[profile.voiceSlot % voices.length] : undefined,
  };
}
