import type { StoryDraft } from '@/lib/story/types';
import { splitParagraphs, splitSentences } from './segment';
import type { Emotion, VoiceRole, VoiceSegment } from './types';

/** Who can be recognised as a speaker in the text around a line of dialogue. */
export type Cast = { hero: string[]; villain: string[]; /** Bedtime: everything is read gently. */ calm?: boolean };

const HERO_WORDS = ['the hero', 'البطل', 'البطلة'];
const VILLAIN_WORDS = [
  'villain', 'sorcerer', 'sorceress', 'witch', 'warlock', 'tyrant', 'warlord', 'demon', 'wraith', 'pirate captain',
  'dark lord', 'shadow king', 'the beast', 'monster', 'dragon', 'enemy', 'stranger in black',
  'الشرير', 'الشريرة', 'الساحر', 'الساحرة', 'المشعوذ', 'الطاغية', 'الشيطان', 'الغول', 'القرصان', 'الوحش', 'التنين', 'العدو', 'سيد الظلام',
];

export function castFor(draft: StoryDraft): Cast {
  const source = draft.mode === 'bedtime' ? draft.bedtime.hero.trim().split(/\s+/).slice(-1).join(' ') : draft.character.name;
  const names = source
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  // Bedtime stories have no real villains; every other speaker is a friendly character.
  const bedtime = draft.mode === 'bedtime';
  return { hero: [...names, ...HERO_WORDS], villain: bedtime ? [] : VILLAIN_WORDS, calm: bedtime };
}

const WHISPER = /whisper|murmur|breathed|softly|همس|تمتم|بصوت خافت|هامس/i;
const FEAR = /trembl|afraid|scream|gasp|shiver|terrified|frightened|خائف|خائفة|ارتجف|مرتجف|صرخ|بخوف|مذعور|مرتعب/i;
const SHOUT = /shout|cried|yelled|roared|bellowed|exclaimed|صاح|هتف|زأر|صرخ بحماس/i;

/** Delivery for a line of dialogue from its punctuation and the speech tag around it. */
export function detectEmotion(line: string, context: string, calm = false): Emotion {
  if (WHISPER.test(context)) return 'whisper';
  if (FEAR.test(context)) return 'fearful';
  if (SHOUT.test(context) || /!/.test(line)) return calm ? 'calm' : 'excited';
  return calm ? 'calm' : 'neutral';
}

const QUOTE = /“([^”]+)”|"([^"]+)"|«([^»]+)»/g;

type Hit = { role: VoiceRole; at: number };

function find(window: string, words: string[], role: VoiceRole, last: boolean): Hit | undefined {
  const lower = window.toLowerCase();
  let best: Hit | undefined;
  for (const w of words) {
    const needle = w.toLowerCase();
    // Latin words need word boundaries ("witch" is not in "switch"); Arabic prefixes like و/ف/ال are fine as substrings.
    const re = /[a-z]/.test(needle) ? new RegExp(`(^|[^\\p{L}])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'gu') : null;
    const positions: number[] = [];
    if (re) for (const m of lower.matchAll(re)) positions.push(m.index + m[1].length);
    else for (let i = lower.indexOf(needle); i !== -1; i = lower.indexOf(needle, i + 1)) positions.push(i);
    for (const at of positions) if (!best || (last ? at > best.at : at < best.at)) best = { role, at };
  }
  return best;
}

/** Closest speaker mention: the first one after the line, otherwise the last one before it. */
export function attributeSpeaker(before: string, after: string, cast: Cast): VoiceRole | undefined {
  const pick = (window: string, last: boolean) => {
    const hits = [find(window, cast.hero, 'hero', last), find(window, cast.villain, 'villain', last)].filter((h): h is Hit => !!h);
    if (!hits.length) return undefined;
    return hits.sort((a, b) => (last ? b.at - a.at : a.at - b.at))[0].role;
  };
  return pick(after, false) ?? pick(before, true);
}

/** The speech tag right after a quote, up to the end of its sentence. */
function tagAfter(text: string): string {
  const end = text.search(/[.!?؟]/);
  return (end === -1 ? text : text.slice(0, end)).slice(0, 80);
}

/** The last sentence of narration before a quote. */
function contextBefore(text: string): string {
  const sentences = splitSentences(text);
  return (sentences[sentences.length - 1] ?? '').slice(-120);
}

/**
 * Splits text into narration and dialogue, giving each quoted line to the hero,
 * the villain, or a generic character based on the speaker named around it.
 */
export function dialogueSegments(text: string, cast: Cast): VoiceSegment[] {
  const out: VoiceSegment[] = [];
  splitParagraphs(text).forEach((p, paragraph) => {
    const narrate = (chunk: string) => {
      for (const s of splitSentences(chunk)) out.push({ role: 'narrator', kind: 'narration', text: s, paragraph, emotion: cast.calm ? 'calm' : 'neutral' });
    };
    const quotes = [...p.matchAll(QUOTE)];
    let cursor = 0;
    let previous: VoiceRole | undefined;
    quotes.forEach((m, i) => {
      const start = m.index;
      const end = start + m[0].length;
      const line = (m[1] ?? m[2] ?? m[3]).trim();
      const nextStart = quotes[i + 1]?.index ?? p.length;
      narrate(p.slice(cursor, start));
      cursor = end;
      if (!/[\p{L}\p{N}]/u.test(line)) return;
      const before = contextBefore(p.slice(0, start));
      const tag = tagAfter(p.slice(end, nextStart));
      const role = attributeSpeaker(before, tag, cast) ?? previous ?? 'companion';
      previous = role;
      const emotion = detectEmotion(line, `${tag} ${before}`, cast.calm);
      const parts = line.length > 280 ? splitSentences(line) : [line];
      for (const t of parts) out.push({ role, kind: 'dialogue', text: t, paragraph, emotion });
    });
    narrate(p.slice(cursor));
  });
  return out;
}

/** Segments for reading: dialogue-aware when character voices are on, narrator-only otherwise. */
export function buildSegments(text: string, draft: StoryDraft, multiVoice: boolean): VoiceSegment[] {
  const segments = dialogueSegments(text, castFor(draft));
  // Narrator-only still keeps the emotion hints; only the voice role collapses.
  return multiVoice ? segments : segments.map((s) => ({ ...s, role: 'narrator' as const }));
}
