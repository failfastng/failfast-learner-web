import { locked } from '../copy/locked';

const SHARE_URL = 'https://learner.failfastng.com/?utm_source=share&utm_medium=link';

// ── Module-level clicked-share flag ──────────────────────────────────────────
// Set to true the first time shareApp() is called in any session.
// Read by buildSessionEndPayload via getClickedShare().
let _clickedShareThisSession = false;

export function getClickedShare(): boolean {
  return _clickedShareThisSession;
}
export function resetClickedShare(): void {
  _clickedShareThisSession = false;
}

// ── Share ─────────────────────────────────────────────────────────────────────

export async function shareApp(): Promise<'shared' | 'copied' | 'dismissed'> {
  _clickedShareThisSession = true;

  const text = locked.shareText.replace('[link]', SHARE_URL);
  const nav = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
  if (typeof navigator !== 'undefined' && typeof nav.share === 'function') {
    try {
      await nav.share({ text });
      return 'shared';
    } catch {
      return 'dismissed';
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
  return 'copied';
}
