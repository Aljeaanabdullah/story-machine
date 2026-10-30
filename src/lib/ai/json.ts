/** End index of the balanced {...} starting at `start`, ignoring braces inside strings. */
function balancedEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
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
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Every top-level JSON object found in a model reply, in order. Models wrap JSON in
 * ``` fences, add sentences around it, or leak their reasoning (which may itself
 * contain braces) before the real answer, so callers usually want the last match.
 */
export function extractJsonObjects(text: string): Record<string, unknown>[] {
  const cleaned = text.replace(/```(?:json)?/gi, '');
  const found: Record<string, unknown>[] = [];
  let i = cleaned.indexOf('{');
  while (i >= 0) {
    const end = balancedEnd(cleaned, i);
    const parsed = end > 0 ? tryParse(cleaned.slice(i, end + 1)) : undefined;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      found.push(parsed as Record<string, unknown>);
      i = cleaned.indexOf('{', end + 1);
    } else {
      i = cleaned.indexOf('{', i + 1);
    }
  }
  return found;
}

/** The first JSON object in a reply, or undefined. */
export function extractJsonObject(text: string): unknown {
  return extractJsonObjects(text)[0];
}

/** The last object in a reply that has any of the given keys (the model's final answer). */
export function extractAnswer(text: string, keys: string[]): Record<string, unknown> | undefined {
  const all = extractJsonObjects(text);
  for (let i = all.length - 1; i >= 0; i--) if (keys.some((k) => k in all[i])) return all[i];
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
