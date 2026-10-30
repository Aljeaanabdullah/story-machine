import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Field } from '@/components/Field';
import { HeroButton } from '@/components/HeroButton';
import { OrnateCard } from '@/components/OrnateCard';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { WorldCard } from '@/components/WorldCard';
import { findWorld, WORLDS } from '@/data/catalog';
import { useDraft } from '@/state/draft';
import { useSettings } from '@/state/settings';
import { colors } from '@/theme';

const GUTTER = 18; // matches Screen content padding
const GAP = 12;

export default function WorldScreen() {
  const { s, settings, dir, calm } = useSettings();
  const { draft, patch } = useDraft();
  const { width } = useWindowDimensions();
  const w = draft.world;
  const selected = w.kind === 'preset' ? findWorld(w.id) : undefined;
  const custom = w.kind === 'custom';
  const valid = !custom || w.description.trim().length > 0;
  const cardWidth = Math.floor((Math.min(width, 560) - GUTTER * 2 - GAP) / 2) - 1;

  return (
    <Screen
      title={s.worldTitle}
      subtitle={s.worldSubtitle}
      back
      glow={selected?.accent ?? colors.purple}
      footer={<HeroButton label={s.continue} sub={selected ? selected.name[settings.uiLanguage] : undefined} disabled={!valid} onPress={() => router.push('/setup')} />}
    >
      <View style={[styles.grid, { flexDirection: dir.row }]}>
        {WORLDS.map((world, i) => (
          <Animated.View key={world.id} entering={calm ? undefined : FadeInDown.delay(i * 60).duration(400)}>
            <WorldCard world={world} width={cardWidth} selected={selected?.id === world.id} onPress={() => patch({ world: { kind: 'preset', id: world.id } })} />
          </Animated.View>
        ))}
      </View>

      <PressableScale
        onPress={() => !custom && patch({ world: { kind: 'custom', description: '' } })}
        accessibilityRole="radio"
        accessibilityState={{ checked: custom }}
        accessibilityLabel={s.customWorld}
        scaleTo={0.98}
      >
        <OrnateCard active={custom} accent={colors.gold} style={styles.customCard}>
          <View style={[styles.customRow, { flexDirection: dir.row }]}>
            <View style={styles.medal}>
              <MaterialCommunityIcons name="feather" size={22} color={colors.gold} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" color={custom ? colors.gold : colors.text}>
                {s.customWorld}
              </AppText>
              <AppText variant="caption">{s.customWorldPlaceholder}</AppText>
            </View>
          </View>
          {custom && (
            <Field
              label={s.world}
              value={w.description}
              onChangeText={(description) => patch({ world: { kind: 'custom', description } })}
              placeholder={s.customWorldPlaceholder}
              maxLength={240}
              multiline
              autoFocus
            />
          )}
        </OrnateCard>
      </PressableScale>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexWrap: 'wrap', gap: GAP, justifyContent: 'center' },
  customCard: { gap: 12 },
  customRow: { alignItems: 'center', gap: 12 },
  medal: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
