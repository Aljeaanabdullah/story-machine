import type { StoryDraft } from '@/lib/story/types';

/** Looping background beds. All files are synthesized by scripts/gen-sfx.js (original, no licensing). */
export const AMBIENCES = ['ocean', 'rain', 'storm', 'wind', 'forest', 'suspense'] as const;
export type Ambience = (typeof AMBIENCES)[number];

/** One-shot effects fired when a sentence mentions them. */
export const CUES = ['thunder', 'footsteps', 'door', 'magic'] as const;
export type Cue = (typeof CUES)[number];

/** English words match whole words plus common endings ("wave" → "waves"); Arabic matches anywhere (prefixes like و/ف/ال). */
const AMBIENCE_WORDS: Record<Ambience, string[]> = {
  storm: ['storm', 'thunder', 'lightning', 'tempest', 'عاصفة', 'العاصفة', 'رعد', 'برق'],
  rain: ['rain', 'drizzle', 'downpour', 'مطر', 'المطر', 'أمطار', 'رذاذ'],
  ocean: ['sea', 'ocean', 'wave', 'shore', 'beach', 'ship', 'sail', 'tide', 'harbor', 'بحر', 'البحر', 'موج', 'الأمواج', 'شاطئ', 'الشاطئ', 'سفينة', 'شراع', 'المد', 'ميناء'],
  forest: ['forest', 'tree', 'jungle', 'wood', 'leaves', 'grove', 'غابة', 'الغابة', 'أشجار', 'شجرة', 'أدغال', 'أوراق'],
  wind: ['wind', 'desert', 'dune', 'mountain', 'sand', 'cliff', 'ريح', 'رياح', 'الرياح', 'صحراء', 'الصحراء', 'كثبان', 'جبل', 'رمال'],
  suspense: ['dark', 'darkness', 'shadow', 'cave', 'fear', 'creep', 'haunt', 'ghost', 'silence', 'ظلام', 'الظلام', 'ظل', 'كهف', 'خوف', 'شبح', 'صمت', 'مخيف'],
};

const CUE_WORDS: Record<Cue, string[]> = {
  thunder: ['thunder', 'lightning', 'رعد', 'الرعد', 'برق'],
  door: ['door', 'gate', 'باب', 'الباب', 'بوابة'],
  footsteps: ['footstep', 'steps', 'walked', 'stepped', 'stride', 'خطوات', 'مشى', 'خطا', 'وقع أقدام'],
  magic: ['magic', 'spell', 'enchant', 'sparkle', 'sparkl', 'سحر', 'السحر', 'تعويذة', 'سحري', 'بريق'],
};

const WORLD_AMBIENCE: Record<string, Ambience> = {
  'lost-island': 'ocean',
  'underwater-kingdom': 'ocean',
  'enchanted-forest': 'forest',
  'desert-secrets': 'wind',
  'haunted-mansion': 'suspense',
  'cyberpunk-city': 'rain',
  'space-frontier': 'suspense',
  'ancient-kingdom': 'wind',
};

function count(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  let n = 0;
  for (const w of words) {
    if (/[a-z]/.test(w)) n += lower.match(new RegExp(`(^|[^\\p{L}])${w}(?:s|es|ed|ing|y)?(?![\\p{L}])`, 'gu'))?.length ?? 0;
    else for (let i = lower.indexOf(w); i !== -1; i = lower.indexOf(w, i + 1)) n++;
  }
  return n;
}

/** The bed that best fits a scene: the most mentioned setting, else the world's default. */
export function pickAmbience(text: string, draft: StoryDraft): Ambience | null {
  if (draft.mode === 'bedtime') return count(text, AMBIENCE_WORDS.rain) ? 'rain' : count(text, AMBIENCE_WORDS.ocean) ? 'ocean' : null;
  let best: Ambience | null = null;
  let bestScore = 0;
  for (const a of AMBIENCES) {
    const score = count(text, AMBIENCE_WORDS[a]) * (a === 'storm' ? 1.5 : 1);
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  if (best) return best;
  return draft.world.kind === 'preset' ? (WORLD_AMBIENCE[draft.world.id] ?? null) : null;
}

/** The effect a sentence calls for, if any. */
export function cueFor(text: string): Cue | null {
  for (const c of CUES) if (count(text, CUE_WORDS[c]) > 0) return c;
  return null;
}

/** How loud the bed plays while narration (0.55) or a character (0.3) is speaking. */
export const DUCK = { none: 1, narration: 0.55, dialogue: 0.3 } as const;
export type DuckLevel = keyof typeof DUCK;
