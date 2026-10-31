import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { ErrorPanel } from '@/components/ErrorPanel';
import { GoldButton } from '@/components/GoldButton';
import { useModeText } from '@/components/ModeCard';
import { NarrationBar } from '@/components/NarrationBar';
import { OrnateCard } from '@/components/OrnateCard';
import { IconButton, Screen } from '@/components/Screen';
import { SceneArt } from '@/components/SceneArt';
import { SceneVideoBar, SceneVideoStage } from '@/components/SceneVideo';
import { storyAccent } from '@/components/StoryArt';
import { TextSizeButton } from '@/components/TextSizeButton';
import type { VoiceSegment } from '@/lib/audio/types';
import { presentProse } from '@/lib/media/present';
import { touch } from '@/lib/story/factory';
import { useDraft } from '@/state/draft';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { useNarration } from '@/state/useNarration';
import { useSceneVideo } from '@/state/useSceneVideo';
import { useSoundscape } from '@/state/useSoundscape';
import { colors, radius } from '@/theme';

const NO_SEGMENTS: VoiceSegment[] = [];

export default function StoryReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, settings, dir, calm } = useSettings();
  const { get, upsert, remove, ready } = useStories();
  const { set } = useDraft();
  const story = get(id);
  const mode = useModeText(story?.mode ?? 'short');

  const scene = useMemo(() => (story ? presentProse(story, settings.multiVoice) : undefined), [story, settings.multiVoice]);
  const narration = useNarration(scene?.segments ?? NO_SEGMENTS, story?.language ?? 'en');
  useSoundscape(narration.state, scene?.segments ?? NO_SEGMENTS, scene?.ambience ?? null);
  const video = useSceneVideo(story, 1, scene?.video, narration.stop, scene);
  const speaking = narration.active ? narration.state.paragraph : undefined;

  if (!story || !scene) {
    return (
      <Screen back>
        {ready && <ErrorPanel message={s.errors.unknown} onBack={() => router.replace('/home')} />}
      </Screen>
    );
  }

  const accent = storyAccent(story.draft);
  const date = new Date(story.createdAt).toLocaleDateString(settings.uiLanguage === 'ar' ? 'ar' : 'en', { dateStyle: 'medium' });

  const regenerate = () => {
    if (!story.saved) remove(story.id);
    set(story.draft);
    router.replace('/generating');
  };

  return (
    <Screen
      back
      glow={accent}
      right={
        <View style={[styles.headerActions, { flexDirection: dir.row }]}>
          <TextSizeButton />
          <IconButton icon="library-outline" label={s.backToLibrary} onPress={() => router.push('/library')} />
        </View>
      }
      footer={
        <>
          <View style={[styles.row, { flexDirection: dir.row }]}>
            <GoldButton
              style={styles.flex}
              label={story.saved ? s.saved : s.saveStory}
              icon={story.saved ? 'checkmark' : 'bookmark-outline'}
              disabled={story.saved}
              onPress={() => upsert(touch(story, { saved: true }))}
            />
            <GoldButton style={styles.flex} variant="secondary" label={s.generateAgain} icon="refresh" onPress={regenerate} />
          </View>
          <View style={[styles.row, { flexDirection: dir.row }]}>
            <GoldButton style={styles.flex} variant="ghost" label={s.newStory} icon="add" onPress={() => router.replace('/modes')} />
            <GoldButton style={styles.flex} variant="ghost" label={s.backHome} icon="home-outline" onPress={() => router.dismissTo('/home')} />
          </View>
        </>
      }
    >
      <Animated.View entering={calm ? undefined : FadeInDown.duration(600)}>
        <OrnateCard style={styles.page} accent={accent}>
          {video.watching && video.source ? (
            <SceneVideoStage
              source={video.source}
              style={styles.art}
              onClose={video.close}
              poster={<SceneArt draft={story.draft} visual={scene.visual} style={StyleSheet.absoluteFill} fadeTo="#131A2F" />}
            />
          ) : (
            <SceneArt draft={story.draft} visual={scene.visual} motion={scene.motion} atmosphere={scene.atmosphere} style={styles.art} fadeTo="#131A2F" />
          )}
          <View style={styles.head}>
            <AppText variant="caption" center color={accent}>
              {mode.title} · {date}
            </AppText>
            <AppText variant="title" center lang={story.language} color={colors.gold} accessibilityRole="header">
              {story.title}
            </AppText>
            <View style={styles.rule} />
          </View>
          <View style={styles.body}>
            <NarrationBar narration={narration} label={s.listenStory} />
            <SceneVideoBar
              hasVideo={!!video.source}
              watching={video.watching}
              onWatch={video.watch}
              onImport={video.importVideo}
              onRemove={video.remove}
              onUseDemo={video.useDemo}
              onGenerate={video.generate}
              onCancelGenerate={video.cancelGenerate}
              job={video.job}
              message={video.message}
            />
            {scene.paragraphs.map((p, i) => (
              <AppText key={i} variant="story" lang={story.language} style={i === speaking && [styles.speaking, { borderColor: accent }]}>
                {p}
              </AppText>
            ))}
            <AppText variant="heading" center color={colors.gold}>
              ✦
            </AppText>
          </View>
        </OrnateCard>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10 },
  flex: { flex: 1 },
  page: { padding: 0, overflow: 'hidden' },
  headerActions: { gap: 8 },
  art: { height: 190, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  head: { paddingHorizontal: 18, paddingTop: 4, marginTop: -28, gap: 6, alignItems: 'center' },
  rule: { width: 80, height: 1, backgroundColor: colors.goldDim, marginTop: 6 },
  body: { padding: 20, gap: 16 },
  speaking: { backgroundColor: 'rgba(214,180,119,0.08)', borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: 10, marginHorizontal: -11 },
});
