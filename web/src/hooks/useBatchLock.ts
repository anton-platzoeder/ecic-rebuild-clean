/**
 * useBatchLock Hook
 *
 * React hook for fetching and managing batch lock state.
 * Includes fail-safe behavior (defaults to locked on error).
 */

import { useState, useEffect } from 'react';
import { getBatchWorkflowStatus } from '@/lib/api/batches';
import { BatchLockState } from '@/lib/permissions/batch-access-control';
import { WorkflowStage } from '@/lib/constants/workflow-stages';

/**
 * Return type for useBatchLock hook
 */
export interface BatchLockInfo {
  isLocked: boolean;
  lockState: BatchLockState;
  lockMessage: string;
  isLoading: boolean;
  error: string | null;
}

function isBatchLockedInternal(status: string): boolean {
  return status !== WorkflowStage.DataPreparation;
}

function getLockMessageInternal(status: string): string {
  if (status === WorkflowStage.DataPreparation) {
    return 'Batch data is editable';
  }
  if (status === WorkflowStage.Approved) {
    return 'Batch is locked (approved and archived)';
  }
  if (
    status === WorkflowStage.Level1Pending ||
    status === WorkflowStage.Level2Pending ||
    status === WorkflowStage.Level3Pending
  ) {
    return 'Batch is locked for approval';
  }
  return 'Batch is locked';
}

function getBatchLockStateInternal(status: string): BatchLockState {
  if (status === WorkflowStage.DataPreparation) {
    return BatchLockState.Unlocked;
  }
  if (status === WorkflowStage.Approved) {
    return BatchLockState.Archived;
  }
  return BatchLockState.Locked;
}

/**
 * Hook to fetch and track batch lock state.
 * Fails safe to locked state on errors.
 */
export function useBatchLock(batchId: number | null): BatchLockInfo {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [lockState, setLockState] = useState<BatchLockState>(
    BatchLockState.Locked,
  );
  const [lockMessage, setLockMessage] = useState<string>('Batch is locked');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchId === null) {
      setIsLocked(true);
      setLockState(BatchLockState.Locked);
      setLockMessage('No active batch');
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentBatchId: number = batchId;

    async function fetchLockState() {
      setIsLoading(true);
      setError(null);

      try {
        const workflowStatus = await getBatchWorkflowStatus(currentBatchId);
        const locked = isBatchLockedInternal(workflowStatus.currentStage);
        const state = getBatchLockStateInternal(workflowStatus.currentStage);
        const message = getLockMessageInternal(workflowStatus.currentStage);

        setIsLocked(locked);
        setLockState(state);
        setLockMessage(message);
      } catch (err) {
        setIsLocked(true);
        setLockState(BatchLockState.Locked);
        setLockMessage('Unable to verify lock status. Locked as a precaution.');

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to check lock status');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchLockState();
  }, [batchId]);

  return {
    isLocked,
    lockState,
    lockMessage,
    isLoading,
    error,
  };
}
