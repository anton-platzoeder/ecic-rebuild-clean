/**
 * localStorage wrapper utilities for batch ID persistence
 */

const ACTIVE_BATCH_ID_KEY = 'activeBatchId';

/**
 * Get the active batch ID from localStorage.
 * Returns null if no value exists or if the value is invalid.
 */
export function getActiveBatchId(): number | null {
  const stored = localStorage.getItem(ACTIVE_BATCH_ID_KEY);

  if (!stored || stored === '') {
    return null;
  }

  const parsed = parseInt(stored, 10);

  if (isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Set the active batch ID in localStorage.
 * Stores the value as a string.
 */
export function setActiveBatchId(id: number): void {
  localStorage.setItem(ACTIVE_BATCH_ID_KEY, id.toString());
}

/**
 * Clear the active batch ID from localStorage.
 */
export function clearActiveBatchId(): void {
  localStorage.removeItem(ACTIVE_BATCH_ID_KEY);
}
