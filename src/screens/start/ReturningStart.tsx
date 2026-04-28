import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { locked } from '../../copy/locked';
import { colors } from '../../theme/colors';
import { fontSize, fontWeight } from '../../theme/type';
import SubjectCard from '../../components/SubjectCard';
import ResetConfirmModal from '../../components/ResetConfirmModal';
import { useProgressStore } from '../../hooks/useProgressStore';
import { getDisplayName } from '../../lib/displayName';
import { saveDisplayName } from '../../lib/storage';
import { shareApp } from '../../lib/share';
import { Toast } from '../../components/Toast';
import type { Subject } from '../../types/domain';

const ALL_SUBJECTS: Subject[] = ['maths', 'english', 'economics'];

export default function ReturningStart() {
  const router = useRouter();
  const { getSubjectProgress } = useProgressStore();

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [nameInput, setNameInput] = useState(getDisplayName());
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  function handleStart() {
    if (!selectedSubject) return;
    saveDisplayName(nameInput.trim());
    router.push(`/practice/${selectedSubject}`);
  }

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Reset progress link — top-right */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => setResetModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={locked.resetLink}
          >
            <Text style={styles.resetLink}>{locked.resetLink}</Text>
          </TouchableOpacity>
        </View>

        {/* Wordmark */}
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>FailFast</Text>
          <View style={styles.miniBadge}>
            <Text style={styles.miniBadgeText}>mini</Text>
          </View>
        </View>

        {/* NO tagline, NO explainer — returning state is Things 3 register */}

        {/* Display name input — pre-filled, no autofocus */}
        <View style={styles.nameSection}>
          <Text style={styles.nameLabel}>{locked.nameFieldLabel}</Text>
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={false}
            returnKeyType="done"
            accessibilityLabel={locked.nameFieldLabel}
            placeholderTextColor={colors.textMuted}
            placeholder={locked.nameFieldPlaceholder}
          />
        </View>

        {/* Subject cards with progress */}
        <View style={styles.cardsSection}>
          {ALL_SUBJECTS.map((subject) => {
            const prog = getSubjectProgress(subject);
            const isNotStarted = prog.successPoints === 0 && prog.gritPoints === 0;
            return (
              <SubjectCard
                key={subject}
                variant="with-progress"
                subject={subject}
                isSelected={selectedSubject === subject}
                onSelect={() => setSelectedSubject(subject)}
                tier={prog.tier}
                successPoints={prog.successPoints}
                isNotStarted={isNotStarted}
              />
            );
          })}
        </View>

        {/* Start Practice button */}
        <TouchableOpacity
          style={[styles.startButton, !selectedSubject && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={!selectedSubject}
          accessibilityRole="button"
          accessibilityLabel={locked.startButton}
          accessibilityState={{ disabled: !selectedSubject }}
        >
          <Text
            style={[styles.startButtonText, !selectedSubject && styles.startButtonTextDisabled]}
          >
            {locked.startButton}
          </Text>
        </TouchableOpacity>

        {/* Share link */}
        <TouchableOpacity
          style={styles.shareLink}
          onPress={async () => {
            const result = await shareApp();
            if (result === 'copied') setShowCopiedToast(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={locked.shareAppLink}
        >
          <Text style={styles.shareLinkText}>{locked.shareAppLink}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Reset confirm modal */}
      <ResetConfirmModal visible={resetModalVisible} onClose={() => setResetModalVisible(false)} />

      {/* Copied toast */}
      {showCopiedToast && <Toast message={locked.toastCopied} durationMs={2500} />}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginBottom: 32,
  },
  resetLink: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  wordmark: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  nameSection: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 24,
  },
  nameLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 12 : 14,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    outlineStyle: 'none',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  cardsSection: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 28,
  },
  startButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    minWidth: 220,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    color: colors.buttonPrimaryText,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  startButtonTextDisabled: {
    // subtle de-emphasis already handled by parent opacity
  },
  shareLink: {
    marginTop: 20,
  },
  shareLinkText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
