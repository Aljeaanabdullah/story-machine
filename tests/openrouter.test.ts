import { AIError, chat, isModelSpecific, kindForStatus } from '@/lib/ai/openrouter';
import { mockFetch } from './helpers';

const base = { apiKey: 'test-key', model: 'm/x:free', messages: [{ role: 'user' as const, content: 'hi' }] };

async function errorOf(p: Promise<unknown>): Promise<AIError> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(AIError);
    return e as AIError;
  }
  throw new Error('expected rejection');
}

describe('OpenRouter chat client', () => {
  it('returns the assistant content and sends the expected request', async () => {
    const m = mockFetch([{ content: 'hello' }]);
    await expect(chat({ ...base, fetchImpl: m.fetch, maxTokens: 50 })).resolves.toBe('hello');
    expect(m.calls[0].model).toBe('m/x:free');
    expect(m.calls[0].headers.Authorization).toBe('Bearer test-key');
    expect(m.calls[0].messages).toEqual(base.messages);
  });

  it('fails fast with no_key and never calls the network', async () => {
    const m = mockFetch([]);
    expect((await errorOf(chat({ ...base, apiKey: '', fetchImpl: m.fetch }))).kind).toBe('no_key');
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'bad_request'],
    [401, 'unauthorized'],
    [402, 'payment'],
    [404, 'not_found'],
    [429, 'rate_limited'],
    [500, 'server'],
    [503, 'server'],
  ])('maps HTTP %i to %s', async (status, kind) => {
    const m = mockFetch([{ status, body: { error: { code: status, message: 'nope' } } }]);
    const err = await errorOf(chat({ ...base, fetchImpl: m.fetch }));
    expect(err.kind).toBe(kind);
    expect(err.status).toBe(status);
  });

  it('recognises the daily free-model cap as quota, not a short rate limit', async () => {
    const msg = 'Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day';
    const m = mockFetch([{ status: 429, body: { error: { code: 429, message: msg } } }]);
    expect((await errorOf(chat({ ...base, fetchImpl: m.fetch }))).kind).toBe('quota');
    expect(isModelSpecific('quota')).toBe(false);
  });

  it('treats an error object inside a 200 response as a failure', async () => {
    const m = mockFetch([{ status: 200, body: { error: { code: 429, message: 'upstream busy' } } }]);
    expect((await errorOf(chat({ ...base, fetchImpl: m.fetch }))).kind).toBe('rate_limited');
  });

  it.each([[null], [''], ['   ']])('reports empty content (%j) as empty', async (content) => {
    const m = mockFetch([{ content }]);
    expect((await errorOf(chat({ ...base, fetchImpl: m.fetch }))).kind).toBe('empty');
  });

  it('reports a body without choices as empty', async () => {
    const m = mockFetch([{ body: {} }]);
    expect((await errorOf(chat({ ...base, fetchImpl: m.fetch }))).kind).toBe('empty');
  });

  it('reports network failures', async () => {
    const m = mockFetch([{ throws: new TypeError('Network request failed') }]);
    expect((await errorOf(chat({ ...base, fetchImpl: m.fetch }))).kind).toBe('network');
  });

  it('times out slow requests', async () => {
    const hanging = ((_: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      })) as unknown as typeof fetch;
    expect((await errorOf(chat({ ...base, fetchImpl: hanging, timeoutMs: 20 }))).kind).toBe('timeout');
  });

  it('never puts the API key in error messages', async () => {
    const m = mockFetch([{ status: 401, body: { error: { message: 'Invalid credentials' } } }]);
    const err = await errorOf(chat({ ...base, apiKey: 'sk-or-v1-SECRET', fetchImpl: m.fetch }));
    expect(err.message).not.toContain('SECRET');
  });

  it('classifies which failures are worth trying another model for', () => {
    expect(kindForStatus(418)).toBe('unknown');
    expect(isModelSpecific('rate_limited')).toBe(true);
    expect(isModelSpecific('not_found')).toBe(true);
    expect(isModelSpecific('empty')).toBe(true);
    expect(isModelSpecific('unauthorized')).toBe(false);
    expect(isModelSpecific('payment')).toBe(false);
    expect(isModelSpecific('network')).toBe(false);
  });
});
