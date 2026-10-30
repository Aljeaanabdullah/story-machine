import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { World } from '@/data/catalog';
import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { ArtFrame } from './art/ArtFrame';
import { WorldArt } from './art/WorldArt';
import { PressableScale } from './PressableScale';

type Props = { world: World; width: number; selected: boolean; onPress: () => void };

/** Illustrated world tile: scene art on top, medallion icon + name + hook below. */
export function WorldCard({ world, width, selected, onPress }: Props) {
  const { settings, dir } = useSettings();
  const lang = settings.uiLanguage;
  const artHeight = Math.round(width * 0.8);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${world.name[lang]}. ${world.tagline[lang]}`}
      scaleTo={0.97}
      style={[styles.card, { width }, selected && { borderColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.8 }]}
    >
      <ArtFrame
        slot={`world-${world.id}`}
        style={[styles.art, { height: artHeight }]}
        fadeBottom
        fadeTo="#0E1428"
        fallback={<WorldArt id={world.id} gradient={world.gradient} accent={world.accent} style={StyleSheet.absoluteFill} />}
      />
      {selected && (
        <View style={[styles.check, dir.isRTL ? { left: 8 } : { right: 8 }]}>
          <Ionicons name="checkmark" size={16} color="#24170A" />
        </View>
      )}
      <LinearGradient colors={['#0E1428', '#0A0F1F']} style={[styles.info, { flexDirection: dir.row }]}>
        <View style={[styles.medal, { borderColor: world.accent }]}>
          <MaterialCommunityIcons name={world.icon} size={16} color={world.accent} />
        </View>
        <View style={styles.text}>
          <AppText variant="heading" numberOfLines={2} color={selected ? colors.gold : colors.text} style={styles.name}>
            {world.name[lang]}
          </AppText>
          <AppText variant="caption" numberOfLines={2} style={styles.tag}>
            {world.tagline[lang]}
          </AppText>
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // Grows to the tallest card in its row so two-line names keep the grid even.
  card: {
    flexGrow: 1,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: 'rgba(214,180,119,0.45)',
    backgroundColor: '#0A0F1F',
    overflow: 'hidden',
    shadowRadius: 14,
    shadowOpacity: 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  art: { width: '100%' },
  check: {
    position: 'absolute',
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF1CC',
  },
  info: { flexGrow: 1, alignItems: 'center', gap: 7, paddingHorizontal: 8, paddingVertical: 9, minHeight: 62 },
  medal: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,16,32,0.8)' },
  text: { flex: 1 },
  name: { fontSize: 13.5, lineHeight: 19 },
  tag: { fontSize: 11, lineHeight: 15 },
});
