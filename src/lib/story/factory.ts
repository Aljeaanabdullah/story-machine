import { findWorld } from '@/data/catalog';
import type { AdventureState, Story, StoryDraft } from './types';

export function newId(now = Date.now()): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function startLocation(draft: StoryDraft): string {
  if (draft.world.kind === 'custom') return draft.world.description.trim().slice(0, 120);
  return findWorld(draft.world.id)?.name.en ?? draft.world.id;
}

export function makeProseStory(draft: StoryDraft, title: string, content: string, now = Date.now()): Story {
  return { id: newId(now), mode: draft.mode, language: draft.language, title, content, draft, createdAt: now, updatedAt: now, saved: false };
}

/** Adventures are saved immediately so progress survives app restarts and failed requests. */
export function makeAdventureStory(draft: StoryDraft, adventure: AdventureState, now = Date.now()): Story {
  const title = adventure.scenes[0]?.title ?? draft.character.name;
  return { id: newId(now), mode: 'adventure', language: draft.language, title, adventure, draft, createdAt: now, updatedAt: now, saved: true };
}

/** Returns an updated copy of a story with a fresh `updatedAt`. */
export function touch(story: Story, patch: Partial<Story> = {}): Story {
  return { ...story, ...patch, updatedAt: Date.now() };
}
