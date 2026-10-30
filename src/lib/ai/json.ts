/**
 * Pulls the first JSON object out of a model reply. Models often wrap JSON in
 * ``` fences or add a sentence before/after it, so we scan for a balanced
 * object instead of trusting the whole string.
 */
export function extractJsonObject(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  if (start < 0) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return tryParse(cleaned.slice(start, i + 1));
    }
  }
  return undefined;
}

function tryParse(candidate: string): unknown {
  try {
    return JSON.parse(candidate);
  } catch {
    // Common model slip: trailing commas before } or ].
    try {
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return undefined;
    }
  }
}

export function asString(v: unknown, max = 4000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function asStringList(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => asString(x, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
