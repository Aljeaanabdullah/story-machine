import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { ArchetypeEmblem } from '@/components/art/ArchetypeEmblem';
import { MagicCircle } from '@/components/art/MagicCircle';
import { ErrorPanel } from '@/components/ErrorPanel';
import { GoldButton } from '@/components/GoldButton';
import { OrnateCard } from '@/components/OrnateCard';
import { Screen } from '@/components/Screen';
import { storyAccent } from '@/components/StoryArt';
import { ARCHETYPES } from '@/data/catalog';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { useStartMode } from '@/state/useStartMode';
import { colors } from '@/theme';

export default function Ending() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, settings, dir, calm } = useSettings();
  const { get, ready } = useStories();
  const { width } = useWindowDimensions();
  const startMode = useStartMode();
  const story = get(id);
  const adv = story?.adventure;

  if (!story || !adv) {
    return <Screen back>{ready && <ErrorPanel message={s.errors.unknown} onBack={() => router.replace('/home')} />}</Screen>;
  }

  const last = adv.scenes[adv.scenes.length - 1];
  const arch = ARCHETYPES.find((a) => a.id === story.draft.character.archetype) ?? ARCHETYPES[0];
  const size = Math.min(width * 0.6, 240);
  const enter = (d: number) => (calm ? undefined : FadeInDown.delay(d).duration(500));

  return (
    <Screen
      back
      glow={storyAccent(story.draft)}
      footer={
        <>
          <GoldButton label={s.newAdventure} icon="sparkles" onPress={() => startMode('adventure')} />
          <View style={[styles.row, { flexDirection: dir.row }]}>
            <GoldButton style={styles.flex} variant="secondary" label={s.backToLibrary} icon="library-outline" onPress={() => router.push('/library')} />
            <GoldButton style={styles.flex} variant="ghost" label={s.backHome} icon="home-outline" onPress={() => router.dismissTo('/home')} />
          </View>
        </>
      }
    >
      <View style={styles.center}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View style={StyleSheet.absoluteFill}>
            <MagicCircle size={size} calm={calm} inner={arch.color} />
          </View>
          <Animated.View entering={calm ? undefined : ZoomIn.duration(700)}>
            <ArchetypeEmblem id={arch.id} size={size * 0.5} color={arch.color} />
          </Animated.View>
        </View>
        <AppText variant="display" center color={colors.gold} accessibilityRole="header">
          {s.endingTitle}
        </AppText>
        <AppText variant="heading" center lang={story.language}>
          {story.draft.character.name} — {last?.title}
        </AppText>
      </View>

      <Animated.View entering={enter(200)}>
        <OrnateCard style={styles.gap}>
          <AppText variant="label" color={colors.gold}>
            {s.yourPath}
          </AppText>
          {adv.choices.map((c) => (
            <View key={c.scene} style={[styles.step, { flexDirection: dir.row }]}>
              <View style={styles.dot}>
                <AppText variant="caption" lang="en" center color="#2A1A05">
                  {c.scene}
                </AppText>
              </View>
              <AppText variant="body" lang={story.language} style={styles.flex}>
                {c.text}
              </AppText>
            </View>
          ))}
          <View style={[styles.step, { flexDirection: dir.row }]}>
            <View style={[styles.dot, { backgroundColor: colors.blue }]}>
              <AppText variant="caption" lang="en" center color={colors.bg}>
                ✦
              </AppText>
            </View>
            <AppText variant="body" lang={story.language} color={colors.textDim} style={styles.flex}>
              {last?.summary}
            </AppText>
          </View>
        </OrnateCard>
      </Animated.View>

      <AppText variant="caption" center>
        {new Date(story.updatedAt).toLocaleString(settings.uiLanguage === 'ar' ? 'ar' : 'en')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 8 },
  row: { gap: 10 },
  flex: { flex: 1 },
  gap: { gap: 12 },
  step: { gap: 12, alignItems: 'flex-start' },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
