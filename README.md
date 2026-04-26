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
Node version: 22

## Web head injection

**Confirmed working mechanism: `app/+html.tsx`**

Expo Router's HTML root file (`app/+html.tsx`) is the correct way to inject custom `<head>` content on SDK 54. This file runs at `expo export` time in Node — not in the browser — and wraps the entire app in a real HTML document shell.

All OG and Twitter meta tags live in `app/+html.tsx`. Do not use `app.config.ts > web.meta` for this — that mechanism does not reliably inject arbitrary meta tags on SDK 54 with Metro bundler.

**To update OG tags** (e.g., when replacing the placeholder image in Item 20): edit `app/+html.tsx` directly.

---

## Notes

- `react-native-worklets-core/plugin` is listed last in babel.config.js plugins (SDK 54 requirement)
- jest-expo installed with `--legacy-peer-deps` due to react-dom peer version mismatch in SDK 54 (react 19.1.0 vs react-dom 19.2.5). This does not affect the web build.
