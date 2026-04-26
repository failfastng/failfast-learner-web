import { getDisplayName as storageGetDisplayName } from './storage';

/**
 * Returns the stored display name, or 'Learner' as the fallback.
 * This is the single source-of-truth function across the entire codebase.
 */
export function getDisplayName(): string {
  try {
    const name = storageGetDisplayName();
    return name.trim() || 'Learner';
  } catch {
    return 'Learner';
  }
}
