import { AIError } from '@/lib/ai/openrouter';
import { applyScene, choose, createAdventure, MAX_SCENES } from '@/lib/story/engine';
import { generateBedtimeStory, generateNextScene, generateShortStory, requestValidated } from '@/lib/story/generate';
import type { AdventureState } from '@/lib/story/types';
import { draftFor, mockFetch, sceneJson, TEST_CONFIG, words } from './helpers';

const story = (title = 'The Pearl', n = 300) => JSON.stringify({ title, story: words(n) });

describe('requestValidated retry budget', () => {
  const parse = (raw: string) => (raw === 'good' ? { ok: true as const, value: raw } : { ok: false as const, reason: 'bad' });
  const msgs = [{ role: 'user' as const, content: 'x' }];

  it('retries the same model once after a malformed reply', async () => {
    const m = mockFetch([{ content: 'garbage' }, { content: 'good' }]);
    await expect(requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: m.fetch })).resolves.toBe('good');
    expect(m.calls.map((c) => c.model)).toEqual(['primary/model:free', 'primary/model:free']);
  });

  it('moves to the fallback model on 429 / 404', async () => {
    const m = mockFetch([{ status: 429 }, { content: 'good' }]);
    await expect(requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: m.fetch })).resolves.toBe('good');
    expect(m.calls.map((c) => c.model)).toEqual(['primary/model:free', 'fallback/model:free']);
  });

  it('moves to the fallback model when a reasoning model returns empty content', async () => {
    const m = mockFetch([{ content: null }, { content: 'good' }]);
    await expect(requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: m.fetch })).resolves.toBe('good');
    expect(m.calls.map((c) => c.model)).toEqual(['primary/model:free', 'fallback/model:free']);
  });

  it('stops immediately on 401 without trying fallbacks', async () => {
    const m = mockFetch([{ status: 401 }]);
    await expect(requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: m.fetch })).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(m.calls).toHaveLength(1);
  });

  it('does not burn fallbacks once the daily free quota is used up', async () => {
    const m = mockFetch([{ status: 429, body: { error: { message: 'Rate limit exceeded: free-models-per-day' } } }]);
    await expect(requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: m.fetch })).rejects.toMatchObject({ kind: 'quota' });
    expect(m.calls).toHaveLength(1);
  });

  it('stops immediately on network failure', async () => {
    const m = mockFetch([{ throws: new TypeError('offline') }]);
    await expect(requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: m.fetch })).rejects.toMatchObject({ kind: 'network' });
    expect(m.calls).toHaveLength(1);
  });

  it('gives up with "invalid" after a bounded number of attempts', async () => {
    const m = mockFetch(Array.from({ length: 10 }, () => ({ content: 'garbage' })));
    await expect(requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: m.fetch })).rejects.toMatchObject({ kind: 'invalid' });
    expect(m.calls).toHaveLength(4); // 2 models × (1 try + 1 retry)
  });

  it('surfaces the last model-specific error when every model fails', async () => {
    const m = mockFetch([{ status: 429 }, { status: 404 }]);
    const err = await requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: m.fetch }).catch((e) => e);
    expect(err).toBeInstanceOf(AIError);
    expect(err.kind).toBe('not_found');
  });

  it('stops at once when the caller cancels, without retries or fallbacks', async () => {
    const ctrl = new AbortController();
    const calls: string[] = [];
    const hanging = ((_: string, init: RequestInit) => {
      calls.push(JSON.parse(String(init.body)).model);
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      });
    }) as unknown as typeof fetch;
    const p = requestValidated(msgs, parse, { config: TEST_CONFIG, fetchImpl: hanging, signal: ctrl.signal });
    ctrl.abort();
    await expect(p).rejects.toBeInstanceOf(AIError);
    expect(calls).toEqual(['primary/model:free']);
  });

  it('rejects with no_key when no API key is configured', async () => {
    const m = mockFetch([]);
    await expect(requestValidated(msgs, parse, { config: { ...TEST_CONFIG, apiKey: '' }, fetchImpl: m.fetch })).rejects.toMatchObject({ kind: 'no_key' });
    expect(m.calls).toHaveLength(0);
  });
});

describe('short and bedtime story generation', () => {
  const prompts = [
    ['A Kuwaiti sailor discovers a mysterious island.', 'en'],
    ['A young magician enters a forbidden forest.', 'en'],
    ['A child finds a magical library.', 'en'],
    ['بحّار كويتي يكتشف جزيرة غامضة.', 'ar'],
    ['ساحر شاب يدخل غابة محرّمة.', 'ar'],
    ['طفل يجد مكتبة سحرية.', 'ar'],
  ] as const;

  it.each(prompts)('short story: "%s" (%s)', async (idea, lang) => {
    const m = mockFetch([{ content: '```json\n' + story('Title', 450) + '\n```' }]);
    const result = await generateShortStory(draftFor('short', lang, idea), { config: TEST_CONFIG, fetchImpl: m.fetch });
    expect(result.title).toBe('Title');
    const [system, user] = m.calls[0].messages;
    expect(system.content).toContain('400-600 words');
    expect(user.content).toContain(idea);
    expect(user.content).toContain(lang === 'ar' ? 'Modern Standard Arabic' : 'clear, vivid English');
    expect(user.content).toContain('Faisal');
  });

  it('bedtime story uses the gentle system prompt and child inputs', async () => {
    const m = mockFetch([{ content: story('Sleepy Noor', 200) }]);
    const result = await generateBedtimeStory(draftFor('bedtime', 'ar', 'A child finds a magical library.'), { config: TEST_CONFIG, fetchImpl: m.fetch });
    expect(result.title).toBe('Sleepy Noor');
    const [system, user] = m.calls[0].messages;
    expect(system.content).toMatch(/Never include anything frightening/);
    expect(user.content).toContain('6–8 years');
    expect(user.content).toContain('a sleepy fox named Noor');
    expect(user.content).toContain('Friendship');
  });

  it('retries once when the first story is too short', async () => {
    const m = mockFetch([{ content: story('x', 40) }, { content: story('Full', 420) }]);
    const result = await generateShortStory(draftFor('short'), { config: TEST_CONFIG, fetchImpl: m.fetch });
    expect(result.title).toBe('Full');
    expect(m.calls).toHaveLength(2);
  });
});

