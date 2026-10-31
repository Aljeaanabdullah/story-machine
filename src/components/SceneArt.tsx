import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import type { Atmosphere } from '@/lib/media/atmosphere';
import { cameraFrame } from '@/lib/media/motion';
import type { MotionHint, SceneVisual } from '@/lib/media/types';
import type { StoryDraft } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { AtmosphereLayer } from './AtmosphereLayer';
import { StoryArt } from './StoryArt';

type Props = {
  draft: StoryDraft;
  visual: SceneVisual;
  /** Slow camera move over the still; ignored when reduced motion is on. */
  motion?: MotionHint;
  /** Fog and light motes drifting over the art (parallax layers). */
  atmosphere?: Atmosphere;
  style?: StyleProp<ViewStyle>;
  fadeTo: string;
};

/**
 * A scene's image slot: the scene's own image once one exists (generated or uploaded),
 * otherwise the story's world art as a placeholder. The art drifts with the scene's
 * camera move while the fade stays fixed above it.
 */
export function SceneArt({ draft, visual, motion, atmosphere, style, fadeTo }: Props) {
  const { calm } = useSettings();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const t = useSharedValue(0);
  const moving = !!motion && !calm && motion.camera !== 'still';
  const camera = motion?.camera ?? 'still';
  const intensity = motion?.intensity ?? 0;
  const duration = motion?.durationMs ?? 12000;

  useEffect(() => {
    if (!moving) {
      cancelAnimation(t);
      t.set(0);
      return;
    }
    t.set(0);
    t.set(withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [moving, duration, camera, t]);

  // A single soft light sweep when the scene first appears (a cinematic transition).
  const sweep = useSharedValue(calm ? 1 : 0);
  useEffect(() => {
    if (calm) return;
    sweep.set(withDelay(250, withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) })));
    return () => cancelAnimation(sweep);
  }, [calm, sweep]);
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: sweep.value >= 1 ? 0 : 0.55 * Math.sin(Math.PI * sweep.value),
    transform: [{ translateX: (sweep.value * 1.6 - 0.6) * size.w }, { rotate: '18deg' }],
  }));

  const animated = useAnimatedStyle(() => {
    if (!moving) return { transform: [{ scale: 1 }] };
    const f = cameraFrame(camera, intensity, t.value, size.w, size.h);
    return { transform: [{ translateX: f.translateX }, { translateY: f.translateY }, { scale: f.scale }] };
  });

  return (
    <View
      style={[styles.wrap, style]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, animated]}>
        {visual.status === 'ready' && visual.uri ? (
          <Image source={{ uri: visual.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        ) : (
          <StoryArt draft={draft} style={StyleSheet.absoluteFill} />
        )}
      </Animated.View>
      {atmosphere && <AtmosphereLayer atmosphere={atmosphere} width={size.w} height={size.h} calm={calm} />}
      {!calm && (
        <Animated.View pointerEvents="none" style={[styles.sweep, { width: size.w * 0.35, height: size.h * 2, top: -size.h * 0.5 }, sweepStyle]}>
          <LinearGradient colors={['#FFF4D600', '#FFF4D6', '#FFF4D600']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
      <LinearGradient colors={[`${fadeTo}00`, fadeTo]} style={styles.fade} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%' },
  sweep: { position: 'absolute', left: 0 },
});
