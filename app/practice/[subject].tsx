import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useQuestionBank } from '../../src/hooks/useQuestionBank';
import { useSessionReducer } from '../../src/hooks/useSessionReducer';
import { clearSeenIds, getSubjectProgress } from '../../src/lib/storage';
import { selectNextQuestion } from '../../src/lib/rotation';
import { QuestionPhase } from '../../src/screens/practice/QuestionPhase';
import type { Subject } from '../../src/types/domain';

const VALID_SUBJECTS: Subject[] = ['maths', 'english', 'economics'];

function isValidSubject(s: unknown): s is Subject {
  return VALID_SUBJECTS.includes(s as Subject);
}

export default function PracticeRoute() {
  const { subject: rawSubject } = useLocalSearchParams<{ subject: string }>();
  const subject = isValidSubject(rawSubject) ? rawSubject : 'maths';

  const { bank, isReady, error } = useQuestionBank();
  const [state, dispatch] = useSessionReducer(subject);

  // Track whether we've already dispatched LOADED to avoid double-dispatch in
  // React StrictMode / effect re-runs
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isReady || loadedRef.current) return;
    if (bank.length === 0) return;

    loadedRef.current = true;

    // Build a 10-question queue with in-session uniqueness
    const seenIds = getSubjectProgress(subject).seenQuestionIds;
    const queue = [];
    const inSessionIds: string[] = [];

    for (let i = 0; i < 10; i++) {
      try {
        const result = selectNextQuestion(bank, subject, seenIds, inSessionIds);
        // If rotation reset triggered, caller should clear seenIds in localStorage
        if (result.rotationReset) {
          clearSeenIds(subject);
        }
        queue.push(result.question);
        inSessionIds.push(result.question.id);
      } catch {
        // Not enough questions for this subject — break early
        break;
      }
    }

    if (queue.length > 0) {
      dispatch({ type: 'LOADED', queue });
    }
  }, [isReady, bank, subject, dispatch]);

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Could not load questions. Please check your connection and try again.</Text>
      </View>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (!isReady || state.phase === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ── Summary placeholder (Item 14 implements fully) ───────────────────────
  if (state.phase === 'summary') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, textAlign: 'center' }}>
          Summary coming in Item 14
        </Text>
        <Text style={{ marginTop: 8, color: '#666', textAlign: 'center' }}>
          Session complete — {state.outcomes.length} outcome(s) recorded.
        </Text>
      </View>
    );
  }

  // ── Question phase ───────────────────────────────────────────────────────
  return (
    <QuestionPhase
      state={state}
      dispatch={dispatch}
      bank={bank}
      subject={subject}
    />
  );
}
