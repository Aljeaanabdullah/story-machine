import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function tap(enabled: boolean, strong = false) {
  if (!enabled || Platform.OS === 'web') return;
  Haptics.impactAsync(strong ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
