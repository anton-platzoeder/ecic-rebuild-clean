/**
 * Story Metadata:
 * - Epic: 2
 * - Story: 5
 * - Route: N/A (utility module)
 * - Target File: lib/permissions/batch-access-control.ts
 * - Page Action: create_new
 *
 * Tests for Batch Access Control Utilities
 *
 * Tests pure functions for determining batch lock state based on workflow status.
 * Lock is absolute - no role-based overrides.
 */
import { describe, it, expect } from 'vitest';
import {
  isBatchLocked,
  canModifyBatchData,
  getLockMessage,
  getBatchLockState,
  BatchLockState,
} from '@/lib/permissions/batch-access-control';
import { WorkflowStage } from '@/lib/constants/workflow-stages';

describe('Batch Access Control Utilities', () => {
  describe('isBatchLocked()', () => {
    it('returns false for DataPreparation status', () => {
      expect(isBatchLocked(WorkflowStage.DataPreparation)).toBe(false);
    });

    it('returns true for Level1Pending status', () => {
      expect(isBatchLocked(WorkflowStage.Level1Pending)).toBe(true);
    });

    it('returns true for Level2Pending status', () => {
      expect(isBatchLocked(WorkflowStage.Level2Pending)).toBe(true);
    });

    it('returns true for Level3Pending status', () => {
      expect(isBatchLocked(WorkflowStage.Level3Pending)).toBe(true);
    });

    it('returns true for Approved status', () => {
      expect(isBatchLocked(WorkflowStage.Approved)).toBe(true);
    });

    it('returns true for unknown status (fail-safe)', () => {
      expect(isBatchLocked('UnknownStatus')).toBe(true);
    });

    it('returns true for empty string status (fail-safe)', () => {
      expect(isBatchLocked('')).toBe(true);
    });
  });

  describe('canModifyBatchData()', () => {
    it('returns true for DataPreparation status', () => {
      expect(canModifyBatchData(WorkflowStage.DataPreparation)).toBe(true);
    });

    it('returns false for Level1Pending status', () => {
      expect(canModifyBatchData(WorkflowStage.Level1Pending)).toBe(false);
    });

    it('returns false for Level2Pending status', () => {
      expect(canModifyBatchData(WorkflowStage.Level2Pending)).toBe(false);
    });

    it('returns false for Level3Pending status', () => {
      expect(canModifyBatchData(WorkflowStage.Level3Pending)).toBe(false);
    });

    it('returns false for Approved status', () => {
      expect(canModifyBatchData(WorkflowStage.Approved)).toBe(false);
    });

    it('returns false for unknown status (fail-safe)', () => {
      expect(canModifyBatchData('UnknownStatus')).toBe(false);
    });
  });

  describe('getLockMessage()', () => {
    it('returns editable message for DataPreparation status', () => {
      const message = getLockMessage(WorkflowStage.DataPreparation);
      expect(message).toContain('editable');
    });

    it('returns approval lock message for Level1Pending status', () => {
      const message = getLockMessage(WorkflowStage.Level1Pending);
      expect(message).toContain('locked');
      expect(message).toContain('approval');
    });

    it('returns approval lock message for Level2Pending status', () => {
      const message = getLockMessage(WorkflowStage.Level2Pending);
      expect(message).toContain('locked');
      expect(message).toContain('approval');
    });

    it('returns approval lock message for Level3Pending status', () => {
      const message = getLockMessage(WorkflowStage.Level3Pending);
      expect(message).toContain('locked');
      expect(message).toContain('approval');
    });

    it('returns approved lock message for Approved status', () => {
      const message = getLockMessage(WorkflowStage.Approved);
      expect(message).toContain('locked');
      expect(message).toContain('approved');
    });

    it('returns generic lock message for unknown status', () => {
      const message = getLockMessage('UnknownStatus');
      expect(message).toContain('locked');
    });
  });

  describe('getBatchLockState()', () => {
    it('returns Unlocked for DataPreparation status', () => {
      expect(getBatchLockState(WorkflowStage.DataPreparation)).toBe(
        BatchLockState.Unlocked,
      );
    });

    it('returns Locked for Level1Pending status', () => {
      expect(getBatchLockState(WorkflowStage.Level1Pending)).toBe(
        BatchLockState.Locked,
      );
    });

    it('returns Locked for Level2Pending status', () => {
      expect(getBatchLockState(WorkflowStage.Level2Pending)).toBe(
        BatchLockState.Locked,
      );
    });

    it('returns Locked for Level3Pending status', () => {
      expect(getBatchLockState(WorkflowStage.Level3Pending)).toBe(
        BatchLockState.Locked,
      );
    });

    it('returns Archived for Approved status', () => {
      expect(getBatchLockState(WorkflowStage.Approved)).toBe(
        BatchLockState.Archived,
      );
    });

    it('returns Locked for unknown status (fail-safe)', () => {
      expect(getBatchLockState('UnknownStatus')).toBe(BatchLockState.Locked);
    });
  });

  describe('BatchLockState enum', () => {
    it('has three distinct lock states', () => {
      expect(BatchLockState.Unlocked).toBe('Unlocked');
      expect(BatchLockState.Locked).toBe('Locked');
      expect(BatchLockState.Archived).toBe('Archived');
    });

    it('uses different values for each state', () => {
      const states = [
        BatchLockState.Unlocked,
        BatchLockState.Locked,
        BatchLockState.Archived,
      ];
      const uniqueStates = new Set(states);
      expect(uniqueStates.size).toBe(3);
    });
  });

  describe('Integration scenarios', () => {
    it('lock state and canModify are consistent for DataPreparation', () => {
      const status = WorkflowStage.DataPreparation;
      expect(isBatchLocked(status)).toBe(false);
      expect(canModifyBatchData(status)).toBe(true);
      expect(getBatchLockState(status)).toBe(BatchLockState.Unlocked);
    });

    it('lock state and canModify are consistent for Level1Pending', () => {
      const status = WorkflowStage.Level1Pending;
      expect(isBatchLocked(status)).toBe(true);
      expect(canModifyBatchData(status)).toBe(false);
      expect(getBatchLockState(status)).toBe(BatchLockState.Locked);
    });

    it('lock state and canModify are consistent for Approved', () => {
      const status = WorkflowStage.Approved;
      expect(isBatchLocked(status)).toBe(true);
      expect(canModifyBatchData(status)).toBe(false);
      expect(getBatchLockState(status)).toBe(BatchLockState.Archived);
    });

    it('all approval stages are locked', () => {
      const approvalStages = [
        WorkflowStage.Level1Pending,
        WorkflowStage.Level2Pending,
        WorkflowStage.Level3Pending,
      ];

      approvalStages.forEach((stage) => {
        expect(isBatchLocked(stage)).toBe(true);
        expect(canModifyBatchData(stage)).toBe(false);
        expect(getBatchLockState(stage)).toBe(BatchLockState.Locked);
      });
    });
  });
});
