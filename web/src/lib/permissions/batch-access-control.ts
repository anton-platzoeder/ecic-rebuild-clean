/**
 * Batch Access Control Utilities
 *
 * Pure functions for determining batch lock state based on workflow status.
 * Lock is absolute - no role-based overrides.
 */

import { WorkflowStage } from '@/lib/constants/workflow-stages';

/**
 * Lock state enum - three distinct states for batch data access
 */
export enum BatchLockState {
  Unlocked = 'Unlocked',
  Locked = 'Locked',
  Archived = 'Archived',
}

/**
 * Check if a batch is locked based on workflow status.
 * Returns true for all non-DataPreparation statuses (fail-safe).
 *
 * @param status - Current workflow status
 * @returns true if batch is locked, false if editable
 */
export function isBatchLocked(status: string): boolean {
  return status !== WorkflowStage.DataPreparation;
}

/**
 * Check if batch data can be modified.
 * Inverse of isBatchLocked() for clearer intent in some contexts.
 *
 * @param batchStatus - Current workflow status
 * @returns true if data can be modified, false otherwise
 */
export function canModifyBatchData(batchStatus: string): boolean {
  return !isBatchLocked(batchStatus);
}

/**
 * Get user-friendly lock message based on workflow status.
 *
 * @param status - Current workflow status
 * @returns Human-readable lock message
 */
export function getLockMessage(status: string): string {
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

  // Fail-safe for unknown statuses
  return 'Batch is locked';
}

/**
 * Get the lock state for a batch based on workflow status.
 *
 * @param status - Current workflow status
 * @returns BatchLockState enum value
 */
export function getBatchLockState(status: string): BatchLockState {
  if (status === WorkflowStage.DataPreparation) {
    return BatchLockState.Unlocked;
  }

  if (status === WorkflowStage.Approved) {
    return BatchLockState.Archived;
  }

  // All approval stages (Level1Pending, Level2Pending, Level3Pending) and unknown statuses
  return BatchLockState.Locked;
}
