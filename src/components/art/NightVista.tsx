import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme';

const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = Math.sin(i * 12.9898) * 43758.5453;
  const f = r - Math.floor(r);
  const g = Math.sin(i * 78.233) * 12345.678;
  return { x: f * 400, y: (g - Math.floor(g)) * 330, s: 0.5 + ((i * 7) % 5) * 0.25 };
});

/**
 * Layered moonlit fantasy landscape (sky, moon halo, three mountain ranges,
 * a lit castle and mist). Original vector art used behind the home hero
 * until a painted `home-hero` illustration is supplied.
 */
function NightVistaBase() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#060914" />
          <Stop offset="0.45" stopColor="#1A1F45" />
          <Stop offset="0.75" stopColor="#3A2A5C" />
          <Stop offset="1" stopColor="#0B1020" />
        </LinearGradient>
        <RadialGradient id="moonHalo" cx="88%" cy="42%" r="34%">
          <Stop offset="0" stopColor="#CFE3FF" stopOpacity="0.55" />
          <Stop offset="0.25" stopColor="#7FA7FF" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#7FA7FF" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="fireGlow" cx="50%" cy="72%" r="45%">
          <Stop offset="0" stopColor={colors.fire} stopOpacity="0.45" />
          <Stop offset="1" stopColor={colors.fire} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8FA3D9" stopOpacity="0" />
          <Stop offset="1" stopColor="#8FA3D9" stopOpacity="0.22" />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="600" fill="url(#sky)" />
      <Rect width="400" height="600" fill="url(#moonHalo)" />
      {STARS.map((st, i) => (
        <Circle key={i} cx={st.x} cy={st.y} r={st.s} fill="#FFFFFF" opacity={0.35 + (i % 4) * 0.15} />
      ))}
      <Circle cx="352" cy="252" r="22" fill="#E9F0FF" />
      <Circle cx="345" cy="246" r="4.5" fill="#C9D6F2" opacity={0.6} />
      <Circle cx="358" cy="260" r="3" fill="#C9D6F2" opacity={0.5} />
      {/* far range */}
      <Path d="M0 360 L40 300 L80 330 L130 270 L170 320 L220 260 L270 315 L320 275 L360 310 L400 285 V600 H0 Z" fill="#232A55" opacity={0.85} />
      <Rect y="250" width="400" height="140" fill="url(#mist)" />
      {/* castle on the ridge */}
      <G fill="#141A38">
        <Path d="M250 330 V250 L258 236 L266 250 V330 Z" />
        <Path d="M272 330 V215 L284 190 L296 215 V330 Z" />
        <Path d="M300 330 V240 L309 224 L318 240 V330 Z" />
        <Rect x="244" y="285" width="82" height="50" />
      </G>
      {[[282, 240], [306, 262], [256, 292], [288, 300]].map(([x, y]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width="3" height="5" fill="#FFC56B" />
      ))}
      {/* mid range */}
      <Path d="M0 420 L60 360 L110 395 L170 345 L230 400 L290 360 L350 405 L400 380 V600 H0 Z" fill="#161C3D" />
      <Rect width="400" height="600" fill="url(#fireGlow)" />
      {/* foreground cliffs */}
      <Path d="M0 470 Q80 430 150 465 T300 455 T400 470 V600 H0 Z" fill="#0B1020" />
      <Path d="M0 520 Q100 490 200 515 T400 505 V600 H0 Z" fill="#070A15" />
    </Svg>
  );
}

export const NightVista = memo(NightVistaBase);
