import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors, radius, TOUCH } from '@/theme';
import { AppText } from './AppText';
import { GoldButton } from './GoldButton';
import { PressableScale } from './PressableScale';

function Control({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.control} hitSlop={6}>
      <Ionicons name={icon} size={20} color={colors.gold} />
    </PressableScale>
  );
}

type StageProps = { source: VideoSource; poster: ReactNode; style?: StyleProp<ViewStyle>; onClose: () => void };

/** Plays a scene's MP4 over its image. The image stays underneath as poster and error fallback. */
export function SceneVideoStage({ source, poster, style, onClose }: StageProps) {
  const { s, dir } = useSettings();
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [ended, setEnded] = useState(false);
  const [shown, setShown] = useState(false);
  useEventListener(player, 'playToEnd', () => setEnded(true));

  const failed = status === 'error';
  const loading = !failed && (status === 'loading' || !shown);

  const replay = () => {
    setEnded(false);
    player.replay();
    player.play();
  };

  return (
    <View style={[styles.wrap, style]}>
      {poster}
      {!failed && (
        <VideoView
          player={player}
          style={[StyleSheet.absoluteFill, !shown && styles.hidden]}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
          onFirstFrameRender={() => setShown(true)}
          accessibilityLabel={s.watchScene}
        />
      )}
      {loading && (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.gold} />
          <AppText variant="caption" color={colors.text}>
            {s.videoLoading}
          </AppText>
        </View>
      )}
      {failed && (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <AppText variant="caption" center color={colors.fire}>
            {s.videoError}
          </AppText>
        </View>
      )}
      <View style={[styles.controls, { flexDirection: dir.row }]}>
        {!failed && !ended && (
          <Control icon={isPlaying ? 'pause' : 'play'} label={isPlaying ? s.pauseNarration : s.playVideo} onPress={() => (isPlaying ? player.pause() : player.play())} />
        )}
        {!failed && <Control icon="refresh" label={s.replayVideo} onPress={replay} />}
        <Control icon="close" label={s.closeVideo} onPress={onClose} />
      </View>
    </View>
  );
}

type BarProps = {
  hasVideo: boolean;
  watching: boolean;
  onWatch: () => void;
  onImport: () => void;
  onRemove: () => void;
  /** Offered when no video is attached and a bundled demo exists for this world. */
  onUseDemo?: () => void;
  message?: string | null;
};

/** Watch Scene plus importing / removing an MP4 for the scene. */
export function SceneVideoBar({ hasVideo, watching, onWatch, onImport, onRemove, onUseDemo, message }: BarProps) {
  const { s, dir } = useSettings();
  return (
    <View style={styles.bar}>
      <View style={[styles.barRow, { flexDirection: dir.row }]}>
        {hasVideo && !watching && <GoldButton style={styles.flex} variant="secondary" icon="film-outline" label={s.watchScene} onPress={onWatch} />}
        <GoldButton
          style={hasVideo && !watching ? undefined : styles.flex}
          variant="ghost"
          icon={hasVideo ? 'swap-horizontal' : 'cloud-upload-outline'}
          label={hasVideo ? s.replaceVideo : s.addVideo}
          onPress={onImport}
        />
        {hasVideo && <Control icon="trash-outline" label={s.removeVideo} onPress={onRemove} />}
      </View>
      {!hasVideo && onUseDemo && <GoldButton variant="ghost" icon="sparkles-outline" label={s.useDemoClip} onPress={onUseDemo} />}
      {message ? (
        <AppText variant="caption" center color={colors.textDim}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.bg },
  hidden: { opacity: 0 },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(11,16,32,0.35)' },
  errorBox: { position: 'absolute', left: 12, right: 12, top: 12, padding: 8, borderRadius: radius.sm, backgroundColor: 'rgba(11,16,32,0.8)' },
  controls: { position: 'absolute', bottom: 34, right: 10, left: 10, gap: 8, justifyContent: 'flex-end' },
  control: {
    width: TOUCH - 8,
    height: TOUCH - 8,
    borderRadius: (TOUCH - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(11,16,32,0.75)',
  },
  bar: { gap: 6 },
  barRow: { gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
});
