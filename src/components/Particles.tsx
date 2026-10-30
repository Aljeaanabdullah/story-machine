import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

type Props = { count?: number; calm?: boolean; tint?: string };

/** Deterministic pseudo-random so particles don't jump around between renders. */
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Mote({ index, width, height, tint }: { index: number; width: number; height: number; tint: string }) {
  const progress = useSharedValue(0);
  const r = seeded(index);
  const r2 = seeded(index + 100);
  const size = 2 + r * 4;
  const x = r2 * width;
  const duration = 7000 + r * 7000;

  useEffect(() => {
    progress.set(withDelay(r2 * 4000, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)));
    return () => cancelAnimation(progress);
  }, [progress, duration, r2]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1,
      transform: [{ translateY: height - p * (height * 0.9) }, { translateX: Math.sin(p * Math.PI * 2 + index) * 14 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.mote,
        { left: x, width: size, height: size, borderRadius: size / 2, backgroundColor: tint, shadowColor: tint },
        style,
      ]}
    />
  );
}

function ParticlesBase({ count = 14, calm, tint = colors.gold }: Props) {
  const { width, height } = useWindowDimensions();
  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  if (calm) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((i) => (
        <Mote key={i} index={i} width={width} height={height} tint={i % 3 === 0 ? colors.blue : tint} />
      ))}
    </View>
  );
}

export const Particles = memo(ParticlesBase);

const styles = StyleSheet.create({
  mote: {
    position: 'absolute',
    top: 0,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
});
