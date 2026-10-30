import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { ArchetypeEmblem } from '@/components/art/ArchetypeEmblem';
import { ArtFrame } from '@/components/art/ArtFrame';
import { MagicCircle } from '@/components/art/MagicCircle';
import { NightVista } from '@/components/art/NightVista';
import { Chip, ChipGroup } from '@/components/Chip';
import { Field, SectionLabel } from '@/components/Field';
import { HeroButton } from '@/components/HeroButton';
import { OrnateCard } from '@/components/OrnateCard';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { ARCHETYPES, PERSONALITIES } from '@/data/catalog';
import type { Character } from '@/lib/story/types';
import { useDraft } from '@/state/draft';
import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';

const LAST = 3;

export default function CharacterScreen() {
  const { s, settings, dir, calm } = useSettings();
  const { draft, patch } = useDraft();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const lang = settings.uiLanguage;
  const c = draft.character;
  const arch = ARCHETYPES.find((a) => a.id === c.archetype) ?? ARCHETYPES[0];
  const personality = PERSONALITIES.find((p) => p.id === c.personality);
  const set = (p: Partial<Character>) => patch({ character: { ...c, ...p } });

  const nameOk = c.name.trim().length > 0;
  const canNext = step !== 0 || nameOk;
  const portraitH = Math.min(width * 0.86, 360);
  const tile = Math.floor((Math.min(width, 560) - 36 - 5 * 6) / 6);
  const steps = [s.stepArchetype, s.stepPersonality, s.stepAbility, s.stepConfirm];

  const next = () => (step < LAST ? setStep(step + 1) : router.push('/world'));
  const back = () => (step > 0 ? setStep(step - 1) : router.canGoBack() ? router.back() : router.replace('/home'));
  const fade = (d = 0) => (calm ? undefined : FadeInDown.delay(d).duration(400));

  return (
    <Screen
      title={s.characterTitle}
      back={back}
      glow={arch.color}
      footer={
        <>
          {step === 0 && !nameOk && (
            <AppText variant="caption" center>
              {s.nameRequired}
            </AppText>
          )}
          <HeroButton label={step === LAST ? s.continue : s.next} sub={step === LAST ? s.worldTitle : steps[step + 1]} disabled={!canNext} glow={step === LAST} onPress={next} />
        </>
      }
    >
      <Stepper steps={steps} current={step} onStep={setStep} />

      {/* Portrait stage */}
      <View style={[styles.stage, { height: portraitH }]}>
        <ArtFrame
          slot={`hero-${arch.id}`}
          style={StyleSheet.absoluteFill}
          fadeBottom
          contentPosition="top"
          fallback={
            <>
              <NightVista />
              <LinearGradient colors={['transparent', `${arch.color}40`, 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.fallbackCenter}>
                <View style={{ width: portraitH * 0.86, height: portraitH * 0.86, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={StyleSheet.absoluteFill}>
                    <MagicCircle size={portraitH * 0.86} calm={calm} color={colors.gold} inner={arch.color} />
                  </View>
                  <Animated.View key={arch.id} entering={calm ? undefined : FadeIn.duration(450)}>
                    <ArchetypeEmblem id={arch.id} size={portraitH * 0.42} color={arch.color} />
                  </Animated.View>
                </View>
              </View>
            </>
          }
        />
        <View style={styles.stageFrame} pointerEvents="none" />
        <View style={styles.nameplate}>
          <AppText variant="title" center color="#F1D69A" numberOfLines={1} style={styles.plateName}>
            {c.name.trim() || arch.name[lang]}
          </AppText>
          <AppText variant="label" center color={arch.color} style={styles.plateName}>
            {nameOk ? `${arch.name[lang]} · ${personality?.name[lang]}` : personality?.name[lang]}
          </AppText>
        </View>
      </View>

      {step === 0 && (
        <Animated.View key="s0" entering={fade()} style={styles.section}>
          <SectionLabel>{s.chooseArchetype}</SectionLabel>
          <View style={[styles.tiles, { flexDirection: dir.row }]} accessibilityRole="radiogroup">
            {ARCHETYPES.map((a) => {
              const on = a.id === c.archetype;
              return (
                <PressableScale
                  key={a.id}
                  onPress={() => set({ archetype: a.id })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${a.name[lang]}. ${a.blurb[lang]}`}
                  style={[styles.tile, { width: tile, minHeight: tile + 26 }, on && { borderColor: colors.gold, backgroundColor: 'rgba(214,180,119,0.14)', shadowOpacity: 0.8 }]}
                >
                  <MaterialCommunityIcons name={a.icon} size={tile * 0.42} color={on ? colors.gold : a.color} />
                  <AppText variant="caption" center numberOfLines={1} color={on ? colors.gold : colors.text} style={styles.tileLabel}>
                    {a.name[lang]}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>
          <AppText variant="caption" center color={arch.color}>
            {arch.blurb[lang]}
          </AppText>
          <Field label={s.heroName} value={c.name} onChangeText={(name) => set({ name })} placeholder={s.namePlaceholder} maxLength={40} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => nameOk && next()} />
        </Animated.View>
      )}

      {step === 1 && (
        <Animated.View key="s1" entering={fade()} style={styles.section}>
          <SectionLabel>{s.personality}</SectionLabel>
          <ChipGroup options={PERSONALITIES.map((p) => ({ id: p.id, label: p.name[lang] }))} value={c.personality} onChange={(p) => set({ personality: p })} />
          <Field label={s.appearance} hint={s.optional} value={c.appearance} onChangeText={(appearance) => set({ appearance })} placeholder={s.appearancePlaceholder} maxLength={160} multiline />
        </Animated.View>
      )}

      {step === 2 && (
        <Animated.View key="s2" entering={fade()} style={styles.section}>
          <Field label={s.ability} hint={s.optional} value={c.ability} onChangeText={(ability) => set({ ability })} placeholder={s.abilityPlaceholder} maxLength={80} />
          <View style={[styles.ideas, { flexDirection: dir.row }]}>
            {s.abilityIdeas.map((idea) => (
              <Chip key={idea} label={idea} selected={c.ability === idea} onPress={() => set({ ability: idea })} accent={arch.color} />
            ))}
          </View>
        </Animated.View>
      )}

      {step === 3 && (
        <Animated.View key="s3" entering={fade()}>
          <OrnateCard active accent={colors.gold} style={styles.summary}>
            <View style={[styles.summaryHead, { flexDirection: dir.row }]}>
              <ArchetypeEmblem id={arch.id} size={56} color={arch.color} />
              <View style={styles.flex}>
                <AppText variant="caption" color={colors.gold}>
                  {s.heroReady}
                </AppText>
                <AppText variant="title" numberOfLines={1}>
                  {c.name}
                </AppText>
              </View>
            </View>
            {[
              [s.archetype, arch.name[lang], 0],
              [s.personality, personality?.name[lang], 1],
              [s.appearance, c.appearance.trim() || '—', 1],
              [s.ability, c.ability.trim() || '—', 2],
            ].map(([label, value, target]) => (
              <PressableScale key={label as string} onPress={() => setStep(target as number)} accessibilityLabel={`${label}: ${value}`} style={[styles.summaryRow, { flexDirection: dir.row }]}>
                <AppText variant="label" color={colors.gold} style={styles.summaryLabel}>
                  {label}
                </AppText>
                <AppText variant="body" style={styles.flex}>
                  {value}
                </AppText>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textDim} />
              </PressableScale>
            ))}
          </OrnateCard>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.bg2 },
  stageFrame: { ...StyleSheet.absoluteFill, borderRadius: radius.lg, borderWidth: 1.2, borderColor: 'rgba(214,180,119,0.5)' },
  fallbackCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 },
  nameplate: { position: 'absolute', left: 0, right: 0, bottom: 10, alignItems: 'center', paddingHorizontal: 12 },
  plateName: { textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } },
  section: { gap: 12 },
  tiles: { gap: 6, justifyContent: 'center' },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.sm,
    borderWidth: 1.2,
    borderColor: 'rgba(214,180,119,0.3)',
    backgroundColor: 'rgba(14,20,40,0.9)',
    shadowColor: colors.gold,
    shadowRadius: 10,
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  tileLabel: { fontSize: 11 },
  ideas: { flexWrap: 'wrap', gap: 8 },
  summary: { gap: 6 },
  summaryHead: { alignItems: 'center', gap: 12, marginBottom: 6 },
  summaryRow: { alignItems: 'center', gap: 10, minHeight: 44, borderTopWidth: 1, borderTopColor: 'rgba(214,180,119,0.15)', paddingVertical: 6 },
  summaryLabel: { width: 90 },
  flex: { flex: 1 },
});
