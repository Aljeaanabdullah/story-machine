import { attributeSpeaker, buildSegments, castFor, dialogueSegments } from '@/lib/audio/dialogue';
import { VOICE_PROFILES, speakOptionsFor } from '@/lib/audio/voices';
import { VOICE_ROLES } from '@/lib/audio/types';
import { draftFor } from './helpers';

const cast = castFor(draftFor('short')); // hero: Faisal
const lines = (text: string) => dialogueSegments(text, cast).map((s) => [s.role, s.kind, s.text]);

describe('speaker attribution', () => {
  it('prefers the speech tag after the line, then the sentence before it', () => {
    expect(attributeSpeaker('', ' Faisal called', cast)).toBe('hero');
    expect(attributeSpeaker('', ', hissed the sorcerer', cast)).toBe('villain');
    expect(attributeSpeaker('Faisal raised his lantern at the witch.', '', cast)).toBe('villain');
    expect(attributeSpeaker('The witch turned to Faisal.', '', cast)).toBe('hero');
    expect(attributeSpeaker('Someone whispered.', ' she said', cast)).toBeUndefined();
  });

  it('matches whole English words only', () => {
    expect(attributeSpeaker('', ' flipped the switch', cast)).toBeUndefined();
    expect(attributeSpeaker('', ' FAISAL shouted', cast)).toBe('hero');
  });

  it('bedtime stories use the hero name and never cast a villain', () => {
    const bedtime = castFor(draftFor('bedtime')); // hero: "a sleepy fox named Noor"
    expect(bedtime.hero).toContain('Noor');
    expect(attributeSpeaker('', ' said the dragon', bedtime)).toBeUndefined();
  });
});

describe('dialogue-aware segmentation (English)', () => {
  it('separates narration from quoted lines and assigns roles', () => {
    expect(lines('"Who goes there?" Faisal called into the dark.')).toEqual([
      ['hero', 'dialogue', 'Who goes there?'],
      ['narrator', 'narration', 'Faisal called into the dark.'],
    ]);
  });

  it('keeps the same speaker across a split quote', () => {
    expect(lines('A figure stepped out. “You should not have come,” hissed the sorcerer. “This island keeps what it takes.”')).toEqual([
      ['narrator', 'narration', 'A figure stepped out.'],
      ['villain', 'dialogue', 'You should not have come,'],
      ['narrator', 'narration', 'hissed the sorcerer.'],
      ['villain', 'dialogue', 'This island keeps what it takes.'],
    ]);
  });

  it('gives unattributed lines to a generic character and tracks paragraphs', () => {
    const segs = dialogueSegments('The door creaked.\n\n"Hello?" came a small voice.', cast);
    expect(segs.map((s) => [s.role, s.paragraph])).toEqual([
      ['narrator', 0],
      ['companion', 1],
      ['narrator', 1],
    ]);
  });

  it('text without quotes is pure narration', () => {
    expect(lines('The sea was calm. Faisal slept.').every(([role]) => role === 'narrator')).toBe(true);
  });

  it('skips empty quotes and splits very long speeches into sentences', () => {
    expect(lines('He said "  " and left.')).toEqual([
      ['narrator', 'narration', 'He said'],
      ['narrator', 'narration', 'and left.'],
    ]);
    const long = Array.from({ length: 12 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
    const segs = dialogueSegments(`"${long}" said Faisal.`, cast).filter((s) => s.kind === 'dialogue');
    expect(segs).toHaveLength(12);
    expect(segs.every((s) => s.role === 'hero')).toBe(true);
  });
});

describe('dialogue-aware segmentation (Arabic)', () => {
  const ar = castFor({ ...draftFor('short', 'ar'), character: { ...draftFor('short', 'ar').character, name: 'فيصل' } });

  it('recognises «» quotes, the hero name and Arabic villain words', () => {
    const text = '«من هناك؟» نادى فيصل في الظلام.\n\nخرج الساحر من بين الأشجار وقال: «ما كان عليك أن تأتي أيها البحّار.»';
    expect(dialogueSegments(text, ar).map((s) => [s.role, s.kind])).toEqual([
      ['hero', 'dialogue'],
      ['narrator', 'narration'],
      ['narrator', 'narration'],
      ['villain', 'dialogue'],
    ]);
  });

  it('matches Arabic words with attached prefixes', () => {
    expect(attributeSpeaker('', ' قال والساحر يضحك', ar)).toBe('villain');
  });
});

describe('buildSegments and voice profiles', () => {
  it('narrator-only mode reads quotes in the narrator voice', () => {
    const text = '"Run!" cried the witch.';
    expect(buildSegments(text, draftFor('short'), false).every((s) => s.role === 'narrator')).toBe(true);
    expect(buildSegments(text, draftFor('short'), true)[0].role).toBe('villain');
  });

  it('every role has a distinct profile and maps to its own device voice when available', () => {
    const pitches = VOICE_ROLES.map((r) => VOICE_PROFILES[r].pitch);
    expect(new Set(pitches).size).toBe(VOICE_ROLES.length);
    const voices = ['v0', 'v1', 'v2', 'v3'];
    const picked = VOICE_ROLES.map((r) => speakOptionsFor(r, voices, { language: 'en', multiVoice: true, rate: 1 }).voice);
    expect(new Set(picked).size).toBe(4);
  });

  it('roles fall back to the narrator profile when character voices are off', () => {
    const opts = { language: 'en' as const, multiVoice: false, rate: 1 };
    expect(speakOptionsFor('villain', ['v0', 'v1', 'v2'], opts)).toEqual(speakOptionsFor('narrator', ['v0', 'v1', 'v2'], opts));
  });

  it('wraps voice slots on devices with few voices and uses the default with none', () => {
    const opts = { language: 'ar' as const, multiVoice: true, rate: 1.15 };
    expect(speakOptionsFor('villain', ['only'], opts).voice).toBe('only');
    expect(speakOptionsFor('hero', [], opts).voice).toBeUndefined();
    expect(speakOptionsFor('narrator', [], opts).rate).toBeCloseTo(0.95 * 1.15, 2);
  });
});
