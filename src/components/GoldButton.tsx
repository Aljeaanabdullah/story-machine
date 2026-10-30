import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useSettings } from '@/state/settings';
import { colors, radius, TOUCH } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  /** Pulsing outer glow for the main call to action. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function GoldButton({ label, onPress, variant = 'primary', icon, disabled, loading, glow, style, accessibilityHint }: Props) {
  const { dir, calm } = useSettings();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!glow || calm) return;
    pulse.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(pulse);
  }, [glow, calm, pulse]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.45, transform: [{ scale: 1 + pulse.value * 0.04 }] }));

  const primary = variant === 'primary';
  const textColor = primary ? '#2A1A05' : variant === 'secondary' ? colors.gold : colors.textDim;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      strongHaptic={primary}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[styles.wrap, style]}
    >
      {glow && <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />}
      {primary ? (
        <LinearGradient colors={['#F2D9A0', colors.gold, '#A9823F']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.body, styles.primaryBorder]}>
          <Inner label={label} icon={icon} color={textColor} row={dir.row} loading={loading} />
        </LinearGradient>
      ) : (
        <View style={[styles.body, variant === 'secondary' ? styles.secondary : styles.ghost]}>
          <Inner label={label} icon={icon} color={textColor} row={dir.row} loading={loading} />
        </View>
      )}
    </PressableScale>
  );
}

function Inner({ label, icon, color, row, loading }: { label: string; icon?: Props['icon']; color: string; row: 'row' | 'row-reverse' | undefined | 'column' | 'column-reverse'; loading?: boolean }) {
  return (
    <View style={[styles.inner, { flexDirection: row }]}>
      {loading ? <ActivityIndicator color={color} /> : icon ? <Ionicons name={icon} size={20} color={color} /> : null}
      <AppText variant="label" color={color} style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: TOUCH + 6, justifyContent: 'center' },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  body: { minHeight: TOUCH + 6, borderRadius: radius.pill, paddingHorizontal: 22, justifyContent: 'center' },
  primaryBorder: { borderWidth: 1, borderColor: '#FBEBC4' },
  secondary: { borderWidth: 1.5, borderColor: colors.gold, backgroundColor: 'rgba(214,180,119,0.08)' },
  ghost: { borderWidth: 1, borderColor: 'rgba(174,181,203,0.3)', backgroundColor: 'rgba(20,27,48,0.6)' },
  inner: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: { fontSize: 15, flexShrink: 1 },
});
