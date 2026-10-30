import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { art } from '@/assets/art';
import { FRAMING, type Framing } from '@/assets/framing';
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
  /** Height of each fade, default 38%. */
  fadeTopSize?: DimensionValue;
  fadeBottomSize?: DimensionValue;
  contentPosition?: 'center' | 'top' | 'bottom';
};

/** Positions the image so band [x, x+w] fills the width, starting at fraction y (clamped to keep the frame covered). */
function framedStyle(f: Framing, w: number, h: number) {
  const imgW = w / f.w;
  const imgH = imgW / f.ratio;
  const top = Math.min(Math.max(f.y * imgH, 0), Math.max(imgH - h, 0));
  return { position: 'absolute' as const, width: imgW, height: imgH, left: -f.x * imgW, top: -top };
}

/** Cinematic artwork area: bundled illustration when available, vector fallback otherwise. */
export function ArtFrame({ slot, fallback, style, fadeBottom, fadeTop, fadeTo = colors.bg, fadeTopSize = '38%', fadeBottomSize = '38%', contentPosition = 'center' }: Props) {
  const source = art(slot);
  const framing = FRAMING[slot];
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  let image: ReactNode = null;
  if (source && framing) {
    image = size ? <Image source={source} style={framedStyle(framing, size.w, size.h)} contentFit="fill" transition={250} /> : null;
  } else if (source) {
    image = <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={contentPosition} transition={250} />;
  }

  return (
    <View
      style={[styles.wrap, style]}
      onLayout={framing ? (e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }) : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {source ? image : fallback}
      {fadeTop && <LinearGradient colors={[fadeTo, `${fadeTo}00`]} style={[styles.fade, styles.top, { height: fadeTopSize }]} pointerEvents="none" />}
      {fadeBottom && <LinearGradient colors={[`${fadeTo}00`, fadeTo]} style={[styles.fade, styles.bottom, { height: fadeBottomSize }]} pointerEvents="none" />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0 },
  top: { top: 0 },
  bottom: { bottom: 0 },
});
