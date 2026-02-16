/**
 * Batch Detail Client Component
 *
 * Client-side component that fetches and displays comprehensive batch status information.
 * Provides overview of files, validation, calculations, and workflow state.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { BatchHeader } from '@/components/batches/BatchHeader';
import { OverallStatusBanner } from '@/components/batches/OverallStatusBanner';
import { FileStatusSection } from '@/components/batches/FileStatusSection';
import { ValidationSummarySection } from '@/components/batches/ValidationSummarySection';
import { CalculationStatusSection } from '@/components/batches/CalculationStatusSection';
import { WorkflowInfoSection } from '@/components/batches/WorkflowInfoSection';
import { KeyMetricsPanel } from '@/components/batches/KeyMetricsPanel';
import {
  getReportBatch,
  getBatchCalculations,
  getBatchApprovals,
  getBatchValidation,
  getBatchWorkflowStatus,
  type ReportBatch,
  type BatchCalculation,
  type BatchApproval,
  type BatchValidationResult,
  type BatchWorkflowStatus,
} from '@/lib/api/batches';

interface BatchDetailClientProps {
  batchId: number;
}

export default function BatchDetailClient({ batchId }: BatchDetailClientProps) {
  const [batch, setBatch] = useState<ReportBatch | null>(null);
  const [calculations, setCalculations] = useState<BatchCalculation[]>([]);
  const [approvals, setApprovals] = useState<BatchApproval[]>([]);
  const [validation, setValidation] = useState<BatchValidationResult | null>(
    null,
  );
  const [workflowStatus, setWorkflowStatus] =
    useState<BatchWorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBatchData() {
      try {
        const [
          batchData,
          calculationsData,
          approvalsData,
          validationData,
          workflowData,
        ] = await Promise.all([
          getReportBatch(batchId),

          getBatchCalculations(batchId),
          getBatchApprovals(batchId),
          getBatchValidation(batchId),
          getBatchWorkflowStatus(batchId),
        ]);

        if (!cancelled) {
          setBatch(batchData);

          setCalculations(calculationsData);
          setApprovals(approvalsData);
          setValidation(validationData);
          setWorkflowStatus(workflowData);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage =
            err instanceof Error &&
            err.message.toLowerCase().includes('not found')
              ? err.message
              : 'Failed to load batch details';
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    }

    loadBatchData();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" role="progressbar" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/batches">Return to Batch Management</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!batch || !workflowStatus) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <BatchHeader
        reportDate={batch.reportDate}
        status={batch.status}
        createdBy={batch.createdBy}
      />

      <OverallStatusBanner batch={batch} />

      <div className="grid gap-6 md:grid-cols-2">
        <FileStatusSection
          batchId={batchId}
          received={batch.fileSummary.received}
          total={batch.fileSummary.total}
        />

        <ValidationSummarySection
          errors={batch.validationSummary.errors}
          warnings={batch.validationSummary.warnings}
          validationDetails={validation || undefined}
        />

        <CalculationStatusSection
          calculationStatus={batch.calculationStatus}
          calculations={calculations}
        />

        <WorkflowInfoSection
          currentStage={workflowStatus.currentStage}
          lastUpdated={workflowStatus.lastUpdated}
          approvals={approvals}
        />
      </div>

      <KeyMetricsPanel calculations={calculations} />

      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link href={`/batches/${batchId}/workflow`}>Workflow History</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/batches/${batchId}/validation`}>
            Validation Details
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/batches/${batchId}/files`}>View Files</Link>
        </Button>
      </div>
    </div>
  );
}
