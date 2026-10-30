import { DEFAULT_FALLBACKS, DEFAULT_MODEL, isFreeModel, resolveModels } from '@/lib/ai/config';

describe('AI model configuration', () => {
  it('only accepts :free models', () => {
    expect(isFreeModel('nvidia/nemotron-3-ultra-550b-a55b:free')).toBe(true);
    expect(isFreeModel('openai/gpt-5')).toBe(false);
    expect(isFreeModel('free')).toBe(false);
    expect(isFreeModel('a/b:free; rm -rf')).toBe(false);
  });

  it('uses the preferred default when nothing is configured', () => {
    expect(resolveModels(undefined, undefined, undefined)).toEqual([DEFAULT_MODEL, ...DEFAULT_FALLBACKS]);
  });

  it('prefers the in-app override, then the env model', () => {
    expect(resolveModels('x/override:free', 'y/env:free', '')[0]).toBe('x/override:free');
    expect(resolveModels('', 'y/env:free', '')[0]).toBe('y/env:free');
  });

  it('ignores paid models everywhere and de-duplicates', () => {
    const models = resolveModels('paid/model', 'y/env:free', 'y/env:free, paid/other ,z/fb:free');
    expect(models).toEqual(['y/env:free', 'z/fb:free']);
  });
});
