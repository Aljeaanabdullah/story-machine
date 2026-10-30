const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export type AIErrorKind =
  | 'no_key'
  | 'bad_request'
  | 'unauthorized'
  | 'payment'
  | 'not_found'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'timeout'
  | 'empty'
  | 'invalid'
  | 'unknown';

/** Errors carry a kind for UI messaging; `detail` is for logs only and never contains the key. */
export class AIError extends Error {
  constructor(
    public kind: AIErrorKind,
    public detail = '',
    public status?: number,
  ) {
    super(`${kind}${status ? ` (${status})` : ''}${detail ? `: ${detail}` : ''}`);
    this.name = 'AIError';
  }
}

export function kindForStatus(status: number): AIErrorKind {
  if (status === 400) return 'bad_request';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 402) return 'payment';
  if (status === 404) return 'not_found';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** Failures where trying a different free model may help. */
export function isModelSpecific(kind: AIErrorKind) {
  return kind === 'not_found' || kind === 'rate_limited' || kind === 'server' || kind === 'bad_request';
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatOptions = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

type OpenRouterResponse = {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  error?: { code?: number; message?: string };
};

/** Single chat completion. Returns the assistant text or throws AIError. */
export async function chat({ apiKey, model, messages, maxTokens = 2000, temperature = 0.9, timeoutMs = 90000, signal, fetchImpl = fetch }: ChatOptions): Promise<string> {
  if (!apiKey) throw new AIError('no_key');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener('abort', onOuterAbort);

  let res: Response;
  try {
    res = await fetchImpl(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'StoryVerse AI',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        // Keep hidden reasoning short and out of the answer for reasoning models; ignored by others.
        reasoning: { effort: 'low', exclude: true },
      }),
    });
  } catch (e) {
    const aborted = controller.signal.aborted || (e as Error)?.name === 'AbortError';
    throw new AIError(aborted ? 'timeout' : 'network', aborted ? '' : String((e as Error)?.message ?? e));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }

  let body: OpenRouterResponse | null = null;
  try {
    body = (await res.json()) as OpenRouterResponse;
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new AIError(kindForStatus(res.status), body?.error?.message ?? '', res.status);
  }
  // OpenRouter can report upstream failures inside a 200 body.
  if (body?.error) {
    const status = typeof body.error.code === 'number' ? body.error.code : 500;
    throw new AIError(kindForStatus(status), body.error.message ?? '', status);
  }

  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim().length === 0) throw new AIError('empty');
  return content;
}
