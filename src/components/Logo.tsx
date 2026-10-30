import { StyleSheet, View } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors, fonts } from '@/theme';
import { AppText } from './AppText';

/** Wordmark: "STORYVERSE" in Cinzel with a glowing "AI" seal and gold rule. */
export function Logo({ size = 34, tagline = true }: { size?: number; tagline?: boolean }) {
  const { s } = useSettings();
  return (
    <View style={styles.wrap} accessible accessibilityRole="header" accessibilityLabel={`${s.appName}. ${s.tagline}`}>
      <View style={styles.row}>
        <AppText lang="en" variant="display" style={[styles.word, { fontSize: size, lineHeight: size * 1.25 }]} color={colors.gold}>
          STORYVERSE
        </AppText>
        <View style={styles.seal}>
          <AppText lang="en" variant="label" color={colors.text} style={{ fontFamily: fonts.display, fontSize: size * 0.36 }}>
            AI
          </AppText>
        </View>
      </View>
      <View style={styles.rule}>
        <View style={styles.line} />
        <View style={styles.diamond} />
        <View style={styles.line} />
      </View>
      {tagline && (
        <AppText variant="body" center color={colors.textDim} style={styles.tagline}>
          {s.tagline}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  // The wordmark is Latin in both languages, so it never flips.
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'ltr' },
  word: {
    textShadowColor: 'rgba(214,180,119,0.7)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  seal: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.purple,
    borderWidth: 1,
    borderColor: colors.gold,
    shadowColor: colors.purple,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 220 },
  line: { flex: 1, height: 1, backgroundColor: colors.goldDim },
  diamond: { width: 8, height: 8, backgroundColor: colors.gold, transform: [{ rotate: '45deg' }] },
  tagline: { fontStyle: 'italic' },
});
