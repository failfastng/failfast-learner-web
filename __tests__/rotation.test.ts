/**
 * rotation.test.ts — 3 tests per spec.md > Testing > Client
 *
 * Tests:
 *  1. Normal pick: returns a question not in seenIds or inSessionIds
 *  2. Exhaustion reset: when all questions are seen, picks from cleared set
 *     and sets rotationReset: true
 *  3. In-session uniqueness: does not return a question already in inSessionIds
 */

import { selectNextQuestion } from '../src/lib/rotation';
import type { Question } from '../src/types/domain';

// ── Test fixtures ─────────────────────────────────────────────────────────────
function makeQuestion(id: string): Question {
  return {
    id,
    subject: 'maths',
    topic: 'algebra',
    difficulty: 'medium',
    question_text: `Question ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correct_index: 0,
    source: 'test',
  };
}

const bank: Question[] = [
  makeQuestion('q1'),
  makeQuestion('q2'),
  makeQuestion('q3'),
  makeQuestion('q4'),
  makeQuestion('q5'),
];

// ── Test 1: Normal pick ───────────────────────────────────────────────────────
test('normal pick: returns a question not in seenIds or inSessionIds', () => {
  const seenIds = ['q1', 'q2'];
  const inSessionIds = ['q3'];

  const result = selectNextQuestion(bank, 'maths', seenIds, inSessionIds);

  expect(result.rotationReset).toBe(false);
  expect(['q4', 'q5']).toContain(result.question.id);
  expect(seenIds).not.toContain(result.question.id);
  expect(inSessionIds).not.toContain(result.question.id);
});

// ── Test 2: Exhaustion reset ──────────────────────────────────────────────────
test('exhaustion reset: when all questions seen, picks from cleared set and sets rotationReset: true', () => {
  // All 5 questions are "seen"
  const seenIds = ['q1', 'q2', 'q3', 'q4', 'q5'];
  const inSessionIds: string[] = [];

  const result = selectNextQuestion(bank, 'maths', seenIds, inSessionIds);

  expect(result.rotationReset).toBe(true);
  // Should have picked a question from the full bank (seenIds cleared on recurse)
  expect(bank.map((q) => q.id)).toContain(result.question.id);
});

// ── Test 3: In-session uniqueness ─────────────────────────────────────────────
test('in-session uniqueness: does not return a question already in inSessionIds', () => {
  const seenIds: string[] = [];
  // q1–q4 are already in session
  const inSessionIds = ['q1', 'q2', 'q3', 'q4'];

  const result = selectNextQuestion(bank, 'maths', seenIds, inSessionIds);

  expect(result.rotationReset).toBe(false);
  expect(result.question.id).toBe('q5');
  expect(inSessionIds).not.toContain(result.question.id);
});
