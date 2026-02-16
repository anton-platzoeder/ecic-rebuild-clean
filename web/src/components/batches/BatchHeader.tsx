/**
 * Batch Header Component
 *
 * Displays batch name, reporting date, status badge, and created by information.
 */
'use client';

import { Badge } from '@/components/ui/badge';
import { formatReportDate } from '@/lib/utils/date-formatting';

interface BatchHeaderProps {
  reportDate: string;
  status: string;
  createdBy: string;
}

function getStatusVariant(
  status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status.includes('Pending')) return 'default';
  if (status === 'DataPreparation') return 'secondary';
  if (status === 'Approved') return 'outline';
  if (status.includes('Rejected')) return 'destructive';
  return 'outline';
}

export function BatchHeader({
  reportDate,
  status,
  createdBy,
}: BatchHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">{formatReportDate(reportDate)}</h1>
      <div className="flex items-center gap-4">
        <Badge variant={getStatusVariant(status)}>{status}</Badge>
        <span className="text-sm text-muted-foreground">
          Created by: {createdBy}
        </span>
      </div>
    </div>
  );
}
