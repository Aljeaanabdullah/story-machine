import { MIN_WORDS, parseProse, parseScene } from '@/lib/story/validate';
import { sceneJson, words } from './helpers';

describe('parseProse (short and bedtime stories)', () => {
  it('accepts a valid story', () => {
    const r = parseProse(JSON.stringify({ title: 'The Pearl', story: words(300) }), MIN_WORDS.short);
    expect(r).toEqual({ ok: true, value: { title: 'The Pearl', content: words(300) } });
  });

  it('rejects non-JSON, missing story and too-short stories', () => {
    expect(parseProse('Once upon a time…', 10)).toEqual({ ok: false, reason: 'not_json' });
    expect(parseProse('{"title":"x"}', 10)).toEqual({ ok: false, reason: 'missing_story' });
    expect(parseProse(JSON.stringify({ title: 'x', story: words(50) }), MIN_WORDS.short)).toEqual({ ok: false, reason: 'too_short' });
  });

  it('derives a title when the model omits it', () => {
    const r = parseProse(JSON.stringify({ story: words(150, 'moon') }), MIN_WORDS.bedtime);
    expect(r.ok && r.value.title).toBe('moon moon moon moon moon');
  });
});

describe('parseScene (interactive adventure)', () => {
  it('accepts a scene with exactly 3 choices and extracts memory', () => {
    const r = parseScene(sceneJson(), 1, 6);
    if (!r.ok) throw new Error(r.reason);
    expect(r.value.scene.choices).toHaveLength(3);
    expect(r.value.scene.isEnding).toBe(false);
    expect(r.value.memory).toEqual({ location: 'Black Sand Beach', objective: 'Find the pearl', companions: [], discoveries: ['a carved stone'] });
  });

  it.each([
    [['only one'], 'wrong_choice_count'],
    [['a', 'b'], 'wrong_choice_count'],
    [['a', 'b', 'c', 'd'], 'wrong_choice_count'],
    [[], 'wrong_choice_count'],
  ])('rejects non-final scenes with choices %j', (choices, reason) => {
    expect(parseScene(sceneJson({ choices }), 2, 6)).toEqual({ ok: false, reason });
  });

  it('rejects duplicate choices (case-insensitive)', () => {
    expect(parseScene(sceneJson({ choices: ['Run', 'run', 'Hide'] }), 2, 6)).toEqual({ ok: false, reason: 'duplicate_choices' });
  });

  it('rejects an ending before the climax', () => {
    expect(parseScene(sceneJson({ isEnding: true, choices: [] }), 2, 6)).toEqual({ ok: false, reason: 'early_ending' });
  });

  it('treats an early "ending" with valid choices as a normal scene', () => {
    const r = parseScene(sceneJson({ isEnding: true }), 2, 6);
    expect(r.ok && r.value.scene.isEnding).toBe(false);
  });

  it('allows an ending at the climax scene', () => {
    const r = parseScene(sceneJson({ isEnding: true, choices: [] }), 5, 6);
    expect(r.ok && r.value.scene).toMatchObject({ isEnding: true, choices: [] });
  });

  it('forces the last scene to be the ending and drops any choices', () => {
    const r = parseScene(sceneJson({ isEnding: false }), 6, 6);
    expect(r.ok && r.value.scene).toMatchObject({ isEnding: true, choices: [] });
  });

  it('rejects missing or too-short narrative and invalid JSON', () => {
    expect(parseScene('nope', 1, 6)).toEqual({ ok: false, reason: 'not_json' });
    expect(parseScene(JSON.stringify({ title: 't', choices: ['a', 'b', 'c'] }), 1, 6)).toEqual({ ok: false, reason: 'missing_narrative' });
    expect(parseScene(sceneJson({ narrative: words(10) }), 1, 6)).toEqual({ ok: false, reason: 'too_short' });
  });

  it('accepts Arabic scenes', () => {
    const r = parseScene(
      sceneJson({ title: 'الشاطئ', narrative: words(80, 'موج'), choices: ['اصعد الجرف', 'ادخل الكهف', 'أرسل إشارة'], summary: 'وصل البطل.' }),
      1,
      6,
    );
    expect(r.ok && r.value.scene.choices).toEqual(['اصعد الجرف', 'ادخل الكهف', 'أرسل إشارة']);
  });
});
