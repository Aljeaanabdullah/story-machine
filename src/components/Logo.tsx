import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ltrRow } from '@/i18n/direction';
import { strings } from '@/i18n/strings';
import { useSettings } from '@/state/settings';
import { colors, fonts } from '@/theme';
import { AppText } from './AppText';

function Crest({ width }: { width: number }) {
  return (
    <Svg width={width} height={18} viewBox="0 0 120 18">
      <Path d="M60 1 L65 9 L60 17 L55 9 Z" fill={colors.gold} />
      <Path d="M48 9 Q54 3 58 9 M72 9 Q66 3 62 9" stroke={colors.gold} strokeWidth={1} fill="none" />
      <Path d="M8 9 H46 M74 9 H112" stroke={colors.goldDim} strokeWidth={0.8} />
    </Svg>
  );
}

/** Wordmark: crest, "STORYVERSE" in Cinzel, flanked "AI", and the tagline in both languages. */
export function Logo({ size = 40, tagline = true }: { size?: number; tagline?: boolean }) {
  const { s, settings } = useSettings();
  const other = settings.uiLanguage === 'ar' ? 'en' : 'ar';
  return (
    <View style={styles.wrap} accessible accessibilityRole="header" accessibilityLabel={`${s.appName}. ${s.tagline}`}>
      <Crest width={size * 3.2} />
      <AppText lang="en" variant="display" center color="#F1D69A" style={[styles.word, { fontSize: size, lineHeight: size * 1.18 }]}>
        STORYVERSE
      </AppText>
      <View style={[styles.aiRow, { flexDirection: ltrRow() }]}>
        <View style={styles.aiLine} />
        <AppText lang="en" variant="label" color={colors.gold} style={{ fontFamily: fonts.display, fontSize: size * 0.42 }}>
          AI
        </AppText>
        <View style={styles.aiLine} />
      </View>
      {tagline && (
        <View style={styles.taglines}>
          <AppText variant={settings.uiLanguage === 'ar' ? 'heading' : 'body'} center color={colors.text} style={[styles.shadow, settings.uiLanguage === 'en' && styles.enTagline]}>
            {s.tagline}
          </AppText>
          <AppText variant="caption" center lang={other} color={colors.textDim} style={[styles.shadow, other === 'en' && styles.italic]}>
            {strings[other].tagline}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2 },
  word: {
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 2 },
  },
  aiRow: { alignItems: 'center', gap: 10, marginTop: -4 },
  aiLine: { width: 46, height: 1, backgroundColor: colors.gold },
  taglines: { alignItems: 'center', marginTop: 6, gap: 2 },
  shadow: { textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
  italic: { fontStyle: 'italic' },
  enTagline: { fontStyle: 'italic', fontSize: 17 },
});
