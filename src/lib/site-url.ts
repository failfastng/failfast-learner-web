/**
 * Canonical origin for learner web (OG tags, share links).
 * Override with EXPO_PUBLIC_SITE_URL only when needed (e.g. staging on *.pages.dev).
 */
export function getSiteUrl(): string {
  return (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://learner.failfastng.com').replace(/\/$/, '');
}
