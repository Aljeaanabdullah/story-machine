import { deviceSpeech } from './providers/device';
import { elevenLabsSpeech } from './providers/elevenlabs';
import { createNeuralSpeech, withFallback } from './providers/neural';
import type { SpeechProvider, TTSProviderId } from './types';

const PROVIDERS: Record<TTSProviderId, SpeechProvider> = {
  device: deviceSpeech,
  // Device speech is the guaranteed fallback whenever the PC server is off or unreachable.
  neural: withFallback(createNeuralSpeech(), deviceSpeech),
  elevenlabs: elevenLabsSpeech,
};

/** The requested engine when it is usable, otherwise free device speech. */
export function getSpeechProvider(id: TTSProviderId): SpeechProvider {
  const provider = PROVIDERS[id];
  return provider?.isAvailable() ? provider : deviceSpeech;
}

export function isProviderAvailable(id: TTSProviderId): boolean {
  if (id === 'neural') return createNeuralSpeech().isAvailable();
  return PROVIDERS[id]?.isAvailable() ?? false;
}
