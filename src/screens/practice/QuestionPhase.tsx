/**
 * QuestionPhase — the main question-flow screen.
 *
 * Spec ref: spec.md > Question flow > QuestionPhase component tree
 * PRD ref: Epic 2 (Stories 2.1–2.8), Epic 3 (Story 3.1)
 *
 * Items 9 + 10: full feedback UI — GritFloat, OptionCard states,
 * FeedbackCopy, PointsHeader with AttemptCounter, NextQuestionButton,
 * markQuestionSeen side effect.
 *
 * Write-through side effect:
 *   Every time state.outcomes.length changes, the cumulative progress for
 *   the subject is updated in localStorage using a pre-session snapshot so
 *   we always write an ABSOLUTE value (stored_before_session + session_delta)
 *   rather than re-adding the running session total each time.
 *
 * GritFloat is positioned absolutely inside the ScrollView's content area.
 * On web, tap coordinates from the press event are relative to the viewport,
 * but since the float is inside the ScrollView with position:absolute it
 * tracks the tap visually well enough given the short 600ms animation.
 */

import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useProgressStore } from '../../hooks/useProgressStore';
import { getSubjectProgress, markQuestionSeen } from '../../lib/storage';
import { locked } from '../../copy/locked';
import { scoreBranch } from '../../lib/scoring';
import type { Action } from '../../hooks/useSessionReducer';
import type { Question, SessionState, Subject } from '../../types/domain';

