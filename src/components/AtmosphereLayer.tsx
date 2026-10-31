import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import type { Atmosphere } from '@/lib/media/atmosphere';
import { Particles } from './Particles';

type BandProps = { width: number; top: number; height: number; tint: string; opacity: number; duration: number; direction: 1 | -1 };

/** One fog band, wider than the frame, drifting back and forth. Slower bands read as farther away. */
function FogBand({ width, top, height, tint, opacity, duration, direction }: BandProps) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [t, duration]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: direction * (t.value - 0.5) * width * 0.35 }] }));
  return (
    <Animated.View style={[styles.band, { top, height, left: -width * 0.3, width: width * 1.6, opacity }, style]}>
      <LinearGradient colors={[`${tint}00`, tint, `${tint}00`]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[`${tint}00`, `${tint}AA`, `${tint}00`]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

type Props = { atmosphere: Atmosphere; width: number; height: number; calm: boolean };

/**
 * Parallax weather over a scene: a far, slow fog band, a near, faster one drifting
 * the other way, and foreground light motes. With reduced motion only a still haze remains.
 */
function AtmosphereLayerBase({ atmosphere, width, height, calm }: Props) {
  if (!width || !height || (atmosphere.fog <= 0 && atmosphere.motes <= 0)) return null;
  if (calm) {
    return atmosphere.fog > 0 ? (
      <View pointerEvents="none" style={[styles.band, { top: height * 0.45, height: height * 0.4, left: 0, right: 0, opacity: atmosphere.fog * 0.6 }]}>
        <LinearGradient colors={[`${atmosphere.fogTint}00`, `${atmosphere.fogTint}AA`, `${atmosphere.fogTint}00`]} style={StyleSheet.absoluteFill} />
      </View>
    ) : null;
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {atmosphere.fog > 0 && (
        <>
          <FogBand width={width} top={height * 0.18} height={height * 0.45} tint={atmosphere.fogTint} opacity={atmosphere.fog * 0.7} duration={26000} direction={1} />
          <FogBand width={width} top={height * 0.5} height={height * 0.5} tint={atmosphere.fogTint} opacity={atmosphere.fog} duration={17000} direction={-1} />
        </>
      )}
      {atmosphere.motes > 0 && <Particles count={atmosphere.motes} tint={atmosphere.moteTint} area={{ width, height }} />}
    </View>
  );
}

export const AtmosphereLayer = memo(AtmosphereLayerBase);

const styles = StyleSheet.create({
  band: { position: 'absolute' },
});
