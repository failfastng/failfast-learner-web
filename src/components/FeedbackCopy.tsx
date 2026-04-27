/**
 * FeedbackCopy — renders the feedback message below the option cards.
 *
 * Spec ref: spec.md > Question flow > FeedbackCopy
 * PRD ref: Stories 2.4 (wrong), 2.5 (failed-through), 2.6 (correct)
 *
 * Props:
 *   attempt  — which state to render copy for
 *   earnedPoints — only used when attempt === 'correct'
 *
 * Copy rules (CRITICAL):
 *   - No "Wrong" word rendered anywhere. Key name wrongCopyAttempt1 is internal.
 *   - No red. No shake. No buzzer.
 *   - failed-through copy has NO second sentence. Numbers do the work.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { getDisplayName } from '../lib/displayName';
import { locked } from '../copy/locked';

// ── Props ─────────────────────────────────────────────────────────────────────
type Attempt = 1 | 2 | 'failed-through' | 'correct';

type Props = {
  attempt: Attempt;
  earnedPoints?: number;
};

// ── Component ─────────────────────────────────────────────────────────────────
export function FeedbackCopy({ attempt, earnedPoints }: Props) {
  let copy: string;

  switch (attempt) {
    case 1:
      copy = locked.wrongCopyAttempt1.replace('[Name]', getDisplayName());
      break;
    case 2:
      copy = locked.wrongCopyAttempt2.replace('[Name]', getDisplayName());
      break;
    case 'failed-through':
      // No name interpolation. No second sentence. The number does the work.
      copy = locked.failedThroughCopy;
      break;
    case 'correct':
      copy = locked.correctCopy.replace('[X]', String(earnedPoints ?? 0));
      break;
    default:
      return null;
  }

  const isWrong = attempt === 1 || attempt === 2;
  const isResolved = attempt === 'failed-through' || attempt === 'correct';

  return (
    <Text
      style={[styles.base, isWrong && styles.wrong, isResolved && styles.resolved]}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
    >
      {copy}
    </Text>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  base: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 20,
    marginBottom: 4,
    color: '#444',
  },
  // Wrong attempts: slightly quieter, no color change — purely informational
  wrong: {
    color: '#555',
  },
  // Resolved states: slightly more prominent
  resolved: {
    color: '#333',
    fontWeight: '500',
  },
});
