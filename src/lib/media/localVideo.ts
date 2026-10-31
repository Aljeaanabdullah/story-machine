/**
 * Client for the free local AI video server (tools/video-server, Wan2.2 on your own GPU).
 *
 * EXPO_PUBLIC_VIDEO_SERVER_URL holds only a LAN address, never a secret. The server
 * answers private-network clients only; never expose it to the internet.
 */

export function getVideoServerUrl(): string {
  return (process.env.EXPO_PUBLIC_VIDEO_SERVER_URL ?? '').trim().replace(/\/+$/, '');
}

export type VideoJobStatus = 'queued' | 'rendering' | 'ready' | 'failed' | 'cancelled';

export type VideoJob = {
  id: string;
  status: VideoJobStatus;
  /** encoding | loading | rendering | encoding-video | retrying-smaller | cached | done … */
  stage: string;
  /** 0..1 within the current stage. */
  progress: number;
  error: string | null;
  /** Server path of the finished clip, e.g. /videos/abc.mp4. */
  video?: string;
};

export type VideoFailure = 'unavailable' | 'gpu_out_of_memory' | 'failed' | 'cancelled' | 'network';

export class VideoError extends Error {
  constructor(readonly reason: VideoFailure) {
    super(reason);
  }
}

type Fetch = typeof fetch;

const isJob = (j: unknown): j is VideoJob =>
  !!j && typeof j === 'object' && typeof (j as VideoJob).id === 'string' && typeof (j as VideoJob).status === 'string';

async function json(res: Response): Promise<unknown> {
  if (!res.ok && res.status !== 202) throw new VideoError(res.status === 403 ? 'unavailable' : 'failed');
  return res.json();
}

export type LocalVideoClient = ReturnType<typeof createLocalVideoClient>;

export function createLocalVideoClient(baseUrl: string = getVideoServerUrl(), fetchImpl: Fetch = (...a) => fetch(...a), pollMs = 2000) {
  const url = (path: string) => `${baseUrl}${path}`;

  async function health(timeoutMs = 2500): Promise<boolean> {
    if (!baseUrl) return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const body = (await json(await fetchImpl(url('/health'), { signal: ctrl.signal }))) as { ok?: boolean };
      return body?.ok === true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async function submit(slot: string, prompt: string, seed: number): Promise<VideoJob> {
    let body: unknown;
    try {
      body = await json(await fetchImpl(url('/jobs'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot, prompt, seed }) }));
    } catch (e) {
      throw e instanceof VideoError ? e : new VideoError('unavailable');
    }
    if (!isJob(body)) throw new VideoError('failed');
    return body;
  }

  async function status(id: string): Promise<VideoJob> {
    const body = await json(await fetchImpl(url(`/jobs/${id}`)));
    if (!isJob(body)) throw new VideoError('failed');
    return body;
  }

  async function cancel(id: string): Promise<void> {
    try {
      await fetchImpl(url(`/jobs/${id}`), { method: 'DELETE' });
    } catch {
      // server gone: nothing left to cancel
    }
  }

  /**
   * Submits a job and polls until it finishes. Resolves with the clip URL.
   * Aborting the signal cancels the job on the server too.
   */
  async function generate(slot: string, prompt: string, seed: number, onUpdate: (job: VideoJob) => void, signal?: AbortSignal): Promise<string> {
    let job = await submit(slot, prompt, seed);
    let misses = 0;
    const onAbort = () => void cancel(job.id);
    signal?.addEventListener('abort', onAbort);
    try {
      for (;;) {
        onUpdate(job);
        if (job.status === 'ready' && job.video) return url(job.video);
        if (job.status === 'cancelled') throw new VideoError('cancelled');
        if (job.status === 'failed') throw new VideoError(job.error === 'gpu_out_of_memory' ? 'gpu_out_of_memory' : 'failed');
        await new Promise((r) => setTimeout(r, pollMs));
        if (signal?.aborted) throw new VideoError('cancelled');
        try {
          job = await status(job.id);
          misses = 0;
        } catch {
          // Tolerate a few dropped polls on flaky Wi-Fi before giving up.
          if (++misses >= 5) throw new VideoError('network');
        }
      }
    } finally {
      signal?.removeEventListener('abort', onAbort);
    }
  }

  return { health, submit, status, cancel, generate };
}
