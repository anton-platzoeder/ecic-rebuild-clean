/**
 * Story Metadata:
 * - Epic: 2
 * - Story: 5
 * - Route: N/A (custom hook)
 * - Target File: hooks/useBatchLock.ts
 * - Page Action: create_new
 *
 * Tests for useBatchLock Hook
 *
 * Tests React hook for batch lock state that fetches from API.
 * Includes fail-safe behavior (defaults to locked on error).
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBatchLock } from '@/hooks/useBatchLock';
import * as batchesApi from '@/lib/api/batches';
import { BatchLockState } from '@/lib/permissions/batch-access-control';
import { WorkflowStage } from '@/lib/constants/workflow-stages';

// Mock batches API
vi.mock('@/lib/api/batches', () => ({
  getBatchWorkflowStatus: vi.fn(),
}));

// Mock batch access control utilities
vi.mock('@/lib/permissions/batch-access-control', () => ({
  isBatchLocked: vi.fn(),
  getLockMessage: vi.fn(),
  getBatchLockState: vi.fn(),
  BatchLockState: {
    Unlocked: 'Unlocked',
    Locked: 'Locked',
    Archived: 'Archived',
  },
}));

const mockGetBatchWorkflowStatus =
  batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>;

describe('useBatchLock()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path - Unlocked Batch', () => {
    it('returns unlocked state for DataPreparation batch', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.DataPreparation,
        isLocked: false,
        canConfirm: true,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(false);
      expect(result.current.lockState).toBe(BatchLockState.Unlocked);
      expect(result.current.lockMessage).toContain('editable');
      expect(result.current.error).toBeNull();
    });

    it('fetches workflow status from API on mount', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.DataPreparation,
        isLocked: false,
        canConfirm: true,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(mockGetBatchWorkflowStatus).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Happy Path - Locked Batch', () => {
    it('returns locked state for Level1Pending batch', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.Level1Pending,
        isLocked: true,
        canConfirm: false,
        canApprove: true,
        pendingApprovalLevel: 1,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockState).toBe(BatchLockState.Locked);
      expect(result.current.lockMessage).toContain('locked');
      expect(result.current.error).toBeNull();
    });

    it('returns locked state for Level2Pending batch', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 2,
        currentStage: WorkflowStage.Level2Pending,
        isLocked: true,
        canConfirm: false,
        canApprove: true,
        pendingApprovalLevel: 2,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(2));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockState).toBe(BatchLockState.Locked);
    });

    it('returns locked state for Level3Pending batch', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 3,
        currentStage: WorkflowStage.Level3Pending,
        isLocked: true,
        canConfirm: false,
        canApprove: true,
        pendingApprovalLevel: 3,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(3));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockState).toBe(BatchLockState.Locked);
    });

    it('returns archived state for Approved batch', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 4,
        currentStage: WorkflowStage.Approved,
        isLocked: true,
        canConfirm: false,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(4));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockState).toBe(BatchLockState.Archived);
    });
  });

  describe('Loading State', () => {
    it('starts with isLoading true', () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.DataPreparation,
        isLocked: false,
        canConfirm: true,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(1));

      expect(result.current.isLoading).toBe(true);
    });

    it('sets isLoading to false after API call completes', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.DataPreparation,
        isLocked: false,
        canConfirm: true,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets isLoading to false after API error', async () => {
      mockGetBatchWorkflowStatus.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Error Handling - Fail-Safe Behavior', () => {
    it('defaults to locked state when API fails', async () => {
      mockGetBatchWorkflowStatus.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockState).toBe(BatchLockState.Locked);
    });

    it('shows fail-safe warning message when API fails', async () => {
      mockGetBatchWorkflowStatus.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.lockMessage).toContain('Unable to verify');
      expect(result.current.lockMessage).toContain('precaution');
    });

    it('sets error state with error message when API fails', async () => {
      mockGetBatchWorkflowStatus.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toContain('Network error');
    });

    it('handles generic error objects', async () => {
      mockGetBatchWorkflowStatus.mockRejectedValue('String error');

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(true);
      expect(result.current.error).toBe('Failed to check lock status');
    });
  });

  describe('Null Batch ID', () => {
    it('returns locked state when batchId is null', () => {
      const { result } = renderHook(() => useBatchLock(null));

      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockState).toBe(BatchLockState.Locked);
      expect(result.current.isLoading).toBe(false);
    });

    it('shows "No active batch" message when batchId is null', () => {
      const { result } = renderHook(() => useBatchLock(null));

      expect(result.current.lockMessage).toContain('No active batch');
    });

    it('does not call API when batchId is null', () => {
      renderHook(() => useBatchLock(null));

      expect(mockGetBatchWorkflowStatus).not.toHaveBeenCalled();
    });
  });

  describe('Batch ID Changes', () => {
    it('refetches when batchId changes', async () => {
      mockGetBatchWorkflowStatus
        .mockResolvedValueOnce({
          batchId: 1,
          currentStage: WorkflowStage.DataPreparation,
          isLocked: false,
          canConfirm: true,
          canApprove: false,
          pendingApprovalLevel: null,
          lastUpdated: '2026-01-15T10:00:00Z',
        })
        .mockResolvedValueOnce({
          batchId: 2,
          currentStage: WorkflowStage.Level1Pending,
          isLocked: true,
          canConfirm: false,
          canApprove: true,
          pendingApprovalLevel: 1,
          lastUpdated: '2026-01-15T10:00:00Z',
        });

      const { result, rerender } = renderHook(({ id }) => useBatchLock(id), {
        initialProps: { id: 1 },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(false);

      // Change batch ID
      rerender({ id: 2 });

      await waitFor(() => {
        expect(mockGetBatchWorkflowStatus).toHaveBeenCalledWith(2);
      });

      await waitFor(() => {
        expect(result.current.isLocked).toBe(true);
      });
    });

    it('does not refetch when batchId remains the same', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.DataPreparation,
        isLocked: false,
        canConfirm: true,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { rerender } = renderHook(({ id }) => useBatchLock(id), {
        initialProps: { id: 1 },
      });

      await waitFor(() => {
        expect(mockGetBatchWorkflowStatus).toHaveBeenCalledTimes(1);
      });

      // Rerender with same batch ID
      rerender({ id: 1 });

      // Should not call API again
      expect(mockGetBatchWorkflowStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Immediate Enforcement', () => {
    it('enforces lock state immediately after API response', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.Level1Pending,
        isLocked: true,
        canConfirm: false,
        canApprove: true,
        pendingApprovalLevel: 1,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(1));

      // Lock should be enforced as soon as loading completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(true);
    });

    it('enforces unlock immediately after API response', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.DataPreparation,
        isLocked: false,
        canConfirm: true,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(1));

      // Unlock should be applied as soon as loading completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLocked).toBe(false);
    });
  });

  describe('Return Value Structure', () => {
    it('returns all required fields', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.DataPreparation,
        isLocked: false,
        canConfirm: true,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('isLocked');
      expect(result.current).toHaveProperty('lockState');
      expect(result.current).toHaveProperty('lockMessage');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });

    it('has correct types for all return fields', async () => {
      mockGetBatchWorkflowStatus.mockResolvedValue({
        batchId: 1,
        currentStage: WorkflowStage.DataPreparation,
        isLocked: false,
        canConfirm: true,
        canApprove: false,
        pendingApprovalLevel: null,
        lastUpdated: '2026-01-15T10:00:00Z',
      });

      const { result } = renderHook(() => useBatchLock(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.isLocked).toBe('boolean');
      expect(typeof result.current.lockState).toBe('string');
      expect(typeof result.current.lockMessage).toBe('string');
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string',
      ).toBe(true);
    });
  });
});
