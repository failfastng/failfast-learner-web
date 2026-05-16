import { useReducer } from 'react';
import { gritIncrementForWrongTap, scoreBranch } from '../lib/scoring';
import type { Outcome, Question, SessionState, Subject } from '../types/domain';

// ── Action union ──────────────────────────────────────────────────────────────
export type Action =
  | { type: 'LOADED'; queue: Question[] }
  | {
      type: 'TAP_OPTION';
      optionIndex: number;
      isCorrect: boolean;
      tapPosition?: { x: number; y: number };
    }
  | { type: 'NEXT_QUESTION' }
  | { type: 'OPEN_END_CONFIRM' }
  | { type: 'CLOSE_END_CONFIRM' }
  | { type: 'CONFIRM_END_SESSION' }
  | { type: 'OPEN_SKILLED_MODAL' }
  | { type: 'CLOSE_SKILLED_MODAL' }
  | { type: 'START_RECOMMENDED_SUBJECT'; subject: Subject };

// ── Helpers ───────────────────────────────────────────────────────────────────
function nowISO(): string {
  return new Date().toISOString();
}

export function makeInitialState(subject: Subject): SessionState {
  return {
    phase: 'loading',
    subject,
    questionQueue: [],
    currentIndex: 0,
    currentAttempt: 1,
    tappedWrongIndices: [],
    optionRevealed: false,
    lastResolution: 'pending',
    sessionSuccess: 0,
    sessionGrit: 0,
    outcomes: [],
    abandonedCount: 0,
    skilledFiredThisSession: false,
    endConfirmOpen: false,
    skilledModalOpen: false,
    startedAt: '',
    lastActivityAt: '',
  };
}

// ── Pure reducer ──────────────────────────────────────────────────────────────
// NO side effects inside. All localStorage writes and analytics POSTs live in
// useEffect hooks in QuestionPhase.tsx watching specific state slices.
// Exported for direct unit testing — see __tests__/sessionReducer.test.ts.
export function sessionReducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    // ── LOADED ──────────────────────────────────────────────────────────────
    case 'LOADED': {
      const now = nowISO();
      return {
        ...state,
        phase: 'question',
        questionQueue: action.queue.map((q) => q.id),
        currentIndex: 0,
        currentAttempt: 1,
        tappedWrongIndices: [],
        optionRevealed: false,
        lastResolution: 'pending',
        sessionSuccess: 0,
        sessionGrit: 0,
        outcomes: [],
        abandonedCount: 0,
        skilledFiredThisSession: false,
        startedAt: now,
        lastActivityAt: now,
      };
    }

    // ── TAP_OPTION ───────────────────────────────────────────────────────────
    case 'TAP_OPTION': {
      const { optionIndex, isCorrect } = action;

      // Guard: if already resolved, ignore further taps
      if (state.lastResolution !== 'pending') return state;

      // ── Correct tap ──────────────────────────────────────────────────────
      // scoreBranch returns the canonical per-question total. The wrong-tap
      // path has already booked some of that Grit incrementally; only the
      // residual is added here. wrongGritBooked map: 0/15/20 for 0/1/2 prior
      // wrong taps. Net effect — branch 0: +15 SP / +5 GP. Branch 1: +5 SP
      // / +0 GP (15 already booked). Branch 2: +3 SP / +0 GP (20 booked).
      if (isCorrect) {
        const wrongCount = state.tappedWrongIndices.length;
        const { success, grit } = scoreBranch(wrongCount);
        const wrongGritBooked = wrongCount === 0 ? 0 : wrongCount === 1 ? 15 : 20;
        const gritDelta = grit - wrongGritBooked;

        const outcomeLabel: Outcome =
          wrongCount === 0
            ? 'first_try_correct'
            : wrongCount === 1
              ? 'second_try_correct'
              : 'third_try_correct';

        return {
          ...state,
          sessionSuccess: state.sessionSuccess + success,
          sessionGrit: state.sessionGrit + gritDelta,
          lastResolution: 'correct',
          outcomes: [...state.outcomes, outcomeLabel],
          lastActivityAt: nowISO(),
        };
      }

      // ── Wrong tap ────────────────────────────────────────────────────────
      // Marginal Grit increments: 15 on 1st wrong, 5 on 2nd, 5 on 3rd.
      // Sums match canonical per-question totals (15 / 20 / 25).
      const wrongTapIndex = state.tappedWrongIndices.length as 0 | 1 | 2;
      const gritIncrement = gritIncrementForWrongTap(wrongTapIndex);
      const newWrongIndices = [...state.tappedWrongIndices, optionIndex];

      // 3rd wrong → failed-through
      if (wrongTapIndex === 2) {
        return {
          ...state,
          tappedWrongIndices: newWrongIndices,
          sessionGrit: state.sessionGrit + gritIncrement,
          optionRevealed: true,
          lastResolution: 'failed-through',
          outcomes: [...state.outcomes, 'failed_through'],
          lastActivityAt: nowISO(),
        };
      }

      // 1st or 2nd wrong
      return {
        ...state,
        tappedWrongIndices: newWrongIndices,
        sessionGrit: state.sessionGrit + gritIncrement,
        currentAttempt: (state.currentAttempt + 1) as 1 | 2 | 3,
        lastActivityAt: nowISO(),
      };
    }

    // ── NEXT_QUESTION ────────────────────────────────────────────────────────
    case 'NEXT_QUESTION': {
      if (state.currentIndex === 9) {
        return { ...state, phase: 'summary' };
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        currentAttempt: 1,
        tappedWrongIndices: [],
        optionRevealed: false,
        lastResolution: 'pending',
      };
    }

    // ── END CONFIRM MODAL ────────────────────────────────────────────────────
    case 'OPEN_END_CONFIRM':
      return { ...state, endConfirmOpen: true };

    case 'CLOSE_END_CONFIRM':
      return { ...state, endConfirmOpen: false };

    // ── CONFIRM_END_SESSION ──────────────────────────────────────────────────
    // If the current question has had wrong taps but isn't resolved → abandoned.
    // lastResolution guard: if the question is already resolved (correct or
    // failed-through), no abandoned entry — the outcome was already pushed.
    // Else (ended cleanly between questions), just transition to summary.
    case 'CONFIRM_END_SESSION': {
      const isAbandoned = state.tappedWrongIndices.length > 0 && state.lastResolution === 'pending';
      return {
        ...state,
        outcomes: isAbandoned ? [...state.outcomes, 'abandoned'] : state.outcomes,
        abandonedCount: isAbandoned ? state.abandonedCount + 1 : state.abandonedCount,
        lastActivityAt: nowISO(),
        phase: 'summary',
      };
    }

    // ── SKILLED MODAL ────────────────────────────────────────────────────────
    case 'OPEN_SKILLED_MODAL':
      return {
        ...state,
        skilledModalOpen: true,
        skilledFiredThisSession: true,
      };

    case 'CLOSE_SKILLED_MODAL':
      return { ...state, skilledModalOpen: false };

    // ── START_RECOMMENDED_SUBJECT ────────────────────────────────────────────
    // Resets session state for a new subject.
    // Does NOT clear seenQuestionIds for the new subject (per spec).
    case 'START_RECOMMENDED_SUBJECT':
      return {
        ...makeInitialState(action.subject),
        // Carry over nothing — fresh session for new subject
      };

    default:
      return state;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSessionReducer(subject: Subject): [SessionState, React.Dispatch<Action>] {
  return useReducer(sessionReducer, subject, makeInitialState);
}
