import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { locked } from '../copy/locked';
import { getDisplayName } from '../lib/storage';
import type { Subject } from '../types/domain';

type Props = {
  visible: boolean;
  subject: Subject;
  onContinue: () => void;
};

export function SkilledModal({ visible, subject, onContinue }: Props) {
  const name = getDisplayName() || locked.learnerFallback;
  const subjectLabel = subject === 'maths' ? 'Maths' : subject === 'english' ? 'English' : 'Economics';

  const body = locked.levelUpModalBody
    .replace('[Name]', name)
    .replace('[Subject]', subjectLabel);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.badge}>★</Text>
          <Text style={styles.tier}>Skilled</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable style={styles.continueBtn} onPress={onContinue} accessibilityRole="button">
            <Text style={styles.continueBtnText}>{locked.levelUpModalContinue}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '85%',
    alignItems: 'center',
  },
  badge: {
    fontSize: 40,
    marginBottom: 8,
  },
  tier: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  continueBtn: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
