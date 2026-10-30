import { asStringList, extractAnswer, extractJsonObject, extractJsonObjects, wordCount } from '@/lib/ai/json';

describe('extractJsonObject', () => {
  it('parses a plain object', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips ```json fences and surrounding prose', () => {
    const raw = 'Here is your story:\n```json\n{"title":"Tide","story":"x"}\n```\nEnjoy!';
    expect(extractJsonObject(raw)).toEqual({ title: 'Tide', story: 'x' });
  });

  it('ignores braces inside strings and handles escaped quotes', () => {
    const raw = '{"text":"a {weird} \\"quoted\\" }brace","n":2} trailing {junk}';
    expect(extractJsonObject(raw)).toEqual({ text: 'a {weird} "quoted" }brace', n: 2 });
  });

  it('repairs trailing commas', () => {
    expect(extractJsonObject('{"choices":["a","b",],}')).toEqual({ choices: ['a', 'b'] });
  });

  it('returns undefined for invalid or missing JSON', () => {
    expect(extractJsonObject('no json here')).toBeUndefined();
    expect(extractJsonObject('{"unterminated": ')).toBeUndefined();
    expect(extractJsonObject('{bad json}')).toBeUndefined();
  });

  it('keeps Arabic text intact', () => {
    expect(extractJsonObject('{"title":"البحّار والجزيرة"}')).toEqual({ title: 'البحّار والجزيرة' });
  });
});

describe('leaked reasoning (seen live from a free reasoning model)', () => {
  const raw =
    'We need to output JSON with title and story. Something like {title, story}. Maybe {"draft": true}.\n' +
    'Let me write it.\n{"title":"Noor and the Library","story":"Once upon a time..."}';

  it('collects every parseable object in order', () => {
    expect(extractJsonObjects(raw)).toEqual([{ draft: true }, { title: 'Noor and the Library', story: 'Once upon a time...' }]);
  });

  it('extractAnswer returns the final object with the expected keys', () => {
    expect(extractAnswer(raw, ['story'])).toEqual({ title: 'Noor and the Library', story: 'Once upon a time...' });
    expect(extractAnswer(raw, ['narrative'])).toBeUndefined();
  });
});

describe('helpers', () => {
  it('counts words in English and Arabic', () => {
    expect(wordCount('one two  three\nfour')).toBe(4);
    expect(wordCount('بحّار كويتي يكتشف جزيرة')).toBe(4);
    expect(wordCount('   ')).toBe(0);
  });

  it('filters and trims string lists', () => {
    expect(asStringList([' a ', '', 3, 'b', 'c'], 2, 10)).toEqual(['a', 'b']);
    expect(asStringList('not a list', 3, 10)).toEqual([]);
  });
});
