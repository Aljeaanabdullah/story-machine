import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { cameraFrame } from '@/lib/media/motion';
import type { MotionHint, SceneVisual } from '@/lib/media/types';
import type { StoryDraft } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { StoryArt } from './StoryArt';

type Props = {
  draft: StoryDraft;
  visual: SceneVisual;
  /** Slow camera move over the still; ignored when reduced motion is on. */
  motion?: MotionHint;
  style?: StyleProp<ViewStyle>;
  fadeTo: string;
};

/**
 * A scene's image slot: the scene's own image once one exists (generated or uploaded),
 * otherwise the story's world art as a placeholder. The art drifts with the scene's
 * camera move while the fade stays fixed above it.
 */
export function SceneArt({ draft, visual, motion, style, fadeTo }: Props) {
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
      <LinearGradient colors={[`${fadeTo}00`, fadeTo]} style={styles.fade} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%' },
});
