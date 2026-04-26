/**
 * displayName.test.ts — 2 tests per spec.md > Testing > Client
 * Covers: filled name returned, empty-string fallback → "Learner".
 */

import { getDisplayName } from '../src/lib/displayName';
import { saveDisplayName } from '../src/lib/storage';

// ── localStorage mock ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
  },
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
});

// ── Test 1: returns stored name ───────────────────────────────────────────────
test('getDisplayName() returns the stored display name', () => {
  saveDisplayName('Amara');
  expect(getDisplayName()).toBe('Amara');
});

// ── Test 2: returns "Learner" fallback when localStorage is empty ─────────────
test('getDisplayName() returns "Learner" when localStorage is empty', () => {
  // Nothing stored
  expect(getDisplayName()).toBe('Learner');
});
