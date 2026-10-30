import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { ArtSlot } from '@/assets/slots';
import type { StoryMode } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { ArtFrame } from './art/ArtFrame';
import { PressableScale } from './PressableScale';

export const MODE_STYLE: Record<StoryMode, { icon: keyof typeof Ionicons.glyphMap; gradient: [string, string]; accent: string; art: ArtSlot }> = {
  short: { icon: 'book-outline', gradient: ['#3A2470', '#141B30'], accent: colors.purple, art: 'world-enchanted-forest' },
  adventure: { icon: 'git-branch-outline', gradient: ['#6E4A1C', '#141B30'], accent: colors.gold, art: 'world-ancient-kingdom' },
  bedtime: { icon: 'moon-outline', gradient: ['#0F4573', '#141B30'], accent: colors.blue, art: 'world-underwater-kingdom' },
};

export function useModeText(mode: StoryMode) {
  const { s } = useSettings();
  return {
    short: { title: s.modeShort, desc: s.modeShortDesc },
    adventure: { title: s.modeAdventure, desc: s.modeAdventureDesc },
    bedtime: { title: s.modeBedtime, desc: s.modeBedtimeDesc },
  }[mode];
}

type Props = { mode: StoryMode; onPress: () => void };

/** Illustrated story-mode card: painted banner with the title, icon medallion and hook overlaid. */
export function ModeCard({ mode, onPress }: Props) {
  const { s, dir } = useSettings();
  const { title, desc } = useModeText(mode);
  const st = MODE_STYLE[mode];
  const flagship = mode === 'adventure';

  return (
    <PressableScale onPress={onPress} accessibilityLabel={title} accessibilityHint={desc} scaleTo={0.98} style={[styles.card, flagship && styles.flagship]}>
      <ArtFrame
        slot={st.art}
        style={StyleSheet.absoluteFill}
        fadeBottom
        fadeBottomSize="70%"
        fadeTo="#0A0F1F"
        fallback={<LinearGradient colors={st.gradient} style={StyleSheet.absoluteFill} />}
      />
      {flagship && (
        <View style={[styles.badge, dir.isRTL ? { left: 12 } : { right: 12 }]}>
          <AppText variant="caption" color="#24170A">
            {s.flagship}
          </AppText>
        </View>
      )}
      <View style={[styles.row, { flexDirection: dir.row }]}>
        <View style={[styles.medal, { borderColor: st.accent }]}>
          <Ionicons name={st.icon} size={24} color={st.accent} />
        </View>
        <View style={styles.text}>
          <AppText variant="heading" color={flagship ? colors.gold : colors.text} style={styles.shadow}>
            {title}
          </AppText>
          <AppText variant="caption" color={colors.text} style={styles.shadow}>
            {desc}
          </AppText>
        </View>
        <View style={styles.chevron}>
          <Ionicons name={dir.isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.gold} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 176,
    borderRadius: radius.lg,
    borderWidth: 1.2,
    borderColor: 'rgba(214,180,119,0.45)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#0A0F1F',
  },
  flagship: { borderColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  badge: { position: 'absolute', top: 12, backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 },
  row: { alignItems: 'center', gap: 12, padding: 14 },
  medal: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,16,32,0.85)' },
  text: { flex: 1, gap: 2 },
  shadow: { textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
  chevron: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
});
