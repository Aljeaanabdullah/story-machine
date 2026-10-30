import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/state/settings';
import { colors, TOUCH } from '@/theme';
import { AppText } from './AppText';
import { CinematicBackground } from './CinematicBackground';
import { GoldDivider } from './GoldDivider';
import { PressableScale } from './PressableScale';

type Props = {
  title?: string;
  /** Small line under the title, above the content. */
  subtitle?: string;
  back?: boolean | (() => void);
  right?: ReactNode;
  /** Shown in the leading slot when there is no back button. */
  left?: ReactNode;
  children: ReactNode;
  /** Pinned under the scroll area, e.g. the primary CTA. */
  footer?: ReactNode;
  scroll?: boolean;
  glow?: string;
  gradient?: [string, string, string];
  particles?: boolean;
};

export function IconButton({ icon, onPress, label }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.iconBtn} hitSlop={6}>
      <Ionicons name={icon} size={22} color={colors.gold} />
    </PressableScale>
  );
}

export function Screen({ title, subtitle, back, right, left, children, footer, scroll = true, glow, gradient, particles }: Props) {
  const insets = useSafeAreaInsets();
  const { dir, s } = useSettings();

  const goBack = () => {
    if (typeof back === 'function') back();
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const header = (title || back || right || left) && (
    <View style={[styles.header, { flexDirection: dir.row }]}>
      <View style={styles.side}>{back ? <IconButton icon={dir.isRTL ? 'chevron-forward' : 'chevron-back'} onPress={goBack} label={s.goBack} /> : left}</View>
      <View style={styles.title}>
        {title ? (
          <>
            <AppText variant="title" center numberOfLines={1} color="#F1D69A" accessibilityRole="header">
              {title}
            </AppText>
            <GoldDivider width={150} />
          </>
        ) : null}
      </View>
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );

  return (
    <View style={styles.root}>
      <CinematicBackground glow={glow} gradient={gradient} particles={particles} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.flex, { paddingTop: insets.top + 6 }]}>
          {header}
          {subtitle ? (
            <AppText variant="caption" center color={colors.text} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
          {scroll ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.content, { paddingBottom: footer ? 24 : insets.bottom + 32 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.flex, styles.content]}>{children}</View>
          )}
          {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { alignItems: 'center', paddingHorizontal: 12, minHeight: TOUCH + 4 },
  side: { minWidth: TOUCH + 8 },
  title: { flex: 1, alignItems: 'center' },
  subtitle: { paddingHorizontal: 24, paddingBottom: 6, fontSize: 13 },
  iconBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,27,48,0.7)',
  },
  content: { paddingHorizontal: 18, paddingTop: 8, gap: 18 },
  footer: { paddingHorizontal: 18, paddingTop: 10, gap: 10, backgroundColor: 'rgba(11,16,32,0.6)' },
});
