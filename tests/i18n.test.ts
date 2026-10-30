import { ARCHETYPES, BEDTIME_THEMES, GENRES, MOODS, PERSONALITIES, WORLDS } from '@/data/catalog';
import { directionStyles } from '@/i18n/direction';
import { strings, t } from '@/i18n/strings';
import { errorMessage } from '@/lib/ai/errors';
import { AIError, type AIErrorKind } from '@/lib/ai/openrouter';

function shape(o: unknown): unknown {
  if (Array.isArray(o)) return `array:${o.length}`;
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)]));
  return typeof o;
}

describe('bilingual strings', () => {
  it('Arabic has exactly the same keys and list lengths as English', () => {
    expect(shape(strings.ar)).toEqual(shape(strings.en));
  });

  it('has no empty translations', () => {
    const empty = (o: object, path = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? (v.trim() ? [] : [path + k]) : typeof v === 'object' ? empty(v, `${path}${k}.`) : []));
    expect(empty(strings.en)).toEqual([]);
    expect(empty(strings.ar)).toEqual([]);
  });

  it('falls back to English for unknown languages', () => {
    expect(t('xx' as never)).toBe(strings.en);
  });

  it('every catalog entry is translated', () => {
    for (const list of [ARCHETYPES, PERSONALITIES, GENRES, MOODS, BEDTIME_THEMES, WORLDS]) {
      for (const item of list) {
        expect(item.name.en.trim()).not.toBe('');
        expect(item.name.ar.trim()).not.toBe('');
      }
    }
    for (const w of WORLDS) expect(w.tagline.ar && w.description.ar && w.mood.ar).toBeTruthy();
  });

  it('translates every AI error kind in both languages without leaking details', () => {
    const kinds: AIErrorKind[] = ['no_key', 'bad_request', 'unauthorized', 'payment', 'not_found', 'rate_limited', 'quota', 'server', 'network', 'timeout', 'empty', 'invalid', 'unknown'];
    for (const kind of kinds) {
      const en = errorMessage(new AIError(kind, 'secret upstream detail'), strings.en);
      const ar = errorMessage(new AIError(kind, 'secret upstream detail'), strings.ar);
      expect(en).toBe(strings.en.errors[kind]);
      expect(ar).toBe(strings.ar.errors[kind]);
      expect(en).not.toContain('secret');
    }
    expect(errorMessage(new Error('boom'), strings.ar)).toBe(strings.ar.errors.unknown);
  });
});

describe('layout direction', () => {
  it('mirrors rows and text for Arabic on an LTR device', () => {
    expect(directionStyles(true, false)).toMatchObject({ isRTL: true, row: 'row-reverse', textAlign: 'right', sign: -1 });
    expect(directionStyles(false, false)).toMatchObject({ isRTL: false, row: 'row', textAlign: 'left', sign: 1 });
  });

  it('does not double-flip when the device itself is RTL', () => {
    expect(directionStyles(true, true)).toMatchObject({ row: 'row', textAlign: 'left', writingDirection: 'rtl' });
    expect(directionStyles(false, true)).toMatchObject({ row: 'row-reverse', textAlign: 'right', writingDirection: 'ltr' });
  });
});
