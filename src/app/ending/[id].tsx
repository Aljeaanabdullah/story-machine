import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { ArchetypeEmblem } from '@/components/art/ArchetypeEmblem';
import { ErrorPanel } from '@/components/ErrorPanel';
import { GoldButton } from '@/components/GoldButton';
import { OrnateCard } from '@/components/OrnateCard';
import { Screen } from '@/components/Screen';
import { StoryArt, storyAccent } from '@/components/StoryArt';
import { ARCHETYPES } from '@/data/catalog';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { useStartMode } from '@/state/useStartMode';
import { colors, radius } from '@/theme';

export default function Ending() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, settings, dir, calm } = useSettings();
  const { get, ready } = useStories();
  const startMode = useStartMode();
  const story = get(id);
  const adv = story?.adventure;

  if (!story || !adv) {
    return <Screen back>{ready && <ErrorPanel message={s.errors.unknown} onBack={() => router.replace('/home')} />}</Screen>;
  }

  const last = adv.scenes[adv.scenes.length - 1];
  const arch = ARCHETYPES.find((a) => a.id === story.draft.character.archetype) ?? ARCHETYPES[0];
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
      <View style={styles.banner}>
        <StoryArt draft={story.draft} style={StyleSheet.absoluteFill} fadeBottom fadeTo="#0B1020" />
        <View style={styles.bannerText}>
          <Animated.View entering={calm ? undefined : ZoomIn.duration(700)}>
            <ArchetypeEmblem id={arch.id} size={58} color={arch.color} />
          </Animated.View>
          <AppText variant="display" center color="#F1D69A" accessibilityRole="header" style={styles.shadow}>
            {s.endingTitle}
          </AppText>
          <AppText variant="heading" center lang={story.language} style={styles.shadow}>
            {story.draft.character.name} — {last?.title}
          </AppText>
        </View>
      </View>

      <Animated.View entering={enter(100)}>
        <OrnateCard corners={false} style={[styles.stats, { flexDirection: dir.row }]}>
          {[
            ['map-marker-path', s.scenesPlayed, String(adv.scenes.length)],
            ['source-branch', s.choicesMade, String(adv.choices.length)],
            ['flag-checkered', s.endingLabel, s.epicEnding],
          ].map(([icon, label, value], i) => (
            <View key={label} style={[styles.stat, i > 0 && styles.statDivider]}>
              <MaterialCommunityIcons name={icon as 'flag-checkered'} size={22} color={colors.gold} />
              <AppText variant="caption" center>
                {label}
              </AppText>
              <AppText variant="heading" center color={colors.text}>
                {value}
              </AppText>
            </View>
          ))}
        </OrnateCard>
      </Animated.View>

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
  banner: { height: 300, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1.2, borderColor: 'rgba(214,180,119,0.5)', justifyContent: 'flex-end' },
  bannerText: { alignItems: 'center', gap: 4, padding: 16 },
  shadow: { textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } },
  stats: { paddingVertical: 12, paddingHorizontal: 6 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { borderStartWidth: 1, borderColor: 'rgba(214,180,119,0.25)' },
  center: { alignItems: 'center', gap: 8 },
  row: { gap: 10 },
  flex: { flex: 1 },
  gap: { gap: 12 },
  step: { gap: 12, alignItems: 'flex-start' },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
