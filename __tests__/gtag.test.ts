/**
 * gtag.test.ts
 * Covers: normalizeGaMeasurementId(), isGtagAvailable(), sendPageView(), sendEvent().
 */

import {
  normalizeGaMeasurementId,
  isGtagAvailable,
  sendPageView,
  sendEvent,
} from '../src/lib/gtag';

beforeEach(() => {
  Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true,
    configurable: true,
  });
});

// ── normalizeGaMeasurementId ──────────────────────────────────────────────────

test('normalizeGaMeasurementId() returns undefined when input is unset', () => {
  expect(normalizeGaMeasurementId(undefined)).toBeUndefined();
});

test('normalizeGaMeasurementId() returns undefined when input is empty string', () => {
  expect(normalizeGaMeasurementId('   ')).toBeUndefined();
});

test('normalizeGaMeasurementId() returns trimmed measurement ID', () => {
  expect(normalizeGaMeasurementId('  G-TEST123  ')).toBe('G-TEST123');
});

// ── isGtagAvailable ───────────────────────────────────────────────────────────

test('isGtagAvailable() returns false when window is undefined', () => {
  expect(isGtagAvailable()).toBe(false);
});

test('isGtagAvailable() returns false when gtag is missing', () => {
  Object.defineProperty(global, 'window', {
    value: {},
    writable: true,
    configurable: true,
  });
  expect(isGtagAvailable()).toBe(false);
});

test('isGtagAvailable() returns true when gtag is a function', () => {
  Object.defineProperty(global, 'window', {
    value: { gtag: jest.fn() },
    writable: true,
    configurable: true,
  });
  expect(isGtagAvailable()).toBe(true);
});

// ── sendPageView ─────────────────────────────────────────────────────────────

test('sendPageView() sends page_view event via gtag', () => {
  const gtag = jest.fn();
  Object.defineProperty(global, 'window', {
    value: {
      gtag,
      location: { href: 'https://learner.failfastng.com/practice/maths' },
    },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(global, 'document', {
    value: { title: 'FailFast Learner' },
    writable: true,
    configurable: true,
  });

  sendPageView('/practice/maths');

  expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
    page_path: '/practice/maths',
    page_location: 'https://learner.failfastng.com/practice/maths',
    page_title: 'FailFast Learner',
  });
});

// ── sendEvent ─────────────────────────────────────────────────────────────────

test('sendEvent() sends event with params via gtag', () => {
  const gtag = jest.fn();
  Object.defineProperty(global, 'window', {
    value: { gtag },
    writable: true,
    configurable: true,
  });

  sendEvent('review_submit', { source: 'summary' });

  expect(gtag).toHaveBeenCalledWith('event', 'review_submit', { source: 'summary' });
});

test('sendEvent() sends empty params object when none provided', () => {
  const gtag = jest.fn();
  Object.defineProperty(global, 'window', {
    value: { gtag },
    writable: true,
    configurable: true,
  });

  sendEvent('reset');

  expect(gtag).toHaveBeenCalledWith('event', 'reset', {});
});
