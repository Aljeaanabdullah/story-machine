import { StyleSheet, View } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors } from '@/theme';
import { AppText } from './AppText';

/** Scene progress as a row of diamond runes joined by a thread. */
export function ProgressRunes({ current, total, done }: { current: number; total: number; done?: boolean }) {
  const { s, dir } = useSettings();
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${s.scene} ${current} ${s.of} ${total}`}
      accessibilityValue={{ min: 0, max: total, now: current }}
    >
      <View style={[styles.row, { flexDirection: dir.row }]}>
        {Array.from({ length: total }, (_, i) => {
          const reached = i < current;
          const isCurrent = i === current - 1 && !done;
          return (
            <View key={i} style={[styles.item, { flexDirection: dir.row }]}>
              {i > 0 && <View style={[styles.thread, reached && styles.threadOn]} />}
              <View style={[styles.rune, reached && styles.runeOn, isCurrent && styles.runeCurrent]} />
            </View>
          );
        })}
      </View>
      <AppText variant="caption" center color={colors.gold}>
        {s.scene} {current} {s.of} {total}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, alignItems: 'center' },
  row: { alignItems: 'center' },
  item: { alignItems: 'center' },
  thread: { width: 22, height: 1.5, backgroundColor: 'rgba(174,181,203,0.25)' },
  threadOn: { backgroundColor: colors.gold },
  rune: { width: 12, height: 12, transform: [{ rotate: '45deg' }], borderWidth: 1.5, borderColor: 'rgba(174,181,203,0.4)' },
  runeOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  runeCurrent: { backgroundColor: colors.blue, borderColor: '#BFE9FF', shadowColor: colors.blue, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
});
