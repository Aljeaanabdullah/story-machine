import type { ArchetypeId } from '@/data/catalog';
import type { Language } from '@/i18n/strings';
import type { SceneMedia } from '@/lib/media/types';

export type StoryMode = 'short' | 'adventure' | 'bedtime';

export type Character = {
  name: string;
  archetype: ArchetypeId;
  personality: string;
  ability: string;
  appearance: string;
};

/** Either a catalog world id or free text typed by the user. */
export type WorldChoice = { kind: 'preset'; id: string } | { kind: 'custom'; description: string };

export type BedtimeInput = {
  ageRange: '3-5' | '6-8' | '9-12';
  hero: string;
  theme: string;
};

/** Everything collected by the creation flow before generation. */
export type StoryDraft = {
  mode: StoryMode;
  language: Language;
  character: Character;
  world: WorldChoice;
  genre: string;
  mood: string;
  idea: string;
  bedtime: BedtimeInput;
};

export type Scene = {
  number: number;
  title: string;
  text: string;
  /** Exactly 3 for non-final scenes, empty for the ending. */
  choices: string[];
  isEnding: boolean;
  /** One-sentence recap fed back to the model for continuity. */
  summary: string;
  /** Optional visual / motion / video overrides (V2). Defaults are derived. */
  media?: SceneMedia;
};

export type ChoiceRecord = { scene: number; index: number; text: string };

/** Compact memory the model receives every turn instead of the full transcript. */
export type AdventureMemory = {
  location: string;
  objective: string;
  companions: string[];
  discoveries: string[];
};

export type AdventureState = {
  maxScenes: number;
  scenes: Scene[];
  choices: ChoiceRecord[];
  memory: AdventureMemory;
  finished: boolean;
};

export type Story = {
  id: string;
  mode: StoryMode;
  language: Language;
  title: string;
  createdAt: number;
  updatedAt: number;
  draft: StoryDraft;
  /** Full text for short and bedtime stories. */
  content?: string;
  adventure?: AdventureState;
  /** Media overrides for short and bedtime stories, which are a single scene. */
  media?: SceneMedia;
  saved: boolean;
};

export function storyProgress(story: Story): { current: number; total: number; done: boolean } {
  if (story.mode !== 'adventure' || !story.adventure) return { current: 1, total: 1, done: true };
  const a = story.adventure;
  return { current: a.scenes.length, total: a.maxScenes, done: a.finished };
}
