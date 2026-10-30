import { StyleSheet, View } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Props = { steps: string[]; current: number; onStep?: (i: number) => void };

/** Numbered gold step indicator. Completed steps can be tapped to go back. */
export function Stepper({ steps, current, onStep }: Props) {
  const { dir } = useSettings();
  return (
    <View style={[styles.row, { flexDirection: dir.row }]} accessibilityRole="tablist">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={label} style={styles.item}>
            {i > 0 && <View style={[styles.line, dir.isRTL ? styles.lineRtl : styles.lineLtr, (done || active) && styles.lineOn]} />}
            <PressableScale
              disabled={!done || !onStep}
              onPress={() => onStep?.(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${i + 1}. ${label}`}
              style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}
            >
              <AppText variant="label" lang="en" center color={active ? colors.gold : done ? '#24170A' : colors.textDim}>
                {i + 1}
              </AppText>
            </PressableScale>
            <AppText variant="caption" center color={active ? colors.gold : colors.textDim} numberOfLines={1}>
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 4 },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  // Spans from the previous dot's edge to this dot's edge (16 = dot radius) so it never crosses a number.
  line: { position: 'absolute', top: 16, height: 1.5, backgroundColor: 'rgba(174,181,203,0.25)' },
  lineLtr: { left: '-50%', right: '50%', marginLeft: 18, marginRight: 18 },
  lineRtl: { left: '50%', right: '-50%', marginLeft: 18, marginRight: 18 },
  lineOn: { backgroundColor: colors.gold },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(174,181,203,0.45)',
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  dotActive: {
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
