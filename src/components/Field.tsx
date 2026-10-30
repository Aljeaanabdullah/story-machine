import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors, fonts, radius } from '@/theme';
import { AppText } from './AppText';

export function SectionLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  const { dir } = useSettings();
  return (
    <View style={[styles.labelRow, { flexDirection: dir.row }]}>
      <View style={styles.rune} />
      <AppText variant="label" color={colors.gold}>
        {children}
      </AppText>
      {hint ? <AppText variant="caption">({hint})</AppText> : null}
    </View>
  );
}

type FieldProps = TextInputProps & { label: string; hint?: string };

export function Field({ label, hint, multiline, style, ...rest }: FieldProps) {
  const { settings, dir } = useSettings();
  const [focused, setFocused] = useState(false);
  const ar = settings.uiLanguage === 'ar';
  return (
    <View style={styles.field}>
      <SectionLabel hint={hint}>{label}</SectionLabel>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor="rgba(174,181,203,0.55)"
        selectionColor={colors.gold}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            fontFamily: ar ? fonts.arabic : fonts.body,
            textAlign: dir.textAlign,
            writingDirection: dir.writingDirection,
            borderColor: focused ? colors.gold : 'rgba(214,180,119,0.25)',
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  labelRow: { alignItems: 'center', gap: 8 },
  rune: { width: 7, height: 7, backgroundColor: colors.gold, transform: [{ rotate: '45deg' }] },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(11,16,32,0.75)',
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
