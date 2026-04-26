import { useReducer } from 'react';
import { scoreBranch } from '../lib/scoring';
import type { Outcome, Question, SessionState, Subject } from '../types/domain';

// ── Action union ──────────────────────────────────────────────────────────────
export type Action =
  | { type: 'LOADED'; queue: Question[] }
  | { type: 'TAP_OPTION'; optionIndex: number; isCorrect: boolean; tapPosition?: { x: number; y: number } }
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

function makeInitialState(subject: Subject): SessionState {
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
function sessionReducer(state: SessionState, action: Action): SessionState {
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
      if (isCorrect) {
        const { success, grit } = scoreBranch(state.tappedWrongIndices.length);

        const outcomeLabel: Outcome =
          state.tappedWrongIndices.length === 0
            ? 'first_try_correct'
            : state.tappedWrongIndices.length === 1
              ? 'second_try_correct'
              : 'third_try_correct';

        return {
          ...state,
          sessionSuccess: state.sessionSuccess + success,
          sessionGrit: state.sessionGrit + grit,
          lastResolution: 'correct',
          outcomes: [...state.outcomes, outcomeLabel],
          lastActivityAt: nowISO(),
        };
      }

      // ── Wrong tap ────────────────────────────────────────────────────────
      const newWrongIndices = [...state.tappedWrongIndices, optionIndex];

      // Wrong tap, attempt 3 (this is the 3rd wrong — tappedWrongIndices was length 2)
      if (state.tappedWrongIndices.length === 2) {
        return {
          ...state,
          tappedWrongIndices: newWrongIndices,
          sessionGrit: state.sessionGrit + 25,
          optionRevealed: true,
          lastResolution: 'failed-through',
          outcomes: [...state.outcomes, 'failed_through'],
          lastActivityAt: nowISO(),
        };
      }

      // Wrong tap, attempt 1 or 2
      return {
        ...state,
        tappedWrongIndices: newWrongIndices,
        sessionGrit: state.sessionGrit + 15,
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
    // If the current question has had wrong taps (mid-attempt, unresolved),
    // push 'abandoned' to outcomes and increment abandonedCount.
    // Else (ended cleanly between questions), just transition to summary.
    case 'CONFIRM_END_SESSION': {
      const hasWrongTapsOnCurrent = state.tappedWrongIndices.length > 0;
      return {
        ...state,
        outcomes: hasWrongTapsOnCurrent
          ? [...state.outcomes, 'abandoned']
          : state.outcomes,
        abandonedCount: hasWrongTapsOnCurrent
          ? state.abandonedCount + 1
          : state.abandonedCount,
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
