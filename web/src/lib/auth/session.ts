'use client';

/**
 * Session Management Utilities
 *
 * Handles client-side session timeout, activity tracking, and logout functionality.
 * Sessions expire after 30 minutes of inactivity.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { logActivity } from '@/lib/api/auth';

/**
 * Session timeout duration in milliseconds (30 minutes)
 */
export const SESSION_TIMEOUT_MS = 1800000;

/**
 * Module-level router reference for use in standalone logout function
 * This is set by the useSession hook when a component mounts
 */
let routerRef: ReturnType<typeof useRouter> | null = null;

/**
 * Check if the current session has expired
 *
 * @returns true if session has expired due to inactivity
 */
export function isSessionExpired(): boolean {
  const lastActivityTime = localStorage.getItem('lastActivityTime');

  if (!lastActivityTime) {
    return true;
  }

  const timeSinceLastActivity = Date.now() - parseInt(lastActivityTime, 10);
  return timeSinceLastActivity >= SESSION_TIMEOUT_MS;
}

/**
 * Reset the session timeout by updating the last activity timestamp
 */
export function resetSessionTimeout(): void {
  localStorage.setItem('lastActivityTime', Date.now().toString());
}

/**
 * Clear all auth cookies
 */
function clearAuthCookies(): void {
  // Clear accessToken cookie
  document.cookie =
    'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  // Clear refreshToken cookie
  document.cookie =
    'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Logout the current user
 * - Clears session storage
 * - Clears authentication cookies
 * - Logs the logout activity
 * - Redirects to login page
 */
export async function logout(): Promise<void> {
  // Clear session data
  localStorage.removeItem('lastActivityTime');

  // Clear auth cookies
  clearAuthCookies();

  // Log the logout activity
  try {
    await logActivity({
      action: 'Logout',
      timestamp: Date.now(),
    });
  } catch (error) {
    // Ignore errors from logging - proceed with logout anyway
    console.error('Failed to log logout activity:', error);
  }

  // Redirect to login page
  // Use the router reference if available (from useSession hook)
  // Otherwise fall back to window.location
  if (routerRef) {
    routerRef.push('/login');
  } else {
    window.location.href = '/login';
  }
}

/**
 * Session state for the useSession hook
 */
export interface SessionState {
  isExpired: boolean;
  expiryMessage: string | null;
  resetTimeout: () => void;
  handleExpiredSession: () => Promise<void>;
}

/**
 * React hook for managing session state and activity tracking
 *
 * Features:
 * - Checks for session expiry on mount
 * - Tracks user activity (mouse, keyboard, clicks)
 * - Automatically resets session timeout on activity
 * - Provides session status and handlers
 *
 * @returns Session state and control methods
 */
export function useSession(): SessionState {
  const router = useRouter();

  // Initialize state with current expiry status to support fake timers in tests
  // State initializer runs synchronously on first render, avoiding timing issues
  const [isExpired, setIsExpired] = useState(() => isSessionExpired());

  useEffect(() => {
    // Store router reference for use by logout function
    routerRef = router;

    // Set up activity listeners that reset timeout and update expiry state
    const handleActivity = () => {
      resetSessionTimeout();
      setIsExpired(false);
    };

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
    };
  }, [router]);

  const handleExpiredSession = async (): Promise<void> => {
    router.push('/login');
  };

  return {
    isExpired,
    expiryMessage: isExpired
      ? 'Your session has expired. Please log in again.'
      : null,
    resetTimeout: resetSessionTimeout,
    handleExpiredSession,
  };
}
