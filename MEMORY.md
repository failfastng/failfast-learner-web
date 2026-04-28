# failfast-learner-web — Agent Memory

## Expo static export conventions

- **`public/` directory** is the only way to serve files at the root URL (`/og-preview.png`, `/apple-touch-icon.png`). Files in `assets/` are bundled and hashed — they are NOT served at a predictable root path. OG images, favicons, and touch icons must live in `public/`.
- **`app/+html.tsx`** is the canonical place for all `<head>` meta tags — OG, Twitter Card, apple-touch-icon, description. The `web.meta` field in `app.config.ts` is a secondary source; `+html.tsx` takes precedence and is what actually ships.
- **OG image checklist for full platform support** (Twitter, WhatsApp, Facebook, iMessage):
  - `og:image` — absolute HTTPS URL
  - `og:image:secure_url` — same URL (Facebook requirement)
  - `og:image:type` — `image/png`
  - `og:image:width` / `og:image:height` — WhatsApp requires these for large card previews
  - `twitter:card` — `summary_large_image`
  - `apple-touch-icon` — for iOS share sheets and home screen

## In-memory store invalidation

`useProgressStore` uses `useSyncExternalStore` with a `snapshotCache`. Any operation that wipes localStorage (like `wipeForReset()`) must also call `notifyProgressReset()` to bust the cache — otherwise `hasAnyProgress()` returns stale data and the app stays on `ReturningStart` after reset.

## Question option shuffling

Options are shuffled in `useQuestionBank` at load time (not stored back to cache). `shuffleBank` tracks `lastCorrectIndex` and retries once if the correct answer would land in the same position as the previous question — prevents obvious patterns. The cache always stores unshuffled data; shuffling is applied fresh each session load.

## Analytics fire-and-forget pattern

- Session POST fires once on `SummaryPhase` mount — it captures the state at that moment.
- Any event that happens after the session POST (share, waitlist signup) fires its own dedicated endpoint and also patches the `Session` row on the API side.
- `postShareEvent(sessionId)` fires inside `shareApp()` the moment the user taps — not in a summary effect.
- `useWaitlist` passes `session_uuid: getSessionId()` in the payload so the API can patch `completed_waitlist_signup`.

## Copy / UI conventions propersam cares about

- **Singular/plural**: always check counts before inserting into copy strings. "1 questions" and "corrected yourself 1 times" are bugs. Use ternary at replacement site: `` `${n} ${n === 1 ? 'time' : 'times'}` ``
- **Redundant links**: if two links do the same thing, remove the weaker label. "Back to start" and "Try a different subject" both went to `/` — "Back to start" was removed.
- **Mini badge on wordmark**: The FailFast wordmark on both start screens has a small grey "mini" superscript pill. Keep this on any new start screen variants.
- **Share link placement**: "Share this app" appears on both the `ReturningStart` screen (below Start Practice button) and the `SummaryPhase` tertiary row — not on `ColdOpenStart`.

## Reset flow

`wipeForReset()` in `storage.ts` clears all localStorage keys. After calling it, always call `notifyProgressReset()` from `useProgressStore` before any navigation. Without this, the store cache is stale and the UI won't reflect the reset state.

## Deployment

- Cloudflare Pages builds from `main` on push — static export via `npx expo export --platform web`, output dir `dist`.
- Twitter aggressively caches card previews — use Twitter Card Validator to force a fresh crawl after OG changes.
- Facebook link previews require the Facebook Sharing Debugger "Scrape Again" to bust cache.
- WhatsApp caches links too — sending a fresh link (add `?v=2` to bust) is the easiest way to test.
