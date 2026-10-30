import type { Strings } from '@/i18n/strings';
import { AIError } from './openrouter';

/** Maps any thrown value to a translated, user-safe message. */
export function errorMessage(e: unknown, s: Strings): string {
  const kind = e instanceof AIError ? e.kind : 'unknown';
  return s.errors[kind] ?? s.errors.unknown;
}

/** Dev-only log line that never includes request headers or the key. */
export function logAIError(e: unknown) {
  if (__DEV__) console.warn('[StoryVerse AI]', e instanceof AIError ? e.message : String(e));
}
