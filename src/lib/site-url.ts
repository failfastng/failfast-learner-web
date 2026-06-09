/**
 * Build-time canonical origin for OG/head meta tags.
 * Reads EXPO_PUBLIC_SITE_URL at export time; used only by app/+html.tsx and app.config.ts.
 */
export function getSiteUrl(): string {
  return (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://learner.failfastng.com').replace(/\/$/, '');
}

/**
 * Runtime learner origin. Returns window.location.origin in the browser so that
 * share links and visible copy match the domain the visitor actually used.
 * Falls back to EXPO_PUBLIC_SITE_URL (or the hardcoded default) for SSR/export/test contexts.
 */
export function getRuntimeSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://learner.failfastng.com').replace(/\/$/, '');
}

/**
 * Marketing root URL for the current domain, with an optional path.
 * Strips the `learner.` subdomain prefix so that learner.failfastedu.com
 * resolves to https://failfastedu.com, and learner.failfastng.com to
 * https://failfastng.com. Used for footer links, the privacy page, etc.
 */
export function getMarketingUrl(path = ''): string {
  let hostname: string;
  if (typeof window !== 'undefined' && window.location?.hostname) {
    hostname = window.location.hostname;
  } else {
    const configured = (
      process.env.EXPO_PUBLIC_SITE_URL ?? 'https://learner.failfastng.com'
    ).replace(/\/$/, '');
    hostname = new URL(configured).hostname;
  }
  const marketingHost = hostname.startsWith('learner.')
    ? hostname.slice('learner.'.length)
    : hostname;
  const normalizedPath = path && !path.startsWith('/') ? `/${path}` : path;
  return `https://${marketingHost}${normalizedPath}`;
}

/**
 * Runtime API base URL. Swaps the `learner.` subdomain for `learner-api.` so
 * that learner.failfastedu.com calls https://learner-api.failfastedu.com, and
 * learner.failfastng.com calls https://learner-api.failfastng.com.
 * Falls back to EXPO_PUBLIC_API_BASE or the hardcoded default for non-browser contexts.
 */
export function getRuntimeApiBase(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { hostname } = window.location;
    if (hostname.startsWith('learner.')) {
      return `https://learner-api.${hostname.slice('learner.'.length)}`;
    }
  }
  return (process.env.EXPO_PUBLIC_API_BASE ?? 'https://learner-api.failfastng.com').replace(
    /\/$/,
    '',
  );
}
