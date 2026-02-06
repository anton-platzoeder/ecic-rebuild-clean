/**
 * Story Metadata:
 * - Epic: 1
 * - Story: 1
 * - Target: lib/auth/session.ts
 *
 * Tests for Session Management
 * Covers session timeout, activity tracking, and logout functionality
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useSession,
  logout,
  isSessionExpired,
  resetSessionTimeout,
  SESSION_TIMEOUT_MS,
} from '@/lib/auth/session';
import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);

    // Clear any existing session data
    localStorage.clear();
    document.cookie = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Session Timeout', () => {
    it('session expires after 30 minutes of inactivity', () => {
      const lastActivityTime = Date.now();
      localStorage.setItem('lastActivityTime', lastActivityTime.toString());

      // Fast-forward time by 30 minutes (1800000 ms)
      vi.advanceTimersByTime(SESSION_TIMEOUT_MS);

      expect(isSessionExpired()).toBe(true);
    });

    it('session does not expire before 30 minutes', () => {
      const lastActivityTime = Date.now();
      localStorage.setItem('lastActivityTime', lastActivityTime.toString());

      // Fast-forward time by 29 minutes (1740000 ms)
      vi.advanceTimersByTime(SESSION_TIMEOUT_MS - 60000);

      expect(isSessionExpired()).toBe(false);
    });

    it('resets session timeout on user activity', () => {
      const initialTime = Date.now();
      localStorage.setItem('lastActivityTime', initialTime.toString());

      // Fast-forward by 20 minutes
      vi.advanceTimersByTime(1200000);

      // User activity occurs
      act(() => {
        resetSessionTimeout();
      });

      // Fast-forward by another 20 minutes (total 40 minutes from initial, but only 20 from reset)
      vi.advanceTimersByTime(1200000);

      // Session should NOT be expired because timeout was reset
      expect(isSessionExpired()).toBe(false);
    });

    it('tracks multiple user activities correctly', () => {
      const initialTime = Date.now();
      localStorage.setItem('lastActivityTime', initialTime.toString());

      // Activity 1: after 10 minutes
      vi.advanceTimersByTime(600000);
      act(() => {
        resetSessionTimeout();
      });

      // Activity 2: after another 15 minutes
      vi.advanceTimersByTime(900000);
      act(() => {
        resetSessionTimeout();
      });

      // Activity 3: after another 10 minutes
      vi.advanceTimersByTime(600000);
      act(() => {
        resetSessionTimeout();
      });

      // Total time: 35 minutes, but last activity was 0 minutes ago
      expect(isSessionExpired()).toBe(false);
    });
  });

  describe('Session Expiry Handling', () => {
    it('shows expiry message and redirects to login when session expires', async () => {
      const { result } = renderHook(() => useSession());

      // Set session as expired
      const expiredTime = Date.now() - SESSION_TIMEOUT_MS - 1000;
      localStorage.setItem('lastActivityTime', expiredTime.toString());

      // Trigger session check
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isExpired).toBe(true);
      expect(result.current.expiryMessage).toBe(
        'Your session has expired. Please log in again.',
      );

      await act(async () => {
        await result.current.handleExpiredSession();
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('does not show expiry message when session is active', () => {
      const activeTime = Date.now();
      localStorage.setItem('lastActivityTime', activeTime.toString());

      const { result } = renderHook(() => useSession());

      expect(result.current.isExpired).toBe(false);
      expect(result.current.expiryMessage).toBeNull();
    });
  });

  describe('Logout', () => {
    it('clears session and redirects to login', async () => {
      // Set up session data
      localStorage.setItem('lastActivityTime', Date.now().toString());
      document.cookie = 'accessToken=mock-token; path=/';

      await act(async () => {
        await logout();
      });

      // Verify session data is cleared
      expect(localStorage.getItem('lastActivityTime')).toBeNull();
      expect(document.cookie).not.toContain('accessToken');

      // Verify redirect
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('clears all auth-related cookies', async () => {
      // Set multiple auth cookies
      document.cookie = 'accessToken=mock-access; path=/';
      document.cookie = 'refreshToken=mock-refresh; path=/';

      await act(async () => {
        await logout();
      });

      expect(document.cookie).not.toContain('accessToken');
      expect(document.cookie).not.toContain('refreshToken');
    });

    it('logs activity when logout is called', async () => {
      const mockLogActivity = vi.fn();

      // Mock the activity logging function
      vi.spyOn(
        await import('@/lib/api/auth'),
        'logActivity',
      ).mockImplementation(mockLogActivity);

      await act(async () => {
        await logout();
      });

      expect(mockLogActivity).toHaveBeenCalledWith({
        action: 'Logout',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('useSession Hook', () => {
    it('provides session state and methods', () => {
      const { result } = renderHook(() => useSession());

      expect(result.current).toHaveProperty('isExpired');
      expect(result.current).toHaveProperty('expiryMessage');
      expect(result.current).toHaveProperty('resetTimeout');
      expect(result.current).toHaveProperty('handleExpiredSession');
    });

    it('automatically checks for expiry on mount', () => {
      const expiredTime = Date.now() - SESSION_TIMEOUT_MS - 1000;
      localStorage.setItem('lastActivityTime', expiredTime.toString());

      const { result } = renderHook(() => useSession());

      expect(result.current.isExpired).toBe(true);
    });

    it('sets up activity listeners', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useSession());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
      );
    });

    it('cleans up activity listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useSession());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
      );
    });
  });
});
