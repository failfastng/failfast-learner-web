import { scoreBranch } from './scoring';
import { getSessionId, getWaitlistedAt } from './storage';
import { getClickedShare } from './share';
import type { SessionState, Subject } from '../types/domain';

// ── Payload types ─────────────────────────────────────────────────────────────

type QuestionOutcomePayload = {
  question_id: string;
  outcome: string;
  success_points_earned: number;
  grit_points_earned: number;
  resolved_at: string;
};

type SessionEndPayload = {
  session_uuid: string;
  display_name_hash: string;
  subject: string;
  started_at: string;
  last_activity_at: string;
  ended_at: string;
  ended_early: boolean;
  questions_answered: number;
  questions_abandoned: number;
  total_points: number;
  success_points: number;
  grit_points: number;
  completed_waitlist_signup: boolean;
  clicked_share: boolean;
  outcomes: QuestionOutcomePayload[];
};

// ── Fire-and-forget POSTs ─────────────────────────────────────────────────────

export function postSessionEnd(payload: SessionEndPayload): void {
  fetch(`${process.env.EXPO_PUBLIC_API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => console.warn('[analytics] sessions POST failed', err));
}

export function postResetEvent(session_uuid: string): void {
  fetch(`${process.env.EXPO_PUBLIC_API_BASE}/events/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_uuid }),
  }).catch((err) => console.warn('[analytics] reset POST failed', err));
}

export function postShareEvent(session_uuid: string): void {
  fetch(`${process.env.EXPO_PUBLIC_API_BASE}/events/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_uuid }),
  }).catch((err) => console.warn('[analytics] share POST failed', err));
}

export function postReview(text: string, source: 'summary' | 'returning_start'): void {
  fetch(`${process.env.EXPO_PUBLIC_API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_uuid: getSessionId(), text, source }),
  }).catch((err) => console.warn('[analytics] review POST failed', err));
}

// ── Build payload ─────────────────────────────────────────────────────────────

export function buildSessionEndPayload(
  state: SessionState,
  subject: Subject,
  displayNameHash: string,
  sessionStartWaitlistedAt: string | null,
): SessionEndPayload {
  const endedAt = new Date().toISOString();
  const questionsAnswered = state.outcomes.filter((o) => o !== 'abandoned').length;
  const completedWaitlistSignup = getWaitlistedAt() !== null && sessionStartWaitlistedAt === null;

  const outcomes: QuestionOutcomePayload[] = state.outcomes.map((outcome, i) => {
    const questionId = state.questionQueue[i] ?? `unknown-${i}`;
    let success_points_earned = 0;
    let grit_points_earned = 0;
    if (outcome === 'first_try_correct') {
      const s = scoreBranch(0);
      success_points_earned = s.success;
      grit_points_earned = s.grit;
    } else if (outcome === 'second_try_correct') {
      const s = scoreBranch(1);
      success_points_earned = s.success;
      grit_points_earned = s.grit;
    } else if (outcome === 'third_try_correct') {
      const s = scoreBranch(2);
      success_points_earned = s.success;
      grit_points_earned = s.grit;
    } else if (outcome === 'failed_through') {
      grit_points_earned = 25;
    }
    return {
      question_id: questionId,
      outcome,
      success_points_earned,
      grit_points_earned,
      resolved_at: state.lastActivityAt,
    };
  });

  return {
    session_uuid: getSessionId(),
    display_name_hash: displayNameHash,
    subject,
    started_at: state.startedAt,
    last_activity_at: state.lastActivityAt,
    ended_at: endedAt,
    ended_early: state.phase === 'summary' && state.outcomes.length < 10,
    questions_answered: questionsAnswered,
    questions_abandoned: state.abandonedCount,
    total_points: state.sessionSuccess + state.sessionGrit,
    success_points: state.sessionSuccess,
    grit_points: state.sessionGrit,
    completed_waitlist_signup: completedWaitlistSignup,
    clicked_share: getClickedShare(),
    outcomes,
  };
}

// ── Legacy stub (kept for any existing import of analytics object) ─────────────
// ResetConfirmModal was updated to import postResetEvent directly.
export const analytics = {
  postResetEvent,
  postSessionEnd,
};
