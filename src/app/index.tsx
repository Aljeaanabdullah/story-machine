import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { MagicCircle } from '@/components/art/MagicCircle';
import { CinematicBackground } from '@/components/CinematicBackground';
import { Logo } from '@/components/Logo';
import { useSettings } from '@/state/settings';

/** In-app cinematic splash shown after the native splash hides. */
export default function Splash() {
  const { width } = useWindowDimensions();
  const { calm } = useSettings();

  useEffect(() => {
    const id = setTimeout(() => router.replace('/home'), calm ? 600 : 2200);
    return () => clearTimeout(id);
  }, [calm]);

  const size = Math.min(width * 0.8, 340);
  return (
    <View style={styles.root}>
      <CinematicBackground />
      <Animated.View entering={calm ? undefined : ZoomIn.duration(900)} style={[styles.circle, { width: size, height: size }]}>
        <MagicCircle size={size} calm={calm} />
      </Animated.View>
      <Animated.View entering={calm ? undefined : FadeIn.delay(500).duration(900)}>
        <Logo />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', opacity: 0.6 },
});
