import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useSettings } from '@/state/settings';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { GoldButton } from './GoldButton';
import { OrnateCard } from './OrnateCard';

type Props = { message: string; onRetry?: () => void; onBack?: () => void; retryDisabled?: boolean };

/** Friendly failure card. Never shows raw errors or API details. */
export function ErrorPanel({ message, onRetry, onBack, retryDisabled }: Props) {
  const { s, calm } = useSettings();
  return (
    <Animated.View entering={calm ? undefined : FadeInUp.duration(400)} style={styles.wrap}>
      <OrnateCard accent={colors.fire} active style={styles.card}>
        <Ionicons name="flame-outline" size={36} color={colors.fire} style={styles.icon} />
        <AppText variant="heading" center color={colors.fire} accessibilityRole="alert">
          {s.errorTitle}
        </AppText>
        <AppText variant="body" center color={colors.textDim} style={styles.message}>
          {message}
        </AppText>
        {onRetry && <GoldButton label={s.retry} icon="refresh" onPress={onRetry} disabled={retryDisabled} />}
        {onBack && <GoldButton label={s.goBack} variant="ghost" onPress={onBack} />}
      </OrnateCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', maxWidth: '100%' },
  card: { gap: 14, paddingVertical: 24 },
  // Long identifiers like env var names must wrap instead of widening the card (web).
  message: { flexShrink: 1, ...({ wordBreak: 'break-word' } as object) },
  icon: { alignSelf: 'center' },
});
