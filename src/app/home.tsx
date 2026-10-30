import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { HoodedSeer } from '@/components/art/HoodedSeer';
import { GoldButton } from '@/components/GoldButton';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Logo } from '@/components/Logo';
import { ModeCard } from '@/components/ModeCard';
import { IconButton, Screen } from '@/components/Screen';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { useStartMode } from '@/state/useStartMode';
import { colors } from '@/theme';

export default function Home() {
  const { s, dir, calm } = useSettings();
  const { stories } = useStories();
  const { width, height } = useWindowDimensions();
  const startMode = useStartMode();

  const resumable = useMemo(() => stories.find((st) => st.saved && st.mode === 'adventure' && !st.adventure?.finished), [stories]);
  // Leave room for the CTA and mode cards on short phones.
  const heroSize = Math.min(width * 0.78, height * 0.36, 360);
  const enter = (delay: number) => (calm ? undefined : FadeInDown.delay(delay).duration(600));

  return (
    <Screen
      right={
        <View style={[styles.actions, { flexDirection: dir.row }]}>
          <IconButton icon="library-outline" label={s.library} onPress={() => router.push('/library')} />
          <IconButton icon="settings-outline" label={s.settings} onPress={() => router.push('/settings')} />
        </View>
      }
      left={<LanguageToggle />}
    >
      <Animated.View entering={calm ? undefined : FadeInUp.duration(800)} style={styles.center}>
        <Logo size={Math.min(34, width * 0.085)} />
      </Animated.View>

      <View style={styles.center}>
        <HoodedSeer size={heroSize} calm={calm} />
      </View>

      <Animated.View entering={enter(200)} style={styles.ctas}>
        <GoldButton label={s.createStory} icon="sparkles" glow onPress={() => router.push('/modes')} />
        {resumable && (
          <GoldButton
            label={s.continueStory}
            variant="secondary"
            icon="play"
            accessibilityHint={resumable.title}
            onPress={() => router.push({ pathname: '/adventure/[id]', params: { id: resumable.id } })}
          />
        )}
      </Animated.View>

      <Animated.View entering={enter(350)} style={styles.modes}>
        <AppText variant="label" center color={colors.gold}>
          {s.chooseYourPath}
        </AppText>
        <View style={[styles.modeRow, { flexDirection: dir.row }]}>
          <ModeCard compact mode="short" onPress={() => startMode('short')} />
          <ModeCard compact mode="adventure" onPress={() => startMode('adventure')} />
          <ModeCard compact mode="bedtime" onPress={() => startMode('bedtime')} />
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8 },
  center: { alignItems: 'center' },
  ctas: { gap: 12 },
  modes: { gap: 10 },
  modeRow: { gap: 10 },
});
