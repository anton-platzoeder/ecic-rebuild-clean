/**
 * Story Metadata:
 * - Epic: 2
 * - Story: 2
 * - Route: N/A (global context state)
 * - Target File: contexts/BatchContext.tsx
 * - Page Action: create_new
 *
 * Tests for BatchContext - Global batch state management
 */
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { act } from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BatchProvider, useBatch } from '@/contexts/BatchContext';
import * as batchesApi from '@/lib/api/batches';
import * as storage from '@/lib/utils/storage';
import type { ReportBatch } from '@/lib/api/batches';

// Mock batches API
vi.mock('@/lib/api/batches', () => ({
  listReportBatches: vi.fn(),
  getReportBatch: vi.fn(),
}));

// Mock storage utilities
vi.mock('@/lib/utils/storage', () => ({
  getActiveBatchId: vi.fn(),
  setActiveBatchId: vi.fn(),
  clearActiveBatchId: vi.fn(),
}));

// Mock toast context
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const createMockBatch = (
  overrides: Partial<ReportBatch> = {},
): ReportBatch => ({
  id: 1,
  reportBatchType: 'Monthly',
  reportDate: '2026-01-31',
  workflowInstanceId: 'wf-001',
  status: 'DataPreparation',
  createdAt: '2026-01-15T10:00:00Z',
  createdBy: 'Sarah Thomas',
  lastRejection: null,
  fileSummary: {
    received: 3,
    total: 5,
  },
  validationSummary: {
    errors: 0,
    warnings: 2,
  },
  calculationStatus: 'Not Started',
  ...overrides,
});

describe('BatchContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('initializes with null active batch when no localStorage value', async () => {
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      expect(result.current.activeBatchId).toBeNull();
      expect(result.current.currentBatch).toBeNull();
      expect(result.current.isReadOnly).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('loads batch ID from localStorage on mount and fetches batch details', async () => {
      const mockBatch = createMockBatch({ id: 1 });
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.activeBatchId).toBe(1);
        expect(result.current.currentBatch).toEqual(mockBatch);
      });

      expect(batchesApi.getReportBatch).toHaveBeenCalledWith(1);
    });

    it('sets isReadOnly to true when batch status is Approved', async () => {
      const mockBatch = createMockBatch({ id: 1, status: 'Approved' });
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.isReadOnly).toBe(true);
      });
    });

    it('sets isReadOnly to false when batch status is not Approved', async () => {
      const mockBatch = createMockBatch({
        id: 1,
        status: 'DataPreparation',
      });
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.isReadOnly).toBe(false);
      });
    });

    it('auto-selects most recent batch when no localStorage value and batches exist', async () => {
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );
      const mockBatches = [
        createMockBatch({ id: 2, reportDate: '2026-02-28' }),
        createMockBatch({ id: 1, reportDate: '2026-01-31' }),
      ];
      (
        batchesApi.listReportBatches as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        items: mockBatches,
        meta: { page: 1, pageSize: 10, totalItems: 2, totalPages: 1 },
      });
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatches[0],
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.activeBatchId).toBe(2);
        expect(result.current.currentBatch?.reportDate).toBe('2026-02-28');
      });

      expect(storage.setActiveBatchId).toHaveBeenCalledWith(2);
    });
  });

  describe('switchBatch()', () => {
    it('updates activeBatchId and fetches batch details', async () => {
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );
      const newBatch = createMockBatch({ id: 2, reportDate: '2026-02-28' });
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        newBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await act(async () => {
        await result.current.switchBatch(2);
      });

      await waitFor(() => {
        expect(result.current.activeBatchId).toBe(2);
        expect(result.current.currentBatch).toEqual(newBatch);
      });

      expect(batchesApi.getReportBatch).toHaveBeenCalledWith(2);
    });

    it('persists activeBatchId to localStorage', async () => {
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );
      const newBatch = createMockBatch({ id: 2 });
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        newBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await act(async () => {
        await result.current.switchBatch(2);
      });

      await waitFor(() => {
        expect(storage.setActiveBatchId).toHaveBeenCalledWith(2);
      });
    });

    it('shows success toast when batch switched successfully', async () => {
      const mockShowToast = vi.fn();
      vi.mocked(vi.fn()).mockImplementation(() => ({
        showToast: mockShowToast,
      }));

      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );
      const newBatch = createMockBatch({
        id: 2,
        reportDate: '2026-02-28',
      });
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        newBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await act(async () => {
        await result.current.switchBatch(2);
      });

      await waitFor(() => {
        expect(result.current.activeBatchId).toBe(2);
      });
    });

    it('handles API errors gracefully and does not update state', async () => {
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      const currentBatch = createMockBatch({ id: 1 });
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(currentBatch)
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.activeBatchId).toBe(1);
      });

      await act(async () => {
        try {
          await result.current.switchBatch(2);
        } catch (error) {
          // Expected to fail
        }
      });

      // Should remain on batch 1
      expect(result.current.activeBatchId).toBe(1);
      expect(result.current.currentBatch?.id).toBe(1);
    });

    it('sets isLoading to true while switching batches', async () => {
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );
      const newBatch = createMockBatch({ id: 2 });
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        newBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      act(() => {
        result.current.switchBatch(2);
      });

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('clearBatch()', () => {
    it('removes active batch and sets state to null', async () => {
      const mockBatch = createMockBatch({ id: 1 });
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.activeBatchId).toBe(1);
      });

      act(() => {
        result.current.clearBatch();
      });

      expect(result.current.activeBatchId).toBeNull();
      expect(result.current.currentBatch).toBeNull();
    });

    it('clears activeBatchId from localStorage', async () => {
      const mockBatch = createMockBatch({ id: 1 });
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.activeBatchId).toBe(1);
      });

      act(() => {
        result.current.clearBatch();
      });

      expect(storage.clearActiveBatchId).toHaveBeenCalled();
    });
  });

  describe('Read-Only Status Detection', () => {
    it('marks Level2Pending batch as editable (not read-only)', async () => {
      const mockBatch = createMockBatch({
        id: 1,
        status: 'Level2Pending',
      });
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.isReadOnly).toBe(false);
      });
    });

    it('marks Level3Pending batch as read-only (locked for Level 2 approval)', async () => {
      const mockBatch = createMockBatch({
        id: 1,
        status: 'Level3Pending',
      });
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.isReadOnly).toBe(true);
      });
    });

    it('marks DataPreparation batch with rejection as editable', async () => {
      const mockBatch = createMockBatch({
        id: 1,
        status: 'DataPreparation',
        lastRejection: {
          date: '2026-01-20T14:30:00Z',
          level: 'Level 2',
          reason: 'Missing data',
        },
      });
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockBatch,
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.isReadOnly).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('throws error when useBatch is used outside BatchProvider', () => {
      expect(() => {
        renderHook(() => useBatch());
      }).toThrow('useBatch must be used within a BatchProvider');
    });

    it('handles batch fetch errors and does not crash', async () => {
      (storage.getActiveBatchId as ReturnType<typeof vi.fn>).mockReturnValue(1);
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API error'),
      );

      const { result } = renderHook(() => useBatch(), {
        wrapper: BatchProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should remain in safe state
      expect(result.current.activeBatchId).toBeNull();
      expect(result.current.currentBatch).toBeNull();
    });
  });
});
