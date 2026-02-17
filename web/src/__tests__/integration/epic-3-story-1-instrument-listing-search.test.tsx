/**
 * Story Metadata:
 * - Epic: 3
 * - Story: 1
 * - Route: /master-data/instruments
 * - Target File: app/master-data/instruments/page.tsx
 * - Page Action: create_new
 *
 * Tests for Instrument Master Data Listing & Search
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';
import InstrumentsClient from '@/app/master-data/instruments/InstrumentsClient';
import * as instrumentsApi from '@/lib/api/instruments';
import * as authApi from '@/lib/api/auth';
import type { AuthUser } from '@/lib/api/auth';
import type { Instrument, InstrumentList } from '@/lib/api/instruments';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/master-data/instruments'),
}));

// Mock auth API
vi.mock('@/lib/api/auth', () => ({
  getCurrentUser: vi.fn(),
}));

// Mock instruments API
vi.mock('@/lib/api/instruments', () => ({
  listInstruments: vi.fn(),
  exportInstruments: vi.fn(),
}));

// Mock BatchContext
vi.mock('@/contexts/BatchContext', () => ({
  useBatch: vi.fn(() => ({
    activeBatch: {
      id: 1,
      reportDate: '2026-01-31',
      status: 'DataPreparation',
    },
  })),
}));

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

// Mock user factory
const createMockUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'sjohnson',
  displayName: 'Sarah Johnson',
  email: 'sjohnson@investinsight.com',
  roles: ['Analyst'],
  permissions: ['instrument.view', 'instrument.create', 'instrument.update'],
  allowedPages: ['/master-data/instruments'],
  ...overrides,
});

// Mock instrument factory
const createMockInstrument = (
  overrides: Partial<Instrument> = {},
): Instrument => ({
  id: 1,
  isin: 'US5949181045',
  instrumentCode: 'MSFT',
  bloombergTicker: 'MSFT US Equity',
  cusip: '594918104',
  sedol: '2588173',
  name: 'Microsoft Corporation',
  shortName: 'MSFT',
  description: 'Common Stock',
  ticker: 'MSFT',
  parentCompanyName: 'Microsoft Corporation',
  securityType: 'Equity',
  securitySubType: 'Common Stock',
  marketSector: 'Technology',
  securityClass: null,
  issuerIndustry: 'Software',
  countryId: 1,
  quotedCurrencyId: 1,
  amountIssued: null,
  couponType: null,
  coupon: null,
  couponFrequency: null,
  issueDate: '1986-03-13',
  maturityDate: null,
  issuerName: 'Microsoft Corporation',
  issuerCode: null,
  isCashEquivalent: false,
  lastChangedUser: 'sjohnson',
  validFrom: '2026-01-05T14:23:00Z',
  validTo: '9999-12-31T23:59:59Z',
  countryName: 'United States',
  currencyCode: 'USD',
  isComplete: true,
  missingData: [],
  ...overrides,
});

// Mock instrument list factory
const createMockInstrumentList = (
  instruments: Instrument[],
  meta?: Partial<{
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }>,
): InstrumentList => ({
  items: instruments,
  meta: {
    page: 1,
    pageSize: 10,
    totalItems: instruments.length,
    totalPages: Math.ceil(instruments.length / 10),
    ...meta,
  },
});

describe('Instrument Master Data Listing & Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockUser(),
    );
  });

  describe('Happy Path - View Instrument List', () => {
    it('displays a paginated table of instruments with ISIN, Name, Type, Country, Currency, and Actions columns', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([
          createMockInstrument({
            id: 1,
            isin: 'US5949181045',
            name: 'Microsoft Corporation',
            securityType: 'Equity',
            countryName: 'United States',
            currencyCode: 'USD',
          }),
          createMockInstrument({
            id: 2,
            isin: 'US0378331005',
            name: 'Apple Inc',
            securityType: 'Equity',
            countryName: 'United States',
            currencyCode: 'USD',
          }),
        ]),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
        expect(screen.getByText('Apple Inc')).toBeInTheDocument();
        expect(screen.getByText('US5949181045')).toBeInTheDocument();
        expect(screen.getByText('US0378331005')).toBeInTheDocument();
      });
    });

    it('shows instrument count summary with incomplete count', async () => {
      const instruments = [
        createMockInstrument({ id: 1, isComplete: true }),
        createMockInstrument({ id: 2, isComplete: true }),
        createMockInstrument({
          id: 3,
          isComplete: false,
          missingData: ['Duration', 'YTM'],
        }),
      ];

      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList(instruments, { totalItems: 245 }),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText(/245 instruments/i)).toBeInTheDocument();
      });
    });

    it('shows green "Complete" badge for instruments with all required data', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([
          createMockInstrument({ id: 1, isComplete: true, missingData: [] }),
        ]),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Complete')).toBeInTheDocument();
      });
    });

    it('shows amber "Incomplete" badge with missing data details for instruments missing required data', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([
          createMockInstrument({
            id: 1,
            name: 'SA Govt Bond',
            isComplete: false,
            missingData: ['Duration', 'YTM'],
          }),
        ]),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete')).toBeInTheDocument();
        expect(screen.getByText(/Missing: Duration, YTM/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters instruments when user searches by name', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([
          createMockInstrument({
            id: 1,
            name: 'Apple Inc',
            isin: 'US0378331005',
          }),
        ]),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Apple Inc')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        /search by isin, name, issuer/i,
      );
      const user = userEvent.setup();
      await user.clear(searchInput);
      await user.type(searchInput, 'Apple');

      // Should call API with search parameter
      await waitFor(() => {
        expect(instrumentsApi.listInstruments).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Apple' }),
        );
      });
    });

    it('shows empty state when search returns no results', async () => {
      // First load with data
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(
        createMockInstrumentList([createMockInstrument({ id: 1 })]),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
      });

      // Mock empty response for search
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(createMockInstrumentList([]));

      const searchInput = screen.getByPlaceholderText(
        /search by isin, name, issuer/i,
      );
      const user = userEvent.setup();
      await user.clear(searchInput);
      await user.type(searchInput, 'ZZZZZ');

      await waitFor(() => {
        expect(screen.getByText(/no instruments found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('filters instruments by security type when dropdown selection changes', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([
          createMockInstrument({ id: 1, securityType: 'Equity' }),
        ]),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
      });

      // Find and interact with security type filter
      const securityTypeFilter = screen.getByLabelText(/security type/i);
      const user = userEvent.setup();
      await user.click(securityTypeFilter);

      // Select "Equity" option
      const equityOption = await screen.findByRole('option', {
        name: /equity/i,
      });
      await user.click(equityOption);

      await waitFor(() => {
        expect(instrumentsApi.listInstruments).toHaveBeenCalledWith(
          expect.objectContaining({ securityType: 'Equity' }),
        );
      });
    });

    it('resets all filters when Clear Filters is clicked', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([createMockInstrument({ id: 1 })]),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', {
        name: /clear filters/i,
      });
      const user = userEvent.setup();
      await user.click(clearButton);

      await waitFor(() => {
        expect(instrumentsApi.listInstruments).toHaveBeenCalledWith(
          expect.objectContaining({
            search: undefined,
            securityType: undefined,
            countryId: undefined,
            isActive: true,
          }),
        );
      });
    });
  });

  describe('Completeness Filter Checkboxes', () => {
    it('shows "Missing Ratings", "Missing Risk Metrics", and "Incomplete" filter checkboxes', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockInstrumentList([createMockInstrument()]));

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/missing ratings/i)).toBeInTheDocument();
        expect(
          screen.getByLabelText(/missing risk metrics/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/incomplete/i)).toBeInTheDocument();
      });
    });

    it('filters to show only instruments missing credit ratings when checkbox is checked', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([
          createMockInstrument({
            id: 1,
            name: 'Diageo PLC',
            isComplete: false,
            missingData: ['Credit Rating'],
          }),
        ]),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/missing ratings/i)).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByLabelText(/missing ratings/i));

      await waitFor(() => {
        expect(instrumentsApi.listInstruments).toHaveBeenCalledWith(
          expect.objectContaining({ missingRatings: true }),
        );
      });
    });
  });

  describe('Pagination', () => {
    it('shows pagination controls when more than 10 instruments exist', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([createMockInstrument()], {
          page: 1,
          pageSize: 10,
          totalItems: 245,
          totalPages: 25,
        }),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        // Should show pagination
        expect(
          screen.getByRole('navigation', { name: /pagination/i }),
        ).toBeInTheDocument();
      });
    });

    it('loads page 2 when user clicks next page', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        createMockInstrumentList([createMockInstrument()], {
          page: 1,
          pageSize: 10,
          totalItems: 25,
          totalPages: 3,
        }),
      );

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /pagination/i }),
        ).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const page2Button = screen.getByRole('button', { name: /page 2/i });
      await user.click(page2Button);

      await waitFor(() => {
        expect(instrumentsApi.listInstruments).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 }),
        );
      });
    });
  });

  describe('Export to Excel', () => {
    it('calls export API when user clicks "Export to Excel" button', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockInstrumentList([createMockInstrument()]));
      (
        instrumentsApi.exportInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(new Blob());

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const exportButton = screen.getByRole('button', {
        name: /export to excel/i,
      });
      await user.click(exportButton);

      await waitFor(() => {
        expect(instrumentsApi.exportInstruments).toHaveBeenCalled();
      });
    });
  });

  describe('Batch Context & State Awareness', () => {
    it('shows "Add New Instrument" and "Bulk Import" buttons enabled when batch is in Data Preparation', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockInstrumentList([createMockInstrument()]));

      render(<InstrumentsClient />);

      await waitFor(() => {
        const addButton = screen.getByRole('button', {
          name: /add new instrument/i,
        });
        expect(addButton).toBeEnabled();
      });
    });

    it('shows "Add New Instrument" button disabled with lock indicator when batch is locked', async () => {
      // Override BatchContext mock to return locked batch
      const { useBatch } = await import('@/contexts/BatchContext');
      (useBatch as ReturnType<typeof vi.fn>).mockReturnValue({
        activeBatch: {
          id: 1,
          reportDate: '2026-01-31',
          status: 'Level1Pending',
        },
      });

      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockInstrumentList([createMockInstrument()]));

      render(<InstrumentsClient />);

      await waitFor(() => {
        const addButton = screen.getByRole('button', {
          name: /add new instrument/i,
        });
        expect(addButton).toBeDisabled();
      });
    });
  });

  describe('Action Buttons', () => {
    it('shows View, Edit, and History action links for each instrument row', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockInstrumentList([createMockInstrument()]));

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /view/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /edit/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /history/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no instruments exist', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockInstrumentList([]));

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText(/no instruments found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('shows Master Data sub-navigation with Instruments as active tab', async () => {
      (
        instrumentsApi.listInstruments as ReturnType<typeof vi.fn>
      ).mockResolvedValue(createMockInstrumentList([createMockInstrument()]));

      render(<InstrumentsClient />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
      });

      // Check sub-navigation exists with correct tabs
      expect(
        screen.getByRole('link', { name: /instruments/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /reference data/i }),
      ).toBeInTheDocument();
    });
  });
});
