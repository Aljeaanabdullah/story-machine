import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme';
import { MagicCircle } from './MagicCircle';

/**
 * Home hero illustration: a cloaked storyteller holding a glowing orb inside a
 * rotating rune circle. Hand-built vector art — no third-party character assets.
 */
function HoodedSeerBase({ size, calm }: { size: number; calm?: boolean }) {
  const float = useSharedValue(0);
  useEffect(() => {
    if (calm) return;
    float.set(withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(float);
  }, [calm, float]);

  const figure = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * float.value }] }));
  const orb = useAnimatedStyle(() => ({ opacity: 0.75 + 0.25 * float.value, transform: [{ scale: 0.94 + 0.1 * float.value }] }));

  const w = size;
  const h = size * 1.05;
  return (
    <View style={{ width: w, height: h, alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', top: -h * 0.06 }]}>
        <MagicCircle size={w * 0.98} calm={calm} />
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, figure]}>
        <Svg width={w} height={h} viewBox="0 0 200 210">
          <Defs>
            <LinearGradient id="cloak" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#25305A" />
              <Stop offset="1" stopColor="#0D1124" />
            </LinearGradient>
            <LinearGradient id="trim" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.gold} />
              <Stop offset="1" stopColor="#8E7546" />
            </LinearGradient>
            <RadialGradient id="hoodShadow" cx="50%" cy="45%" r="50%">
              <Stop offset="0" stopColor="#000" stopOpacity="1" />
              <Stop offset="1" stopColor="#05070F" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="100" cy="200" rx="58" ry="7" fill="#000" opacity={0.45} />
          {/* cloak */}
          <Path d="M100 40 C72 44 64 78 62 104 C58 140 44 172 30 200 L170 200 C156 172 142 140 138 104 C136 78 128 44 100 40 Z" fill="url(#cloak)" />
          <Path d="M100 40 C72 44 64 78 62 104 C58 140 44 172 30 200" stroke="url(#trim)" strokeWidth={1.4} fill="none" opacity={0.8} />
          <Path d="M100 40 C128 44 136 78 138 104 C142 140 156 172 170 200" stroke="url(#trim)" strokeWidth={1.4} fill="none" opacity={0.8} />
          {/* robe seam and filigree */}
          <Path d="M100 92 L100 200" stroke="url(#trim)" strokeWidth={1.2} opacity={0.7} />
          <Path d="M86 120 Q100 128 114 120 M82 150 Q100 160 118 150 M78 178 Q100 190 122 178" stroke={colors.gold} strokeWidth={0.8} fill="none" opacity={0.55} />
          {/* hood */}
          <Path d="M100 22 C78 22 68 44 70 66 C72 82 82 94 100 96 C118 94 128 82 130 66 C132 44 122 22 100 22 Z" fill="url(#cloak)" stroke="url(#trim)" strokeWidth={1.3} />
          <Path d="M100 34 C86 34 80 50 82 64 C84 78 92 86 100 86 C108 86 116 78 118 64 C120 50 114 34 100 34 Z" fill="url(#hoodShadow)" />
          {/* eyes */}
          <Circle cx="93" cy="62" r="1.8" fill={colors.blue} />
          <Circle cx="107" cy="62" r="1.8" fill={colors.blue} />
          {/* amulet */}
          <Circle cx="100" cy="104" r="5" fill="#0B1020" stroke={colors.gold} strokeWidth={1.4} />
          <Circle cx="100" cy="104" r="2.6" fill={colors.blue} />
          {/* arm reaching toward the orb */}
          <Path d="M134 112 C146 116 154 122 160 128" stroke="#1C2542" strokeWidth={10} strokeLinecap="round" fill="none" />
          <Path d="M134 112 C146 116 154 122 160 128" stroke={colors.gold} strokeWidth={0.8} strokeLinecap="round" fill="none" opacity={0.5} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.orb, { left: w * 0.72, top: h * 0.5, width: w * 0.2, height: w * 0.2 }, orb]}>
        <Svg width="100%" height="100%" viewBox="0 0 40 40">
          <Defs>
            <RadialGradient id="orbG" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFF4D6" stopOpacity="1" />
              <Stop offset="0.35" stopColor={colors.fire} stopOpacity="0.95" />
              <Stop offset="1" stopColor={colors.fire} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="20" cy="20" r="20" fill="url(#orbG)" />
          <Circle cx="20" cy="20" r="11" stroke="#FFE2B0" strokeWidth={0.7} fill="none" opacity={0.8} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export const HoodedSeer = memo(HoodedSeerBase);

const styles = StyleSheet.create({
  orb: { position: 'absolute', shadowColor: colors.fire, shadowOpacity: 0.9, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
});
