import { StyleSheet, View } from 'react-native';

import { ltrRow } from '@/i18n/direction';
import type { Language } from '@/i18n/strings';
import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const OPTIONS: { id: Language; label: string; a11y: string }[] = [
  { id: 'en', label: 'EN', a11y: 'English' },
  { id: 'ar', label: 'ع', a11y: 'العربية' },
];

/** Segmented EN | ع switch. Changing UI language also changes the default story language. */
export function LanguageToggle() {
  const { settings, update } = useSettings();
  return (
    // Fixed LTR order so the control doesn't jump under the user's finger when it flips the UI.
    <View style={[styles.wrap, { flexDirection: ltrRow() }]} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => {
        const on = settings.uiLanguage === o.id;
        return (
          <PressableScale
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.a11y}
            onPress={() => update({ uiLanguage: o.id, storyLanguage: o.id })}
            style={[styles.opt, on && styles.on]}
          >
            <AppText lang={o.id} variant="label" center color={on ? '#2A1A05' : colors.textDim}>
              {o.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(20,27,48,0.75)', padding: 3 },
  opt: { minWidth: 44, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  on: { backgroundColor: colors.gold },
});
