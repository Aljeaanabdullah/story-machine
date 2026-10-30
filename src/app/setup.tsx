import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ArchetypeEmblem } from '@/components/art/ArchetypeEmblem';
import { ChipGroup } from '@/components/Chip';
import { Field, SectionLabel } from '@/components/Field';
import { GoldButton } from '@/components/GoldButton';
import { useModeText } from '@/components/ModeCard';
import { OrnateCard } from '@/components/OrnateCard';
import { Screen } from '@/components/Screen';
import { AGE_RANGES, ARCHETYPES, BEDTIME_THEMES, findWorld, GENRES, MOODS } from '@/data/catalog';
import type { Language } from '@/i18n/strings';
import { useDraft } from '@/state/draft';
import { useSettings } from '@/state/settings';
import { colors } from '@/theme';

export default function Setup() {
  const { s, settings, dir } = useSettings();
  const { draft, patch } = useDraft();
  const lang = settings.uiLanguage;
  const mode = useModeText(draft.mode);
  const bedtime = draft.mode === 'bedtime';
  const arch = ARCHETYPES.find((a) => a.id === draft.character.archetype) ?? ARCHETYPES[0];
  const worldName = draft.world.kind === 'preset' ? findWorld(draft.world.id)?.name[lang] : draft.world.description;
  const valid = !bedtime || draft.bedtime.hero.trim().length > 0;

  const languages: { id: Language; label: string }[] = [
    { id: 'en', label: s.english },
    { id: 'ar', label: s.arabic },
  ];
  const opts = (list: { id: string; name: Record<Language, string> }[]) => list.map((x) => ({ id: x.id, label: x.name[lang] }));

  return (
    <Screen
      title={s.setupTitle}
      back
      glow={bedtime ? colors.blue : colors.purple}
      footer={
        <>
          {!valid && (
            <AppText variant="caption" center>
              {s.ideaRequired}
            </AppText>
          )}
          <GoldButton label={s.begin} icon="sparkles" glow={valid} disabled={!valid} onPress={() => router.push('/generating')} />
        </>
      }
    >
      <AppText variant="label" center color={colors.gold}>
        {mode.title}
      </AppText>

      {!bedtime && (
        <OrnateCard style={[styles.summary, { flexDirection: dir.row }]}>
          <ArchetypeEmblem id={arch.id} size={60} color={arch.color} />
          <View style={styles.flex}>
            <AppText variant="caption" color={colors.gold}>
              {s.hero}
            </AppText>
            <AppText variant="heading" numberOfLines={1}>
              {draft.character.name || arch.name[lang]} · {arch.name[lang]}
            </AppText>
            <AppText variant="caption" color={colors.gold}>
              {s.world}
            </AppText>
            <AppText variant="body" color={colors.textDim} numberOfLines={2}>
              {worldName}
            </AppText>
          </View>
        </OrnateCard>
      )}

      {bedtime ? (
        <>
          <View style={styles.section}>
            <SectionLabel>{s.childAge}</SectionLabel>
            <ChipGroup
              accent={colors.blue}
              options={opts(AGE_RANGES)}
              value={draft.bedtime.ageRange}
              onChange={(ageRange) => patch({ bedtime: { ...draft.bedtime, ageRange: ageRange as typeof draft.bedtime.ageRange } })}
            />
          </View>
          <Field
            label={s.mainCharacter}
            value={draft.bedtime.hero}
            onChangeText={(hero) => patch({ bedtime: { ...draft.bedtime, hero } })}
            placeholder={s.mainCharacterPlaceholder}
            maxLength={100}
          />
          <View style={styles.section}>
            <SectionLabel>{s.theme}</SectionLabel>
            <ChipGroup accent={colors.blue} options={opts(BEDTIME_THEMES)} value={draft.bedtime.theme} onChange={(theme) => patch({ bedtime: { ...draft.bedtime, theme } })} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.section}>
            <SectionLabel>{s.genre}</SectionLabel>
            <ChipGroup options={opts(GENRES)} value={draft.genre} onChange={(genre) => patch({ genre })} />
          </View>
          <View style={styles.section}>
            <SectionLabel>{s.mood}</SectionLabel>
            <ChipGroup options={opts(MOODS)} value={draft.mood} onChange={(mood) => patch({ mood })} />
          </View>
        </>
      )}

      <Field label={s.storyIdea} hint={s.optional} value={draft.idea} onChangeText={(idea) => patch({ idea })} placeholder={s.storyIdeaPlaceholder} maxLength={300} multiline />

      <View style={styles.section}>
        <SectionLabel>{s.storyLanguage}</SectionLabel>
        <ChipGroup options={languages} value={draft.language} onChange={(language) => patch({ language })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { alignItems: 'center', gap: 14 },
  flex: { flex: 1 },
  section: { gap: 10 },
});
