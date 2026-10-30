import type { Language } from '@/i18n/strings';
import type { AIConfig } from '@/lib/ai/config';
import type { StoryDraft } from '@/lib/story/types';
import { emptyDraft } from '@/state/draft';

export const TEST_CONFIG: AIConfig = { apiKey: 'test-key', models: ['primary/model:free', 'fallback/model:free'] };

export function draftFor(mode: StoryDraft['mode'], language: Language = 'en', idea = ''): StoryDraft {
  const d = emptyDraft(mode, language);
  return {
    ...d,
    idea,
    character: { name: 'Faisal', archetype: 'sailor', personality: 'brave', ability: 'reads the tides', appearance: 'sea-worn cloak' },
    world: { kind: 'preset', id: 'lost-island' },
    bedtime: { ageRange: '6-8', hero: 'a sleepy fox named Noor', theme: 'friendship' },
  };
}

/** n words of filler so validators' minimum lengths are met. */
export function words(n: number, word = 'tide'): string {
  return Array.from({ length: n }, () => word).join(' ');
}

export function sceneJson(opts: { choices?: string[]; isEnding?: boolean; title?: string; narrative?: string; summary?: string; memory?: object } = {}) {
  return JSON.stringify({
    title: opts.title ?? 'The Shore',
    narrative: opts.narrative ?? words(80),
    choices: opts.choices ?? ['Climb the cliff', 'Enter the cave', 'Signal the ship'],
    isEnding: opts.isEnding ?? false,
    summary: opts.summary ?? 'The hero lands on the island.',
    memory: opts.memory ?? { location: 'Black Sand Beach', objective: 'Find the pearl', companions: [], discoveries: ['a carved stone'] },
  });
}

type Reply = { status?: number; body?: unknown; content?: string | null; throws?: Error };

/** fetch mock that returns queued replies and records every request body. */
export function mockFetch(replies: Reply[]) {
  const calls: { model: string; messages: { role: string; content: string }[]; headers: Record<string, string> }[] = [];
  const queue = [...replies];
  const fn = jest.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    calls.push({ model: body.model, messages: body.messages, headers: init.headers as Record<string, string> });
    const r = queue.shift();
    if (!r) throw new Error('mockFetch: no more replies queued');
    if (r.throws) throw r.throws;
    const status = r.status ?? 200;
    const payload = r.body ?? { choices: [{ message: { content: r.content ?? '' } }] };
    return { ok: status >= 200 && status < 300, status, json: async () => payload } as unknown as Response;
  });
  return { fetch: fn as unknown as typeof fetch, calls, remaining: () => queue.length };
}
