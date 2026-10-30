import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme';

/** Ornamental gold rule: tapered lines, scrollwork and a central diamond. */
export function GoldDivider({ width = 220, color = colors.gold }: { width?: number; color?: string }) {
  const h = 14;
  const c = width / 2;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
        <Defs>
          <LinearGradient id="gdL" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="gdR" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={h / 2 - 0.5} width={c - 16} height={1} fill="url(#gdL)" />
        <Rect x={c + 16} y={h / 2 - 0.5} width={c - 16} height={1} fill="url(#gdR)" />
        <Path d={`M${c - 16} ${h / 2} q5 -5 9 0 M${c + 16} ${h / 2} q-5 -5 -9 0`} stroke={color} strokeWidth={1} fill="none" />
        <Path d={`M${c} 1 L${c + 5} ${h / 2} L${c} ${h - 1} L${c - 5} ${h / 2} Z`} fill={color} />
        <Circle cx={c - 9} cy={h / 2} r={1.3} fill={color} />
        <Circle cx={c + 9} cy={h / 2} r={1.3} fill={color} />
      </Svg>
    </View>
  );
}
