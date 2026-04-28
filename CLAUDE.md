# failfast-learner-web

Expo SDK 54 + React Native + Expo Router v4 app for FailFast Learner — a WAEC/JAMB exam practice tool. Deployed as a static web export to Cloudflare Pages. No native builds — web only.

## Agent memory

**Read [`MEMORY.md`](./MEMORY.md) before starting any task.** It contains hard-won patterns and mistakes from past sessions that are not obvious from the code alone.

**Update `MEMORY.md` when you finish.** If you hit a non-obvious problem, discover a new invariant, make a decision that future agents should know about, or find that an existing entry is wrong — add or correct it. Keep entries concise: state the rule, why it exists, and how to apply it. This file is the institutional memory for this codebase.

## Stack

- Expo SDK 54, Expo Router v4 (static export)
- React Native + React Native Web
- React Native Reanimated (animations run on UI thread)
- `useSyncExternalStore` for progress state
- TypeScript, ESLint + Prettier via `eslint.config.mjs`
- Cloudflare Pages (auto-deploys from `main`)

## Key directories

```
app/
  +html.tsx          — ALL <head> meta tags live here (OG, Twitter, apple-touch-icon)
  _layout.tsx        — root layout
  index.tsx          — routes to ColdOpenStart or ReturningStart
  practice/[subject] — question + summary screens
public/              — files served at root URL (og-preview.png, apple-touch-icon.png)
src/
  components/        — OptionCard, SubjectCard, GritFloat, WaitlistSection, Toast, LevelUpBar
  copy/locked.ts     — ALL user-facing copy lives here, no inline strings
  hooks/             — useProgressStore, useQuestionBank, useWaitlist, useSessionReducer
  lib/               — storage, analytics, share, scoring, summary, hash
  screens/           — ColdOpenStart, ReturningStart, QuestionPhase, SummaryPhase
  theme/             — colors.ts, type.ts, motion.ts
  types/domain.ts    — Question, Subject, SessionState, Outcome, Tier
```

## Static export conventions

- `public/` is the only way to serve files at a predictable root URL. Files in `assets/` are hashed by the bundler and NOT accessible at `/filename`. OG images, apple-touch-icon, and any file referenced by absolute URL must be in `public/`.
- `app/+html.tsx` is the canonical source for `<head>` content. `web.meta` in `app.config.ts` is secondary and should mirror `+html.tsx`.

## OG / social meta — full tag set required

For previews to work on Twitter, WhatsApp, Facebook, and iMessage, `+html.tsx` must include:

```html
<meta property="og:image" content="https://learner.failfastng.com/og-preview.png" />
<meta property="og:image:secure_url" content="https://learner.failfastng.com/og-preview.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

WhatsApp requires `og:image:width` and `og:image:height` for large card previews. Without them it either shows a thumbnail or nothing. Facebook requires `og:image:secure_url`.

## Progress store — always invalidate on reset

`useProgressStore` uses `useSyncExternalStore` with a module-level `snapshotCache`. Any code that wipes localStorage must also call `notifyProgressReset()` from `useProgressStore` before navigating. Skipping this leaves a stale snapshot — `hasAnyProgress()` returns `true` even after a full wipe, keeping the user on `ReturningStart`.

## Analytics pattern

- Session POST fires once on `SummaryPhase` mount — captures state at that moment.
- Events that fire after (share, waitlist) send their own dedicated request AND patch the `Session` row on the API.
- `shareApp()` in `src/lib/share.ts` calls `postShareEvent(getSessionId())` immediately on tap.
- `useWaitlist` sends `session_uuid: getSessionId()` in every waitlist payload.
- Never rely on the initial session POST to capture post-mount user actions.

## Question option shuffling

Options are shuffled in `useQuestionBank` at load time via Fisher-Yates. `shuffleBank` tracks `lastCorrectIndex` and retries once if the next question's correct answer would land in the same slot — reduces obvious patterns. The localStorage cache always stores unshuffled data; shuffling is applied fresh on every session load.

## Copy conventions

- All user-facing strings live in `src/copy/locked.ts`. No inline strings in components.
- **Always pluralise dynamic counts**: `${n} ${n === 1 ? 'time' : 'times'}`. "1 times" and "1 questions" are bugs.
- When two links navigate to the same route, remove the weaker label. Prefer the more descriptive one.

## UI conventions

- **"mini" badge on wordmark**: both `ColdOpenStart` and `ReturningStart` have a small grey pill next to "FailFast" (`backgroundColor: '#f0f0f0'`, `borderRadius: 6`, `fontSize: 11`, `color: '#888'`). Preserve on any new start screen.
- **"Share this app"** appears on `ReturningStart` (below Start Practice) and `SummaryPhase` tertiary row. It does NOT appear on `ColdOpenStart`.
- **Toast component** uses `position: absolute` — its parent must have `position: 'relative'` and `flex: 1`. Wrap with a `View` with `outerContainer` style, not a bare fragment.
- **Colors and motion**: all values come from `src/theme/colors.ts` and `src/theme/motion.ts`. No hardcoded hex or duration values outside these files.

## Linting

Run `npx eslint <file> --max-warnings=0` before committing. The pre-commit hook runs lint-staged automatically, but manual checks catch issues earlier. Prettier formatting errors from lint can be auto-fixed with `--fix`.

## Deployment

- Push to `main` → Cloudflare Pages auto-builds with `npx expo export --platform web`, output dir `dist`.
- After OG changes, use Twitter Card Validator to force a fresh crawl on Twitter.
- Facebook requires the Sharing Debugger "Scrape Again" to bust its cache.
- WhatsApp caches links aggressively — append `?v=N` to test a fresh preview.
