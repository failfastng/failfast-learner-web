/**
 * site-url.test.ts
 * Covers: getRuntimeSiteUrl() and getMarketingUrl() runtime domain helpers.
 */

import { getRuntimeSiteUrl, getMarketingUrl, getRuntimeApiBase } from '../src/lib/site-url';

// ── window.location helpers ───────────────────────────────────────────────────

function setWindowOrigin(origin: string) {
  Object.defineProperty(global, 'window', {
    value: { location: { origin, hostname: new URL(origin).hostname } },
    writable: true,
    configurable: true,
  });
}

function clearWindow() {
  Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV };
  clearWindow();
});

afterAll(() => {
  process.env = OLD_ENV;
  clearWindow();
});

// ── getRuntimeSiteUrl ─────────────────────────────────────────────────────────

test('getRuntimeSiteUrl() returns window.location.origin when browser context exists', () => {
  setWindowOrigin('https://learner.failfastedu.com');
  expect(getRuntimeSiteUrl()).toBe('https://learner.failfastedu.com');
});

test('getRuntimeSiteUrl() returns window.location.origin for failfastng.com hostname', () => {
  setWindowOrigin('https://learner.failfastng.com');
  expect(getRuntimeSiteUrl()).toBe('https://learner.failfastng.com');
});

test('getRuntimeSiteUrl() falls back to EXPO_PUBLIC_SITE_URL when window is undefined', () => {
  process.env.EXPO_PUBLIC_SITE_URL = 'https://learner.failfastng.com';
  expect(getRuntimeSiteUrl()).toBe('https://learner.failfastng.com');
});

test('getRuntimeSiteUrl() falls back to hardcoded default when env is also unset', () => {
  delete process.env.EXPO_PUBLIC_SITE_URL;
  expect(getRuntimeSiteUrl()).toBe('https://learner.failfastng.com');
});

// ── getMarketingUrl ───────────────────────────────────────────────────────────

test('getMarketingUrl() maps learner.failfastedu.com to https://failfastedu.com', () => {
  setWindowOrigin('https://learner.failfastedu.com');
  expect(getMarketingUrl()).toBe('https://failfastedu.com');
});

test('getMarketingUrl("/privacy") maps learner.failfastedu.com to https://failfastedu.com/privacy', () => {
  setWindowOrigin('https://learner.failfastedu.com');
  expect(getMarketingUrl('/privacy')).toBe('https://failfastedu.com/privacy');
});

test('getMarketingUrl() maps learner.failfastng.com to https://failfastng.com', () => {
  setWindowOrigin('https://learner.failfastng.com');
  expect(getMarketingUrl()).toBe('https://failfastng.com');
});

test('getMarketingUrl("/privacy") maps learner.failfastng.com to https://failfastng.com/privacy', () => {
  setWindowOrigin('https://learner.failfastng.com');
  expect(getMarketingUrl('/privacy')).toBe('https://failfastng.com/privacy');
});

test('getMarketingUrl() falls back to https://failfastng.com when window is undefined', () => {
  delete process.env.EXPO_PUBLIC_SITE_URL;
  expect(getMarketingUrl()).toBe('https://failfastng.com');
});

// ── getRuntimeApiBase ─────────────────────────────────────────────────────────

test('getRuntimeApiBase() maps learner.failfastedu.com to https://learner-api.failfastedu.com', () => {
  setWindowOrigin('https://learner.failfastedu.com');
  expect(getRuntimeApiBase()).toBe('https://learner-api.failfastedu.com');
});

test('getRuntimeApiBase() maps learner.failfastng.com to https://learner-api.failfastng.com', () => {
  setWindowOrigin('https://learner.failfastng.com');
  expect(getRuntimeApiBase()).toBe('https://learner-api.failfastng.com');
});

test('getRuntimeApiBase() falls back to EXPO_PUBLIC_API_BASE when window is undefined', () => {
  process.env.EXPO_PUBLIC_API_BASE = 'https://learner-api.failfastng.com';
  expect(getRuntimeApiBase()).toBe('https://learner-api.failfastng.com');
});

test('getRuntimeApiBase() falls back to hardcoded default when env and window are both absent', () => {
  delete process.env.EXPO_PUBLIC_API_BASE;
  expect(getRuntimeApiBase()).toBe('https://learner-api.failfastng.com');
});
