import { useSyncExternalStore } from 'react';
import {
  getProgress,
  getSubjectProgress,
  writeSubjectProgress as storageWrite,
} from '../lib/storage';
import type { Subject, SubjectProgress } from '../types/domain';

// ── External store plumbing ───────────────────────────────────────────────────
type Listener = () => void;
const listeners = new Set<Listener>();

// Stable snapshot cache — useSyncExternalStore calls getSnapshot() multiple
// times per render to check for tearing. If we return a new object reference
// every call (from JSON.parse), React detects "inconsistency" and re-renders
// infinitely (error #185). Solution: cache the reference; only replace it when
// notify() fires (i.e., when data actually changed).
let snapshotCache: Record<Subject, SubjectProgress> | null = null;

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  snapshotCache = null; // invalidate so next getSnapshot() reads fresh data
  listeners.forEach((l) => l());
}

function getSnapshot(): Record<Subject, SubjectProgress> {
  if (snapshotCache === null) {
    snapshotCache = getProgress();
  }
  return snapshotCache;
}

// Server snapshot — safe fallback for SSR / static export
function getServerSnapshot(): Record<Subject, SubjectProgress> {
  return {
    maths: { successPoints: 0, gritPoints: 0, tier: 'Rookie', seenQuestionIds: [] },
    english: { successPoints: 0, gritPoints: 0, tier: 'Rookie', seenQuestionIds: [] },
    economics: { successPoints: 0, gritPoints: 0, tier: 'Rookie', seenQuestionIds: [] },
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useProgressStore() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function hasAnyProgress(): boolean {
    return Object.values(progress).some(
      (p) => p.successPoints > 0 || p.gritPoints > 0
    );
  }

  function getSubjectProgressFromStore(subject: Subject): SubjectProgress {
    return progress[subject] ?? getSubjectProgress(subject);
  }

  function writeSubjectProgress(subject: Subject, p: SubjectProgress): void {
    storageWrite(subject, p);
    notify();
  }

  return {
    progress,
    hasAnyProgress,
    getSubjectProgress: getSubjectProgressFromStore,
    writeSubjectProgress,
  };
}
