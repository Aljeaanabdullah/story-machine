import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { CinematicBackground } from '@/components/CinematicBackground';
import { ChoiceCard } from '@/components/ChoiceCard';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ErrorPanel } from '@/components/ErrorPanel';
import { GoldButton } from '@/components/GoldButton';
import { LoadingOrb } from '@/components/LoadingOrb';
import { OrnateCard } from '@/components/OrnateCard';
import { ProgressRunes } from '@/components/ProgressRunes';
import { IconButton } from '@/components/Screen';
import { StoryArt, storyAccent } from '@/components/StoryArt';
import { errorMessage, logAIError } from '@/lib/ai/errors';
import { awaitingNextScene, choose, currentScene, needsScene, restartAdventure } from '@/lib/story/engine';
import { touch } from '@/lib/story/factory';
import { generateNextScene } from '@/lib/story/generate';
import type { Story } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { colors, radius } from '@/theme';

export default function AdventureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, settings, dir, calm } = useSettings();
  const { get, upsert, ready } = useStories();
  const insets = useSafeAreaInsets();
  const story = get(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const inFlight = useRef(false);

  /** Writes the next scene. The chosen option is already persisted, so a failure loses nothing. */
  const continueStory = useCallback(
    async (base: Story) => {
      if (!base.adventure || inFlight.current || !needsScene(base.adventure)) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const adventure = await generateNextScene(base.draft, base.adventure, { modelOverride: settings.model || undefined });
        upsert(touch(base, { adventure }));
        scrollRef.current?.scrollTo({ y: 0, animated: !calm });
      } catch (e) {
        logAIError(e);
        setError(errorMessage(e, s));
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [settings.model, upsert, s, calm],
  );

  // Resume automatically if the app was closed while a scene was being written.
  const resumeChecked = useRef(false);
  useEffect(() => {
    if (!story?.adventure || resumeChecked.current) return;
    const pending = story;
    const id = setTimeout(() => {
      resumeChecked.current = true;
      if (pending.adventure && needsScene(pending.adventure)) continueStory(pending);
    }, 0);
    return () => clearTimeout(id);
  }, [story, continueStory]);

  if (!story?.adventure) {
    return (
      <View style={styles.root}>
        <CinematicBackground />
        <View style={[styles.missing, { paddingTop: insets.top + 40 }]}>
          {ready && <ErrorPanel message={s.errors.unknown} onBack={() => router.replace('/home')} />}
        </View>
      </View>
    );
  }

  const adv = story.adventure;
  const scene = currentScene(adv);
  const accent = storyAccent(story.draft);
  const picked = scene ? adv.choices.find((c) => c.scene === scene.number) : undefined;
  const previousChoice = scene ? adv.choices.find((c) => c.scene === scene.number - 1) : undefined;
  const waiting = awaitingNextScene(adv);

  const onChoose = (index: number) => {
    const next = choose(adv, index);
    if (next === adv) return;
    const updated = touch(story, { adventure: next });
    upsert(updated);
    continueStory(updated);
  };

  const onRestart = () => {
    setConfirmRestart(false);
    setError(null);
    upsert(touch(story, { adventure: restartAdventure(adv) }));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={styles.root}>
      <CinematicBackground glow={accent} particles={!loading} />
      <View style={[styles.header, { paddingTop: insets.top + 6, flexDirection: dir.row }]}>
        <IconButton icon={dir.isRTL ? 'chevron-forward' : 'chevron-back'} label={s.goBack} onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <View style={styles.flex}>
          <ProgressRunes current={Math.max(adv.scenes.length, 1)} total={adv.maxScenes} done={adv.finished} />
        </View>
        <View style={[styles.headerActions, { flexDirection: dir.row }]}>
          <IconButton icon="refresh" label={s.restartStory} onPress={() => setConfirmRestart(true)} />
          <IconButton icon="library-outline" label={s.backToLibrary} onPress={() => router.push('/library')} />
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {scene && (
          <Animated.View key={scene.number} entering={calm ? undefined : FadeInDown.duration(600)} style={styles.gap}>
            {previousChoice && (
              <View style={[styles.prevChoice, { flexDirection: dir.row }]}>
                <AppText variant="caption" color={colors.gold}>
                  {s.yourChoice}:
                </AppText>
                <AppText variant="caption" lang={story.language} color={colors.text} style={styles.flex}>
                  {previousChoice.text}
                </AppText>
              </View>
            )}
            <OrnateCard style={styles.page} accent={accent}>
              <StoryArt draft={story.draft} style={styles.art} />
              <View style={styles.sceneHead}>
                <AppText variant="caption" center color={accent}>
                  {s.scene} {scene.number}
                </AppText>
                <AppText variant="title" center lang={story.language} color={colors.gold} accessibilityRole="header">
                  {scene.title}
                </AppText>
              </View>
              <View style={styles.body}>
                {scene.text
                  .split(/\n\s*\n|\n/)
                  .filter((p) => p.trim())
                  .map((p, i) => (
                    <AppText key={i} variant="story" lang={story.language}>
                      {p.trim()}
                    </AppText>
                  ))}
              </View>
            </OrnateCard>

            {!scene.isEnding && (
              <View style={styles.gap}>
                <AppText variant="heading" center color={colors.gold}>
                  {s.whatWillYouDo}
                </AppText>
                {scene.choices.map((c, i) => (
                  <Animated.View key={`${scene.number}-${i}`} entering={calm ? undefined : FadeInDown.delay(300 + i * 120).duration(450)}>
                    <ChoiceCard
                      index={i}
                      text={c}
                      lang={story.language}
                      selected={picked?.index === i}
                      dimmed={!!picked && picked.index !== i}
                      disabled={waiting || loading}
                      onPress={() => onChoose(i)}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {loading && (
          <Animated.View entering={calm ? undefined : FadeIn.duration(400)} style={styles.loading}>
            <LoadingOrb size={150} title={s.writingNextScene} lines={s.generatingLines} />
          </Animated.View>
        )}

        {error && !loading && <ErrorPanel message={error} onRetry={() => continueStory(story)} onBack={() => router.back()} />}

        {adv.finished && (
          <GoldButton label={s.seeEnding} icon="sparkles" glow onPress={() => router.push({ pathname: '/ending/[id]', params: { id: story.id } })} />
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmRestart}
        title={`${s.restartStory}?`}
        body={story.title}
        confirmLabel={s.restartStory}
        onConfirm={onRestart}
        onCancel={() => setConfirmRestart(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  missing: { paddingHorizontal: 18 },
  header: { alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
  headerActions: { gap: 6 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 8, gap: 18 },
  gap: { gap: 14 },
  prevChoice: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,27,48,0.7)',
  },
  page: { padding: 0, overflow: 'hidden' },
  art: { height: 130, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  sceneHead: { paddingHorizontal: 18, paddingTop: 14, gap: 4 },
  body: { padding: 20, paddingTop: 12, gap: 14 },
  loading: { alignItems: 'center', paddingVertical: 10 },
});
