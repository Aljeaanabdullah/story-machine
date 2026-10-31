import { BUNDLED_VIDEOS, DEMO_FOR_WORLD } from '@/assets/videos';
import { presentProse, presentScene, storyScenes } from '@/lib/media/present';
import { ASSET_PREFIX, isMp4Name, readyVideo, setSceneVideo } from '@/lib/media/sceneVideo';
import { buildTimeline } from '@/lib/media/video';
import { videoSource } from '@/lib/media/videoSource';
import { makeAdventureStory, makeProseStory } from '@/lib/story/factory';
import type { Scene } from '@/lib/story/types';
import { draftFor, words } from './helpers';

const scene = (number: number): Scene => ({ number, title: `S${number}`, text: words(60), choices: ['a', 'b', 'c'], isEnding: false, summary: 's' });
const adventure = () =>
  makeAdventureStory(draftFor('adventure'), {
    maxScenes: 6,
    scenes: [scene(1), scene(2)],
    choices: [{ scene: 1, index: 0, text: 'a' }],
    memory: { location: 'beach', objective: 'pearl', companions: [], discoveries: [] },
    finished: false,
  });

describe('attaching videos to scenes (story engine untouched)', () => {
  it('sets a video on exactly one adventure scene and keeps everything else', () => {
    const story = adventure();
    const updated = setSceneVideo(story, 2, readyVideo('file:///docs/scene-videos/a.mp4'));
    expect(updated.adventure!.scenes[1].media?.video).toEqual({ status: 'ready', uri: 'file:///docs/scene-videos/a.mp4', provider: 'import' });
    expect(updated.adventure!.scenes[0]).toBe(story.adventure!.scenes[0]);
    expect(updated.adventure!.choices).toBe(story.adventure!.choices);
    expect(updated.adventure!.memory).toBe(story.adventure!.memory);
    expect(updated.adventure!.scenes[1].text).toBe(story.adventure!.scenes[1].text);
  });

  it('removing a video drops the empty media object', () => {
    const story = setSceneVideo(adventure(), 1, readyVideo('x.mp4'));
    expect(setSceneVideo(story, 1, null).adventure!.scenes[0].media).toBeUndefined();
  });

  it('keeps other media (e.g. an image) when removing the video', () => {
    const story = adventure();
    story.adventure!.scenes[0].media = { visual: { uri: 'https://img' }, video: readyVideo('v.mp4') };
    expect(setSceneVideo(story, 1, null).adventure!.scenes[0].media).toEqual({ visual: { uri: 'https://img' } });
  });

  it('short and bedtime stories store the video on the story itself', () => {
    const prose = makeProseStory(draftFor('short'), 'T', 'One. Two.');
    const updated = setSceneVideo(prose, 99, readyVideo('clip.mp4'));
    expect(updated.media?.video?.uri).toBe('clip.mp4');
    expect(updated.content).toBe(prose.content);
  });

  it('presentations and the video timeline pick the attached clip up', () => {
    const story = setSceneVideo(adventure(), 2, readyVideo('file:///v2.mp4'));
    expect(presentScene(story, story.adventure!.scenes[1], true).video).toMatchObject({ status: 'ready', uri: 'file:///v2.mp4' });
    expect(presentScene(story, story.adventure!.scenes[0], true).video).toEqual({ status: 'none' });
    expect(buildTimeline(storyScenes(story, true)).clips.map((c) => c.videoUri)).toEqual([undefined, 'file:///v2.mp4']);
  });
});

describe('video sources', () => {
  it('maps imported files to uri sources and bundled clips to assets', () => {
    expect(videoSource(readyVideo('file:///a.mp4'))).toEqual({ uri: 'file:///a.mp4' });
    expect(videoSource(readyVideo(`${ASSET_PREFIX}demo-lost-island`, 'demo'))).toBe(BUNDLED_VIDEOS['demo-lost-island']);
    expect(BUNDLED_VIDEOS['demo-lost-island']).toBeTruthy();
  });

  it('returns null when there is nothing valid to play (image fallback)', () => {
    expect(videoSource(undefined)).toBeNull();
    expect(videoSource({ status: 'none' })).toBeNull();
    expect(videoSource({ status: 'failed', uri: 'x.mp4' })).toBeNull();
    expect(videoSource({ status: 'ready' })).toBeNull();
    expect(videoSource(readyVideo(`${ASSET_PREFIX}missing`))).toBeNull();
  });

  it('a malformed stored video degrades to the image', () => {
    const prose = makeProseStory(draftFor('short'), 'T', 'One.');
    expect(videoSource(presentProse({ ...prose, media: { video: { status: 'ready' } } }, true).video)).toBeNull();
  });

  it('every world demo points at a bundled clip', () => {
    for (const name of Object.values(DEMO_FOR_WORLD)) expect(BUNDLED_VIDEOS[name]).toBeTruthy();
  });

  it('accepts MP4/MOV picks and rejects other files', () => {
    expect(isMp4Name('scene.MP4')).toBe(true);
    expect(isMp4Name('clip.mov')).toBe(true);
    expect(isMp4Name('noext', 'video/mp4')).toBe(true);
    expect(isMp4Name('photo.jpg', 'image/jpeg')).toBe(false);
  });
});
