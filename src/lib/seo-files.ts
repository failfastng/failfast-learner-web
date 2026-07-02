import type { Subject } from '../types/domain';

export const LEARNER_PRACTICE_SUBJECTS: Subject[] = ['maths', 'english', 'economics'];

export function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export function getSiteUrlFromEnv(): string {
  return normalizeSiteUrl(process.env.EXPO_PUBLIC_SITE_URL ?? 'https://learner.failfastng.com');
}

export function getLearnerSitemapPaths(): string[] {
  return ['/', ...LEARNER_PRACTICE_SUBJECTS.map((subject) => `/practice/${subject}`)];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildLearnerSitemapXml(siteUrl: string): string {
  const origin = normalizeSiteUrl(siteUrl);
  const entries = getLearnerSitemapPaths()
    .map((path) => {
      const loc = path === '/' ? `${origin}/` : `${origin}${path}`;
      const priority = path === '/' ? '1.0' : '0.8';
      const changefreq = path === '/' ? 'weekly' : 'monthly';
      return [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    '',
  ].join('\n');
}

export function buildLearnerRobotsTxt(siteUrl: string): string {
  const origin = normalizeSiteUrl(siteUrl);
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}
