import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorPanel } from '@/components/ErrorPanel';
import { LoadingOrb } from '@/components/LoadingOrb';
import { Screen } from '@/components/Screen';
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
  const started = useRef(false);
  const alive = useRef(true);

  const run = useCallback(async () => {
    setError(null);
    setBusy(true);
    const opts = { modelOverride: settings.model || undefined };
    try {
      if (draft.mode === 'adventure') {
        const adventure = await generateNextScene(draft, createAdventure(startLocation(draft)), opts);
        const story = makeAdventureStory(draft, adventure);
        upsert(story);
        if (alive.current) router.replace({ pathname: '/adventure/[id]', params: { id: story.id } });
      } else {
        const gen = draft.mode === 'bedtime' ? generateBedtimeStory : generateShortStory;
        const { title, content } = await gen(draft, opts);
        const story = makeProseStory(draft, title, content);
        upsert(story);
        if (alive.current) router.replace({ pathname: '/story/[id]', params: { id: story.id } });
      }
    } catch (e) {
      logAIError(e);
      if (alive.current) setError(errorMessage(e, s));
    } finally {
      if (alive.current) setBusy(false);
    }
  }, [draft, settings.model, upsert, s]);

  useEffect(() => {
    alive.current = true;
    // Guard against double-invoked effects so a free request is never sent twice.
    if (!started.current) {
      started.current = true;
      run();
    }
    return () => {
      alive.current = false;
    };
  }, [run]);

  return (
    <Screen scroll={false} glow={draft.mode === 'bedtime' ? colors.blue : colors.purple} back={error ? true : undefined}>
      <View style={styles.center}>
        {error ? (
          <ErrorPanel message={error} onRetry={run} retryDisabled={busy} onBack={() => router.back()} />
        ) : (
          <LoadingOrb title={s.generatingTitle} lines={s.generatingLines} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
