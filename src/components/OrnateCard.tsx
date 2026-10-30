import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, radius } from '@/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Highlighted (selected) state: brighter border and outer glow. */
  active?: boolean;
  accent?: string;
  corners?: boolean;
};

function Corner({ color, style }: { color: string; style: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[styles.corner, style]}>
      <Svg width={22} height={22} viewBox="0 0 22 22">
        <Path d="M1 21 V8 Q1 1 8 1 H21" stroke={color} strokeWidth={1.6} fill="none" />
        <Path d="M5 21 V10 Q5 5 10 5 H21" stroke={color} strokeWidth={0.8} strokeOpacity={0.6} fill="none" />
        <Path d="M8 8 l2 -2 l2 2 l-2 2 z" fill={color} />
      </Svg>
    </View>
  );
}

/** Glass panel with an antique-gold frame and filigree corners. */
export function OrnateCard({ children, style, active, accent = colors.gold, corners = true }: Props) {
  const border = active ? accent : colors.border;
  return (
    <View
      style={[
        styles.card,
        { borderColor: border },
        active && { shadowColor: accent, shadowOpacity: 0.7, shadowRadius: 14, elevation: 8, backgroundColor: 'rgba(28,37,66,0.92)' },
        style,
      ]}
    >
      {children}
      {corners && (
        <>
          <Corner color={border} style={{ top: 3, left: 3 }} />
          <Corner color={border} style={{ top: 3, right: 3, transform: [{ scaleX: -1 }] }} />
          <Corner color={border} style={{ bottom: 3, left: 3, transform: [{ scaleY: -1 }] }} />
          <Corner color={border} style={{ bottom: 3, right: 3, transform: [{ scaleX: -1 }, { scaleY: -1 }] }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  corner: { position: 'absolute' },
});
