import { memo } from 'react';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { ArchetypeId } from '@/data/catalog';
import { colors } from '@/theme';

function Glyph({ id, c }: { id: ArchetypeId; c: string }) {
  switch (id) {
    case 'warrior': // crossed sword over shield
      return (
        <G>
          <Path d="M50 30 L70 36 L70 54 C70 66 60 74 50 78 C40 74 30 66 30 54 L30 36 Z" stroke={c} strokeWidth={2.5} fill="none" />
          <Line x1="34" y1="70" x2="66" y2="26" stroke={c} strokeWidth={3} strokeLinecap="round" />
          <Line x1="38" y1="60" x2="46" y2="66" stroke={c} strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'mage': // staff with star
      return (
        <G>
          <Line x1="42" y1="78" x2="56" y2="38" stroke={c} strokeWidth={3} strokeLinecap="round" />
          <Path d="M58 22 L61 31 L70 32 L63 38 L66 47 L58 42 L50 47 L53 38 L46 32 L55 31 Z" fill={c} />
          <Circle cx="38" cy="40" r="2" fill={c} />
          <Circle cx="72" cy="58" r="2.5" fill={c} />
        </G>
      );
    case 'explorer': // compass rose
      return (
        <G>
          <Circle cx="50" cy="50" r="22" stroke={c} strokeWidth={2.5} fill="none" />
          <Path d="M50 26 L56 50 L50 74 L44 50 Z" fill={c} />
          <Path d="M26 50 L50 45 L74 50 L50 55 Z" fill={c} opacity={0.55} />
        </G>
      );
    case 'detective': // magnifying glass
      return (
        <G>
          <Circle cx="45" cy="45" r="16" stroke={c} strokeWidth={3} fill="none" />
          <Line x1="57" y1="57" x2="72" y2="72" stroke={c} strokeWidth={5} strokeLinecap="round" />
          <Path d="M37 40 Q40 34 46 33" stroke={c} strokeWidth={2} fill="none" />
        </G>
      );
    case 'sailor': // anchor
      return (
        <G>
          <Circle cx="50" cy="28" r="5" stroke={c} strokeWidth={2.5} fill="none" />
          <Line x1="50" y1="33" x2="50" y2="76" stroke={c} strokeWidth={3} />
          <Line x1="38" y1="42" x2="62" y2="42" stroke={c} strokeWidth={3} strokeLinecap="round" />
          <Path d="M28 58 C30 70 40 76 50 76 C60 76 70 70 72 58" stroke={c} strokeWidth={3} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'inventor': // gear
      return (
        <G>
          {Array.from({ length: 8 }, (_, i) => (
            <Rect key={i} x="46" y="24" width="8" height="10" rx="1.5" fill={c} transform={`rotate(${i * 45} 50 50)`} />
          ))}
          <Circle cx="50" cy="50" r="17" stroke={c} strokeWidth={4} fill="none" />
          <Circle cx="50" cy="50" r="6" fill={c} />
        </G>
      );
  }
}

/** Gold medallion with an archetype glyph. Original vector art. */
function ArchetypeEmblemBase({ id, size, color }: { id: ArchetypeId; size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={`em-${id}`} cx="50%" cy="40%" r="60%">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={colors.bg} stopOpacity="0.95" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="46" fill={`url(#em-${id})`} stroke={colors.gold} strokeWidth={2} />
      <Circle cx="50" cy="50" r="41" stroke={colors.gold} strokeWidth={0.7} strokeDasharray="2 3" fill="none" opacity={0.7} />
      <Glyph id={id} c={color} />
    </Svg>
  );
}

export const ArchetypeEmblem = memo(ArchetypeEmblemBase);
