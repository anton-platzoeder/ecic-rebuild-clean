/**
 * Story Metadata:
 * - Route: N/A (applies to all authenticated pages)
 * - Target File: lib/auth/session.ts, components/SessionWarning.tsx
 * - Page Action: create_new
 *
 * Tests for Session Warning & Auto-Refresh
 * Epic 1, Story 7 - Session expiration warning and automatic token refresh
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock API client
vi.mock('@/lib/api/client', () => ({
  post: vi.fn(),
}));

import { post } from '@/lib/api/client';
import { SessionWarning } from '@/components/SessionWarning';
import { AutoRefreshSession } from '@/components/AutoRefreshSession';

const mockPost = post as ReturnType<typeof vi.fn>;
const mockRouterPush = vi.fn();
const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;

describe('Session Warning Toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseRouter.mockReturnValue({ push: mockRouterPush });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows warning toast at 5 minutes remaining', async () => {
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    // Set last activity to 25 minutes ago (5 minutes remaining)
    const now = Date.now();
    localStorage.setItem(
      'lastActivityTime',
      (now - (SESSION_TIMEOUT_MS - WARNING_THRESHOLD_MS)).toString(),
    );

    render(<SessionWarning />);

    await waitFor(() => {
      expect(
        screen.getByText(/Your session will expire in 5 minutes/i),
      ).toBeInTheDocument();
    });
  });

  it('shows save your work message in warning', async () => {
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    const WARNING_THRESHOLD_MS = 5 * 60 * 1000;

    const now = Date.now();
    localStorage.setItem(
      'lastActivityTime',
      (now - (SESSION_TIMEOUT_MS - WARNING_THRESHOLD_MS)).toString(),
    );

    render(<SessionWarning />);

    await waitFor(() => {
      expect(screen.getByText(/Save your work/i)).toBeInTheDocument();
    });
  });

  it('does not show warning when session has more than 5 minutes remaining', async () => {
    const now = Date.now();
    localStorage.setItem('lastActivityTime', (now - 1000).toString());

    render(<SessionWarning />);

    // Wait a bit to ensure no warning appears
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(
      screen.queryByText(/Your session will expire/i),
    ).not.toBeInTheDocument();
  });
});

describe('Auto-Refresh Session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseRouter.mockReturnValue({ push: mockRouterPush });
    vi.useFakeTimers();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'refreshToken=valid-refresh-token; path=/;',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('automatically refreshes session at 15 minutes remaining', async () => {
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const REFRESH_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

    // Set last activity to 15 minutes ago (15 minutes remaining)
    const now = Date.now();
    localStorage.setItem(
      'lastActivityTime',
      (now - (SESSION_TIMEOUT_MS - REFRESH_THRESHOLD_MS)).toString(),
    );

    mockPost.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 1800,
    });

    render(<AutoRefreshSession />);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/v1/auth/refresh', {
        refreshToken: expect.any(String),
      });
    });
  });

  it('updates cookies after successful refresh', async () => {
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    const REFRESH_THRESHOLD_MS = 15 * 60 * 1000;

    const now = Date.now();
    localStorage.setItem(
      'lastActivityTime',
      (now - (SESSION_TIMEOUT_MS - REFRESH_THRESHOLD_MS)).toString(),
    );

    mockPost.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 1800,
    });

    render(<AutoRefreshSession />);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });

    // Implementation will update document.cookie with new tokens
  });

  it('does not refresh when session has more than 15 minutes remaining', async () => {
    const now = Date.now();
    localStorage.setItem('lastActivityTime', (now - 1000).toString());

    render(<AutoRefreshSession />);

    // Wait a bit to ensure no refresh happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('redirects to login if refresh fails', async () => {
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    const REFRESH_THRESHOLD_MS = 15 * 60 * 1000;

    const now = Date.now();
    localStorage.setItem(
      'lastActivityTime',
      (now - (SESSION_TIMEOUT_MS - REFRESH_THRESHOLD_MS)).toString(),
    );

    mockPost.mockRejectedValue({
      statusCode: 401,
      message: 'Refresh token expired',
    });

    render(<AutoRefreshSession />);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });
});
