import { Modal, StyleSheet, View } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { GoldButton } from './GoldButton';
import { OrnateCard } from './OrnateCard';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** In-theme confirmation dialog (Alert.alert buttons don't work on web and look out of place). */
export function ConfirmModal({ visible, title, body, confirmLabel, onConfirm, onCancel }: Props) {
  const { s, dir } = useSettings();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <OrnateCard active accent={colors.fire} style={styles.card}>
          <AppText variant="heading" center accessibilityRole="alert">
            {title}
          </AppText>
          {body ? (
            <AppText variant="body" center color={colors.textDim}>
              {body}
            </AppText>
          ) : null}
          <View style={[styles.row, { flexDirection: dir.row }]}>
            <GoldButton label={s.cancel} variant="ghost" onPress={onCancel} style={styles.flex} />
            <GoldButton label={confirmLabel} variant="secondary" icon="trash-outline" onPress={onConfirm} style={styles.flex} />
          </View>
        </OrnateCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
  card: { gap: 14, paddingVertical: 24 },
  row: { gap: 10 },
  flex: { flex: 1 },
});
