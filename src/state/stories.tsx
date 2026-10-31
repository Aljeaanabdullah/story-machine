import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { loadStories, saveStories } from '@/lib/storage';
import type { Story } from '@/lib/story/types';

type StoriesContextValue = {
  /** All stories in memory, newest first. Unsaved short/bedtime stories live here until saved. */
  stories: Story[];
  ready: boolean;
  get: (id: string) => Story | undefined;
  upsert: (story: Story) => void;
  /** Applies a change to the latest copy of a story (safe from async callbacks). */
  update: (id: string, change: (story: Story) => Story) => void;
  remove: (id: string) => void;
  clearAll: () => void;
};

const StoriesContext = createContext<StoriesContextValue | null>(null);

export function StoriesProvider({ children }: { children: ReactNode }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadStories().then((saved) => {
      // Keep anything created before the load finished.
      setStories((current) => {
        const ids = new Set(current.map((s) => s.id));
        return [...current, ...saved.filter((s) => !ids.has(s.id))].sort((a, b) => b.updatedAt - a.updatedAt);
      });
      loaded.current = true;
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveStories(stories).catch(() => {});
  }, [stories]);

  const get = useCallback((id: string) => stories.find((s) => s.id === id), [stories]);

  const upsert = useCallback((story: Story) => {
    setStories((prev) => [story, ...prev.filter((s) => s.id !== story.id)]);
  }, []);

  const update = useCallback((id: string, change: (story: Story) => Story) => {
    setStories((prev) => prev.map((s) => (s.id === id ? change(s) : s)));
  }, []);

  const remove = useCallback((id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAll = useCallback(() => setStories([]), []);

  const value = useMemo(() => ({ stories, ready, get, upsert, update, remove, clearAll }), [stories, ready, get, upsert, update, remove, clearAll]);
  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>;
}

export function useStories() {
  const ctx = useContext(StoriesContext);
  if (!ctx) throw new Error('useStories must be used inside StoriesProvider');
  return ctx;
}
