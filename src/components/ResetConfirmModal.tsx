import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { locked } from '../copy/locked';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/type';
import { postResetEvent } from '../lib/analytics';
import { wipeForReset, getSessionId } from '../lib/storage';
import { notifyProgressReset } from '../hooks/useProgressStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ResetConfirmModal({ visible, onClose }: Props) {
  const router = useRouter();

  function handleReset() {
    // 1. Fire analytics (fire-and-forget)
    const sessionId = getSessionId();
    postResetEvent(sessionId);

    // 2. Wipe localStorage, regenerate sessionId, invalidate in-memory store cache
    wipeForReset();
    notifyProgressReset();

    // 3. Navigate to start (cold-open state since hasAnyProgress() = false)
    router.replace('/');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.overlay} onPress={onClose} accessible={false}>
        <Pressable
          style={styles.sheet}
          onPress={() => {
            /* stop propagation */
          }}
        >
          <Text style={styles.title}>{locked.resetModalTitle}</Text>
          <Text style={styles.body}>{locked.resetModalBody}</Text>

          <View style={styles.buttonRow}>
            {/* Cancel — primary styled (safe action) */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={locked.resetModalCancel}
            >
              <Text style={styles.cancelText}>{locked.resetModalCancel}</Text>
            </TouchableOpacity>

            {/* Reset — muted-warning styled (destructive action) */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel={locked.resetModalConfirm}
            >
              <Text style={styles.resetText}>{locked.resetModalConfirm}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.buttonPrimaryText,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetText: {
    color: colors.warningMuted,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
