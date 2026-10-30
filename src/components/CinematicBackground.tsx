import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useSettings } from '@/state/settings';
import { colors } from '@/theme';
import { Particles } from './Particles';

type Props = {
  /** Top glow colour; defaults to royal purple. */
  glow?: string;
  gradient?: [string, string, string];
  particles?: boolean;
};

export function CinematicBackground({ glow = colors.purple, gradient, particles = true }: Props) {
  const { calm } = useSettings();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradient ?? [colors.bg2, colors.bg, '#070A15']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="topGlow" cx="50%" cy="18%" rx="70%" ry="38%">
            <Stop offset="0" stopColor={glow} stopOpacity="0.45" />
            <Stop offset="1" stopColor={glow} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="bottomGlow" cx="50%" cy="100%" rx="80%" ry="30%">
            <Stop offset="0" stopColor={colors.blue} stopOpacity="0.16" />
            <Stop offset="1" stopColor={colors.blue} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#topGlow)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomGlow)" />
      </Svg>
      {particles && <Particles calm={calm} />}
    </View>
  );
}
