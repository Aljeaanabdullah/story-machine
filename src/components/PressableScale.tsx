import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useSettings } from '@/state/settings';
import { tap } from './haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  scaleTo?: number;
  strongHaptic?: boolean;
};

/** Pressable with a springy press-in and haptic tick. */
export function PressableScale({ style, children, scaleTo = 0.96, strongHaptic, onPressIn, onPressOut, onPress, disabled, ...rest }: Props) {
  const { settings, calm } = useSettings();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e) => {
        scale.set(calm ? withTiming(scaleTo, { duration: 60 }) : withSpring(scaleTo, { damping: 15, stiffness: 400 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(calm ? withTiming(1, { duration: 80 }) : withSpring(1, { damping: 12, stiffness: 300 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        tap(settings.haptics, strongHaptic);
        onPress?.(e);
      }}
      style={[style, animated, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressable>
  );
}
