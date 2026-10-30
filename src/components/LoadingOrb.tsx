import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useSettings } from '@/state/settings';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { MagicCircle } from './art/MagicCircle';

/** Cinematic "summoning" loader with rotating flavour lines. */
export function LoadingOrb({ size = 220, title, lines, scene }: { size?: number; title: string; lines: string[]; /** Optional art shown inside a glowing crystal ball. */ scene?: ReactNode }) {
  const { calm } = useSettings();
  const breathe = useSharedValue(0);
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!calm) breathe.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
    const id = setInterval(() => setLine((l) => (l + 1) % Math.max(lines.length, 1)), 2600);
    return () => {
      clearInterval(id);
      cancelAnimation(breathe);
    };
  }, [calm, breathe, lines.length]);

  const orb = useAnimatedStyle(() => ({ transform: [{ scale: 0.85 + breathe.value * 0.2 }], opacity: 0.7 + breathe.value * 0.3 }));

  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite" accessible accessibilityLabel={title}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={StyleSheet.absoluteFill}>
          <MagicCircle size={size} calm={calm} color={colors.gold} inner={colors.purple} />
        </View>
        {scene ? (
          <View style={[styles.crystal, { width: size * 0.62, height: size * 0.62, borderRadius: size * 0.31 }]}>
            {scene}
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.crystalShine, orb]} />
          </View>
        ) : (
        <Animated.View style={[{ width: size * 0.42, height: size * 0.42 }, orb]}>
          <Svg width="100%" height="100%" viewBox="0 0 40 40">
            <Defs>
              <RadialGradient id="lo" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="0.3" stopColor={colors.blue} />
                <Stop offset="1" stopColor={colors.purple} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="20" cy="20" r="20" fill="url(#lo)" />
          </Svg>
        </Animated.View>
        )}
      </View>
      <AppText variant="title" center color={colors.gold}>
        {title}
      </AppText>
      <Animated.View key={line} entering={calm ? undefined : FadeIn.duration(500)} exiting={calm ? undefined : FadeOut.duration(300)}>
        <AppText variant="body" center color={colors.textDim}>
          {lines[line]}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  crystal: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F3D99C',
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  crystalShine: { backgroundColor: 'rgba(255,240,200,0.08)', borderRadius: 999 },
  wrap: { alignItems: 'center', gap: 18 },
});
