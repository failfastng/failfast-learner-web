/**
 * Canonical scoring per prd.md > Core Mechanic
 *
 * Branch table:
 *   0 wrong before → 15 success / 5 grit  (total 20)
 *   1 wrong before → 5 success / 15 grit  (total 20)
 *   2 wrong before → 3 success / 20 grit  (total 23)
 *   failed-through → 0 success / 25 grit  (total 25)
 *
 * Floor property: every resolved outcome has success + grit >= 20.
 */

export type ScoreResult = { success: number; grit: number };

/**
 * Returns the Success/Grit split for a correct answer.
 * `wrongAttemptsBefore` is the number of wrong taps taken before the correct tap.
 * Range: 0, 1, or 2.
 *
 * For the failed-through branch (3 wrong), use scoreBranch is NOT called —
 * the reducer applies 0/25 directly. This function only handles correct resolutions.
 *
 * Tests call scoreBranch(3) as a proxy for the failed-through constant;
 * to support that test idiom we handle 3 -> 0/25 here as well.
 */
export function scoreBranch(wrongAttemptsBefore: number): ScoreResult {
  switch (wrongAttemptsBefore) {
    case 0:
      return { success: 15, grit: 5 };
    case 1:
      return { success: 5, grit: 15 };
    case 2:
      return { success: 3, grit: 20 };
    default:
      // 3 or more wrong (failed-through branch)
      return { success: 0, grit: 25 };
  }
}

/**
 * Marginal Grit booked on a wrong tap.
 *   0 -> 1st wrong tap -> 15
 *   1 -> 2nd wrong tap -> 5
 *   2 -> 3rd wrong tap (failed-through) -> 5
 *
 * Increments sum to the canonical per-question Grit totals (15, 20, 25).
 * The TAP_OPTION reducer pairs this with a residual top-up on the correct
 * tap so per-question Grit always lands on the canonical scoreBranch totals.
 */
export function gritIncrementForWrongTap(wrongTapIndex: 0 | 1 | 2): number {
  return wrongTapIndex === 0 ? 15 : 5;
}
