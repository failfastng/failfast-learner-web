import { selectSummaryVariant, countCorrections, countWalkThroughs } from '../src/lib/summary';
import type { Subject } from '../src/types/domain';

const ROOKIE_ALL = { maths: 'Rookie', english: 'Rookie', economics: 'Rookie' } as Record<Subject, 'Rookie' | 'Skilled'>;
const SKILLED_ALL = { maths: 'Skilled', english: 'Skilled', economics: 'Skilled' } as Record<Subject, 'Rookie' | 'Skilled'>;
const ZERO_PROGRESS = { maths: { successPoints: 0 }, english: { successPoints: 0 }, economics: { successPoints: 0 } };

describe('selectSummaryVariant', () => {
  // 1. PERFECT happy path
  test('PERFECT: 10Q all first-try → PERFECT with recommended subject', () => {
    const outcomes = Array(10).fill('first_try_correct');
    const result = selectSummaryVariant(
      { questionsAnswered: 10, abandonedCount: 0, success: 150, grit: 50, total: 200, outcomes },
      ROOKIE_ALL, null, ZERO_PROGRESS
    );
    expect(result.variant).toBe('PERFECT');
    if (result.variant === 'PERFECT') {
      expect(['maths', 'english', 'economics']).toContain(result.recommendedSubject);
    }
  });

  // 2. RECOVERY
  test('RECOVERY: total === perfectTotal, not PERFECT', () => {
    const outcomes = ['second_try_correct', ...Array(9).fill('first_try_correct')];
    const result = selectSummaryVariant(
      { questionsAnswered: 10, abandonedCount: 0, success: 135, grit: 65, total: 200, outcomes },
      ROOKIE_ALL, null, ZERO_PROGRESS
    );
    expect(result.variant).toBe('RECOVERY');
    if (result.variant === 'RECOVERY') {
      expect(result.corrections).toBe(1);
      expect(result.perfectTotal).toBe(200);
    }
  });

  // 3. STRUGGLE
  test('STRUGGLE: total > perfectTotal', () => {
    const outcomes = ['failed_through', 'failed_through', ...Array(8).fill('first_try_correct')];
    const result = selectSummaryVariant(
      { questionsAnswered: 10, abandonedCount: 0, success: 120, grit: 130, total: 250, outcomes },
      ROOKIE_ALL, null, ZERO_PROGRESS
    );
    expect(result.variant).toBe('STRUGGLE');
    if (result.variant === 'STRUGGLE') {
      expect(result.walkThroughs).toBe(2);
      expect(result.actualTotal).toBe(250);
    }
  });

  // 4. ALL_SKILLED state 1 (waitlistedAt null)
  test('ALL_SKILLED state 1: all Skilled, waitlistedAt null', () => {
    const result = selectSummaryVariant(
      { questionsAnswered: 10, abandonedCount: 0, success: 150, grit: 50, total: 200, outcomes: Array(10).fill('first_try_correct') },
      SKILLED_ALL, null, ZERO_PROGRESS
    );
    expect(result).toEqual({ variant: 'ALL_SKILLED', renderState: 1 });
  });

  // 5. ALL_SKILLED state 3 (waitlistedAt set)
  test('ALL_SKILLED state 3: all Skilled, waitlistedAt set', () => {
    const result = selectSummaryVariant(
      { questionsAnswered: 10, abandonedCount: 0, success: 150, grit: 50, total: 200, outcomes: Array(10).fill('first_try_correct') },
      SKILLED_ALL, '2026-04-01T00:00:00Z', ZERO_PROGRESS
    );
    expect(result).toEqual({ variant: 'ALL_SKILLED', renderState: 3 });
  });

  // 6. Partial session (questionsAnswered < 10)
  test('partial session: 7Q, STRUGGLE', () => {
    const outcomes = Array(7).fill('failed_through');
    const result = selectSummaryVariant(
      { questionsAnswered: 7, abandonedCount: 0, success: 0, grit: 175, total: 175, outcomes },
      ROOKIE_ALL, null, ZERO_PROGRESS
    );
    expect(result.variant).toBe('STRUGGLE');
    if (result.variant === 'STRUGGLE') expect(result.perfectTotal).toBe(140);
  });

  // 7. Abandoned-question adjustment
  test('abandoned: questionsAnswered=9, abandonedCount=1 → STRUGGLE perfectTotal=180', () => {
    const outcomes = [...Array(9).fill('first_try_correct'), 'abandoned'];
    const result = selectSummaryVariant(
      { questionsAnswered: 9, abandonedCount: 1, success: 135, grit: 45, total: 180, outcomes },
      ROOKIE_ALL, null, ZERO_PROGRESS
    );
    // 9 answered * 20 = 180; success=135, grit=45 → PERFECT
    expect(result.variant).toBe('PERFECT');
  });

  // 8. ALL_SKILLED supersedes PERFECT
  test('ALL_SKILLED supersedes PERFECT', () => {
    const result = selectSummaryVariant(
      { questionsAnswered: 10, abandonedCount: 0, success: 150, grit: 50, total: 200, outcomes: Array(10).fill('first_try_correct') },
      SKILLED_ALL, null, ZERO_PROGRESS
    );
    expect(result.variant).toBe('ALL_SKILLED');
  });

  // 9. ALL_SKILLED supersedes STRUGGLE
  test('ALL_SKILLED supersedes STRUGGLE', () => {
    const result = selectSummaryVariant(
      { questionsAnswered: 10, abandonedCount: 0, success: 0, grit: 250, total: 250, outcomes: Array(10).fill('failed_through') },
      SKILLED_ALL, null, ZERO_PROGRESS
    );
    expect(result.variant).toBe('ALL_SKILLED');
  });

  // 10. ALL_SKILLED supersedes RECOVERY
  test('ALL_SKILLED supersedes RECOVERY', () => {
    const result = selectSummaryVariant(
      { questionsAnswered: 10, abandonedCount: 0, success: 135, grit: 65, total: 200, outcomes: ['second_try_correct', ...Array(9).fill('first_try_correct')] },
      SKILLED_ALL, null, ZERO_PROGRESS
    );
    expect(result.variant).toBe('ALL_SKILLED');
  });

  // 11. ALL_SKILLED fires on partial session when all three Skilled
  test('ALL_SKILLED fires on partial session (7Q) when all three Skilled', () => {
    const result = selectSummaryVariant(
      { questionsAnswered: 7, abandonedCount: 0, success: 105, grit: 35, total: 140, outcomes: Array(7).fill('first_try_correct') },
      SKILLED_ALL, null, ZERO_PROGRESS
    );
    expect(result).toEqual({ variant: 'ALL_SKILLED', renderState: 1 });
  });
});
