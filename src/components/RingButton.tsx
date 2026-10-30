import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Props = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  size?: number;
};

/** Circular gold-ringed medallion button with a label underneath (home mode shortcuts). */
export function RingButton({ icon, label, onPress, size = 64 }: Props) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.wrap}>
      <View style={[styles.ringOuter, { width: size, height: size, borderRadius: size / 2 }]}>
        <LinearGradient colors={['#2A2240', '#0B1020']} style={[styles.ringInner, { borderRadius: size / 2 - 4 }]}>
          <MaterialCommunityIcons name={icon} size={size * 0.44} color={colors.gold} />
        </LinearGradient>
      </View>
      <AppText variant="label" center numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 8 },
  ringOuter: {
    padding: 3,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: 'rgba(214,180,119,0.12)',
    shadowColor: colors.gold,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  ringInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(214,180,119,0.45)' },
  label: { fontSize: 13 },
});
