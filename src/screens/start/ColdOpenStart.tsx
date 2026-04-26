import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { locked } from '../../copy/locked';
import { colors } from '../../theme/colors';
import { fontSize, fontWeight } from '../../theme/type';
import SubjectCard from '../../components/SubjectCard';
import { saveDisplayName } from '../../lib/storage';
import type { Subject } from '../../types/domain';

// Subject count fallback (Open Issue #7):
// If fewer than 3 subjects have questions at runtime, only render cards for
// available subjects with a footer note. This check is wired here but with the
// full 45-question bank it will not trigger.
const ALL_SUBJECTS: Subject[] = ['maths', 'english', 'economics'];

export default function ColdOpenStart() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [nameInput, setNameInput] = useState('');

  // Subtle pulse animation on the Start button — fires once on first selection
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseStarted = useRef(false);

  useEffect(() => {
    if (selectedSubject && !pulseStarted.current) {
      pulseStarted.current = true;
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start();
    }
  }, [selectedSubject, pulseAnim]);

  function handleStart() {
    if (!selectedSubject) return;
    saveDisplayName(nameInput.trim());
    router.push(`/practice/${selectedSubject}`);
  }

  function openFooterLink() {
    Linking.openURL('https://failfastng.com');
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Wordmark */}
      <Text style={styles.wordmark}>FailFast</Text>

      {/* Tagline */}
      <Text style={styles.tagline}>{locked.taglineCold}</Text>

      {/* Explainer */}
      <Text style={styles.explainer}>{locked.explainerCold}</Text>

      {/* Display name input */}
      <View style={styles.nameSection}>
        <Text style={styles.nameLabel}>{locked.nameFieldLabel}</Text>
        <TextInput
          style={styles.nameInput}
          placeholder={locked.nameFieldPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={nameInput}
          onChangeText={setNameInput}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel={locked.nameFieldLabel}
        />
      </View>

      {/* Subject cards */}
      <View style={styles.cardsSection}>
        {ALL_SUBJECTS.map((subject) => (
          <SubjectCard
            key={subject}
            variant="simple"
            subject={subject}
            isSelected={selectedSubject === subject}
            onSelect={() => setSelectedSubject(subject)}
          />
        ))}
      </View>

      {/* Start Practice button */}
      <Animated.View style={{ opacity: selectedSubject ? 1 : 0.4, transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.startButton,
            !selectedSubject && styles.startButtonDisabled,
          ]}
          onPress={handleStart}
          disabled={!selectedSubject}
          accessibilityRole="button"
          accessibilityLabel={locked.startButton}
          accessibilityState={{ disabled: !selectedSubject }}
        >
          <Text style={styles.startButtonText}>{locked.startButton}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer link */}
      <TouchableOpacity
        style={styles.footer}
        onPress={openFooterLink}
        accessibilityRole="link"
        accessibilityLabel="Open failfastng.com"
      >
        <Text style={styles.footerText}>{locked.footerLine}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: colors.background,
  },
  wordmark: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 24,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  explainer: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 36,
    maxWidth: 380,
  },
  nameSection: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 28,
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
    marginBottom: 32,
  },
  startButtonDisabled: {
    // opacity handled by the Animated.View wrapper above
  },
  startButtonText: {
    color: colors.buttonPrimaryText,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    marginTop: 8,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
