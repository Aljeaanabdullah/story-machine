import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Polygon } from 'react-native-svg';

import { colors } from '@/theme';

type Props = { size: number; calm?: boolean; color?: string; inner?: string };

function polar(r: number, deg: number, c: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
}

function starPoints(r: number, points: number, c: number) {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const p = polar(i % 2 === 0 ? r : r * 0.42, (i * 180) / points, c);
    out.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return out.join(' ');
}

/** Three counter-rotating rune rings, drawn procedurally (original artwork). */
function MagicCircleBase({ size, calm, color = colors.gold, inner = colors.blue }: Props) {
  const spin = useSharedValue(0);
  useEffect(() => {
    if (calm) return;
    spin.set(withRepeat(withTiming(1, { duration: 60000, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(spin);
  }, [calm, spin]);

  const outer = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const middle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-spin.value * 720}deg` }] }));

  const c = 100;
  const ticks = Array.from({ length: 48 }, (_, i) => i * 7.5);
  const glyphs = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, outer]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Circle cx={c} cy={c} r={96} stroke={color} strokeWidth={1.2} fill="none" opacity={0.85} />
          <Circle cx={c} cy={c} r={88} stroke={color} strokeWidth={0.6} fill="none" opacity={0.6} />
          {ticks.map((d) => {
            const a = polar(88, d, c);
            const b = polar(d % 30 === 0 ? 80 : 84, d, c);
            return <Line key={d} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={0.8} opacity={0.7} />;
          })}
          {glyphs.map((d) => {
            const p = polar(92, d + 15, c);
            return <Path key={d} d={`M${p.x - 2.5} ${p.y} l2.5 -3 l2.5 3 l-2.5 3 z`} fill={color} opacity={0.9} />;
          })}
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, middle]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Circle cx={c} cy={c} r={70} stroke={inner} strokeWidth={1} fill="none" opacity={0.8} />
          <Polygon points={starPoints(70, 8, c)} stroke={inner} strokeWidth={0.8} fill="none" opacity={0.65} />
          <G opacity={0.55}>
            <Polygon points={`${polar(70, 0, c).x},${polar(70, 0, c).y} ${polar(70, 120, c).x},${polar(70, 120, c).y} ${polar(70, 240, c).x},${polar(70, 240, c).y}`} stroke={inner} strokeWidth={0.7} fill="none" />
            <Polygon points={`${polar(70, 60, c).x},${polar(70, 60, c).y} ${polar(70, 180, c).x},${polar(70, 180, c).y} ${polar(70, 300, c).x},${polar(70, 300, c).y}`} stroke={inner} strokeWidth={0.7} fill="none" />
          </G>
          <Circle cx={c} cy={c} r={38} stroke={color} strokeWidth={0.8} fill="none" opacity={0.7} strokeDasharray="3 4" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export const MagicCircle = memo(MagicCircleBase);
