import {
  buildLearnerRobotsTxt,
  buildLearnerSitemapXml,
  getLearnerSitemapPaths,
  normalizeSiteUrl,
} from '../src/lib/seo-files';

test('getLearnerSitemapPaths() includes home and practice subjects', () => {
  expect(getLearnerSitemapPaths()).toEqual([
    '/',
    '/practice/maths',
    '/practice/english',
    '/practice/economics',
  ]);
});

test('buildLearnerSitemapXml() uses the configured site origin', () => {
  const xml = buildLearnerSitemapXml('https://learner.failfastedu.com');
  expect(xml).toContain('<loc>https://learner.failfastedu.com/</loc>');
  expect(xml).toContain('<loc>https://learner.failfastedu.com/practice/maths</loc>');
  expect(xml).not.toContain('failfastng.com');
});

test('buildLearnerRobotsTxt() points at the matching sitemap URL', () => {
  expect(buildLearnerRobotsTxt('https://learner.failfastedu.com/')).toBe(
    'User-agent: *\nAllow: /\n\nSitemap: https://learner.failfastedu.com/sitemap.xml\n',
  );
});

test('normalizeSiteUrl() strips trailing slash', () => {
  expect(normalizeSiteUrl('https://learner.failfastng.com/')).toBe(
    'https://learner.failfastng.com',
  );
});
