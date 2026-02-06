/**
 * Story Metadata:
 * - Epic: 1
 * - Story: 1
 * - Target: middleware.ts
 *
 * Tests for Authentication Middleware
 * Ensures unauthenticated users are redirected to /login
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import * as authHelpers from '@/lib/auth/auth-helpers';

// Mock auth helpers
vi.mock('@/lib/auth/auth-helpers', () => ({
  getSessionFromRequest: vi.fn(),
  isAuthenticatedRequest: vi.fn(),
}));

const mockGetSessionFromRequest =
  authHelpers.getSessionFromRequest as ReturnType<typeof vi.fn>;
const mockIsAuthenticatedRequest =
  authHelpers.isAuthenticatedRequest as ReturnType<typeof vi.fn>;

describe('Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated Access', () => {
    it('redirects to /login when accessing root without authentication', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(false);

      const request = new NextRequest(new URL('http://localhost:3000/'));

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(307); // Temporary redirect
      expect(response?.headers.get('location')).toContain('/login');
    });

    it('redirects to /login when accessing dashboard without authentication', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(false);

      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard'),
      );

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.headers.get('location')).toContain('/login');
    });

    it('redirects to /login when accessing protected routes without authentication', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(false);

      const protectedRoutes = [
        '/portfolios',
        '/reports',
        '/admin',
        '/approvals',
      ];

      for (const route of protectedRoutes) {
        const request = new NextRequest(
          new URL(`http://localhost:3000${route}`),
        );
        const response = await middleware(request);

        expect(response?.headers.get('location')).toContain('/login');
      }
    });

    it('allows access to /login without authentication', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(false);

      const request = new NextRequest(new URL('http://localhost:3000/login'));

      const response = await middleware(request);

      // Should not redirect (allows access to login page)
      expect(response).toBeUndefined();
    });

    it('allows access to public assets without authentication', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(false);

      const publicPaths = [
        '/_next/static/chunk.js',
        '/favicon.ico',
        '/images/logo.png',
      ];

      for (const path of publicPaths) {
        const request = new NextRequest(
          new URL(`http://localhost:3000${path}`),
        );
        const response = await middleware(request);

        expect(response).toBeUndefined();
      }
    });
  });

  describe('Authenticated Access', () => {
    it('allows authenticated users to access root', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(true);
      mockGetSessionFromRequest.mockResolvedValue({
        user: {
          id: 'user-1',
          username: 'jdoe',
          displayName: 'John Doe',
          email: 'jdoe@example.com',
          roles: ['Analyst'],
        },
      });

      const request = new NextRequest(new URL('http://localhost:3000/'));

      const response = await middleware(request);

      // Should not redirect
      expect(response).toBeUndefined();
    });

    it('allows authenticated users to access dashboard', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(true);
      mockGetSessionFromRequest.mockResolvedValue({
        user: {
          id: 'user-1',
          username: 'jdoe',
          roles: ['Analyst'],
        },
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard'),
      );

      const response = await middleware(request);

      expect(response).toBeUndefined();
    });

    it('redirects authenticated users away from /login to dashboard', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(true);
      mockGetSessionFromRequest.mockResolvedValue({
        user: {
          id: 'user-1',
          username: 'jdoe',
          roles: ['Analyst'],
        },
      });

      const request = new NextRequest(new URL('http://localhost:3000/login'));

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.headers.get('location')).toContain('/dashboard');
    });
  });

  describe('Session Validation', () => {
    it('treats expired session as unauthenticated', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(false);

      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard'),
      );

      const response = await middleware(request);

      expect(response?.headers.get('location')).toContain('/login');
    });

    it('validates session token on each request', async () => {
      mockIsAuthenticatedRequest.mockResolvedValue(true);

      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard'),
      );

      await middleware(request);

      expect(mockIsAuthenticatedRequest).toHaveBeenCalledWith(request);
    });
  });
});
