# FailFast Learner — Web

Practice that counts the effort, not just the answer.

## Stack

- Expo SDK 54 (React Native 0.81, React 19.1)
- Expo Router v6 — file-based routing, web-first PWA
- react-native-reanimated v4
- TypeScript strict
- Jest via jest-expo preset

## Getting started

```bash
npm install
npm run web          # Dev server
npm run export:web   # Production web build → dist/
npm test             # Unit tests
```

## Deployment

Web bundle is auto-deployed to Cloudflare Pages from the `main` branch.
Build command: `npx expo export --platform web`
Output directory: `dist/`
Node version: 20

## Web head injection

**Current mechanism:** `app.config.ts > web.meta`

OG and Twitter meta tags are declared in `app.config.ts` under `web.meta`. Expo SDK 54 with Metro bundler is expected to inject these as `<meta>` tags into the generated `dist/index.html` at export time.

**Status:** to be verified on first CF Pages deploy (Item 3 verify step — see `docs/runbooks/02-cf-pages-deploy.md` Step 4).

**Fallback order if `app.config.ts > web.meta` fails to inject tags** (run verification probe first, then apply the first fallback that works):

1. Add `<head>` component to `app/_layout.tsx` using Expo Router's `<Head>` API (`expo-router/head`) with explicit `<meta property="og:..." />` tags.
2. Create `public/index.html` template with hardcoded meta tags in `<head>` — Expo will use this as the HTML shell.
3. Add `/_headers` file at the root of the project (committed to repo, deployed to CF Pages) mapping `/*` to inject headers; note this works for HTTP response headers only, not HTML `<meta>` tags — use fallback 2 instead if meta injection is the requirement.

**Update this section** after first deploy verification: note which mechanism was confirmed working and remove the fallback list.

---

## Notes

- `react-native-worklets-core/plugin` is listed last in babel.config.js plugins (SDK 54 requirement)
- jest-expo installed with `--legacy-peer-deps` due to react-dom peer version mismatch in SDK 54 (react 19.1.0 vs react-dom 19.2.5). This does not affect the web build.
