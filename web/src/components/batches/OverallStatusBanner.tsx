/**
 * Overall Status Banner Component
 *
 * Displays overall batch status with color-coded banner:
 * - Green: all data complete, no errors
 * - Yellow: missing files or warnings
 * - Red: validation errors present
 */
'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { ReportBatch } from '@/lib/api/batches';

interface OverallStatusBannerProps {
  batch: ReportBatch;
}

function getBannerStatus(batch: ReportBatch): 'success' | 'warning' | 'error' {
  if (batch.validationSummary.errors > 0) {
    return 'error';
  }

  if (
    batch.fileSummary.received < batch.fileSummary.total ||
    batch.validationSummary.warnings > 0
  ) {
    return 'warning';
  }

  if (
    batch.fileSummary.received === batch.fileSummary.total &&
    batch.validationSummary.errors === 0 &&
    batch.validationSummary.warnings === 0 &&
    batch.calculationStatus === 'Complete'
  ) {
    return 'success';
  }

  return 'warning';
}

export function OverallStatusBanner({ batch }: OverallStatusBannerProps) {
  const status = getBannerStatus(batch);

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  };

  const titles = {
    success: 'All Data Complete',
    warning: 'Action Required',
    error: 'Validation Errors Present',
  };

  const descriptions = {
    success: 'All files received, no validation errors. Ready for processing.',
    warning:
      'Some files missing or warnings present. Review before proceeding.',
    error: 'Validation errors must be resolved before proceeding.',
  };

  const borderColors = {
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
  };

  const Icon = icons[status];

  return (
    <Alert role="alert" className={`border-2 ${borderColors[status]}`}>
      <Icon className="h-5 w-5" />
      <AlertTitle>{titles[status]}</AlertTitle>
      <AlertDescription>{descriptions[status]}</AlertDescription>
    </Alert>
  );
}
