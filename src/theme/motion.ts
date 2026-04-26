// Animation duration constants — one file to retune during polish.
// Spec ref: spec.md > Theme & motion > src/theme/motion.ts

export const motion = {
  gritFloatMs: 600,           // Webtoons panel-transition pacing
  counterTickMs: 500,         // Points counter animated rise
  barTickMs: 500,             // Level-up bar fill tick per success point
  skilledModalDelayMs: 500,   // Delay before modal opens after correct-answer resolve
  skilledModalDurationMs: 2800, // End-to-end ritual; under 3 seconds (Apple ring close)
  skilledBadgeEaseMs: 400,
  transitionMs: 80,           // General transitions (sub-100ms latency — Linear)
} as const;
