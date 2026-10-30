import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArtFrame } from '@/components/art/ArtFrame';
import { HoodedSeer } from '@/components/art/HoodedSeer';
import { NightVista } from '@/components/art/NightVista';
import { HeroButton } from '@/components/HeroButton';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Logo } from '@/components/Logo';
import { Particles } from '@/components/Particles';
import { RingButton } from '@/components/RingButton';
import { IconButton } from '@/components/Screen';
import { strings } from '@/i18n/strings';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { useStartMode } from '@/state/useStartMode';
import { colors } from '@/theme';

export default function Home() {
  const { s, settings, dir, calm } = useSettings();
  const { stories } = useStories();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const startMode = useStartMode();
  const other = strings[settings.uiLanguage === 'ar' ? 'en' : 'ar'];
  const otherLang = settings.uiLanguage === 'ar' ? 'en' : 'ar';

  const resumable = useMemo(() => stories.find((st) => st.saved && st.mode === 'adventure' && !st.adventure?.finished), [stories]);
  const artHeight = Math.max(height * 0.74, 560);
  const seer = Math.min(width * 0.86, 380);
  const enter = (delay: number) => (calm ? undefined : FadeInDown.delay(delay).duration(650));

  return (
    <View style={styles.root}>
      <ArtFrame
        slot="home-hero"
        style={[styles.art, { height: artHeight }]}
        fadeTop
        fadeBottom
        contentPosition="top"
        fallback={
          <>
            <NightVista />
            <View style={[styles.seer, { top: artHeight * 0.36 }]}>
              <HoodedSeer size={seer} calm={calm} />
            </View>
          </>
        }
      />
      <Particles calm={calm} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20, minHeight: height }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.header, { flexDirection: dir.row }]}>
          <View style={[styles.headerGroup, { flexDirection: dir.row }]}>
            <IconButton icon="settings-outline" label={s.settings} onPress={() => router.push('/settings')} />
            <IconButton icon="library-outline" label={s.library} onPress={() => router.push('/library')} />
          </View>
          <LanguageToggle />
        </View>

        <Animated.View entering={calm ? undefined : FadeIn.duration(900)} style={styles.logo}>
          <Logo size={Math.min(44, width * 0.105)} />
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={enter(150)} style={styles.ctas}>
          <HeroButton
            label={s.createStory}
            sub={other.createStory}
            subLang={otherLang}
            glow
            onPress={() => router.push('/modes')}
          />
          {resumable ? (
            <HeroButton
              variant="outline"
              icon="book-outline"
              label={s.continueStory}
              sub={resumable.title}
              subLang={resumable.language}
              onPress={() => router.push({ pathname: '/adventure/[id]', params: { id: resumable.id } })}
            />
          ) : (
            <HeroButton variant="outline" icon="book-outline" label={s.exploreModes} sub={other.exploreModes} subLang={otherLang} onPress={() => router.push('/modes')} />
          )}
        </Animated.View>

        <Animated.View entering={enter(300)} style={[styles.rings, { flexDirection: dir.row }]}>
          <RingButton icon="book-open-page-variant-outline" label={s.homeShort} onPress={() => startMode('short')} />
          <RingButton icon="sword-cross" label={s.homeAdventure} onPress={() => startMode('adventure')} />
          <RingButton icon="star-four-points" label={s.homeKids} onPress={() => startMode('bedtime')} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  art: { position: 'absolute', top: 0, left: 0, right: 0 },
  seer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  content: { paddingHorizontal: 16 },
  header: { justifyContent: 'space-between', alignItems: 'center' },
  headerGroup: { gap: 8 },
  logo: { marginTop: 10 },
  spacer: { flex: 1, minHeight: 200 },
  ctas: { gap: 14 },
  rings: { marginTop: 22, gap: 6 },
});
