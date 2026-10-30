import { StyleSheet, View } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const SIGILS = ['I', 'II', 'III'];

type Props = {
  index: number;
  text: string;
  lang: 'en' | 'ar';
  selected?: boolean;
  /** Another choice was taken; this one is shown dimmed. */
  dimmed?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function ChoiceCard({ index, text, lang, selected, dimmed, disabled, onPress }: Props) {
  const { dir } = useSettings();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={text}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[styles.card, selected && styles.selected, dimmed && styles.dimmed, { flexDirection: dir.row }]}
    >
      <View style={[styles.sigil, selected && { backgroundColor: colors.gold }]}>
        <AppText variant="label" lang="en" color={selected ? '#2A1A05' : colors.gold} center>
          {SIGILS[index] ?? index + 1}
        </AppText>
      </View>
      <AppText variant="body" lang={lang} style={styles.text}>
        {text}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(57,184,255,0.35)',
    backgroundColor: 'rgba(20,27,48,0.85)',
    shadowColor: colors.blue,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  selected: { borderColor: colors.gold, backgroundColor: 'rgba(214,180,119,0.14)', shadowColor: colors.gold, shadowOpacity: 0.7 },
  dimmed: { opacity: 0.4 },
  sigil: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
});
