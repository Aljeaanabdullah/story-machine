import { deviceSpeech } from './providers/device';
import { elevenLabsSpeech } from './providers/elevenlabs';
import type { SpeechProvider, TTSProviderId } from './types';

const PROVIDERS: Record<TTSProviderId, SpeechProvider> = { device: deviceSpeech, elevenlabs: elevenLabsSpeech };

/** The requested engine when it is usable, otherwise free device speech. */
export function getSpeechProvider(id: TTSProviderId): SpeechProvider {
  const provider = PROVIDERS[id];
  return provider?.isAvailable() ? provider : deviceSpeech;
}

export function isProviderAvailable(id: TTSProviderId): boolean {
  return PROVIDERS[id]?.isAvailable() ?? false;
}
