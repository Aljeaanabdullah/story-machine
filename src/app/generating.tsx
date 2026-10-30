import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorPanel } from '@/components/ErrorPanel';
import { GoldButton } from '@/components/GoldButton';
import { LoadingOrb } from '@/components/LoadingOrb';
import { Screen } from '@/components/Screen';
import { StoryArt } from '@/components/StoryArt';
import { errorMessage, logAIError } from '@/lib/ai/errors';
import { createAdventure } from '@/lib/story/engine';
import { makeAdventureStory, makeProseStory, startLocation } from '@/lib/story/factory';
import { generateBedtimeStory, generateNextScene, generateShortStory } from '@/lib/story/generate';
import { useDraft } from '@/state/draft';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { colors } from '@/theme';

/** Cinematic loading screen that performs the first AI request for every mode. */
export default function Generating() {
  const { s, settings } = useSettings();
  const { draft } = useDraft();
  const { upsert } = useStories();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setError(null);
    setBusy(true);
    const opts = { modelOverride: settings.model || undefined, signal: ctrl.signal };
    try {
      if (draft.mode === 'adventure') {
        const adventure = await generateNextScene(draft, createAdventure(startLocation(draft)), opts);
        // Leaving or cancelling must not save a story the player never saw.
        if (ctrl.signal.aborted) return;
        const story = makeAdventureStory(draft, adventure);
        upsert(story);
        router.replace({ pathname: '/adventure/[id]', params: { id: story.id } });
      } else {
        const gen = draft.mode === 'bedtime' ? generateBedtimeStory : generateShortStory;
        const { title, content } = await gen(draft, opts);
        if (ctrl.signal.aborted) return;
        const story = makeProseStory(draft, title, content);
        upsert(story);
        router.replace({ pathname: '/story/[id]', params: { id: story.id } });
      }
    } catch (e) {
      if (ctrl.signal.aborted) return;
      logAIError(e);
      setError(errorMessage(e, s));
    } finally {
      if (!ctrl.signal.aborted) setBusy(false);
    }
  }, [draft, settings.model, upsert, s]);

  // Start once on mount; abort the in-flight request if the screen goes away.
  // (Under StrictMode's dev double-mount the first request is aborted and re-sent.)
  useEffect(() => {
    const id = setTimeout(run, 0);
    return () => {
      clearTimeout(id);
      controller.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = () => {
    controller.current?.abort();
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <Screen scroll={false} glow={draft.mode === 'bedtime' ? colors.blue : colors.purple} back={cancel}>
      <View style={styles.center}>
        {error ? (
          <ErrorPanel message={error} onRetry={run} retryDisabled={busy} onBack={cancel} />
        ) : (
          <View style={styles.loading}>
            <LoadingOrb size={260} title={s.generatingTitle} lines={s.generatingLines} scene={<StoryArt draft={draft} style={StyleSheet.absoluteFill} />} />
            <GoldButton label={s.cancel_generation} variant="ghost" icon="close" onPress={cancel} style={styles.cancel} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  loading: { alignItems: 'center', gap: 28 },
  cancel: { minWidth: 160 },
});
