/**
 * QuestionPhase — the main question-flow screen.
 *
 * Component tree per spec.md > Question flow > QuestionPhase component tree:
 *   Placeholder PointsHeader
 *   SessionProgressBar (current index only — visual polish in Item 12)
 *   QuestionText
 *   OptionCard × 4
 *   End Session link (always visible)
 *
 * Items 9-12 add full feedback UI, animations, and modal choreography.
 *
 * Write-through side effect:
 *   Every time state.outcomes.length changes, the cumulative progress for
 *   the subject is updated in localStorage using a pre-session snapshot so
 *   we always write an ABSOLUTE value (stored_before_session + session_delta)
 *   rather than re-adding the running session total each time.
 */

import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useProgressStore } from '../../hooks/useProgressStore';
import { getSubjectProgress } from '../../lib/storage';
import { locked } from '../../copy/locked';
import type { Action } from '../../hooks/useSessionReducer';
import type { Question, SessionState, Subject } from '../../types/domain';

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
  bank: Question[];
  subject: Subject;
};

// ── Component ─────────────────────────────────────────────────────────────────
export function QuestionPhase({ state, dispatch, bank, subject }: Props) {
  const progressStore = useProgressStore();

  // Snapshot the pre-session cumulative totals once at mount so write-through
  // always computes ABSOLUTE cumulative = snapshot + session_running_total.
  // This prevents the bug where we'd add the full running session total on
  // every outcome event (doubling/tripling counts across writes).
  const preSessionSnapshotRef = useRef<{ successPoints: number; gritPoints: number } | null>(
    null
  );

  useEffect(() => {
    // Capture the baseline only once, before any outcomes are recorded
    if (preSessionSnapshotRef.current === null) {
      const pre = getSubjectProgress(subject);
      preSessionSnapshotRef.current = {
        successPoints: pre.successPoints,
        gritPoints: pre.gritPoints,
      };
    }
  }, [subject]);

  // Write-through: fires on every new outcome resolution
  useEffect(() => {
    if (state.outcomes.length === 0) return;
    const snapshot = preSessionSnapshotRef.current;
    if (snapshot === null) return;

    // Absolute cumulative = pre-session total + current session running total
    const absoluteSuccess = snapshot.successPoints + state.sessionSuccess;
    const absoluteGrit = snapshot.gritPoints + state.sessionGrit;
    const tier = absoluteSuccess >= 158 ? 'Skilled' : ('Rookie' as const);

    // Preserve seenQuestionIds — those are written separately (Item 10)
    const current = getSubjectProgress(subject);
    progressStore.writeSubjectProgress(subject, {
      ...current,
      successPoints: absoluteSuccess,
      gritPoints: absoluteGrit,
      tier,
    });
  }, [state.outcomes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive current question from the bank
  const currentQuestionId = state.questionQueue[state.currentIndex];
  const currentQuestion = bank.find((q) => q.id === currentQuestionId) ?? null;

  if (!currentQuestion) {
    return (
      <View style={styles.centered}>
        <Text>Loading question...</Text>
      </View>
    );
  }

  // ── Tap handler ─────────────────────────────────────────────────────────
  const handleOptionTap = (optionIndex: number) => {
    if (state.lastResolution !== 'pending') return;
    if (state.tappedWrongIndices.includes(optionIndex)) return;
    const isCorrect = optionIndex === currentQuestion.correct_index;
    dispatch({ type: 'TAP_OPTION', optionIndex, isCorrect });
  };

  // ── End Session ──────────────────────────────────────────────────────────
  const handleEndSession = () => {
    dispatch({ type: 'OPEN_END_CONFIRM' });
  };

  const handleConfirmEnd = () => {
    const noInteraction =
      state.outcomes.length === 0 && state.tappedWrongIndices.length === 0;
    dispatch({ type: 'CLOSE_END_CONFIRM' });
    if (noInteraction) {
      // Zero-interaction: go back to start, no summary, no analytics
      // (router.replace('/') is called from the route layer — for now dispatch nothing)
      // Item 13 wires the full router.replace('/') path
    } else {
      dispatch({ type: 'CONFIRM_END_SESSION' });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Placeholder PointsHeader — full implementation Items 9+11 */}
      <View style={styles.header} accessibilityRole="header">
        <Text style={styles.totalPoints}>
          {state.sessionSuccess + state.sessionGrit} pts
        </Text>
        <Text style={styles.subPoints}>
          Success: {state.sessionSuccess} · Grit: {state.sessionGrit}
        </Text>
      </View>

      {/* Session progress bar — visual polish Item 12 */}
      <View style={styles.progressBar} accessibilityLabel={`Question ${state.currentIndex + 1} of 10`}>
        {Array.from({ length: 10 }).map((_, i) => {
          const isResolved = i < state.outcomes.length;
          const isCurrent = i === state.currentIndex;
          return (
            <View
              key={i}
              style={[
                styles.progressSegment,
                isResolved && styles.progressSegmentResolved,
                isCurrent && !isResolved && styles.progressSegmentCurrent,
              ]}
            />
          );
        })}
      </View>

      {/* Question text */}
      <Text style={styles.questionText} accessibilityRole="text">
        {currentQuestion.question_text}
      </Text>

      {/* Option cards — no A/B/C/D labels per Story 2.3 */}
      <View style={styles.options}>
        {currentQuestion.options.map((option, index) => {
          const isWrong = state.tappedWrongIndices.includes(index);
          const isUntappable =
            isWrong ||
            state.lastResolution !== 'pending' ||
            state.optionRevealed;

          return (
            <Pressable
              key={index}
              style={[
                styles.optionCard,
                isWrong && styles.optionCardFaded,
                state.lastResolution === 'correct' &&
                  index === currentQuestion.correct_index &&
                  styles.optionCardCorrect,
                state.optionRevealed &&
                  index === currentQuestion.correct_index &&
                  styles.optionCardCorrect,
              ]}
              onPress={() => !isUntappable && handleOptionTap(index)}
              disabled={isUntappable}
              accessibilityLabel={option}
              accessibilityRole="button"
              accessibilityState={{ disabled: isUntappable }}
            >
              <Text style={[styles.optionText, isWrong && styles.optionTextFaded]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Next Question button — shown when question is resolved */}
      {state.lastResolution !== 'pending' && (
        <Pressable
          style={styles.nextButton}
          onPress={() => dispatch({ type: 'NEXT_QUESTION' })}
          accessibilityLabel={locked.nextQuestionButton}
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>{locked.nextQuestionButton}</Text>
        </Pressable>
      )}

      {/* End Session link — always visible */}
      <Pressable
        style={styles.endSessionLink}
        onPress={handleEndSession}
        accessibilityLabel={locked.endSessionLink}
        accessibilityRole="button"
      >
        <Text style={styles.endSessionText}>{locked.endSessionLink}</Text>
      </Pressable>

      {/* End Session Confirm Modal — stub; full implementation Item 13 */}
      {state.endConfirmOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{locked.sessionEndTitle}</Text>
            <Text style={styles.modalBody}>{locked.sessionEndBody}</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => dispatch({ type: 'CLOSE_END_CONFIRM' })}
                accessibilityLabel={locked.sessionEndKeepGoing}
                accessibilityRole="button"
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {locked.sessionEndKeepGoing}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleConfirmEnd}
                accessibilityLabel={locked.sessionEndConfirm}
                accessibilityRole="button"
              >
                <Text style={styles.modalButtonSecondaryText}>
                  {locked.sessionEndConfirm}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 8,
  },
  totalPoints: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  subPoints: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 24,
    marginTop: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  progressSegmentResolved: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  progressSegmentCurrent: {
    borderColor: '#999',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
    color: '#111',
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    padding: 16,
    backgroundColor: '#fafafa',
  },
  optionCardFaded: {
    opacity: 0.45,
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
  },
  optionCardCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0fff0',
  },
  optionText: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
  },
  optionTextFaded: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  nextButton: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  endSessionLink: {
    marginTop: 24,
    alignItems: 'center',
    padding: 8,
  },
  endSessionText: {
    color: '#999',
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#111',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonSecondaryText: {
    color: '#555',
    fontSize: 16,
  },
});
