import type { VoiceRole } from './types';

/**
 * Premium voice configuration, read from env so nothing is hardcoded.
 *
 * SECURITY: an ElevenLabs API key must NEVER go in an EXPO_PUBLIC_* variable —
 * those are embedded in the app bundle. Premium voices are meant to go through a
 * backend you control (EXPO_PUBLIC_TTS_PROXY_URL) that keeps the key server-side.
 * Voice IDs are not secrets and may be configured here.
 */
export type PremiumVoiceConfig = {
  proxyUrl: string;
  voiceIds: Partial<Record<VoiceRole, string>>;
};

const clean = (v: string | undefined) => v?.trim() || undefined;

export function getPremiumVoiceConfig(): PremiumVoiceConfig {
  return {
    proxyUrl: clean(process.env.EXPO_PUBLIC_TTS_PROXY_URL) ?? '',
    voiceIds: {
      narrator: clean(process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_NARRATOR),
      hero: clean(process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_HERO),
      villain: clean(process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_VILLAIN),
      companion: clean(process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_COMPANION),
    },
  };
}
