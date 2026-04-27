import type { Outcome, Subject } from '../types/domain';

type VariantRender =
  | { variant: 'ALL_SKILLED'; renderState: 1 | 3 }
  | { variant: 'PERFECT'; recommendedSubject: Subject }
  | { variant: 'RECOVERY'; corrections: number; perfectTotal: number }
  | {
      variant: 'STRUGGLE';
      corrections: number;
      walkThroughs: number;
      perfectTotal: number;
      actualTotal: number;
    };

type SessionStats = {
  questionsAnswered: number;
  abandonedCount: number;
  success: number;
  grit: number;
  total: number;
  outcomes: Outcome[];
};

type TierState = Record<Subject, 'Rookie' | 'Skilled'>;

export function countCorrections(outcomes: Outcome[]): number {
  return outcomes.filter((o) => o === 'second_try_correct' || o === 'third_try_correct').length;
}

export function countWalkThroughs(outcomes: Outcome[]): number {
  return outcomes.filter((o) => o === 'failed_through').length;
}

export function selectSummaryVariant(
  stats: SessionStats,
  tierState: TierState,
  waitlistedAt: string | null,
  allProgress: Record<Subject, { successPoints: number }>, // for recommendedSubject calc
): VariantRender {
  // ALL_SKILLED runs FIRST — supersedes everything
  if (
    tierState.maths === 'Skilled' &&
    tierState.english === 'Skilled' &&
    tierState.economics === 'Skilled'
  ) {
    return { variant: 'ALL_SKILLED', renderState: waitlistedAt ? 3 : 1 };
  }

  const perfectTotal = stats.questionsAnswered * 20;
  const perfectSuccess = stats.questionsAnswered * 15;
  const perfectGrit = stats.questionsAnswered * 5;

  if (
    stats.questionsAnswered === 10 &&
    stats.success === perfectSuccess &&
    stats.grit === perfectGrit
  ) {
    // Recommended subject: lowest cumulative Success, Economics as tiebreaker.
    // Iterate economics-first so it wins on equal successPoints (strict < means
    // equal values never displace the incumbent).
    const subjects: Subject[] = ['maths', 'english', 'economics'];
    const nonSkilled = subjects.filter((s) => tierState[s] !== 'Skilled');
    const pool = nonSkilled.length > 0 ? nonSkilled : subjects;
    const preferenceOrder: Subject[] = ['economics', 'english', 'maths'];
    let recommended: Subject = 'economics';
    let minSuccess = Infinity;
    for (const s of preferenceOrder) {
      if (!pool.includes(s)) continue;
      const sp = allProgress[s].successPoints;
      if (sp < minSuccess) {
        minSuccess = sp;
        recommended = s;
      }
    }
    return { variant: 'PERFECT', recommendedSubject: recommended };
  }

  const corrections = countCorrections(stats.outcomes);

  if (stats.total === perfectTotal) {
    return { variant: 'RECOVERY', corrections, perfectTotal };
  }

  return {
    variant: 'STRUGGLE',
    corrections,
    walkThroughs: countWalkThroughs(stats.outcomes),
    perfectTotal,
    actualTotal: stats.total,
  };
}
