/**
 * Key Metrics Panel Component
 *
 * Displays key batch metrics like total portfolios, instruments, holdings, and total value.
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { BatchCalculation } from '@/lib/api/batches';

interface KeyMetricsPanelProps {
  calculations: BatchCalculation[];
}

export function KeyMetricsPanel({ calculations }: KeyMetricsPanelProps) {
  const totalPortfolios =
    calculations.length > 0 ? calculations[0].totalPortfolios : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5" />
          Key Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Portfolios
            </span>
            <span className="text-2xl font-bold">{totalPortfolios}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
