/**
 * Auto-Refresh Session Component
 *
 * Automatically refreshes the session when 15 minutes remain.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/api/client';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export function AutoRefreshSession() {
  const router = useRouter();

  useEffect(() => {
    const checkAndRefresh = async () => {
      const lastActivityTime = localStorage.getItem('lastActivityTime');
      if (!lastActivityTime) return;

      const now = Date.now();
      const elapsed = now - parseInt(lastActivityTime, 10);
      const remaining = SESSION_TIMEOUT_MS - elapsed;

      if (remaining <= REFRESH_THRESHOLD_MS && remaining > 0) {
        try {
          const refreshToken = getRefreshTokenFromCookie();
          if (!refreshToken) {
            router.push('/login');
            return;
          }

          const response = await post<{
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
          }>('/v1/auth/refresh', { refreshToken });

          document.cookie = `accessToken=${response.accessToken}; path=/; max-age=${response.expiresIn}`;
          document.cookie = `refreshToken=${response.refreshToken}; path=/; max-age=${response.expiresIn * 2}`;

          localStorage.setItem('lastActivityTime', now.toString());
        } catch {
          router.push('/login');
        }
      }
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 60000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}

function getRefreshTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)refreshToken=([^;]*)/);
  return match ? match[1] : null;
}
