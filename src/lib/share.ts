import { locked } from '../copy/locked';

const SHARE_URL = 'https://learner.failfastng.com/?utm_source=share&utm_medium=link';

export async function shareApp(): Promise<'shared' | 'copied' | 'dismissed'> {
  const text = locked.shareText.replace('[link]', SHARE_URL);
  if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
    try {
      await (navigator as any).share({ text });
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
