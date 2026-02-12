/**
 * Story Metadata:
 * - Epic: 2
 * - Story: 2
 * - Route: N/A (utility function)
 * - Target File: lib/utils/storage.ts
 * - Page Action: create_new
 *
 * Tests for localStorage wrapper utilities
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getActiveBatchId,
  setActiveBatchId,
  clearActiveBatchId,
} from '@/lib/utils/storage';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getActiveBatchId', () => {
    it('returns null when no stored value exists', () => {
      const result = getActiveBatchId();
      expect(result).toBeNull();
    });

    it('returns stored number when value exists', () => {
      localStorage.setItem('activeBatchId', '123');
      const result = getActiveBatchId();
      expect(result).toBe(123);
    });

    it('returns null when stored value is invalid', () => {
      localStorage.setItem('activeBatchId', 'invalid');
      const result = getActiveBatchId();
      expect(result).toBeNull();
    });

    it('returns null when stored value is empty string', () => {
      localStorage.setItem('activeBatchId', '');
      const result = getActiveBatchId();
      expect(result).toBeNull();
    });

    it('handles large batch ID numbers', () => {
      localStorage.setItem('activeBatchId', '999999');
      const result = getActiveBatchId();
      expect(result).toBe(999999);
    });

    it('handles batch ID of 0', () => {
      localStorage.setItem('activeBatchId', '0');
      const result = getActiveBatchId();
      expect(result).toBe(0);
    });

    it('handles negative batch IDs', () => {
      localStorage.setItem('activeBatchId', '-1');
      const result = getActiveBatchId();
      expect(result).toBe(-1);
    });
  });

  describe('setActiveBatchId', () => {
    it('stores batch ID value in localStorage', () => {
      setActiveBatchId(123);
      const stored = localStorage.getItem('activeBatchId');
      expect(stored).toBe('123');
    });

    it('overwrites previous value', () => {
      setActiveBatchId(100);
      setActiveBatchId(200);
      const stored = localStorage.getItem('activeBatchId');
      expect(stored).toBe('200');
    });

    it('stores batch ID of 0', () => {
      setActiveBatchId(0);
      const stored = localStorage.getItem('activeBatchId');
      expect(stored).toBe('0');
    });

    it('stores large batch ID numbers', () => {
      setActiveBatchId(999999);
      const stored = localStorage.getItem('activeBatchId');
      expect(stored).toBe('999999');
    });

    it('stores negative batch IDs', () => {
      setActiveBatchId(-1);
      const stored = localStorage.getItem('activeBatchId');
      expect(stored).toBe('-1');
    });
  });

  describe('clearActiveBatchId', () => {
    it('removes activeBatchId from localStorage', () => {
      localStorage.setItem('activeBatchId', '123');
      clearActiveBatchId();
      const stored = localStorage.getItem('activeBatchId');
      expect(stored).toBeNull();
    });

    it('does not throw error when no value exists', () => {
      expect(() => clearActiveBatchId()).not.toThrow();
    });

    it('successfully clears after multiple sets', () => {
      setActiveBatchId(100);
      setActiveBatchId(200);
      setActiveBatchId(300);
      clearActiveBatchId();
      const result = getActiveBatchId();
      expect(result).toBeNull();
    });
  });

  describe('Integration - Full cycle', () => {
    it('supports full get-set-clear cycle', () => {
      // Initial state - no value
      expect(getActiveBatchId()).toBeNull();

      // Set value
      setActiveBatchId(123);
      expect(getActiveBatchId()).toBe(123);

      // Change value
      setActiveBatchId(456);
      expect(getActiveBatchId()).toBe(456);

      // Clear value
      clearActiveBatchId();
      expect(getActiveBatchId()).toBeNull();
    });

    it('maintains data across multiple reads', () => {
      setActiveBatchId(789);
      expect(getActiveBatchId()).toBe(789);
      expect(getActiveBatchId()).toBe(789);
      expect(getActiveBatchId()).toBe(789);
    });
  });
});
