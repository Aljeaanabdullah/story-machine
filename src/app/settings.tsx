import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ChipGroup } from '@/components/Chip';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Field, SectionLabel } from '@/components/Field';
import { GoldButton } from '@/components/GoldButton';
import { OrnateCard } from '@/components/OrnateCard';
import { Screen } from '@/components/Screen';
import type { Language } from '@/i18n/strings';
import { getAIConfig, hasApiKey, isFreeModel } from '@/lib/ai/config';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { colors } from '@/theme';

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { dir } = useSettings();
  return (
    <View style={[styles.toggle, { flexDirection: dir.row }]}>
      <View style={styles.flex}>
        <AppText variant="heading">{label}</AppText>
        {desc ? <AppText variant="caption">{desc}</AppText> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: colors.bg3, true: colors.goldDim }}
        thumbColor={value ? colors.gold : colors.textDim}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { s, settings, update, dir } = useSettings();
  const { stories, clearAll } = useStories();
  const [modelDraft, setModelDraft] = useState(settings.model);
  const [confirmClear, setConfirmClear] = useState(false);
  const keyOk = hasApiKey();
  const activeModel = getAIConfig(settings.model || undefined).models[0];
  const modelValid = modelDraft.trim() === '' || isFreeModel(modelDraft);
  const languages: { id: Language; label: string }[] = [
    { id: 'en', label: s.english },
    { id: 'ar', label: s.arabic },
  ];

  return (
    <Screen title={s.settingsTitle} back>
      <OrnateCard style={styles.card}>
        <SectionLabel>{s.interfaceLanguage}</SectionLabel>
        <ChipGroup options={languages} value={settings.uiLanguage} onChange={(uiLanguage) => update({ uiLanguage })} />
        <SectionLabel>{s.defaultStoryLanguage}</SectionLabel>
        <ChipGroup options={languages} value={settings.storyLanguage} onChange={(storyLanguage) => update({ storyLanguage })} />
      </OrnateCard>

      <OrnateCard style={styles.card}>
        <ToggleRow label={s.reduceMotion} desc={s.reduceMotionDesc} value={settings.reduceMotion} onChange={(reduceMotion) => update({ reduceMotion })} />
        <ToggleRow label={s.haptics} value={settings.haptics} onChange={(haptics) => update({ haptics })} />
      </OrnateCard>

      <OrnateCard style={styles.card}>
        <Field
          label={s.aiModel}
          value={modelDraft}
          onChangeText={setModelDraft}
          onEndEditing={() => modelValid && update({ model: modelDraft.trim() })}
          placeholder={activeModel}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ textAlign: 'left', writingDirection: 'ltr' }}
        />
        <AppText variant="caption" color={modelValid ? colors.textDim : colors.danger}>
          {s.aiModelDesc}
        </AppText>
        <AppText variant="caption" lang="en" color={colors.gold}>
          → {activeModel}
        </AppText>
        <View style={[styles.row, { flexDirection: dir.row }]}>
          <GoldButton style={styles.flex} variant="secondary" label={s.saved} icon="checkmark" disabled={!modelValid || modelDraft.trim() === settings.model} onPress={() => update({ model: modelDraft.trim() })} />
          <GoldButton
            style={styles.flex}
            variant="ghost"
            label={s.resetModel}
            icon="refresh"
            onPress={() => {
              setModelDraft('');
              update({ model: '' });
            }}
          />
        </View>

        <View style={[styles.keyRow, { flexDirection: dir.row }]}>
          <Ionicons name={keyOk ? 'key' : 'alert-circle'} size={20} color={keyOk ? colors.success : colors.fire} />
          <View style={styles.flex}>
            <AppText variant="label" color={colors.gold}>
              {s.apiKey}
            </AppText>
            <AppText variant="caption" color={keyOk ? colors.success : colors.fire}>
              {keyOk ? s.apiKeyConfigured : s.apiKeyMissing}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color={colors.textDim}>
          {s.securityNote}
        </AppText>
      </OrnateCard>

      <GoldButton
        variant="ghost"
        label={`${s.clearLibrary} (${stories.filter((x) => x.saved).length})`}
        icon="trash-outline"
        onPress={() => setConfirmClear(true)}
        disabled={!stories.some((x) => x.saved)}
      />

      <AppText variant="caption" center lang="en">
        StoryVerse AI v{Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>

      <ConfirmModal
        visible={confirmClear}
        title={s.clearLibraryConfirm}
        body={s.deleteConfirmBody}
        confirmLabel={s.delete}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          setConfirmClear(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  toggle: { alignItems: 'center', gap: 12, minHeight: 48 },
  flex: { flex: 1 },
  row: { gap: 10 },
  keyRow: { gap: 10, alignItems: 'center', marginTop: 6 },
});
