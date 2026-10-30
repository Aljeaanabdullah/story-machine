import { AGE_RANGES, ARCHETYPES, BEDTIME_THEMES, findWorld, GENRES, MOODS, PERSONALITIES } from '@/data/catalog';
import type { Language } from '@/i18n/strings';
import type { AdventureState, StoryDraft } from '@/lib/story/types';
import type { ChatMessage } from './openrouter';

function languageRule(lang: Language) {
  return lang === 'ar'
    ? 'Write every text value in eloquent, readable Modern Standard Arabic (الفصحى). Keep JSON keys in English exactly as specified.'
    : 'Write every text value in clear, vivid English. Keep JSON keys exactly as specified.';
}

const SAFETY =
  'Content rules: original characters and settings only (no copyrighted characters); no graphic violence, sexual content, hate, or self-harm; keep peril suitable for teens.';

export const SYSTEM_SHORT = `You are StoryVerse, a master storyteller who writes original short stories.
Write ONE complete short story of 400-600 words with: an intriguing opening, character development, a central conflict, a twist where it fits, and a clear, satisfying ending.
Use paragraphs separated by a blank line. No headings, no markdown inside the story.
${SAFETY}
Reply with ONLY a JSON object, no prose before or after:
{"title": "evocative title, max 8 words", "story": "the full story text"}`;

export const SYSTEM_BEDTIME = `You are StoryVerse, a gentle bedtime storyteller for children.
Write ONE calming bedtime story of 300-450 words. Use gentle, simple language suited to the child's age, warm and positive themes, a cozy comforting atmosphere, and a soft, relaxing ending that invites sleep.
Never include anything frightening, violent, sad without comfort, or age-inappropriate. No villains who cause real harm.
Use short paragraphs separated by a blank line. No headings, no markdown.
Reply with ONLY a JSON object, no prose before or after:
{"title": "sweet title, max 7 words", "story": "the full story text"}`;

export const SYSTEM_ADVENTURE = `You are StoryVerse, the narrator of an interactive choose-your-path adventure.
You write ONE scene at a time. Each scene is 120-220 words, second-person or close third-person on the hero, cinematic and concrete.
Continuity is essential: respect the hero's identity, every previous choice, the current location, discovered facts, companions and the main objective given in STATE. Never contradict earlier scenes.
The player's latest choice MUST visibly shape what happens in this scene.
For a non-final scene, end on a decision point and give EXACTLY 3 distinct, meaningful choices (each max 15 words) that lead in genuinely different directions. Do not number them.
For the final scene, resolve the main conflict with a meaningful ending that reflects the player's choices; "choices" must be an empty array.
${SAFETY}
Reply with ONLY a JSON object, no prose before or after:
{"title": "scene title, max 6 words", "narrative": "scene text", "choices": ["...", "...", "..."], "isEnding": false, "summary": "one sentence recap of what happened", "memory": {"location": "current place", "objective": "current goal", "companions": ["..."], "discoveries": ["important facts or items"]}}`;

function heroLine(d: StoryDraft) {
  const c = d.character;
  const arch = ARCHETYPES.find((a) => a.id === c.archetype)?.name.en ?? c.archetype;
  const personality = PERSONALITIES.find((p) => p.id === c.personality)?.name.en ?? c.personality;
  const parts = [`${c.name.trim() || 'an unnamed hero'}, a ${personality.toLowerCase()} ${arch.toLowerCase()}`];
  if (c.ability.trim()) parts.push(`special ability: ${c.ability.trim()}`);
  if (c.appearance.trim()) parts.push(`appearance: ${c.appearance.trim()}`);
  return parts.join('; ');
}

export function worldLine(d: StoryDraft) {
  if (d.world.kind === 'custom') return d.world.description.trim() || 'a world of the narrator’s choosing';
  const w = findWorld(d.world.id);
  return w ? `${w.name.en} — ${w.description.en} (${w.mood.en})` : d.world.id;
}

const label = (list: { id: string; name: { en: string } }[], id: string) => list.find((x) => x.id === id)?.name.en ?? id;

export function shortStoryMessages(d: StoryDraft): ChatMessage[] {
  const lines = [
    `Main character: ${heroLine(d)}`,
    `Location: ${worldLine(d)}`,
    `Genre: ${label(GENRES, d.genre)}`,
    `Mood: ${label(MOODS, d.mood)}`,
    d.idea.trim() ? `Story idea from the reader: ${d.idea.trim()}` : 'Story idea: invent a surprising premise that fits the hero and location.',
    languageRule(d.language),
  ];
  return [
    { role: 'system', content: SYSTEM_SHORT },
    { role: 'user', content: lines.join('\n') },
  ];
}

export function bedtimeMessages(d: StoryDraft): ChatMessage[] {
  const b = d.bedtime;
  const lines = [
    `Child's age: ${label(AGE_RANGES, b.ageRange)}`,
    `Main character: ${b.hero.trim()}`,
    `Theme: ${label(BEDTIME_THEMES, b.theme)}`,
    d.idea.trim() ? `Story idea from the parent: ${d.idea.trim()}` : 'Story idea: a small, gentle adventure that ends with the character falling peacefully asleep.',
    languageRule(d.language),
  ];
  return [
    { role: 'system', content: SYSTEM_BEDTIME },
    { role: 'user', content: lines.join('\n') },
  ];
}

const MAX_PREVIOUS_CHARS = 1400;

/** Builds the compact STATE the model sees each turn instead of the whole transcript. */
export function adventureMessages(d: StoryDraft, state: AdventureState): ChatMessage[] {
  const n = state.scenes.length + 1;
  const last = state.scenes[state.scenes.length - 1];
  const lastChoice = state.choices[state.choices.length - 1];

  const stateObj = {
    hero: heroLine(d),
    world: worldLine(d),
    genre: label(GENRES, d.genre),
    mood: label(MOODS, d.mood),
    premise: d.idea.trim() || undefined,
    scene: `${n} of ${state.maxScenes}`,
    memory: state.memory,
    storySoFar: state.scenes.map((s, i) => ({
      scene: s.number,
      summary: s.summary,
      playerChose: state.choices.find((c) => c.scene === s.number)?.text ?? (i === state.scenes.length - 1 ? undefined : '—'),
    })),
  };

  let instruction: string;
  if (n === 1) instruction = 'Write the OPENING scene: introduce the hero, the world and the central mystery or objective. It is NOT the ending.';
  else if (n >= state.maxScenes) instruction = 'This is the FINAL scene. You MUST conclude the adventure now: set "isEnding": true and "choices": [].';
  else if (n >= state.maxScenes - 1) instruction = 'This is the climax. You may end the story here ("isEnding": true, "choices": []) only if the main conflict is fully resolved; otherwise give 3 choices leading to the final scene.';
  else instruction = 'Continue the adventure. It is NOT the ending: "isEnding" must be false and you must give exactly 3 choices.';

  const parts = [`STATE:\n${JSON.stringify(stateObj)}`];
  if (last) parts.push(`PREVIOUS SCENE (${last.title}):\n${last.text.slice(-MAX_PREVIOUS_CHARS)}`);
  if (lastChoice) parts.push(`THE PLAYER CHOSE: "${lastChoice.text}"`);
  parts.push(instruction, languageRule(d.language));

  return [
    { role: 'system', content: SYSTEM_ADVENTURE },
    { role: 'user', content: parts.join('\n\n') },
  ];
}
