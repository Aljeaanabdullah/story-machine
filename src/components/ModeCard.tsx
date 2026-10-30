import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { StoryMode } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export const MODE_STYLE: Record<StoryMode, { icon: keyof typeof Ionicons.glyphMap; gradient: [string, string]; accent: string }> = {
  short: { icon: 'book-outline', gradient: ['#3A2470', '#141B30'], accent: colors.purple },
  adventure: { icon: 'git-branch-outline', gradient: ['#6E4A1C', '#141B30'], accent: colors.gold },
  bedtime: { icon: 'moon-outline', gradient: ['#0F4573', '#141B30'], accent: colors.blue },
};

export function useModeText(mode: StoryMode) {
  const { s } = useSettings();
  return {
    short: { title: s.modeShort, desc: s.modeShortDesc },
    adventure: { title: s.modeAdventure, desc: s.modeAdventureDesc },
    bedtime: { title: s.modeBedtime, desc: s.modeBedtimeDesc },
  }[mode];
}

type Props = { mode: StoryMode; onPress: () => void; compact?: boolean };

export function ModeCard({ mode, onPress, compact }: Props) {
  const { s, dir } = useSettings();
  const { title, desc } = useModeText(mode);
  const st = MODE_STYLE[mode];
  const flagship = mode === 'adventure';

  if (compact) {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={title} accessibilityHint={desc} style={styles.compact}>
        <LinearGradient colors={st.gradient} style={[styles.compactInner, { borderColor: st.accent }]}>
          <Ionicons name={st.icon} size={26} color={st.accent} />
          <AppText variant="caption" center color={colors.text} numberOfLines={2}>
            {title}
          </AppText>
        </LinearGradient>
      </PressableScale>
    );
  }

  return (
    <PressableScale onPress={onPress} accessibilityLabel={title} accessibilityHint={desc} scaleTo={0.98}>
      <LinearGradient
        colors={st.gradient}
        start={{ x: dir.isRTL ? 1 : 0, y: 0 }}
        end={{ x: dir.isRTL ? 0 : 1, y: 1 }}
        style={[styles.card, { borderColor: flagship ? colors.gold : colors.border }, flagship && styles.flagshipGlow]}
      >
        <View style={[styles.row, { flexDirection: dir.row }]}>
          <View style={[styles.iconRing, { borderColor: st.accent, shadowColor: st.accent }]}>
            <Ionicons name={st.icon} size={30} color={st.accent} />
          </View>
          <View style={styles.text}>
            <View style={[styles.titleRow, { flexDirection: dir.row }]}>
              <AppText variant="heading" style={styles.flexShrink}>
                {title}
              </AppText>
              {flagship && (
                <View style={styles.badge}>
                  <AppText variant="caption" color="#2A1A05">
                    {s.flagship}
                  </AppText>
                </View>
              )}
            </View>
            <AppText variant="body" color={colors.textDim}>
              {desc}
            </AppText>
          </View>
          <Ionicons name={dir.isRTL ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.gold} />
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 18, minHeight: 120, justifyContent: 'center' },
  flagshipGlow: { shadowColor: colors.gold, shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  row: { alignItems: 'center', gap: 14 },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,16,32,0.6)',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  text: { flex: 1, gap: 4 },
  titleRow: { alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  flexShrink: { flexShrink: 1 },
  badge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  compact: { flex: 1 },
  compactInner: { borderRadius: radius.md, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 6, minHeight: 92 },
});
