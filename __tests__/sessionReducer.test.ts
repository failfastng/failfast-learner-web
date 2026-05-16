/**
 * sessionReducer.test.ts — end-to-end branch coverage for the TAP_OPTION
 * action, locking in the canonical per-question scoring totals from
 * `failfast-learner/docs/prd.md > The Core Mechanic — Canonical Scoring`.
 *
 * Regression guard: prior to this test, the reducer DOUBLE-COUNTED grit by
 * adding +15 on each wrong tap AND then adding scoreBranch().grit on the
 * correct tap — inflating sessionGrit by 2× to 2.5× on every non-first-try
 * branch. The mid-question assertion (sessionGrit === 20 after two wrong
 * taps) is the load-bearing check.
 */

import { makeInitialState, sessionReducer } from '../src/hooks/useSessionReducer';
import type { Question } from '../src/types/domain';

// ── Fixture ──────────────────────────────────────────────────────────────────
function makeQuestion(id: string, correctIndex: number): Question {
  return {
    id,
    subject: 'maths',
    topic: 'test',
    difficulty: 'easy',
    question_text: 'q',
    options: ['a', 'b', 'c', 'd'],
    correct_index: correctIndex,
    source: 'test',
    explanation: '',
  };
}

function freshState() {
  const initial = makeInitialState('maths');
  return sessionReducer(initial, { type: 'LOADED', queue: [makeQuestion('q1', 0)] });
}

// ── Branch 1: first-try correct → 15 SP / 5 GP ───────────────────────────────
test('branch 1 — first-try correct awards 15 success / 5 grit', () => {
  const state = sessionReducer(freshState(), {
    type: 'TAP_OPTION',
    optionIndex: 0,
    isCorrect: true,
  });
  expect(state.sessionSuccess).toBe(15);
  expect(state.sessionGrit).toBe(5);
  expect(state.lastResolution).toBe('correct');
  expect(state.outcomes).toEqual(['first_try_correct']);
});

// ── Branch 2: wrong → correct → 5 SP / 15 GP ─────────────────────────────────
test('branch 2 — wrong then correct awards 5 success / 15 grit', () => {
  let s = freshState();
  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 1, isCorrect: false });
  expect(s.sessionGrit).toBe(15);
  expect(s.sessionSuccess).toBe(0);

  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 0, isCorrect: true });
  expect(s.sessionSuccess).toBe(5);
  expect(s.sessionGrit).toBe(15);
  expect(s.lastResolution).toBe('correct');
  expect(s.outcomes).toEqual(['second_try_correct']);
});

// ── Branch 3: wrong, wrong, correct → 3 SP / 20 GP ───────────────────────────
test('branch 3 — wrong, wrong, correct awards 3 success / 20 grit', () => {
  let s = freshState();
  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 1, isCorrect: false });
  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 2, isCorrect: false });

  // Mid-question regression guard: after 2 wrong taps, grit must be 20 (not 30).
  expect(s.sessionGrit).toBe(20);
  expect(s.sessionSuccess).toBe(0);
  expect(s.lastResolution).toBe('pending');

  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 0, isCorrect: true });
  expect(s.sessionSuccess).toBe(3);
  expect(s.sessionGrit).toBe(20);
  expect(s.lastResolution).toBe('correct');
  expect(s.outcomes).toEqual(['third_try_correct']);
});

// ── Branch 4: failed-through (wrong x3) → 0 SP / 25 GP ───────────────────────
test('branch 4 — failed-through awards 0 success / 25 grit', () => {
  let s = freshState();
  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 1, isCorrect: false });
  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 2, isCorrect: false });
  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 3, isCorrect: false });

  expect(s.sessionSuccess).toBe(0);
  expect(s.sessionGrit).toBe(25);
  expect(s.lastResolution).toBe('failed-through');
  expect(s.optionRevealed).toBe(true);
  expect(s.outcomes).toEqual(['failed_through']);
});

// ── Marginal wrong-tap increments (15, 5, 5) ─────────────────────────────────
test('wrong-tap increments are 15, then 5, then 5 (sum = 25)', () => {
  let s = freshState();
  expect(s.sessionGrit).toBe(0);

  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 1, isCorrect: false });
  expect(s.sessionGrit).toBe(15);

  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 2, isCorrect: false });
  expect(s.sessionGrit).toBe(20);

  s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: 3, isCorrect: false });
  expect(s.sessionGrit).toBe(25);
});

// ── Floor property holds across reducer outputs ──────────────────────────────
test('floor property — every resolved per-question outcome has SP + GP >= 20', () => {
  const cases: Array<{ wrongs: number[]; correct: number | null }> = [
    { wrongs: [], correct: 0 }, // branch 1
    { wrongs: [1], correct: 0 }, // branch 2
    { wrongs: [1, 2], correct: 0 }, // branch 3
    { wrongs: [1, 2, 3], correct: null }, // branch 4 (failed-through)
  ];
  for (const c of cases) {
    let s = freshState();
    for (const w of c.wrongs) {
      s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: w, isCorrect: false });
    }
    if (c.correct !== null) {
      s = sessionReducer(s, { type: 'TAP_OPTION', optionIndex: c.correct, isCorrect: true });
    }
    expect(s.sessionSuccess + s.sessionGrit).toBeGreaterThanOrEqual(20);
  }
});
