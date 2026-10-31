import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { SceneVisual } from '@/lib/media/types';
import type { StoryDraft } from '@/lib/story/types';
import { StoryArt } from './StoryArt';

type Props = {
  draft: StoryDraft;
  visual: SceneVisual;
  style?: StyleProp<ViewStyle>;
  fadeTo: string;
};

/**
 * A scene's image slot: the scene's own image once one exists (generated or uploaded),
 * otherwise the story's world art as a placeholder. The fade stays fixed above the art.
 */
export function SceneArt({ draft, visual, style, fadeTo }: Props) {
  return (
    <View style={[styles.wrap, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {visual.status === 'ready' && visual.uri ? (
        <Image source={{ uri: visual.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
      ) : (
        <StoryArt draft={draft} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={[`${fadeTo}00`, fadeTo]} style={styles.fade} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%' },
});
