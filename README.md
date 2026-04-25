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

## Notes

- `react-native-worklets-core/plugin` is listed last in babel.config.js plugins (SDK 54 requirement)
- jest-expo installed with `--legacy-peer-deps` due to react-dom peer version mismatch in SDK 54 (react 19.1.0 vs react-dom 19.2.5). This does not affect the web build.
