/**
 * Story Metadata:
 * - Epic: 2
 * - Story: 8
 * - Route: /batches/{id}
 * - Target File: app/batches/[id]/page.tsx
 * - Page Action: modify_existing
 *
 * Tests for Batch Status Summary (Story 8)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BatchDetailPage from '@/app/batches/[id]/BatchDetailClient';
import * as batchesApi from '@/lib/api/batches';
import type {
  ReportBatch,
  BatchFile,
  BatchCalculation,
  BatchApproval,
  BatchValidationResult,
  BatchWorkflowStatus,
} from '@/lib/api/batches';

// Mock the API functions
vi.mock('@/lib/api/batches', () => ({
  getReportBatch: vi.fn(),
  getBatchFiles: vi.fn(),
  getBatchCalculations: vi.fn(),
  getBatchApprovals: vi.fn(),
  getBatchValidation: vi.fn(),
  getBatchWorkflowStatus: vi.fn(),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

const createMockBatch = (
  overrides: Partial<ReportBatch> = {},
): ReportBatch => ({
  id: 1,
  reportBatchType: 'Monthly',
  reportDate: '2026-01-31',
  workflowInstanceId: 'wf-001',
  status: 'DataPreparation',
  createdAt: '2026-01-15T08:00:00Z',
  createdBy: 'Sarah Thomas',
  lastRejection: null,
  fileSummary: {
    received: 7,
    total: 10,
  },
  validationSummary: {
    errors: 2,
    warnings: 5,
  },
  calculationStatus: 'Pending',
  ...overrides,
});

const createMockFiles = (): BatchFile[] => [
  {
    id: 1,
    fileName: 'holdings.csv',
    fileType: 'Holdings',
    uploadedBy: 'Sarah Thomas',
    uploadedAt: '2026-02-15T09:00:00Z',
    status: 'Valid',
    recordCount: 1500,
    errorCount: 0,
  },
  {
    id: 2,
    fileName: 'transactions.csv',
    fileType: 'Transactions',
    uploadedBy: 'Sarah Thomas',
    uploadedAt: '2026-02-15T09:05:00Z',
    status: 'Valid',
    recordCount: 350,
    errorCount: 0,
  },
  {
    id: 3,
    fileName: 'cash.csv',
    fileType: 'Cash',
    uploadedBy: 'Sarah Thomas',
    uploadedAt: '2026-02-15T09:10:00Z',
    status: 'Failed',
    recordCount: 100,
    errorCount: 15,
  },
];

const createMockCalculations = (): BatchCalculation[] => [
  {
    id: 1,
    calculationType: 'Portfolio Valuation',
    status: 'Pending',
    startedAt: null,
    completedAt: null,
    portfoliosProcessed: 0,
    totalPortfolios: 25,
  },
  {
    id: 2,
    calculationType: 'Risk Metrics',
    status: 'Pending',
    startedAt: null,
    completedAt: null,
    portfoliosProcessed: 0,
    totalPortfolios: 25,
  },
];

const createMockApprovals = (): BatchApproval[] => [
  {
    id: 1,
    batchId: 1,
    level: 1,
    decision: 'Approved',
    decidedBy: 'Lisa Patel',
    decidedAt: '2026-02-14T14:30:00Z',
    comments: 'Data looks good',
    automatedActions: ['Lock batch for calculation'],
  },
];

const createMockValidation = (): BatchValidationResult => ({
  isComplete: false,
  fileCompleteness: {
    expected: 10,
    received: 7,
    valid: 6,
    failed: 1,
  },
  portfolioDataCompleteness: [
    {
      portfolioId: 1,
      portfolioName: 'Equity Growth Fund',
      holdings: true,
      transactions: true,
      income: false,
      cash: true,
      performance: false,
    },
  ],
  referenceDataCompleteness: {
    instrumentsMissingRatings: 8,
    instrumentsMissingDurations: 5,
    instrumentsMissingBetas: 3,
    missingIndexPrices: 2,
  },
});

const createMockWorkflowStatus = (): BatchWorkflowStatus => ({
  batchId: 1,
  currentStage: 'DataPreparation',
  isLocked: false,
  canConfirm: false,
  canApprove: false,
  pendingApprovalLevel: null,
  lastUpdated: '2026-02-15T10:00:00Z',
});

describe('Batch Status Summary Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Batch Header', () => {
    it('displays batch name with formatted reporting date', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch(),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/January 2026/i)).toBeInTheDocument();
      });
    });

    it('displays batch status badge', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({ status: 'DataPreparation' }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        const allMatches = screen.getAllByText(/DataPreparation/i);
        expect(allMatches.length).toBeGreaterThan(0);
      });
    });

    it('displays created by information', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({ createdBy: 'Sarah Thomas' }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Created by:/i)).toBeInTheDocument();
        expect(screen.getByText(/Sarah Thomas/i)).toBeInTheDocument();
      });
    });
  });

  describe('Overall Status Banner', () => {
    it('shows yellow banner when files are missing', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({ validationSummary: { errors: 0, warnings: 0 } }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        const statusBanner = alerts.find((alert) =>
          alert.className.includes('border-yellow-500'),
        );
        expect(statusBanner).toBeDefined();
      });
    });

    it('shows red banner when validation errors exist', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({
          validationSummary: { errors: 10, warnings: 3 },
        }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        const errorBanner = alerts.find((alert) =>
          alert.className.includes('border-red-500'),
        );
        expect(errorBanner).toBeDefined();
      });
    });

    it('shows green banner when all data is complete', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({
          fileSummary: { received: 10, total: 10 },
          validationSummary: { errors: 0, warnings: 0 },
          calculationStatus: 'Complete',
        }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: 1,
          calculationType: 'Portfolio Valuation',
          status: 'Complete',
          startedAt: '2026-02-15T09:00:00Z',
          completedAt: '2026-02-15T09:30:00Z',
          portfoliosProcessed: 25,
          totalPortfolios: 25,
        },
      ]);
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ ...createMockValidation(), isComplete: true });
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        const successBanner = alerts.find((alert) =>
          alert.className.includes('border-green-500'),
        );
        expect(successBanner).toBeDefined();
      });
    });
  });

  describe('File Status Section', () => {
    it('displays file count and percentage', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({ fileSummary: { received: 7, total: 10 } }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Files: 7\/10 \(70%\)/i)).toBeInTheDocument();
      });
    });

    it('has link to file details page', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch(),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /view files/i });
        expect(links[0]).toHaveAttribute('href', '/batches/1/files');
      });
    });
  });

  describe('Validation Summary Section', () => {
    it('displays error and warning counts', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({
          validationSummary: { errors: 2, warnings: 5 },
        }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/2 Errors/i)).toBeInTheDocument();
        expect(screen.getByText(/5 Warnings/i)).toBeInTheDocument();
      });
    });

    it('shows expandable validation breakdown', async () => {
      const user = userEvent.setup();
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch(),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Validation Summary/i)).toBeInTheDocument();
      });

      const expandButton = screen.getByRole('button', {
        name: /view breakdown/i,
      });
      await user.click(expandButton);

      expect(
        screen.getByText(/8 instruments missing ratings/i),
      ).toBeInTheDocument();
    });
  });

  describe('Calculation Status Section', () => {
    it('displays pending status with no timestamps', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({ calculationStatus: 'Pending' }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Calculation Status')).toBeInTheDocument();
        expect(
          screen.getByText(
            (_content, element) =>
              (element?.tagName === 'P' &&
                element.textContent === 'Status: Pending') ||
              false,
          ),
        ).toBeInTheDocument();
      });
    });

    it('displays complete status with timestamp', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({ calculationStatus: 'Complete' }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: 1,
          calculationType: 'Portfolio Valuation',
          status: 'Complete',
          startedAt: '2026-02-15T09:00:00Z',
          completedAt: '2026-02-15T09:30:00Z',
          portfoliosProcessed: 25,
          totalPortfolios: 25,
        },
      ]);
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(
          screen.getByText(
            (_content, element) =>
              (element?.tagName === 'P' &&
                element.textContent === 'Status: Complete') ||
              false,
          ),
        ).toBeInTheDocument();
        expect(screen.getByText(/Completed:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Information Section', () => {
    it('displays current stage and time in stage', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch({ status: 'DataPreparation' }),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Current Stage:/i)).toBeInTheDocument();
        const allStages = screen.getAllByText(/DataPreparation/i);
        expect(allStages.length).toBeGreaterThan(0);
      });
    });

    it('shows approval history with approver names', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch(),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Lisa Patel/i)).toBeInTheDocument();
        expect(screen.getByText(/Approved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Key Metrics Panel', () => {
    it('displays total portfolios count', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch(),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Total Portfolios/i)).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Links', () => {
    it('has link to workflow history page', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch(),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /workflow history/i });
        expect(link).toHaveAttribute('href', '/batches/1/workflow');
      });
    });

    it('has link to validation details page', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBatch(),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={1} />);

      await waitFor(() => {
        const link = screen.getByRole('link', {
          name: /validation details/i,
        });
        expect(link).toHaveAttribute('href', '/batches/1/validation');
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when batch fetch fails', async () => {
      (batchesApi.getReportBatch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Batch not found'),
      );
      (batchesApi.getBatchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockFiles(),
      );
      (
        batchesApi.getBatchCalculations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockCalculations());
      (
        batchesApi.getBatchApprovals as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockApprovals());
      (
        batchesApi.getBatchValidation as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockValidation());
      (
        batchesApi.getBatchWorkflowStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockWorkflowStatus());

      render(<BatchDetailPage batchId={999} />);

      await waitFor(() => {
        expect(screen.getByText(/Batch not found/i)).toBeInTheDocument();
      });
    });
  });
});
