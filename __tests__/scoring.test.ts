/**
 * scoring.test.ts — 6 tests per spec.md > Testing > Client
 *
 * Tests:
 *  1. 0 wrong → { success: 15, grit: 5 }
 *  2. 1 wrong → { success: 5, grit: 15 }
 *  3. 2 wrong → { success: 3, grit: 20 }
 *  4. failed-through (3 wrong) → { success: 0, grit: 25 }
 *  5. Floor property: every resolved outcome has total ≥ 20
 *  6. Edge: scoreBranch(0).success + scoreBranch(0).grit === 20
 */

import { scoreBranch } from '../src/lib/scoring';

// ── Test 1 ────────────────────────────────────────────────────────────────────
test('scoreBranch(0) → 15 success / 5 grit (first-try correct)', () => {
  const result = scoreBranch(0);
  expect(result.success).toBe(15);
  expect(result.grit).toBe(5);
});

// ── Test 2 ────────────────────────────────────────────────────────────────────
test('scoreBranch(1) → 5 success / 15 grit (second-try correct)', () => {
  const result = scoreBranch(1);
  expect(result.success).toBe(5);
  expect(result.grit).toBe(15);
});

// ── Test 3 ────────────────────────────────────────────────────────────────────
test('scoreBranch(2) → 3 success / 20 grit (third-try correct)', () => {
  const result = scoreBranch(2);
  expect(result.success).toBe(3);
  expect(result.grit).toBe(20);
});

// ── Test 4 ────────────────────────────────────────────────────────────────────
test('scoreBranch(3) → 0 success / 25 grit (failed-through)', () => {
  const result = scoreBranch(3);
  expect(result.success).toBe(0);
  expect(result.grit).toBe(25);
});

// ── Test 5 — Floor property ───────────────────────────────────────────────────
test('floor property: every resolved outcome has success + grit >= 20', () => {
  // Branches 0, 1, 2, 3 → totals: 20, 20, 23, 25 — all >= 20
  const totals = [0, 1, 2, 3].map((w) => {
    const { success, grit } = scoreBranch(w);
    return success + grit;
  });
  totals.forEach((total) => {
    expect(total).toBeGreaterThanOrEqual(20);
  });
});

// ── Test 6 — Edge ─────────────────────────────────────────────────────────────
test('edge: scoreBranch(0).success + scoreBranch(0).grit === 20', () => {
  const { success, grit } = scoreBranch(0);
  expect(success + grit).toBe(20);
});
