import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { WorldArt } from '@/components/art/WorldArt';
import { Field } from '@/components/Field';
import { GoldButton } from '@/components/GoldButton';
import { OrnateCard } from '@/components/OrnateCard';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { findWorld, WORLDS } from '@/data/catalog';
import { useDraft } from '@/state/draft';
import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';

export default function WorldScreen() {
  const { s, settings, dir, calm } = useSettings();
  const { draft, patch } = useDraft();
  const lang = settings.uiLanguage;
  const w = draft.world;
  const selected = w.kind === 'preset' ? findWorld(w.id) : undefined;
  const custom = w.kind === 'custom';
  const valid = !custom || w.description.trim().length > 0;

  return (
    <Screen
      title={s.worldTitle}
      back
      glow={selected?.accent ?? colors.purple}
      footer={<GoldButton label={s.continue} icon={dir.isRTL ? 'arrow-back' : 'arrow-forward'} disabled={!valid} onPress={() => router.push('/setup')} />}
    >
      {WORLDS.map((world, i) => {
        const on = selected?.id === world.id;
        return (
          <Animated.View key={world.id} entering={calm ? undefined : FadeInDown.delay(i * 60).duration(400)}>
            <PressableScale
              onPress={() => patch({ world: { kind: 'preset', id: world.id } })}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${world.name[lang]}. ${world.description[lang]}`}
              scaleTo={0.98}
            >
              <OrnateCard active={on} accent={world.accent} corners={on} style={styles.card}>
                <WorldArt id={world.id} gradient={world.gradient} accent={world.accent} style={styles.art} />
                <View style={styles.body}>
                  <View style={[styles.titleRow, { flexDirection: dir.row }]}>
                    <AppText variant="heading" style={styles.flex} color={on ? world.accent : colors.text}>
                      {world.name[lang]}
                    </AppText>
                    {on && <Ionicons name="checkmark-circle" size={22} color={world.accent} />}
                  </View>
                  <AppText variant="caption" color={colors.gold}>
                    {world.mood[lang]}
                  </AppText>
                  <AppText variant="body" color={colors.textDim}>
                    {world.description[lang]}
                  </AppText>
                </View>
              </OrnateCard>
            </PressableScale>
          </Animated.View>
        );
      })}

      <PressableScale
        onPress={() => !custom && patch({ world: { kind: 'custom', description: '' } })}
        accessibilityRole="radio"
        accessibilityState={{ checked: custom }}
        accessibilityLabel={s.customWorld}
        scaleTo={0.98}
      >
        <OrnateCard active={custom} accent={colors.purple} style={styles.customCard}>
          <View style={[styles.titleRow, { flexDirection: dir.row }]}>
            <Ionicons name="create-outline" size={22} color={custom ? colors.purple : colors.gold} />
            <AppText variant="heading" style={styles.flex}>
              {s.customWorld}
            </AppText>
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
  card: { padding: 0, overflow: 'hidden' },
  art: { height: 96, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  body: { padding: 14, gap: 4 },
  titleRow: { alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  customCard: { gap: 12 },
});
