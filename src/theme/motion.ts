// Animation duration constants — one file to retune during polish.
// Spec ref: spec.md > Theme & motion > src/theme/motion.ts
// Anchor: Things 3 — subtle, purposeful, never distracting.

export const motion = {
  gritFloatMs: 500, // Webtoons panel-transition pacing; trimmed from 600 — snappier exit
  counterTickMs: 250, // Points counter animated rise — fast enough to feel live
  barTickMs: 250, // Level-up bar fill tick per success point — matches counter cadence
  skilledModalDelayMs: 500, // Delay before modal opens after correct-answer resolve
  skilledModalDurationMs: 2800, // End-to-end ritual; under 3 seconds (Apple ring close)
  skilledBadgeEaseMs: 350, // Trimmed from 400 — feels crisper on smaller badge
  transitionMs: 80, // General transitions (sub-100ms latency — Linear)
} as const;
