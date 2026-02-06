'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/api/auth';
import type { AuthUser } from '@/lib/api/auth';
import {
  getPendingActions,
  getActiveBatches,
  getDashboardActivity,
  getDataQualitySummary,
} from '@/lib/api/dashboard';
import type {
  PendingAction,
  ActiveBatchesResponse,
  DashboardActivity,
  DataQualitySummary,
} from '@/lib/api/dashboard';

const MONTHS = [
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

function formatReportDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatToday(): string {
  const date = new Date();
  const weekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return `${weekdays[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getActionLinkText(type: string): string {
  switch (type) {
    case 'approval':
      return 'Review';
    case 'master_data':
      return 'Fix';
    default:
      return 'View';
  }
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [activeBatches, setActiveBatches] =
    useState<ActiveBatchesResponse | null>(null);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQualitySummary | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const results = await Promise.allSettled([
          getPendingActions(),
          getActiveBatches(),
          getDashboardActivity(),
          getDataQualitySummary(),
        ]);

        if (results[0].status === 'fulfilled') {
          setPendingActions(results[0].value);
        } else {
          setErrors((prev) => ({
            ...prev,
            pendingActions: 'Error loading pending actions',
          }));
        }

        if (results[1].status === 'fulfilled') {
          setActiveBatches(results[1].value);
        } else {
          setErrors((prev) => ({
            ...prev,
            activeBatches: 'Error loading batches',
          }));
        }

        if (results[2].status === 'fulfilled') {
          setActivity(results[2].value);
        }

        if (results[3].status === 'fulfilled') {
          setDataQuality(results[3].value);
        }
      } catch {
        // User fetch failed - redirect to login or show error
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div role="progressbar" aria-label="Loading dashboard">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        {user && (
          <h1 className="text-2xl font-bold">
            Welcome, {user.displayName} - {user.roles.join(', ')}
          </h1>
        )}
        <p className="text-muted-foreground">{formatToday()}</p>
      </header>

      {Object.entries(errors).map(([key, message]) => (
        <div
          key={key}
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 p-4 text-red-700"
        >
          {message}
        </div>
      ))}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold mb-4">Pending Actions</h2>
          {pendingActions.length > 0 ? (
            <ul className="space-y-3">
              {pendingActions.map((action) => (
                <li key={action.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <a
                      href={action.link}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(action.link);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      {getActionLinkText(action.type)}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No pending actions</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Active Batches</h2>
          {activeBatches && activeBatches.items.length > 0 ? (
            <ul className="space-y-3">
              {activeBatches.items.map((batch) => (
                <li key={batch.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {batch.reportBatchType} -{' '}
                        {formatReportDate(batch.reportDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {batch.status}
                      </p>
                    </div>
                    <a
                      href={`/batches/${batch.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/batches/${batch.id}`);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      View Details
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No active batches</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {activity.length > 0 ? (
            <ul className="space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="rounded border p-3">
                  <p>{item.action}</p>
                  <p className="text-sm text-muted-foreground">{item.user}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No recent activity</p>
          )}
        </section>

        {dataQuality && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Data Quality Alerts</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt>Missing Ratings</dt>
                <dd>{dataQuality.missingRatings}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Missing Durations</dt>
                <dd>{dataQuality.missingDurations}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Missing Betas</dt>
                <dd>{dataQuality.missingBetas}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Missing Index Prices</dt>
                <dd>{dataQuality.missingIndexPrices}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </main>
  );
}
