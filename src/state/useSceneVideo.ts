import { useState } from 'react';
import { Platform } from 'react-native';

import { DEMO_FOR_WORLD } from '@/assets/videos';
import { createLocalVideoClient, getVideoServerUrl, VideoError } from '@/lib/media/localVideo';
import type { ScenePresentation } from '@/lib/media/present';
import { videoSource } from '@/lib/media/videoSource';
import { buildVideoPrompt, videoImageSlot, videoSeed } from '@/lib/media/videoPrompt';
import { deleteImportedVideo, importSceneVideo, saveGeneratedVideo } from '@/lib/media/importVideo';
import { ASSET_PREFIX, readyVideo, setSceneVideo } from '@/lib/media/sceneVideo';
import type { SceneVideo } from '@/lib/media/types';
import { touch } from '@/lib/story/factory';
import type { Story } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { cancelVideoJob, startVideoJob, useVideoJob } from '@/state/videoJobs';

/**
 * Watch / import / generate / remove the MP4 attached to one scene. Videos live in the
 * scene's optional media overrides, so the story engine never sees them.
 *
 * AI generation runs only when the player taps it, on the free local server
 * (tools/video-server). Nothing is generated automatically and nothing is paid.
 */
export function useSceneVideo(story: Story | undefined, sceneNumber: number, video: SceneVideo | undefined, beforePlay: () => void, scene?: ScenePresentation) {
  const { s } = useSettings();
  const { upsert, update } = useStories();
  const [watchingKey, setWatchingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const key = story ? `${story.id}:${sceneNumber}` : '';
  const source = videoSource(video);
  const watching = watchingKey === key && !!source;
  const job = useVideoJob(key);
  const slot = scene ? videoImageSlot(scene) : null;
  const canGenerate = !!getVideoServerUrl() && !!slot && video?.provider !== 'wan-local';
  const demo = story && story.draft.world.kind === 'preset' && story.draft.mode !== 'bedtime' ? DEMO_FOR_WORLD[story.draft.world.id] : undefined;

  return {
    source,
    watching,
    message,
    watch: () => {
      beforePlay();
      setMessage(null);
      setWatchingKey(key);
    },
    close: () => setWatchingKey(null),
    /** Present while the scene's AI clip is being rendered on the PC. */
    job,
    generate:
      canGenerate && story && scene && slot
        ? () => {
            const storyId = story.id;
            const prompt = buildVideoPrompt(story, scene);
            const seed = videoSeed(story);
            setMessage(null);
            setWatchingKey(null);
            startVideoJob(key, async (signal, onUpdate) => {
              const client = createLocalVideoClient();
              try {
                if (!(await client.health())) throw new VideoError('unavailable');
                const url = await client.generate(slot, prompt, seed, onUpdate, signal);
                const uri = await saveGeneratedVideo(url, key);
                update(storyId, (st) => touch(setSceneVideo(st, sceneNumber, { status: 'ready', uri, provider: 'wan-local' }), {}));
                setMessage(s.aiVideoReady);
              } catch (e) {
                const reason = e instanceof VideoError ? e.reason : 'failed';
                setMessage(
                  reason === 'cancelled' ? s.aiVideoCancelled
                  : reason === 'unavailable' ? s.aiVideoUnavailable
                  : reason === 'gpu_out_of_memory' ? s.aiVideoOutOfMemory
                  : reason === 'network' ? s.aiVideoNetwork
                  : s.aiVideoFailed,
                );
              }
            });
          }
        : undefined,
    cancelGenerate: () => cancelVideoJob(key),
    useDemo: demo
      ? () => {
          if (!story) return;
          upsert(touch(setSceneVideo(story, sceneNumber, readyVideo(`${ASSET_PREFIX}${demo}`, 'demo')), {}));
          setMessage(s.demoClipNote);
        }
      : undefined,
    importVideo: async () => {
      if (!story) return;
      beforePlay();
      setWatchingKey(null);
      const result = await importSceneVideo(key);
      if (!result.ok) {
        if (result.reason !== 'canceled') setMessage(result.reason === 'not_video' ? s.videoNotVideo : s.videoImportFailed);
        return;
      }
      deleteImportedVideo(video?.uri);
      upsert(touch(setSceneVideo(story, sceneNumber, readyVideo(result.uri)), {}));
      setMessage(Platform.OS === 'web' ? s.videoWebNote : s.videoImported);
    },
    remove: () => {
      if (!story) return;
      setWatchingKey(null);
      deleteImportedVideo(video?.uri);
      upsert(touch(setSceneVideo(story, sceneNumber, null), {}));
      setMessage(null);
    },
  };
}
