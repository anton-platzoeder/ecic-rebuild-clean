/**
 * Date formatting utilities for batch context
 */

/**
 * Format an ISO date string to "Month Year" format (e.g., "January 2026").
 * Handles both date-only strings (YYYY-MM-DD) and datetime strings.
 * Uses UTC to avoid timezone conversion issues.
 */
export function formatReportDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Format an ISO datetime string to a readable format with date and time.
 * Returns format like "Jan 15, 2026 at 10:30 AM"
 * Uses UTC to avoid timezone conversion issues.
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * Format an ISO datetime string to relative time (e.g., "2 days ago").
 * Uses UTC calendar-day comparison to avoid timezone issues.
 * For dates in the past, returns relative time. For same-day, returns "today".
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  // Compare by UTC calendar days to avoid partial-day rounding issues
  const dateUTC = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const diffDays = Math.floor((nowUTC - dateUTC) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays > 1) return `${diffDays} days ago`;

  // Future dates (shouldn't happen, but handle gracefully)
  return formatDateTime(dateStr);
}
