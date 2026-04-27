import type { Question, Subject } from '../types/domain';

export type RotationResult = {
  question: Question;
  rotationReset: boolean;
};

/**
 * Selects the next question for a session.
 *
 * Pure function — no side effects.
 * Caller is responsible for:
 *   - clearing `seenQuestionIds[subject]` in localStorage when `rotationReset === true`
 *   - updating `inSessionIds` with the returned question's id before the next call
 */
export function selectNextQuestion(
  bank: Question[],
  subject: Subject,
  seenIds: string[],
  inSessionIds: string[],
): RotationResult {
  const candidates = bank.filter(
    (q) => q.subject === subject && !seenIds.includes(q.id) && !inSessionIds.includes(q.id),
  );

  if (candidates.length === 0) {
    // Exhaustion: clear seenIds and recurse once (rotationReset = true)
    const reset = selectNextQuestion(bank, subject, [], inSessionIds);
    return { question: reset.question, rotationReset: true };
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { question: pick, rotationReset: false };
}
