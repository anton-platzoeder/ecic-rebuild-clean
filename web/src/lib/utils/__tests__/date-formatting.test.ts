/**
 * Story Metadata:
 * - Epic: 2
 * - Story: 2
 * - Route: N/A (utility function)
 * - Target File: lib/utils/date-formatting.ts
 * - Page Action: create_new
 *
 * Tests for date formatting utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatReportDate,
  formatDateTime,
  formatRelativeTime,
} from '@/lib/utils/date-formatting';

describe('date-formatting utilities', () => {
  describe('formatReportDate', () => {
    it('formats ISO date string to "January 2026" format', () => {
      const result = formatReportDate('2026-01-31');
      expect(result).toBe('January 2026');
    });

    it('formats ISO date string to "December 2025" format', () => {
      const result = formatReportDate('2025-12-31');
      expect(result).toBe('December 2025');
    });

    it('formats ISO date string to "February 2026" format', () => {
      const result = formatReportDate('2026-02-28');
      expect(result).toBe('February 2026');
    });

    it('handles date strings with time component', () => {
      const result = formatReportDate('2026-03-31T23:59:59Z');
      expect(result).toBe('March 2026');
    });

    it('handles date strings with different day values', () => {
      const result = formatReportDate('2026-04-15');
      expect(result).toBe('April 2026');
    });

    it('formats all 12 months correctly', () => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      months.forEach((month, index) => {
        const monthNumber = String(index + 1).padStart(2, '0');
        const result = formatReportDate(`2026-${monthNumber}-15`);
        expect(result).toBe(`${month} 2026`);
      });
    });

    it('handles years before 2000', () => {
      const result = formatReportDate('1999-12-31');
      expect(result).toBe('December 1999');
    });

    it('handles years after 2100', () => {
      const result = formatReportDate('2150-06-30');
      expect(result).toBe('June 2150');
    });
  });

  describe('formatDateTime', () => {
    it('formats ISO datetime to readable format', () => {
      const result = formatDateTime('2026-01-15T10:30:00Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });

    it('includes time component in formatted output', () => {
      const result = formatDateTime('2026-01-15T14:45:30Z');
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Should contain time like "14:45" or "2:45"
    });

    it('handles midnight time', () => {
      const result = formatDateTime('2026-01-15T00:00:00Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });

    it('handles end of day time', () => {
      const result = formatDateTime('2026-01-15T23:59:59Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });

    it('formats different months correctly', () => {
      const result = formatDateTime('2026-06-20T12:00:00Z');
      expect(result).toContain('Jun');
      expect(result).toContain('20');
      expect(result).toContain('2026');
    });
  });

  describe('formatRelativeTime (Epic 2 Story 3)', () => {
    beforeEach(() => {
      // Mock current date to 2026-01-15 12:00:00 UTC
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "today" for timestamps within the same day', () => {
      const todayMorning = '2026-01-15T08:00:00Z';
      expect(formatRelativeTime(todayMorning)).toBe('today');
    });

    it('returns "1 day ago" for timestamps from yesterday', () => {
      const yesterday = '2026-01-14T12:00:00Z';
      expect(formatRelativeTime(yesterday)).toBe('1 day ago');
    });

    it('returns "2 days ago" for timestamps from 2 days ago', () => {
      const twoDaysAgo = '2026-01-13T12:00:00Z';
      expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');
    });

    it('returns "3 days ago" for timestamps from 3 days ago', () => {
      const threeDaysAgo = '2026-01-12T12:00:00Z';
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('returns "7 days ago" for timestamps from a week ago', () => {
      const weekAgo = '2026-01-08T12:00:00Z';
      expect(formatRelativeTime(weekAgo)).toBe('7 days ago');
    });

    it('returns correct value for timestamps more than 30 days ago', () => {
      const monthAgo = '2025-12-15T12:00:00Z';
      expect(formatRelativeTime(monthAgo)).toBe('31 days ago');
    });

    it('handles timestamps at day boundary correctly', () => {
      const justYesterday = '2026-01-14T23:59:59Z';
      expect(formatRelativeTime(justYesterday)).toBe('1 day ago');
    });

    it('handles timestamps from same hour correctly', () => {
      const sameHour = '2026-01-15T12:30:00Z';
      expect(formatRelativeTime(sameHour)).toBe('today');
    });

    it('handles timestamps from minutes ago correctly', () => {
      const minutesAgo = '2026-01-15T11:45:00Z';
      expect(formatRelativeTime(minutesAgo)).toBe('today');
    });
  });
});
