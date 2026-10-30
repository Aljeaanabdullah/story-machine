import fs from 'fs';
import path from 'path';

import { resolveModels, type AIConfig } from '@/lib/ai/config';

/**
 * Reads .env.local directly (Jest doesn't load Expo env files).
 * The key is only ever passed to the request header — never logged or returned in messages.
 */
export function loadLiveConfig(): AIConfig | null {
  const file = path.join(__dirname, '..', '..', '.env.local');
  if (!fs.existsSync(file)) return null;
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  const apiKey = (env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '').trim();
  if (!apiKey) return null;
  return { apiKey, models: resolveModels(undefined, env.EXPO_PUBLIC_OPENROUTER_MODEL, env.EXPO_PUBLIC_OPENROUTER_FALLBACK_MODELS) };
}

/** Defensive: any text we print must not contain the key. */
export function safe(text: string, config: AIConfig): string {
  return config.apiKey ? text.split(config.apiKey).join('[REDACTED]') : text;
}