describe('interactive adventure generation', () => {
  it('plays a full adventure start to finish, carrying choices and memory forward', async () => {
    const draft = draftFor('adventure', 'en', 'A Kuwaiti sailor discovers a mysterious island.');
    const replies = Array.from({ length: MAX_SCENES }, (_, i) => ({
      content: sceneJson({
        title: `Scene ${i + 1}`,
        isEnding: i === MAX_SCENES - 1,
        choices: i === MAX_SCENES - 1 ? [] : [`Go north ${i}`, `Go south ${i}`, `Wait ${i}`],
        summary: `Summary ${i + 1}`,
        memory: { location: `Place ${i + 1}`, objective: 'Find the pearl', companions: i >= 2 ? ['Old diver'] : [], discoveries: [] },
      }),
    }));
    const m = mockFetch(replies);
    let state: AdventureState = createAdventure('Lost Island');

    for (let n = 1; n <= MAX_SCENES; n++) {
      state = await generateNextScene(draft, state, { config: TEST_CONFIG, fetchImpl: m.fetch });
      expect(state.scenes).toHaveLength(n);
      if (!state.finished) state = choose(state, 1);
    }

    expect(state.finished).toBe(true);
    expect(state.scenes[MAX_SCENES - 1]).toMatchObject({ isEnding: true, choices: [] });
    expect(state.memory).toMatchObject({ location: `Place ${MAX_SCENES}`, companions: ['Old diver'] });
    expect(m.calls).toHaveLength(MAX_SCENES);

    // Continuity: each request carries the previous choice, the recap and the compact memory.
    const third = m.calls[2].messages[1].content;
    expect(third).toContain('THE PLAYER CHOSE: "Go south 1"');
    expect(third).toContain('Summary 1');
    expect(third).toContain('Summary 2');
    expect(third).toContain('Place 2');
    expect(third).toContain('"scene":"3 of 6"');
    expect(m.calls[0].messages[1].content).toContain('OPENING scene');
    expect(m.calls[MAX_SCENES - 1].messages[1].content).toContain('FINAL scene');

    // No further requests once the story has ended.
    const after = await generateNextScene(draft, state, { config: TEST_CONFIG, fetchImpl: m.fetch });
    expect(after).toBe(state);
    expect(m.calls).toHaveLength(MAX_SCENES);
  });

  it('retries a scene with the wrong number of choices, then succeeds', async () => {
    const m = mockFetch([{ content: sceneJson({ choices: ['a', 'b'] }) }, { content: sceneJson() }]);
    const state = await generateNextScene(draftFor('adventure'), createAdventure('x'), { config: TEST_CONFIG, fetchImpl: m.fetch });
    expect(state.scenes[0].choices).toHaveLength(3);
    expect(m.calls).toHaveLength(2);
  });

  it('keeps the existing story intact when a request fails', async () => {
    const draft = draftFor('adventure');
    const ok = mockFetch([{ content: sceneJson() }]);
    const before = choose(await generateNextScene(draft, createAdventure('x'), { config: TEST_CONFIG, fetchImpl: ok.fetch }), 0);
    const snapshot = JSON.stringify(before);

    const failing = mockFetch([{ status: 429 }, { status: 429 }]);
    await expect(generateNextScene(draft, before, { config: TEST_CONFIG, fetchImpl: failing.fetch })).rejects.toMatchObject({ kind: 'rate_limited' });
    expect(JSON.stringify(before)).toBe(snapshot);

    // The recorded choice survives, so a retry continues from the same point.
    const retry = mockFetch([{ content: sceneJson({ title: 'Scene 2' }) }]);
    const after = await generateNextScene(draft, before, { config: TEST_CONFIG, fetchImpl: retry.fetch });
    expect(after.scenes.map((s) => s.title)).toEqual(['The Shore', 'Scene 2']);
  });

  it('does not request a scene when no choice has been made', async () => {
    const m = mockFetch([]);
    const s = applyScene(createAdventure('x'), { number: 1, title: 't', text: 'x', choices: ['a', 'b', 'c'], isEnding: false, summary: '' }, {});
    expect(await generateNextScene(draftFor('adventure'), s, { config: TEST_CONFIG, fetchImpl: m.fetch })).toBe(s);
    expect(m.calls).toHaveLength(0);
  });
});
