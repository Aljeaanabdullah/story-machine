import { asString, asStringList, extractJsonObject, wordCount } from '@/lib/ai/json';
import type { AdventureMemory, Scene } from './types';

export type Result<T> = { ok: true; value: T } | { ok: false; reason: string };

export const MIN_WORDS = { short: 200, bedtime: 120, scene: 50 } as const;

/** Validates a {title, story} reply for short and bedtime modes. */
export function parseProse(raw: string, minWords: number): Result<{ title: string; content: string }> {
  const obj = extractJsonObject(raw) as Record<string, unknown> | undefined;
  if (!obj || typeof obj !== 'object') return { ok: false, reason: 'not_json' };
  const content = asString(obj.story ?? obj.text ?? obj.content, 12000).replace(/\r\n/g, '\n');
  if (!content) return { ok: false, reason: 'missing_story' };
  if (wordCount(content) < minWords) return { ok: false, reason: 'too_short' };
  const title = asString(obj.title, 120) || content.split(/\s+/).slice(0, 5).join(' ');
  return { ok: true, value: { title, content } };
}

export type SceneParse = { scene: Scene; memory: Partial<AdventureMemory> };

/**
 * Validates one adventure scene against the engine's rules:
 *  - non-final scenes need exactly 3 distinct, non-empty choices;
 *  - the last allowed scene is always treated as the ending (choices dropped);
 *  - endings before `minEndScene` are rejected so adventures can't fizzle out.
 */
export function parseScene(raw: string, number: number, maxScenes: number, minEndScene = maxScenes - 1): Result<SceneParse> {
  const obj = extractJsonObject(raw) as Record<string, unknown> | undefined;
  if (!obj || typeof obj !== 'object') return { ok: false, reason: 'not_json' };

  const text = asString(obj.narrative ?? obj.text ?? obj.story, 6000).replace(/\r\n/g, '\n');
  if (!text) return { ok: false, reason: 'missing_narrative' };
  if (wordCount(text) < MIN_WORDS.scene) return { ok: false, reason: 'too_short' };

  const title = asString(obj.title, 80) || `#${number}`;
  const summary = asString(obj.summary, 300) || text.split(/(?<=[.!?؟])\s/)[0].slice(0, 200);
  const choices = asStringList(obj.choices, 5, 200);
  const claimsEnding = obj.isEnding === true || obj.isEnding === 'true';

  let isEnding: boolean;
  if (number >= maxScenes) isEnding = true;
  else if (claimsEnding && number >= minEndScene) isEnding = true;
  else if (claimsEnding && choices.length !== 3) return { ok: false, reason: 'early_ending' };
  else isEnding = false;

  if (!isEnding) {
    if (choices.length !== 3) return { ok: false, reason: 'wrong_choice_count' };
    const unique = new Set(choices.map((c) => c.toLowerCase()));
    if (unique.size !== 3) return { ok: false, reason: 'duplicate_choices' };
  }

  const m = (obj.memory ?? {}) as Record<string, unknown>;
  const memory: Partial<AdventureMemory> = {};
  const location = asString(m.location, 120);
  const objective = asString(m.objective, 200);
  if (location) memory.location = location;
  if (objective) memory.objective = objective;
  if (Array.isArray(m.companions)) memory.companions = asStringList(m.companions, 6, 80);
  if (Array.isArray(m.discoveries)) memory.discoveries = asStringList(m.discoveries, 8, 120);

  return { ok: true, value: { scene: { number, title, text, choices: isEnding ? [] : choices, isEnding, summary }, memory } };
}
