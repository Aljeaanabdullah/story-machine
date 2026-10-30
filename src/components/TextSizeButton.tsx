import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { TEXT_SCALES } from '@/lib/storage';
import { useSettings } from '@/state/settings';
import { colors, TOUCH } from '@/theme';
import { PressableScale } from './PressableScale';

/** Cycles reading text size 100% → 115% → 130%. Persisted in settings. */
export function TextSizeButton() {
  const { s, settings, update } = useSettings();
  const i = TEXT_SCALES.indexOf(settings.textScale as (typeof TEXT_SCALES)[number]);
  const next = TEXT_SCALES[(i + 1) % TEXT_SCALES.length];
  return (
    <PressableScale
      onPress={() => update({ textScale: next })}
      accessibilityLabel={`${s.textSize}: ${Math.round(settings.textScale * 100)}%`}
      accessibilityHint={`${Math.round(next * 100)}%`}
      style={styles.btn}
      hitSlop={6}
    >
      <MaterialCommunityIcons name="format-size" size={22} color={colors.gold} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,27,48,0.7)',
  },
});
