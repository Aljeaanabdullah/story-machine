/**
 * REAL OpenRouter test — sends ~10 requests to free models.
 * Skipped unless `.env.local` has EXPO_PUBLIC_OPENROUTER_API_KEY. Run: npm run test:live
 * Prints only model ids, titles, word counts and choices; never the key.
 */
import { wordCount } from '@/lib/ai/json';
import { choose, createAdventure, MAX_SCENES } from '@/lib/story/engine';
import { generateBedtimeStory, generateNextScene, generateShortStory, type GenerateOptions } from '@/lib/story/generate';
import type { AdventureState } from '@/lib/story/types';
import { draftFor } from '../helpers';
import { loadLiveConfig, safe } from './env';

const config = loadLiveConfig();
const live = config ? describe : describe.skip;
const ARABIC = /[؀-ۿ]/;

if (!config) console.log('[live] Skipped: no EXPO_PUBLIC_OPENROUTER_API_KEY in .env.local');

live('OpenRouter (live, free models only)', () => {
  const cfg = config!;
  let models: string[] = [];
  const log = (msg: string) => console.log(safe(`[live] ${msg}`, cfg));
  const opts = (): GenerateOptions => ({
    config: { ...cfg, models },
    onAttempt: ({ model, attempt }) => log(`  attempt ${attempt} → ${model}`),
  });

  beforeAll(async () => {
    // Public endpoint, no key needed: keep only configured models that exist right now and are free.
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const ids = new Set(((await res.json()) as { data: { id: string }[] }).data.map((m) => m.id));
    models = cfg.models.filter((m) => m.endsWith(':free') && ids.has(m));
    log(`configured: ${cfg.models.join(', ')}`);
    log(`available:  ${models.join(', ') || '(none)'}`);
    expect(models.length).toBeGreaterThan(0);
  });

  it('short story (EN): A Kuwaiti sailor discovers a mysterious island.', async () => {
    const r = await generateShortStory(draftFor('short', 'en', 'A Kuwaiti sailor discovers a mysterious island.'), opts());
    log(`EN short: "${r.title}" — ${wordCount(r.content)} words`);
    expect(wordCount(r.content)).toBeGreaterThanOrEqual(200);
  });

  it('short story (AR): A young magician enters a forbidden forest.', async () => {
    const d = { ...draftFor('short', 'ar', 'ساحر شاب يدخل غابة محرّمة.'), world: { kind: 'preset' as const, id: 'enchanted-forest' } };
    const r = await generateShortStory(d, opts());
    log(`AR short: "${r.title}" — ${wordCount(r.content)} words`);
    expect(r.content).toMatch(ARABIC);
    expect(r.title).toMatch(ARABIC);
  });

  it('bedtime story (EN): A child finds a magical library.', async () => {
    const r = await generateBedtimeStory(draftFor('bedtime', 'en', 'A child finds a magical library.'), opts());
    log(`EN bedtime: "${r.title}" — ${wordCount(r.content)} words`);
    expect(wordCount(r.content)).toBeGreaterThanOrEqual(120);
  });

  it('interactive adventure (AR) from opening scene to ending', async () => {
    const draft = draftFor('adventure', 'ar', 'بحّار كويتي يكتشف جزيرة غامضة.');
    let state: AdventureState = createAdventure('Lost Island');
    for (let i = 0; i < MAX_SCENES && !state.finished; i++) {
      state = await generateNextScene(draft, state, opts());
      const s = state.scenes[state.scenes.length - 1];
      log(`scene ${s.number}: "${s.title}" — ${wordCount(s.text)} words${s.isEnding ? ' — ENDING' : ''}`);
      expect(s.text).toMatch(ARABIC);
      if (!s.isEnding) {
        expect(s.choices).toHaveLength(3);
        s.choices.forEach((c, j) => log(`    ${j + 1}. ${c}`));
        state = choose(state, s.number % 3);
        log(`    → chose ${(s.number % 3) + 1}`);
      }
    }
    expect(state.finished).toBe(true);
    expect(state.scenes.length).toBeGreaterThanOrEqual(MAX_SCENES - 1);
    expect(state.scenes[state.scenes.length - 1].choices).toEqual([]);
    log(`memory: ${JSON.stringify(state.memory)}`);
  });
});
