/**
 * EVERY user-facing string lives here, keyed and typed.
 * Components import by key — no inline strings.
 * Interpolation: [Name], [Subject], [N], [perfectTotal], [X], [link] are
 * replaced at render time by the component holding the value.
 */
export const locked = {
  // ── Start screen ──────────────────────────────────────────────────────────
  taglineCold: 'Practice that counts the effort, not just the answer.',
  explainerCold:
    'Every question gives you three tries. You earn points for getting it right, and you earn more points for the trying. Struggling counts.',
  nameFieldLabel: 'What should we call you?',
  nameFieldPlaceholder: 'Learner',
  subjectLabelMaths: 'Mathematics',
  subjectLabelEnglish: 'English',
  subjectLabelEconomics: 'Economics',
  subjectSubLabelMaths: 'Algebra, arithmetic, geometry',
  subjectSubLabelEnglish: 'Comprehension, grammar, vocabulary',
  subjectSubLabelEconomics: 'Micro, macro, trade',
  startButton: 'Start Practice',
  footerLine:
    'A preview of FailFast. Full platform launching soon — failfastng.com',
  resetLink: 'Reset progress',

  // ── Reset modal ───────────────────────────────────────────────────────────
  resetModalTitle: 'Reset your progress?',
  resetModalBody:
    'Reset your progress? This clears your tier progress across all subjects. It cannot be undone.',
  resetModalCancel: 'Keep going',
  resetModalConfirm: 'Reset',

  // ── End session modal ─────────────────────────────────────────────────────
  sessionEndTitle: 'End this session?',
  sessionEndBody:
    'End this session? Your score so far will still count toward your tier progress. You can pick this subject up again any time.',
  sessionEndKeepGoing: 'Keep going',
  sessionEndConfirm: 'End session',

  // ── Wrong-answer feedback ─────────────────────────────────────────────────
  // [Name] → getDisplayName()  |  N is hard-coded per attempt
  wrongCopyAttempt1: "That wasn't it, [Name]. You've got 2 attempts left.",
  wrongCopyAttempt2: "That wasn't it, [Name]. You've got 1 attempt left.",

  // ── Correct / failed-through ──────────────────────────────────────────────
  // [X] → awarded points
  correctCopy: 'You earned [X] points.',
  failedThroughCopy: 'You walked through every option. +25 Grit Points.',

  // ── Question flow controls ────────────────────────────────────────────────
  nextQuestionButton: 'Next Question',
  endSessionLink: 'End Session',

  // ── Level-up modal ────────────────────────────────────────────────────────
  levelUpModalTitle: 'You reached Skilled',
  // [Name] → getDisplayName()  |  [Subject] → subject label
  levelUpModalBody:
    '[Name], you just graduated from Rookie to Skilled in [Subject]. Your answers earned this.',
  levelUpModalContinue: 'Continue',

  // ── Summary variants ──────────────────────────────────────────────────────
  // These are populated here with the final spec copy; Item 14 may refine.
  perfectBody:
    'Every question, first try. That is not luck, that is knowledge you already have.\nYour Success Points outpaced your Grit Points by 3 to 1. That is mastery.\n\nNow try [Subject]. Unfamiliar ground is where the fail-forward mechanic actually pays off. See how it feels to earn points for getting it wrong.',
  recoveryBody:
    'You corrected yourself [N] times.\nA user who got every question right on the first try would have scored [perfectTotal].\nYou scored the same [perfectTotal]. Every mistake you made was fully recovered.\nThat is the fail-forward system working exactly as designed.',
  struggleBodyGritLed:
    'You corrected yourself [N] times. You walked through every option on [M] questions.\nA user who got every question right on the first try would have scored [perfectTotal].\nYou scored [X]. Your Grit outweighed your Success.\nThe struggle itself is what put you past [perfectTotal].',
  struggleBodySuccessLed:
    'You corrected yourself [N] times. You walked through every option on [M] questions.\nA user who got every question right on the first try would have scored [perfectTotal].\nYou scored [X]. The struggle itself is what put you past [perfectTotal].',
  allSkilledMilestoneBody:
    'You have now taken every subject to Skilled. That is the whole preview.\nA preview is what it is — a small slice of one idea, played through to its edges. You are at the edge.\n\nYou have seen what the preview can do. The full platform is next.',
  allSkilledMilestoneBodyShort:
    'You have now taken every subject to Skilled. That is the whole preview.\nA preview is what it is — a small slice of one idea, played through to its edges. You are at the edge.\n\nYou have seen what the preview can do. The full platform is next.',
  allSkilledMissionParagraph:
    "We're building something that treats effort as real currency — not just in practice, but in challenges, in stakes, in every way learning counts. Join the waitlist and we'll tell you when it's ready.",

  // ── Summary CTAs ──────────────────────────────────────────────────────────
  // [Subject] → recommended subject
  practiceAgainCTA: 'Practice again',
  pickASubjectCTA: 'Pick a subject →',
  tryDifferentSubjectLink: 'Try a different subject',
  shareAppLink: 'Share this app',
  startOverLink: 'Start over',
  backToStartLink: 'Back to start',

  // ── Waitlist ──────────────────────────────────────────────────────────────
  waitlistHeader: 'Want the full experience?',
  waitlistButton: 'Join the waitlist',
  waitlistDisclosure:
    "We'll email you when the full FailFast platform launches. No spam.",
  // [Name] → getDisplayName()
  waitlistThankYou:
    "Thanks, [Name]. You're on the list. We'll email you when the full platform launches.",
  waitlistShareButton: 'Share this app',

  // ── Toasts ────────────────────────────────────────────────────────────────
  toastCopied: 'Copied!',
  toastCouldNotReach: 'Could not reach the server. Try again?',
  toastQuotaExceeded:
    "We couldn't save your progress this session — clear private mode or allow storage to keep your tier progression",

  // ── Share ─────────────────────────────────────────────────────────────────
  shareText:
    'I just took a practice session on FailFast Learner. The app scored my effort as much as my correctness. Try it yourself: [link].',

  // ── Misc ──────────────────────────────────────────────────────────────────
  learnerFallback: 'Learner',
} as const;
