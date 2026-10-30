import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { MagicCircle } from '@/components/art/MagicCircle';
import { ChipGroup } from '@/components/Chip';
import { ConfirmModal } from '@/components/ConfirmModal';
import { GoldButton } from '@/components/GoldButton';
import { MODE_STYLE, useModeText } from '@/components/ModeCard';
import { OrnateCard } from '@/components/OrnateCard';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { StoryArt } from '@/components/StoryArt';
import { storyProgress, type Story, type StoryMode } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { useStories } from '@/state/stories';
import { colors, radius, TOUCH } from '@/theme';

function openStory(story: Story) {
  if (story.mode === 'adventure') router.push({ pathname: '/adventure/[id]', params: { id: story.id } });
  else router.push({ pathname: '/story/[id]', params: { id: story.id } });
}

function StoryRow({ story, onDelete }: { story: Story; onDelete: () => void }) {
  const { s, settings, dir } = useSettings();
  const mode = useModeText(story.mode);
  const st = MODE_STYLE[story.mode];
  const progress = storyProgress(story);
  const date = new Date(story.updatedAt).toLocaleDateString(settings.uiLanguage === 'ar' ? 'ar' : 'en', { dateStyle: 'medium' });
  const resumable = story.mode === 'adventure' && !progress.done;

  return (
    <OrnateCard corners={false} style={styles.row}>
      <PressableScale onPress={() => openStory(story)} accessibilityLabel={`${story.title}. ${mode.title}`} scaleTo={0.98} style={[styles.main, { flexDirection: dir.row }]}>
        <View style={styles.thumb}>
          <StoryArt draft={story.draft} style={StyleSheet.absoluteFill} />
          <Ionicons name={st.icon} size={20} color={st.accent} style={styles.thumbIcon} />
        </View>
        <View style={styles.info}>
          <AppText variant="heading" lang={story.language} numberOfLines={2}>
            {story.title}
          </AppText>
          <AppText variant="caption" color={st.accent}>
            {mode.title} · {story.language === 'ar' ? 'العربية' : 'English'}
          </AppText>
          <AppText variant="caption">
            {date}
            {story.mode === 'adventure' ? ` · ${s.scene} ${progress.current}/${progress.total} · ${progress.done ? s.complete : s.inProgress}` : ''}
          </AppText>
        </View>
      </PressableScale>
      <View style={[styles.actions, { flexDirection: dir.row }]}>
        <GoldButton
          style={styles.flex}
          variant={resumable ? 'primary' : 'secondary'}
          label={resumable ? s.continueAdventure : s.open}
          icon={resumable ? 'play' : 'book-outline'}
          onPress={() => openStory(story)}
        />
        <PressableScale onPress={onDelete} accessibilityLabel={`${s.delete}: ${story.title}`} style={styles.trash}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </PressableScale>
      </View>
    </OrnateCard>
  );
}

export default function Library() {
  const { s, calm } = useSettings();
  const { stories, remove, ready } = useStories();
  const [pending, setPending] = useState<Story | null>(null);
  const [filter, setFilter] = useState<'all' | StoryMode>('all');
  const allSaved = useMemo(() => stories.filter((st) => st.saved).sort((a, b) => b.updatedAt - a.updatedAt), [stories]);
  const saved = useMemo(() => (filter === 'all' ? allSaved : allSaved.filter((st) => st.mode === filter)), [allSaved, filter]);
  const filters: { id: 'all' | StoryMode; label: string }[] = [
    { id: 'all', label: `${s.all} (${allSaved.length})` },
    { id: 'adventure', label: s.homeAdventure },
    { id: 'short', label: s.homeShort },
    { id: 'bedtime', label: s.homeKids },
  ];

  return (
    <Screen title={s.libraryTitle} back>
      {allSaved.length > 0 && <ChipGroup options={filters} value={filter} onChange={setFilter} />}
      {ready && allSaved.length > 0 && saved.length === 0 && (
        <AppText variant="body" center color={colors.textDim}>
          {s.libraryEmpty}
        </AppText>
      )}
      {ready && allSaved.length === 0 && (
        <View style={styles.empty}>
          <MagicCircle size={180} calm={calm} />
          <AppText variant="body" center color={colors.textDim}>
            {s.libraryEmpty}
          </AppText>
          <GoldButton label={s.createStory} icon="sparkles" onPress={() => router.replace('/modes')} />
        </View>
      )}
      {saved.map((story, i) => (
        <Animated.View key={story.id} entering={calm ? undefined : FadeInDown.delay(Math.min(i, 6) * 70).duration(400)} layout={calm ? undefined : LinearTransition}>
          <StoryRow story={story} onDelete={() => setPending(story)} />
        </Animated.View>
      ))}
      <ConfirmModal
        visible={!!pending}
        title={s.deleteConfirmTitle}
        body={pending ? `“${pending.title}” — ${s.deleteConfirmBody}` : undefined}
        confirmLabel={s.delete}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) remove(pending.id);
          setPending(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 18, paddingTop: 30 },
  row: { padding: 12, gap: 12 },
  main: { gap: 12, alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'flex-start' },
  thumbIcon: { marginTop: 6 },
  info: { flex: 1, gap: 3 },
  actions: { gap: 10, alignItems: 'center' },
  flex: { flex: 1 },
  trash: {
    width: TOUCH + 6,
    height: TOUCH + 6,
    borderRadius: (TOUCH + 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,93,108,0.4)',
    backgroundColor: 'rgba(255,93,108,0.08)',
  },
});
