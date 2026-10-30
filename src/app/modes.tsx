import Animated, { FadeInDown } from 'react-native-reanimated';

import { ModeCard } from '@/components/ModeCard';
import { Screen } from '@/components/Screen';
import type { StoryMode } from '@/lib/story/types';
import { useSettings } from '@/state/settings';
import { useStartMode } from '@/state/useStartMode';

const ORDER: StoryMode[] = ['adventure', 'short', 'bedtime'];

export default function Modes() {
  const { s, calm } = useSettings();
  const startMode = useStartMode();
  return (
    <Screen title={s.modesTitle} back>
      {ORDER.map((mode, i) => (
        <Animated.View key={mode} entering={calm ? undefined : FadeInDown.delay(i * 120).duration(500)}>
          <ModeCard mode={mode} onPress={() => startMode(mode)} />
        </Animated.View>
      ))}
    </Screen>
  );
}
