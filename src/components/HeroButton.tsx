import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  /** Small second line, e.g. the CTA in the other language. */
  sub?: string;
  subLang?: 'en' | 'ar';
  onPress: () => void;
  variant?: 'gold' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/** Ornate pointed gold tip drawn at each end of the main CTA. */
function Tip({ flip, color }: { flip?: boolean; color: string }) {
  return (
    <View pointerEvents="none" style={[styles.tip, flip ? styles.tipRight : styles.tipLeft, flip && { transform: [{ scaleX: -1 }] }]}>
      <Svg width={22} height={40} viewBox="0 0 22 40">
        <Path d="M22 4 L6 20 L22 36" stroke={color} strokeWidth={1.6} fill="none" />
        <Path d="M14 12 L6 20 L14 28" stroke={color} strokeWidth={1} fill="none" opacity={0.7} />
        <Path d="M2 20 l3 -3 l3 3 l-3 3 z" fill={color} />
      </Svg>
    </View>
  );
}

/** Large two-line cinematic CTA used on the redesigned screens. */
export function HeroButton({ label, sub, subLang, onPress, variant = 'gold', icon, disabled, glow, style, accessibilityHint }: Props) {
  const { dir, calm } = useSettings();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!glow || calm || disabled) return;
    pulse.set(withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(pulse);
  }, [glow, calm, disabled, pulse]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.25 + pulse.value * 0.45 }));

  const gold = variant === 'gold';
  const fg = gold ? '#24170A' : colors.text;
  const arrow = dir.isRTL ? 'arrow-back' : 'arrow-forward';

  const content = (
    <View style={[styles.inner, { flexDirection: dir.row }]}>
      {icon && (
        <View style={styles.leadIcon}>
          <Ionicons name={icon} size={24} color={gold ? fg : colors.gold} />
        </View>
      )}
      <View style={styles.labels}>
        <AppText variant="title" center color={fg} style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
        {sub ? (
          <AppText variant="caption" center lang={subLang} color={gold ? '#4A3416' : colors.textDim} numberOfLines={1}>
            {sub}
          </AppText>
        ) : null}
      </View>
      {gold && (
        <View style={styles.arrow}>
          <Ionicons name={arrow} size={20} color={colors.gold} />
        </View>
      )}
    </View>
  );

  return (
    <PressableScale onPress={onPress} disabled={disabled} strongHaptic={gold} accessibilityLabel={sub ? `${label}. ${sub}` : label} accessibilityHint={accessibilityHint} style={[styles.wrap, style]}>
      {gold && glow && <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />}
      {gold ? (
        <LinearGradient colors={['#F8E4B0', '#DDB872', '#A97C3A']} locations={[0, 0.5, 1]} style={[styles.body, styles.goldBorder]}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.body, styles.outline]}>{content}</View>
      )}
      <Tip color={gold ? '#F3D99C' : colors.goldDim} />
      <Tip flip color={gold ? '#F3D99C' : colors.goldDim} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 14, justifyContent: 'center' },
  glow: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  body: { minHeight: 66, borderRadius: radius.lg, paddingHorizontal: 18, paddingVertical: 8, justifyContent: 'center' },
  goldBorder: { borderWidth: 1.5, borderColor: '#FFF1CC' },
  outline: { borderWidth: 1.5, borderColor: colors.goldDim, backgroundColor: 'rgba(11,16,32,0.82)' },
  inner: { alignItems: 'center', gap: 12 },
  leadIcon: { width: 32, alignItems: 'center' },
  labels: { flex: 1, alignItems: 'center' },
  label: { fontSize: 21, lineHeight: 30 },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1206',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3D99C',
  },
  tip: { position: 'absolute', top: '50%', marginTop: -20 },
  tipLeft: { left: -14 },
  tipRight: { right: -14 },
});
