import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { ArchetypeEmblem } from '@/components/art/ArchetypeEmblem';
import { MagicCircle } from '@/components/art/MagicCircle';
import { ChipGroup } from '@/components/Chip';
import { Field, SectionLabel } from '@/components/Field';
import { GoldButton } from '@/components/GoldButton';
import { OrnateCard } from '@/components/OrnateCard';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { ARCHETYPES, PERSONALITIES } from '@/data/catalog';
import type { Character } from '@/lib/story/types';
import { useDraft } from '@/state/draft';
import { useSettings } from '@/state/settings';
import { colors } from '@/theme';

export default function CharacterScreen() {
  const { s, settings, dir, calm } = useSettings();
  const { draft, patch } = useDraft();
  const { width } = useWindowDimensions();
  const lang = settings.uiLanguage;
  const c = draft.character;
  const arch = ARCHETYPES.find((a) => a.id === c.archetype) ?? ARCHETYPES[0];
  const set = (p: Partial<Character>) => patch({ character: { ...c, ...p } });

  const portrait = Math.min(width * 0.62, 260);
  const cardWidth = (Math.min(width, 520) - 36 - 20) / 3;
  const valid = c.name.trim().length > 0;

  return (
    <Screen
      title={s.characterTitle}
      back
      glow={arch.color}
      footer={
        <>
          {!valid && (
            <AppText variant="caption" center>
              {s.nameRequired}
            </AppText>
          )}
          <GoldButton label={s.continue} icon={dir.isRTL ? 'arrow-back' : 'arrow-forward'} disabled={!valid} onPress={() => router.push('/world')} />
        </>
      }
    >
      <View style={styles.portraitWrap}>
        <View style={[styles.portrait, { width: portrait, height: portrait }]}>
          <View style={StyleSheet.absoluteFill}>
            <MagicCircle size={portrait} calm={calm} inner={arch.color} />
          </View>
          <Animated.View key={arch.id} entering={calm ? undefined : ZoomIn.duration(450)}>
            <ArchetypeEmblem id={arch.id} size={portrait * 0.56} color={arch.color} />
          </Animated.View>
        </View>
        <Animated.View key={`${arch.id}-name`} entering={calm ? undefined : FadeIn.duration(400)} style={styles.nameplate}>
          <AppText variant="title" center color={colors.gold} numberOfLines={1}>
            {c.name.trim() || arch.name[lang]}
          </AppText>
          <AppText variant="label" center color={arch.color}>
            {arch.name[lang]} · {PERSONALITIES.find((p) => p.id === c.personality)?.name[lang]}
          </AppText>
        </Animated.View>
        <AppText variant="caption" center>
          {s.portraitNote}
        </AppText>
      </View>

      <Field label={s.name} value={c.name} onChangeText={(name) => set({ name })} placeholder={s.namePlaceholder} maxLength={40} autoCapitalize="words" returnKeyType="done" />

      <View style={styles.section}>
        <SectionLabel>{s.archetype}</SectionLabel>
        <View style={[styles.grid, { flexDirection: dir.row }]} accessibilityRole="radiogroup">
          {ARCHETYPES.map((a) => {
            const on = a.id === c.archetype;
            return (
              <PressableScale
                key={a.id}
                onPress={() => set({ archetype: a.id })}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${a.name[lang]}. ${a.blurb[lang]}`}
                style={{ width: cardWidth }}
              >
                <OrnateCard active={on} accent={a.color} corners={false} style={styles.archCard}>
                  <ArchetypeEmblem id={a.id} size={52} color={a.color} />
                  <AppText variant="label" center color={on ? a.color : colors.text} numberOfLines={1}>
                    {a.name[lang]}
                  </AppText>
                  <AppText variant="caption" center numberOfLines={2}>
                    {a.blurb[lang]}
                  </AppText>
                </OrnateCard>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>{s.personality}</SectionLabel>
        <ChipGroup options={PERSONALITIES.map((p) => ({ id: p.id, label: p.name[lang] }))} value={c.personality} onChange={(personality) => set({ personality })} />
      </View>

      <Field label={s.ability} hint={s.optional} value={c.ability} onChangeText={(ability) => set({ ability })} placeholder={s.abilityPlaceholder} maxLength={80} />
      <Field
        label={s.appearance}
        hint={s.optional}
        value={c.appearance}
        onChangeText={(appearance) => set({ appearance })}
        placeholder={s.appearancePlaceholder}
        maxLength={160}
        multiline
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  portraitWrap: { alignItems: 'center', gap: 6 },
  portrait: { alignItems: 'center', justifyContent: 'center' },
  nameplate: { alignItems: 'center', gap: 2 },
  section: { gap: 10 },
  grid: { flexWrap: 'wrap', gap: 10 },
  archCard: { alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 12, minHeight: 132 },
});
