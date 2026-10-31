import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { VoiceRole } from '@/lib/audio/types';
import type { Narration } from '@/state/useNarration';
import { useSettings } from '@/state/settings';
import { colors, radius, TOUCH } from '@/theme';
import { AppText } from './AppText';
import { GoldButton } from './GoldButton';
import { PressableScale } from './PressableScale';

type Props = { narration: Narration; label: string };

export const ROLE_COLORS: Record<VoiceRole, string> = { narrator: colors.gold, hero: colors.blue, villain: colors.fire, companion: colors.success };

function RoundButton({ icon, label, onPress, primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={[styles.round, primary && styles.roundPrimary]} hitSlop={6}>
      <Ionicons name={icon} size={22} color={primary ? colors.bg : colors.gold} />
    </PressableScale>
  );
}

/** Listen button that expands into pause / resume / stop controls with progress. */
export function NarrationBar({ narration, label }: Props) {
  const { s, dir } = useSettings();
  const { state, active } = narration;

  if (!active) {
    const done = state.status === 'done';
    return (
      <View style={styles.idle}>
        <GoldButton variant="secondary" icon={done ? 'refresh' : 'headset-outline'} label={done ? s.listenAgain : label} onPress={narration.play} />
        {state.status === 'error' && (
          <AppText variant="caption" center color={colors.fire} accessibilityLiveRegion="polite">
            {s.narrationError}
          </AppText>
        )}
      </View>
    );
  }

  const loading = state.status === 'loading';
  const paused = state.status === 'paused';
  const progress = state.total ? Math.min(1, (state.index + (paused ? 0 : 0.5)) / state.total) : 0;
  const status = loading ? s.preparingVoice : paused ? s.narrationPaused : s.roles[state.role ?? 'narrator'];

  return (
    <View style={[styles.bar, { flexDirection: dir.row }]} accessibilityLabel={s.narration}>
      {loading ? (
        <View style={styles.round}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : (
        <RoundButton
          primary
          icon={paused ? 'play' : 'pause'}
          label={paused ? s.resumeNarration : s.pauseNarration}
          onPress={paused ? narration.resume : narration.pause}
        />
      )}
      <View style={styles.flex}>
        <View style={[styles.meta, { flexDirection: dir.row }]}>
          {!loading && !paused && <View style={[styles.dot, { backgroundColor: ROLE_COLORS[state.role ?? 'narrator'] }]} />}
          <AppText variant="label" color={colors.gold} numberOfLines={1} style={styles.flex}>
            {status}
          </AppText>
          {state.engine && !loading && (
            <AppText variant="caption" color={state.engine === 'neural' ? colors.success : colors.textDim}>
              {state.engine === 'neural' ? s.engineNeural : s.engineDevice}
            </AppText>
          )}
          <AppText variant="caption" lang="en">
            {Math.min(state.index + 1, state.total)}/{state.total}
          </AppText>
        </View>
        <View
          style={[styles.track, { flexDirection: dir.row }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: state.total, now: state.index }}
        >
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      <RoundButton icon="stop" label={s.stopNarration} onPress={narration.stop} />
    </View>
  );
}

const styles = StyleSheet.create({
  idle: { gap: 6 },
  bar: {
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,27,48,0.85)',
  },
  flex: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  meta: { alignItems: 'center', gap: 8, marginBottom: 6 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.bg3, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.gold },
  round: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roundPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
});
