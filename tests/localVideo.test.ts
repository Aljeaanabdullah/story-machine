import { createLocalVideoClient, VideoError, type VideoJob } from '@/lib/media/localVideo';
import { presentProse, presentScene } from '@/lib/media/present';
import { buildVideoPrompt, videoImageSlot, videoSeed } from '@/lib/media/videoPrompt';
import { makeAdventureStory, makeProseStory } from '@/lib/story/factory';
import type { Scene } from '@/lib/story/types';
import { draftFor, words } from './helpers';

const scene = (number: number, text = words(40)): Scene => ({ number, title: `S${number}`, text, choices: ['a', 'b', 'c'], isEnding: false, summary: 's' });
const adventure = () =>
  makeAdventureStory(draftFor('adventure'), {
    maxScenes: 6,
    scenes: [scene(1), scene(2, 'Waves crashed against the black rocks of the cave. Faisal lifted his lantern.')],
    choices: [{ scene: 1, index: 1, text: 'Enter the sea cave' }],
    memory: { location: 'Sea Cave', objective: 'pearl', companions: [], discoveries: [] },
    finished: false,
  });

describe('story-to-video prompt', () => {
  const story = adventure();
  const p = presentScene(story, story.adventure!.scenes[1], true);
  const prompt = buildVideoPrompt(story, p);

  it('uses the world, location, moment, previous choice, motion and camera', () => {
    expect(prompt).toContain('Mist-wrapped shores');
    expect(prompt).toContain('Location: Sea Cave');
    expect(prompt).toContain('Waves crashed against the black rocks of the cave.');
    expect(prompt).toContain('Just after the hero chose: Enter the sea cave');
    expect(prompt).toMatch(/Motion: waves roll in/);
    expect(prompt).toMatch(/Camera: slow smooth camera pan to the left/); // scene 2 cycle
    expect(prompt).toMatch(/Keep the exact painted art style.*No text, no watermark/);
  });

  it('earlier scenes do not borrow the current location; no doubled punctuation', () => {
    const first = buildVideoPrompt(story, presentScene(story, story.adventure!.scenes[0], true));
    expect(first).not.toContain('Location:');
    expect(prompt).not.toMatch(/\.\.|\?\.|!\./);
  });

  it('motion follows what the shot shows, not just the sound bed', () => {
    const p1 = presentScene(story, story.adventure!.scenes[1], true);
    expect(buildVideoPrompt(story, { ...p1, ambience: 'wind' })).toMatch(/Motion: waves roll in/);
  });

  it('stays within the server prompt limit even for long scenes', () => {
    const long = makeProseStory(draftFor('short'), 'T', `${words(400)}. ${words(400)}`);
    expect(buildVideoPrompt(long, presentProse(long, true)).length).toBeLessThan(1200);
  });

  it('keeps one seed per story for visual consistency', () => {
    expect(videoSeed(story)).toBe(videoSeed({ id: story.id }));
    expect(videoSeed(story)).toBeGreaterThanOrEqual(0);
    expect(videoSeed(story)).toBeLessThan(2 ** 31);
    expect(videoSeed({ id: 'other' })).not.toBe(videoSeed(story));
  });

  it('only animates scenes that have world art', () => {
    expect(videoImageSlot(p)).toBe('world-lost-island');
    const bedtime = makeProseStory(draftFor('bedtime'), 'T', 'Night.');
    expect(videoImageSlot(presentProse(bedtime, true))).toBeNull();
  });
});

type Reply = { status?: number; body?: unknown; throws?: boolean };
function server(replies: Reply[]) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const fetchImpl = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (init?.method === 'DELETE') return { ok: true, status: 200, json: async () => ({}) } as Response;
    const r = replies.shift();
    if (!r || r.throws) throw new TypeError('Network request failed');
    const status = r.status ?? 200;
    return { ok: status < 300, status, json: async () => r.body } as Response;
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}
const job = (over: Partial<VideoJob>): VideoJob => ({ id: 'abcdef123456', status: 'queued', stage: 'queued', progress: 0, error: null, ...over });

describe('local video server client', () => {
  it('is unavailable without a URL and never calls the network', async () => {
    const { fetchImpl, calls } = server([]);
    expect(await createLocalVideoClient('', fetchImpl).health()).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('only talks to the configured local server (no paid endpoints)', async () => {
    const { fetchImpl, calls } = server([
      { status: 202, body: job({}) },
      { body: job({ status: 'rendering', stage: 'rendering', progress: 0.5 }) },
      { body: job({ status: 'ready', stage: 'done', progress: 1, video: '/videos/0123456789abcdef0123.mp4' }) },
    ]);
    const updates: string[] = [];
    const url = await createLocalVideoClient('http://192.168.1.5:5003', fetchImpl, 0).generate('world-lost-island', 'p', 7, (j) => updates.push(j.stage));
    expect(url).toBe('http://192.168.1.5:5003/videos/0123456789abcdef0123.mp4');
    expect(updates).toEqual(['queued', 'rendering', 'done']);
    expect(calls.every((c) => c.url.startsWith('http://192.168.1.5:5003/'))).toBe(true);
    expect(calls[0]).toMatchObject({ method: 'POST', body: { slot: 'world-lost-island', prompt: 'p', seed: 7 } });
  });

  it('reports GPU out-of-memory distinctly', async () => {
    const { fetchImpl } = server([{ status: 202, body: job({}) }, { body: job({ status: 'failed', stage: 'failed', error: 'gpu_out_of_memory' }) }]);
    await expect(createLocalVideoClient('http://pc', fetchImpl, 0).generate('s', 'p', 1, () => {})).rejects.toEqual(new VideoError('gpu_out_of_memory'));
  });

  it('server down on submit → unavailable', async () => {
    const { fetchImpl } = server([{ throws: true }]);
    await expect(createLocalVideoClient('http://pc', fetchImpl, 0).generate('s', 'p', 1, () => {})).rejects.toMatchObject({ reason: 'unavailable' });
  });

  it('tolerates a few dropped polls, then gives up with a network error', async () => {
    const { fetchImpl } = server([{ status: 202, body: job({}) }, { throws: true }, { throws: true }, { body: job({ status: 'ready', stage: 'done', video: '/videos/x.mp4' }) }]);
    await expect(createLocalVideoClient('http://pc', fetchImpl, 0).generate('s', 'p', 1, () => {})).resolves.toBe('http://pc/videos/x.mp4');
    const down = server([{ status: 202, body: job({}) }, ...Array.from({ length: 5 }, () => ({ throws: true }))]);
    await expect(createLocalVideoClient('http://pc', down.fetchImpl, 0).generate('s', 'p', 1, () => {})).rejects.toMatchObject({ reason: 'network' });
  });

  it('cancelling aborts polling and cancels the job on the server', async () => {
    const ctrl = new AbortController();
    const { fetchImpl, calls } = server([{ status: 202, body: job({}) }, { body: job({ status: 'rendering', stage: 'rendering' }) }]);
    const run = createLocalVideoClient('http://pc', fetchImpl, 0).generate('s', 'p', 1, () => ctrl.abort(), ctrl.signal);
    await expect(run).rejects.toMatchObject({ reason: 'cancelled' });
    expect(calls.some((c) => c.method === 'DELETE' && c.url === 'http://pc/jobs/abcdef123456')).toBe(true);
  });
});