import { FeedbackCopy } from '../../components/FeedbackCopy';
import { GritFloat, type GritFloatRef } from '../../components/GritFloat';
import { OptionCard } from '../../components/OptionCard';
import { PointsHeader } from '../../components/PointsHeader';

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
  const router = useRouter();

  // Snapshot the pre-session cumulative totals once at mount so write-through
  // always computes ABSOLUTE cumulative = snapshot + session_running_total.
  const preSessionSnapshotRef = useRef<{ successPoints: number; gritPoints: number } | null>(null);

  // Last tap position for GritFloat
  const lastTapPosition = useRef<{ x: number; y: number }>({ x: 100, y: 300 });

  // GritFloat ref
  const gritFloatRef = useRef<GritFloatRef>(null);

  // ── One-time pre-session snapshot ──────────────────────────────────────────
  useEffect(() => {
    if (preSessionSnapshotRef.current === null) {
      const pre = getSubjectProgress(subject);
      preSessionSnapshotRef.current = {
        successPoints: pre.successPoints,
        gritPoints: pre.gritPoints,
      };
    }
  }, [subject]);

  // ── Write-through: fires on every new outcome resolution ──────────────────
  useEffect(() => {
    if (state.outcomes.length === 0) return;
    const snapshot = preSessionSnapshotRef.current;
    if (snapshot === null) return;

    const absoluteSuccess = snapshot.successPoints + state.sessionSuccess;
    const absoluteGrit = snapshot.gritPoints + state.sessionGrit;
    const tier = absoluteSuccess >= 158 ? 'Skilled' : ('Rookie' as const);

    const current = getSubjectProgress(subject);
    progressStore.writeSubjectProgress(subject, {
      ...current,
      successPoints: absoluteSuccess,
      gritPoints: absoluteGrit,
      tier,
    });
  }, [state.outcomes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── GritFloat: fire on each wrong tap ────────────────────────────────────
  useEffect(() => {
    if (state.tappedWrongIndices.length > 0 && state.lastResolution === 'pending') {
      gritFloatRef.current?.fire(lastTapPosition.current, '+15 Grit Points for trying');
    }
  }, [state.tappedWrongIndices.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── GritFloat: fire on failed-through ────────────────────────────────────
  useEffect(() => {
    if (state.lastResolution === 'failed-through') {
      gritFloatRef.current?.fire(lastTapPosition.current, '+25 Grit Points');
    }
  }, [state.lastResolution]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── markQuestionSeen: fires on any resolution (correct OR failed-through) ─
  // Per Story 2.8: abandoned questions are NOT marked seen.
  useEffect(() => {
    if (state.lastResolution !== 'pending') {
      const currentQuestionId = state.questionQueue[state.currentIndex];
      if (currentQuestionId) {
        markQuestionSeen(subject, currentQuestionId);
      }
    }
  }, [state.lastResolution]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive current question ───────────────────────────────────────────────
  const currentQuestionId = state.questionQueue[state.currentIndex];
  const currentQuestion = bank.find((q) => q.id === currentQuestionId) ?? null;

  if (!currentQuestion) {
    return (
      <View style={styles.centered}>
        <Text>Loading question...</Text>
      </View>
    );
  }

  // ── Scored points for correct-answer FeedbackCopy ─────────────────────────
  const { success: earnedSuccess, grit: earnedGrit } = scoreBranch(
    state.tappedWrongIndices.length
  );
  const earnedPoints = earnedSuccess + earnedGrit;

  // ── FeedbackCopy attempt value ────────────────────────────────────────────
  type FeedbackAttempt = 1 | 2 | 'failed-through' | 'correct';
  let feedbackAttempt: FeedbackAttempt | null = null;

  if (state.lastResolution === 'correct') {
    feedbackAttempt = 'correct';
  } else if (state.lastResolution === 'failed-through') {
    feedbackAttempt = 'failed-through';
  } else if (state.tappedWrongIndices.length === 1) {
    feedbackAttempt = 1;
  } else if (state.tappedWrongIndices.length >= 2) {
    feedbackAttempt = 2;
  }

  // ── Tap handler ──────────────────────────────────────────────────────────
  const handleOptionTap = (optionIndex: number, event?: { nativeEvent?: { pageX?: number; pageY?: number } }) => {
    if (state.lastResolution !== 'pending') return;
    if (state.tappedWrongIndices.includes(optionIndex)) return;

    // Capture tap position for GritFloat
    if (event?.nativeEvent) {
      lastTapPosition.current = {
        x: event.nativeEvent.pageX ?? 100,
        y: event.nativeEvent.pageY ?? 300,
      };
    }

    const isCorrect = optionIndex === currentQuestion.correct_index;
    dispatch({
      type: 'TAP_OPTION',
      optionIndex,
      isCorrect,
      tapPosition: lastTapPosition.current,
    });
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
      // Zero-interaction: no summary phase, no analytics POST.
      // router.replace ensures the practice route is removed from history
      // so Back doesn't return to a stale session.
      router.replace('/');
    } else {
      dispatch({ type: 'CONFIRM_END_SESSION' });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* PointsHeader — animated counters, attempt counter */}
        <PointsHeader
          sessionSuccess={state.sessionSuccess}
          sessionGrit={state.sessionGrit}
          tappedWrongCount={state.tappedWrongIndices.length}
          currentAttempt={state.currentAttempt}
          lastResolution={state.lastResolution}
        />

        {/* Session progress bar — 10 segments */}
        <View
          style={styles.progressBar}
          accessibilityLabel={`Question ${state.currentIndex + 1} of 10`}
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const outcome = i < state.outcomes.length ? state.outcomes[i] : null;
            const isResolved = outcome !== null && outcome !== 'abandoned';
            const isAbandoned = outcome === 'abandoned';
            const isCurrent = i === state.currentIndex;
            return (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  isResolved && styles.progressSegmentResolved,
                  isAbandoned && styles.progressSegmentAbandoned,
                  isCurrent && !isResolved && !isAbandoned && styles.progressSegmentCurrent,
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
            const isTappedWrong = state.tappedWrongIndices.includes(index);
            const isCorrect = index === currentQuestion.correct_index;

            // When revealed, disable all; when tappedWrong, disable that card
            const isDisabled =
              isTappedWrong ||
              state.lastResolution !== 'pending' ||
              state.optionRevealed;

            return (
              <OptionCard
                key={index}
                text={option}
                isTappedWrong={isTappedWrong}
                isRevealed={state.optionRevealed || state.lastResolution === 'correct'}
                isCorrect={isCorrect}
                onPress={isDisabled ? undefined : (e) => handleOptionTap(index, e)}
                accessibilityLabel={option}
              />
            );
          })}
        </View>

        {/* FeedbackCopy — shown after first tap on wrong, or on resolution */}
        {feedbackAttempt !== null && (
          <FeedbackCopy
            attempt={feedbackAttempt}
            earnedPoints={state.lastResolution === 'correct' ? earnedPoints : undefined}
          />
        )}

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

        {/* End Session Confirm Modal */}
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

        {/* Spacer so GritFloat doesn't clip */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* GritFloat — absolute, pointer-events none, z-index 999 */}
      {/* Rendered outside ScrollView so position is relative to wrapper, not scroll */}
      <GritFloat ref={gritFloatRef} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
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
  progressSegmentAbandoned: {
    backgroundColor: '#e0e0e0',
    borderColor: '#bbb',
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
  bottomSpacer: {
    height: 24,
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
