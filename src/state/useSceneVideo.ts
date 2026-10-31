import { useState } from 'react';
import { Platform } from 'react-native';

import { DEMO_FOR_WORLD } from '@/assets/videos';
import { videoSource } from '@/lib/media/videoSource';
import { deleteImportedVideo, importSceneVideo } from '@/lib/media/importVideo';
import { ASSET_PREFIX, readyVideo, setSceneVideo } from '@/lib/media/sceneVideo';
import type { SceneVideo } from '@/lib/media/types';
import { touch } from '@/lib/story/factory';
import type { Story } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';

/**
 * Watch / import / remove the MP4 attached to one scene. Videos live in the
 * scene's optional media overrides, so the story engine never sees them.
 */
export function useSceneVideo(story: Story | undefined, sceneNumber: number, video: SceneVideo | undefined, beforePlay: () => void) {
  const { s } = useSettings();
  const { upsert } = useStories();
  const [watchingKey, setWatchingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const key = story ? `${story.id}:${sceneNumber}` : '';
  const source = videoSource(video);
  const watching = watchingKey === key && !!source;
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
