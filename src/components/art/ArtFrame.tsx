import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { art } from '@/assets/art';
import type { ArtSlot } from '@/assets/slots';
import { colors } from '@/theme';

type Props = {
  slot: ArtSlot;
  /** Vector art shown until the slot's image file is added. */
  fallback: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Darken toward the bottom so text over the art stays readable. */
  fadeBottom?: boolean;
  fadeTop?: boolean;
  fadeTo?: string;
  contentPosition?: 'center' | 'top' | 'bottom';
};

/** Cinematic artwork area: bundled illustration when available, vector fallback otherwise. */
export function ArtFrame({ slot, fallback, style, fadeBottom, fadeTop, fadeTo = colors.bg, contentPosition = 'center' }: Props) {
  const source = art(slot);
  return (
    <View style={[styles.wrap, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {source ? <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={contentPosition} transition={250} /> : fallback}
      {fadeTop && <LinearGradient colors={[`${fadeTo}E6`, `${fadeTo}00`]} locations={[0, 1]} style={[styles.fade, styles.top]} pointerEvents="none" />}
      {fadeBottom && <LinearGradient colors={[`${fadeTo}00`, fadeTo]} locations={[0, 1]} style={[styles.fade, styles.bottom]} pointerEvents="none" />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, height: '38%' },
  top: { top: 0 },
  bottom: { bottom: 0 },
});
