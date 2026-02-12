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
