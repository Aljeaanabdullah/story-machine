import { getAIConfig, type AIConfig } from '@/lib/ai/config';
import { AIError, chat, isModelSpecific, type ChatMessage } from '@/lib/ai/openrouter';
import { adventureMessages, bedtimeMessages, shortStoryMessages } from '@/lib/ai/prompts';
import { applyScene, needsScene, nextSceneNumber } from './engine';
import type { AdventureState, StoryDraft } from './types';
import { MIN_WORDS, parseProse, parseScene, type Result } from './validate';

export type GenerateOptions = {
  config?: AIConfig;
  modelOverride?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  /** Extra attempts on the same model when the reply is malformed. Kept low to save free quota. */
  invalidRetries?: number;
  maxTokens?: number;
  onAttempt?: (info: { model: string; attempt: number }) => void;
};

/**
 * Calls the model and validates the reply. Budget per call:
 *  - malformed reply → retry the same model up to `invalidRetries` times;
 *  - model-specific HTTP failure (404/429/5xx/400) → move to the next free fallback;
 *  - auth, payment, network, timeout → stop immediately.
 */
export async function requestValidated<T>(messages: ChatMessage[], parse: (raw: string) => Result<T>, opts: GenerateOptions = {}): Promise<T> {
  const config = opts.config ?? getAIConfig(opts.modelOverride);
  if (!config.apiKey) throw new AIError('no_key');
  const invalidRetries = opts.invalidRetries ?? 1;
  let lastError: AIError = new AIError('unknown');
  let attempt = 0;

  for (const model of config.models) {
    for (let tries = 0; tries <= invalidRetries; tries++) {
      attempt++;
      opts.onAttempt?.({ model, attempt });
      let raw: string;
      try {
        raw = await chat({ apiKey: config.apiKey, model, messages, maxTokens: opts.maxTokens, signal: opts.signal, fetchImpl: opts.fetchImpl });
      } catch (e) {
        lastError = e instanceof AIError ? e : new AIError('unknown', String(e));
        if (isModelSpecific(lastError.kind)) break; // try next model
        throw lastError;
      }
      const parsed = parse(raw);
      if (parsed.ok) return parsed.value;
      lastError = new AIError(raw.trim() ? 'invalid' : 'empty', parsed.reason);
    }
  }
  throw lastError;
}

export async function generateShortStory(draft: StoryDraft, opts?: GenerateOptions) {
  return requestValidated(shortStoryMessages(draft), (raw) => parseProse(raw, MIN_WORDS.short), { maxTokens: 2600, ...opts });
}

export async function generateBedtimeStory(draft: StoryDraft, opts?: GenerateOptions) {
  return requestValidated(bedtimeMessages(draft), (raw) => parseProse(raw, MIN_WORDS.bedtime), { maxTokens: 2200, ...opts });
}

/** Generates the next scene and returns the updated state. The input state is never mutated. */
export async function generateNextScene(draft: StoryDraft, state: AdventureState, opts?: GenerateOptions): Promise<AdventureState> {
  if (!needsScene(state)) return state;
  const number = nextSceneNumber(state);
  const { scene, memory } = await requestValidated(adventureMessages(draft, state), (raw) => parseScene(raw, number, state.maxScenes), {
    maxTokens: 1400,
    ...opts,
  });
  return applyScene(state, scene, memory);
}
