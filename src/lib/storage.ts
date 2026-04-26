import type { Question, Subject, SubjectProgress, Tier } from '../types/domain';

// ── Module-level quota-toast guard ──────────────────────────────────────────
let quotaToastFired = false;

// ── Default values ───────────────────────────────────────────────────────────
export const DEFAULT_SUBJECT_PROGRESS: SubjectProgress = {
  successPoints: 0,
  gritPoints: 0,
  tier: 'Rookie',
  seenQuestionIds: [],
};

const SUBJECTS: Subject[] = ['maths', 'english', 'economics'];

const DEFAULT_PROGRESS: Record<Subject, SubjectProgress> = {
  maths: { ...DEFAULT_SUBJECT_PROGRESS, seenQuestionIds: [] },
  english: { ...DEFAULT_SUBJECT_PROGRESS, seenQuestionIds: [] },
  economics: { ...DEFAULT_SUBJECT_PROGRESS, seenQuestionIds: [] },
};

// ── localStorage key constants ───────────────────────────────────────────────
const KEYS = {
  sessionId: 'sessionId',
  displayName: 'displayName',
  waitlistedAt: 'waitlistedAt',
  questionCache: 'questionCache',
  progress: 'progress',
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
export function generateSessionId(): string {
  return crypto.randomUUID();
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[storage] write failed for key "${key}":`, err);
    if (!quotaToastFired) {
      quotaToastFired = true;
      // Fire a non-blocking toast — importable from Toast module but we avoid a
      // circular dep here by dispatching a custom event that Toast.tsx listens to.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ff:quota-exceeded', {
            detail: {
              message:
                "We couldn't save your progress this session — clear private mode or allow storage to keep your tier progression",
            },
          })
        );
      }
    }
  }
}

// ── Session ID ────────────────────────────────────────────────────────────────
// Session IDs are stored as raw strings (not JSON) for simplicity.
function rawSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.error(`[storage] write failed for key "${key}":`, err);
  }
}

export function getSessionId(): string {
  try {
    const id = localStorage.getItem(KEYS.sessionId);
    if (id) return id;
    const fresh = generateSessionId();
    rawSet(KEYS.sessionId, fresh);
    return fresh;
  } catch {
    return generateSessionId();
  }
}

export function setSessionId(id: string): void {
  rawSet(KEYS.sessionId, id);
}

// ── Display name ──────────────────────────────────────────────────────────────
export function getDisplayName(): string {
  try {
    return localStorage.getItem(KEYS.displayName) || '';
  } catch {
    return '';
  }
}

export function saveDisplayName(name: string): void {
  try {
    localStorage.setItem(KEYS.displayName, name);
  } catch (err) {
    console.error(`[storage] write failed for key "${KEYS.displayName}":`, err);
    if (!quotaToastFired) {
      quotaToastFired = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ff:quota-exceeded', {
            detail: { message: "We couldn't save your progress this session — clear private mode or allow storage to keep your tier progression" },
          })
        );
      }
    }
  }
}

// ── Waitlisted at ─────────────────────────────────────────────────────────────
export function getWaitlistedAt(): string | null {
  try {
    const raw = localStorage.getItem(KEYS.waitlistedAt);
    if (!raw || raw === 'null') return null;
    return JSON.parse(raw) as string;
  } catch {
    return null;
  }
}

export function setWaitlistedAt(iso: string): void {
  safeSet(KEYS.waitlistedAt, iso);
}

export function clearWaitlistedAt(): void {
  try {
    localStorage.removeItem(KEYS.waitlistedAt);
  } catch {
    // ignore
  }
}

// ── Question cache ────────────────────────────────────────────────────────────
export type QuestionCache = {
  fetchedAt: number;
  questions: Question[];
};

export function getQuestionCache(): QuestionCache | null {
  return safeGet<QuestionCache | null>(KEYS.questionCache, null);
}

export function setQuestionCache(cache: QuestionCache): void {
  safeSet(KEYS.questionCache, cache);
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function getProgress(): Record<Subject, SubjectProgress> {
  const stored = safeGet<Record<Subject, SubjectProgress> | null>(
    KEYS.progress,
    null
  );
  if (!stored) return { ...DEFAULT_PROGRESS };
  // Merge to ensure all subjects are present
  return {
    maths: stored.maths ?? { ...DEFAULT_SUBJECT_PROGRESS, seenQuestionIds: [] },
    english:
      stored.english ?? { ...DEFAULT_SUBJECT_PROGRESS, seenQuestionIds: [] },
    economics:
      stored.economics ?? {
        ...DEFAULT_SUBJECT_PROGRESS,
        seenQuestionIds: [],
      },
  };
}

export function getSubjectProgress(subject: Subject): SubjectProgress {
  const all = getProgress();
  return all[subject] ?? { ...DEFAULT_SUBJECT_PROGRESS, seenQuestionIds: [] };
}

export function writeSubjectProgress(
  subject: Subject,
  progress: SubjectProgress
): void {
  const all = getProgress();
  all[subject] = progress;
  safeSet(KEYS.progress, all);
}

export function markQuestionSeen(subject: Subject, questionId: string): void {
  const prog = getSubjectProgress(subject);
  if (!prog.seenQuestionIds.includes(questionId)) {
    prog.seenQuestionIds = [...prog.seenQuestionIds, questionId];
    writeSubjectProgress(subject, prog);
  }
}

export function clearSeenIds(subject: Subject): void {
  const prog = getSubjectProgress(subject);
  prog.seenQuestionIds = [];
  writeSubjectProgress(subject, prog);
}

// ── Tier helper ───────────────────────────────────────────────────────────────
export function setSubjectTier(subject: Subject, tier: Tier): void {
  const prog = getSubjectProgress(subject);
  prog.tier = tier;
  writeSubjectProgress(subject, prog);
}

// ── wipeForReset ──────────────────────────────────────────────────────────────
/**
 * Clears all keys EXCEPT sessionId, then regenerates sessionId to a fresh UUID.
 * Per Story 1.4: wipes displayName, all progress, waitlistedAt, seenQuestionIds.
 */
export function wipeForReset(): string {
  try {
    localStorage.removeItem(KEYS.displayName);
    localStorage.removeItem(KEYS.waitlistedAt);
    localStorage.removeItem(KEYS.questionCache);
    localStorage.removeItem(KEYS.progress);
    localStorage.removeItem(KEYS.sessionId);
  } catch {
    // ignore — we still regenerate the session id
  }
  const fresh = generateSessionId();
  rawSet(KEYS.sessionId, fresh);
  return fresh;
}

// ── Convenience: all subjects ─────────────────────────────────────────────────
export { SUBJECTS };
