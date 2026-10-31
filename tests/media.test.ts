import { NarrationPlayer } from '@/lib/audio/player';
import { narrationSegments } from '@/lib/audio/segment';
import { artSlotFor, defaultMotion, imagePrompt, presentProse, presentScene, resolveMedia, storyScenes } from '@/lib/media/present';
import type { SceneMedia } from '@/lib/media/types';
import { buildTimeline, estimateSpeechMs, noVideoProvider } from '@/lib/media/video';
import { makeAdventureStory, makeProseStory } from '@/lib/story/factory';
import type { Scene, Story } from '@/lib/story/types';
import { draftFor, words } from './helpers';

const scene = (number: number, extra: Partial<Scene> = {}): Scene => ({
  number,
  title: `Scene ${number}`,
  text: `"Who goes there?" Faisal called. The waves crashed.\n\n${words(40)}`,
  choices: number < 6 ? ['a', 'b', 'c'] : [],
  isEnding: number === 6,
  summary: 's',
  ...extra,
});

function adventure(scenes: Scene[]): Story {
  return makeAdventureStory(draftFor('adventure'), {
    maxScenes: 6,
    scenes,
    choices: [],
    memory: { location: '', objective: '', companions: [], discoveries: [] },
    finished: false,
  });
}

describe('scene visuals', () => {
  it('picks the same art slot StoryArt shows', () => {
    expect(artSlotFor(draftFor('adventure'))).toBe('world-lost-island');
    expect(artSlotFor(draftFor('bedtime'))).toBe('bedtime');
    expect(artSlotFor({ ...draftFor('short'), world: { kind: 'custom', description: 'a glass city' } })).toBe('custom');
  });

  it('builds an English image prompt from world, scene and mood', () => {
    const p = imagePrompt(draftFor('adventure'), 'The Shore', 'The storm broke. Faisal ran.');
    expect(p).toContain('Scene "The Shore"');
    expect(p).toContain('Mist-wrapped shores');
    expect(p).toContain('Moment: The storm broke.');
    expect(p).toMatch(/Style: .*cinematic/);
    expect(imagePrompt(draftFor('bedtime'), 't', 'x')).toContain('storybook');
  });

  it('a scene without stored media is a placeholder with derived defaults (pre-V2 stories)', () => {
    const v = presentScene(adventure([scene(1)]), scene(1), true);
    expect(v.visual).toMatchObject({ slot: 'world-lost-island', status: 'placeholder' });
    expect(v.video).toEqual({ status: 'none' });
    expect(v.paragraphs).toHaveLength(2);
    expect(v.segments[0]).toMatchObject({ role: 'hero', kind: 'dialogue' });
  });

  it('a stored image fills the slot', () => {
    const v = presentScene(adventure([]), scene(2, { media: { visual: { uri: 'https://img/2.webp' } } }), false);
    expect(v.visual).toMatchObject({ status: 'ready', uri: 'https://img/2.webp' });
    expect(v.segments.every((s) => s.role === 'narrator')).toBe(true);
  });
});

describe('motion hints', () => {
  it('opens pushing in, varies the middle, and pulls out on the ending', () => {
    const d = draftFor('adventure');
    expect(defaultMotion(d, 1, false)).toMatchObject({ camera: 'push-in', transition: 'rise' });
    expect(defaultMotion(d, 2, false).camera).toBe('pan-left');
    expect(defaultMotion(d, 6, true)).toMatchObject({ camera: 'pull-out', transition: 'dissolve' });
    expect(defaultMotion(draftFor('bedtime'), 1, true)).toMatchObject({ camera: 'drift', intensity: 0.35 });
  });

  it('applies valid overrides and ignores malformed ones', () => {
    const base = { visual: { slot: 's', status: 'placeholder' as const, prompt: 'p' }, motion: defaultMotion(draftFor('short'), 1, false) };
    const good = resolveMedia(base, { motion: { camera: 'pan-right', intensity: 5, durationMs: 1 } });
    expect(good.motion).toMatchObject({ camera: 'pan-right', intensity: 1, durationMs: 4000, transition: 'rise' });
    const bad = resolveMedia(base, { motion: { camera: 'barrel-roll', intensity: NaN }, visual: { uri: 42, prompt: '  ' }, video: { status: 'exploded' } } as unknown as SceneMedia);
    expect(bad.motion).toEqual(base.motion);
    expect(bad.visual).toEqual(base.visual);
    expect(bad.video).toEqual({ status: 'none' });
    expect(resolveMedia(base, 'junk' as unknown as SceneMedia).motion).toEqual(base.motion);
  });
});

describe('video-ready architecture', () => {
  it('a ready video without a uri is treated as failed', () => {
    const base = { visual: { slot: 's', status: 'placeholder' as const, prompt: 'p' }, motion: defaultMotion(draftFor('short'), 1, false) };
    expect(resolveMedia(base, { video: { status: 'ready' } }).video.status).toBe('failed');
    expect(resolveMedia(base, { video: { status: 'ready', uri: 'file://clip.mp4', provider: 'x' } }).video).toEqual({ status: 'ready', uri: 'file://clip.mp4', provider: 'x' });
  });

  it('lists every scene of a story in order', () => {
    expect(storyScenes(adventure([scene(1), scene(2), scene(3)]), true).map((s) => s.number)).toEqual([1, 2, 3]);
    const prose = makeProseStory(draftFor('short'), 'Tide', 'One. Two.');
    expect(storyScenes(prose, true)).toEqual([presentProse(prose, true)]);
  });

  it('builds a timeline whose clips last as long as their narration', () => {
    const scenes = storyScenes(adventure([scene(1), scene(2)]), true);
    const t = buildTimeline(scenes);
    expect(t.clips).toHaveLength(2);
    expect(t.clips[0].startMs).toBe(0);
    expect(t.clips[1].startMs).toBe(t.clips[0].durationMs);
    expect(t.totalMs).toBe(t.clips[0].durationMs + t.clips[1].durationMs);
    expect(t.clips[0]).toMatchObject({ camera: 'push-in', image: { slot: 'world-lost-island' } });
    expect(t.clips[0].audio[0]).toEqual({ role: 'hero', text: 'Who goes there?' });
    expect(buildTimeline(scenes, 2).totalMs).toBeLessThan(t.totalMs);
  });

  it('estimates speech length and enforces a minimum clip length', () => {
    expect(estimateSpeechMs({ segments: narrationSegments(words(26)) })).toBe(10000 + 250);
    expect(buildTimeline([presentProse(makeProseStory(draftFor('short'), 't', 'Hi.'), false)]).clips[0].durationMs).toBe(4000);
  });

  it('ships with video generation disabled', async () => {
    expect(noVideoProvider.isAvailable()).toBe(false);
    await expect(noVideoProvider.request(presentProse(makeProseStory(draftFor('short'), 't', 'x'), false))).resolves.toEqual({ status: 'none' });
  });
});

describe('narration survives re-renders', () => {
  it('loading identical content again does not interrupt playback', async () => {
    const spoken: string[] = [];
    const player = new NarrationPlayer({ id: 'device', isAvailable: () => true, speak: (t) => spoken.push(t), stop: jest.fn(), listVoices: async () => [] });
    const settings = { language: 'en' as const, multiVoice: true, rate: 1 };
    player.load(narrationSegments('One. Two.'), settings);
    await player.play();
    player.load(narrationSegments('One. Two.'), { ...settings });
    expect(player.getState().status).toBe('playing');
    player.load(narrationSegments('One. Two.'), { ...settings, rate: 1.15 });
    expect(player.getState().status).toBe('idle');
  });
});
