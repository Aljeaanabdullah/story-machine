import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Language } from '@/i18n/strings';
import type { StoryDraft, StoryMode } from '@/lib/story/types';

export function emptyDraft(mode: StoryMode, language: Language): StoryDraft {
  return {
    mode,
    language,
    character: { name: '', archetype: 'explorer', personality: 'brave', ability: '', appearance: '' },
    world: { kind: 'preset', id: 'lost-island' },
    genre: 'fantasy',
    mood: 'mysterious',
    idea: '',
    bedtime: { ageRange: '6-8', hero: '', theme: 'friendship' },
  };
}

type DraftContextValue = {
  draft: StoryDraft;
  start: (mode: StoryMode, language: Language) => void;
  patch: (p: Partial<StoryDraft>) => void;
  /** Replace the draft wholesale, e.g. to regenerate a saved story with its original inputs. */
  set: (d: StoryDraft) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<StoryDraft>(() => emptyDraft('short', 'en'));

  const start = useCallback((mode: StoryMode, language: Language) => {
    // Keep the hero between runs so players don't retype it.
    setDraft((prev) => ({ ...emptyDraft(mode, language), character: prev.character, world: prev.world }));
  }, []);
  const patch = useCallback((p: Partial<StoryDraft>) => setDraft((prev) => ({ ...prev, ...p })), []);

  const value = useMemo(() => ({ draft, start, patch, set: setDraft }), [draft, start, patch]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider');
  return ctx;
}
