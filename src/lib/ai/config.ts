/**
 * PROTOTYPE ONLY: EXPO_PUBLIC_* values are inlined into the JS bundle, so the
 * key can be extracted from any build. Never ship this to a public store —
 * route requests through a backend first (see README "Security").
 */
export const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
export const DEFAULT_FALLBACKS = ['google/gemma-4-31b-it:free', 'nvidia/nemotron-3.5-lightning:free'];

export type AIConfig = { apiKey: string; models: string[] };

export function isFreeModel(id: string) {
  return /^[\w.-]+\/[\w.:-]+:free$/.test(id.trim());
}

/** Primary model first, then de-duplicated free fallbacks. Paid models are dropped. */
export function resolveModels(override: string | undefined, envModel: string | undefined, envFallbacks: string | undefined): string[] {
  const primary = [override, envModel, DEFAULT_MODEL].map((m) => m?.trim()).find((m) => m && isFreeModel(m)) ?? DEFAULT_MODEL;
  const fallbacks = envFallbacks
    ? envFallbacks
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
    : DEFAULT_FALLBACKS;
  return [...new Set([primary, ...fallbacks].filter(isFreeModel))];
}

export function getAIConfig(modelOverride?: string): AIConfig {
  return {
    // Static references are required for Expo to inline these at build time.
    apiKey: (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '').trim(),
    models: resolveModels(modelOverride, process.env.EXPO_PUBLIC_OPENROUTER_MODEL, process.env.EXPO_PUBLIC_OPENROUTER_FALLBACK_MODELS),
  };
}

export function hasApiKey() {
  return (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '').trim().length > 0;
}
