/**
 * Session Warning Component
 *
 * Displays a warning when the session is about to expire (5 minutes remaining).
 */

'use client';

import { useEffect, useState } from 'react';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function SessionWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const lastActivityTime = localStorage.getItem('lastActivityTime');
      if (!lastActivityTime) return;

      const now = Date.now();
      const elapsed = now - parseInt(lastActivityTime, 10);
      const remaining = SESSION_TIMEOUT_MS - elapsed;

      if (remaining <= WARNING_THRESHOLD_MS && remaining > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!showWarning) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-md p-4 shadow-lg"
    >
      <p className="text-sm font-semibold text-yellow-800">
        Your session will expire in 5 minutes
      </p>
      <p className="text-sm text-yellow-700 mt-1">Save your work</p>
    </div>
  );
}
