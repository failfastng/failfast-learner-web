import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  buildLearnerRobotsTxt,
  buildLearnerSitemapXml,
  getSiteUrlFromEnv,
} from '../src/lib/seo-files';

const outDir = process.argv[2] ?? 'dist';
const siteUrl = getSiteUrlFromEnv();

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sitemap.xml'), buildLearnerSitemapXml(siteUrl), 'utf8');
writeFileSync(join(outDir, 'robots.txt'), buildLearnerRobotsTxt(siteUrl), 'utf8');

console.log(`Wrote learner SEO files for ${siteUrl} -> ${outDir}/`);
