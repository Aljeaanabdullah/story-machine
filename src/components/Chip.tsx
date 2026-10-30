import { StyleSheet, View } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type ChipProps = { label: string; selected: boolean; onPress: () => void; accent?: string };

export function Chip({ label, selected, onPress, accent = colors.gold }: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
      style={[styles.chip, selected && { borderColor: accent, backgroundColor: 'rgba(214,180,119,0.16)', shadowColor: accent, shadowOpacity: 0.6 }]}
    >
      <AppText variant="label" color={selected ? accent : colors.textDim}>
        {label}
      </AppText>
    </PressableScale>
  );
}

type GroupProps<T extends string> = {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accent?: string;
};

export function ChipGroup<T extends string>({ options, value, onChange, accent }: GroupProps<T>) {
  const { dir } = useSettings();
  return (
    <View accessibilityRole="radiogroup" style={[styles.group, { flexDirection: dir.row }]}>
      {options.map((o) => (
        <Chip key={o.id} label={o.label} selected={o.id === value} onPress={() => onChange(o.id)} accent={accent} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(174,181,203,0.25)',
    backgroundColor: 'rgba(20,27,48,0.7)',
    shadowRadius: 8,
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});
