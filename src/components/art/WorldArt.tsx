import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import type { WorldId } from '@/data/catalog';
import { colors } from '@/theme';

/** A small landscape motif per world, drawn on a 200×100 canvas. */
function Motif({ id, accent }: { id: WorldId | 'custom'; accent: string }) {
  const dark = '#070A15';
  switch (id) {
    case 'lost-island':
      return (
        <G>
          <Circle cx="150" cy="30" r="12" fill={accent} opacity={0.55} />
          <Path d="M40 80 L70 40 L82 52 L100 30 L130 80 Z" fill={dark} opacity={0.9} />
          <Path d="M97 34 Q100 22 104 30" stroke={colors.fire} strokeWidth={2} fill="none" opacity={0.8} />
          <Path d="M0 82 Q50 74 100 82 T200 82 V100 H0 Z" fill={accent} opacity={0.25} />
        </G>
      );
    case 'enchanted-forest':
      return (
        <G>
          {[20, 55, 95, 140, 175].map((x, i) => (
            <Path key={x} d={`M${x} 90 L${x - 16} 90 L${x} ${35 + (i % 2) * 12} L${x + 16} 90 Z`} fill={dark} opacity={0.9} />
          ))}
          {[38, 78, 120, 160].map((x) => (
            <Circle key={x} cx={x} cy={84} r={2.5} fill={accent} />
          ))}
        </G>
      );
    case 'ancient-kingdom':
      return (
        <G>
          <Path d="M40 90 V55 L50 40 L60 55 V90 M85 90 V35 L100 15 L115 35 V90 M140 90 V55 L150 40 L160 55 V90" fill={dark} />
          <Rect x="40" y="62" width="120" height="28" fill={dark} />
          <Circle cx="100" cy="12" r="3" fill={accent} />
        </G>
      );
    case 'cyberpunk-city':
      return (
        <G>
          {[[10, 40], [35, 25], [62, 50], [85, 15], [115, 35], [140, 20], [168, 45]].map(([x, y]) => (
            <Rect key={x} x={x} y={y} width="22" height={100 - y} fill={dark} />
          ))}
          {[[18, 50], [42, 34], [92, 26], [148, 30], [122, 46]].map(([x, y]) => (
            <Rect key={`${x}-${y}`} x={x} y={y} width="6" height="2" fill={accent} />
          ))}
        </G>
      );
    case 'desert-secrets':
      return (
        <G>
          <Circle cx="150" cy="34" r="14" fill={colors.fire} opacity={0.55} />
          <Path d="M80 80 L100 48 L120 80 Z" fill={dark} opacity={0.85} />
          <Path d="M0 80 Q60 62 120 80 T200 76 V100 H0 Z" fill={dark} />
        </G>
      );
    case 'space-frontier':
      return (
        <G>
          <Circle cx="140" cy="55" r="26" fill={dark} stroke={accent} strokeWidth={1.2} />
          <Path d="M100 62 Q140 40 182 50" stroke={accent} strokeWidth={1.5} fill="none" opacity={0.7} />
          {[[20, 20], [50, 70], [80, 30], [30, 50], [110, 15], [180, 85]].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} fill="#fff" />
          ))}
        </G>
      );
    case 'haunted-mansion':
      return (
        <G>
          <Circle cx="160" cy="24" r="11" fill="#E8E2FF" opacity={0.6} />
          <Path d="M60 90 V50 L80 30 L100 50 L120 30 L140 50 V90 Z" fill={dark} />
          <Rect x="78" y="58" width="8" height="10" fill={accent} opacity={0.8} />
          <Rect x="114" y="58" width="8" height="10" fill={accent} opacity={0.4} />
        </G>
      );
    case 'underwater-kingdom':
      return (
        <G>
          <Path d="M70 90 V60 Q70 45 85 45 V35 Q100 20 115 35 V45 Q130 45 130 60 V90 Z" fill={dark} />
          {[[30, 40, 3], [44, 60, 2], [170, 30, 2.5], [160, 55, 1.6]].map(([x, y, r]) => (
            <Circle key={`${x}`} cx={x} cy={y} r={r} stroke={accent} strokeWidth={1} fill="none" />
          ))}
        </G>
      );
    default:
      return (
        <G>
          <Circle cx="100" cy="50" r="22" stroke={accent} strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
          <Path d="M100 34 L104 46 L116 50 L104 54 L100 66 L96 54 L84 50 L96 46 Z" fill={accent} />
        </G>
      );
  }
}

type Props = {
  id: WorldId | 'custom';
  gradient: [string, string, string];
  accent: string;
  style?: StyleProp<ViewStyle>;
};

function WorldArtBase({ id, gradient, accent, style }: Props) {
  return (
    <View style={[styles.wrap, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* Dark sky fading to a lit horizon so the dark silhouettes read clearly. */}
      <LinearGradient colors={[gradient[2], gradient[0], gradient[1]]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', `${accent}55`]} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
        <Motif id={id} accent={accent} />
      </Svg>
    </View>
  );
}

export const WorldArt = memo(WorldArtBase);

const styles = StyleSheet.create({ wrap: { overflow: 'hidden' } });
