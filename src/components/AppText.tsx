import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors, fonts } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'story' | 'label' | 'caption';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
  /** Force a language for content (e.g. an Arabic story inside the English UI). */
  lang?: 'en' | 'ar';
};

const sizes: Record<Variant, { size: number; line: number }> = {
  display: { size: 34, line: 44 },
  title: { size: 24, line: 34 },
  heading: { size: 18, line: 26 },
  body: { size: 15, line: 23 },
  story: { size: 18, line: 31 },
  label: { size: 13, line: 18 },
  caption: { size: 12, line: 17 },
};

function family(variant: Variant, ar: boolean) {
  if (ar) return variant === 'display' || variant === 'title' || variant === 'heading' || variant === 'label' ? fonts.arabicBold : fonts.arabic;
  switch (variant) {
    case 'display':
    case 'title':
      return fonts.display;
    case 'heading':
    case 'label':
      return fonts.displayRegular;
    default:
      return fonts.body;
  }
}

export function AppText({ variant = 'body', color, center, lang, style, ...rest }: Props) {
  const { settings, dir } = useSettings();
  const contentLang = lang ?? settings.uiLanguage;
  const ar = contentLang === 'ar';
  const scale = variant === 'story' ? settings.textScale : 1;
  const size = sizes[variant].size * scale;
  const line = sizes[variant].line * scale;
  // Arabic glyphs need extra leading; story text gets the most.
  const lineHeight = ar ? Math.round(line * (variant === 'story' ? 1.18 : 1.1)) : line;
  // Align by the content's own language so an Arabic story reads correctly inside the English UI.
  const align: TextStyle['textAlign'] = center ? 'center' : contentLang === settings.uiLanguage ? dir.textAlign : ar ? 'right' : 'left';

  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={1.6}
      style={[
        styles.base,
        {
          fontFamily: family(variant, ar),
          fontSize: size,
          lineHeight,
          color: color ?? (variant === 'caption' ? colors.textDim : colors.text),
          textAlign: align,
          writingDirection: ar ? 'rtl' : 'ltr',
          letterSpacing: !ar && (variant === 'display' || variant === 'label') ? 1.2 : 0,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
