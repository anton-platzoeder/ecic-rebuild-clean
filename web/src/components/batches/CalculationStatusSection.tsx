/**
 * Calculation Status Section Component
 *
 * Displays calculation status with completion timestamp.
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import type { BatchCalculation } from '@/lib/api/batches';

interface CalculationStatusSectionProps {
  calculationStatus: string;
  calculations: BatchCalculation[];
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function CalculationStatusSection({
  calculationStatus,
  calculations,
}: CalculationStatusSectionProps) {
  const completedCalculation = calculations.find(
    (c) => c.status === 'Complete',
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Calculator className="h-5 w-5" />
          Calculation Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-2">
          <span className="font-semibold">Status:</span> {calculationStatus}
        </p>
        {completedCalculation && completedCalculation.completedAt && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Completed:</span>{' '}
            {formatTimestamp(completedCalculation.completedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
