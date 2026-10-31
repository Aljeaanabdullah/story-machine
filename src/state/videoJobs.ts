import { useSyncExternalStore } from 'react';

import type { VideoJob } from '@/lib/media/localVideo';

/** Progress of one scene's AI video, shown while the PC renders it. */
export type VideoJobView = { stage: string; progress: number };

type Entry = VideoJobView & { controller: AbortController };

/**
 * Generation jobs keyed by `storyId:scene`. They live outside React so a clip keeps
 * rendering (and is saved to its scene) when the player moves on to the next scene.
 */
const jobs = new Map<string, Entry>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function startVideoJob(key: string, run: (signal: AbortSignal, onUpdate: (job: VideoJob) => void) => Promise<void>): boolean {
  if (jobs.has(key)) return false;
  const controller = new AbortController();
  jobs.set(key, { stage: 'queued', progress: 0, controller });
  emit();
  const onUpdate = (job: VideoJob) => {
    const e = jobs.get(key);
    if (!e || (e.stage === job.stage && e.progress === job.progress)) return;
    jobs.set(key, { ...e, stage: job.stage, progress: job.progress });
    emit();
  };
  run(controller.signal, onUpdate).finally(() => {
    jobs.delete(key);
    emit();
  });
  return true;
}

export function cancelVideoJob(key: string) {
  jobs.get(key)?.controller.abort();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useVideoJob(key: string): VideoJobView | null {
  return useSyncExternalStore(subscribe, () => jobs.get(key) ?? null);
}
