import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { findWorld } from '@/data/catalog';
import type { StoryDraft } from '@/lib/story/types';
import { colors } from '@/theme';
import { ArtFrame } from './art/ArtFrame';
import { WorldArt } from './art/WorldArt';

const BEDTIME: [string, string, string] = ['#0F2E5A', '#1B3F7A', '#0B1020'];
const CUSTOM: [string, string, string] = ['#2A1A5E', '#3A2470', '#0B1020'];

type Props = { draft: StoryDraft; style?: StyleProp<ViewStyle>; fadeBottom?: boolean; fadeTo?: string };

/** Cinematic header art for a story: the world's painting, or vector art for bedtime / custom worlds. */
export function StoryArt({ draft, style, fadeBottom, fadeTo }: Props) {
  if (draft.mode === 'bedtime') return <WorldArt id="bedtime" gradient={BEDTIME} accent={colors.blue} style={style} />;
  const world = draft.world.kind === 'preset' ? findWorld(draft.world.id) : undefined;
  if (!world) return <WorldArt id="custom" gradient={CUSTOM} accent={colors.gold} style={style} />;
  return (
    <ArtFrame
      slot={`world-${world.id}`}
      style={style}
      fadeBottom={fadeBottom}
      fadeTo={fadeTo}
      fallback={<WorldArt id={world.id} gradient={world.gradient} accent={world.accent} style={StyleSheet.absoluteFill} />}
    />
  );
}

export function storyAccent(draft: StoryDraft): string {
  if (draft.mode === 'bedtime') return colors.blue;
  const world = draft.world.kind === 'preset' ? findWorld(draft.world.id) : undefined;
  return world?.accent ?? colors.purple;
}
