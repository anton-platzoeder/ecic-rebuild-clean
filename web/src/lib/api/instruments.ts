/**
 * Instrument API Functions
 *
 * Provides functions for instrument CRUD operations, search, filtering,
 * export, and audit history access.
 * Matches OpenAPI spec: /instruments endpoints
 */

import { get, post, put, apiClient } from '@/lib/api/client';
import type { PaginationMeta } from '@/lib/api/batches';

/**
 * Instrument entity from the API
 * Matches OpenAPI Instrument schema with frontend extensions
 */
export interface Instrument {
  id: number;
  isin: string | null;
  instrumentCode: string | null;
  bloombergTicker: string | null;
  cusip: string | null;
  sedol: string | null;
  name: string | null;
  shortName: string | null;
  description: string | null;
  ticker: string | null;
  parentCompanyName: string | null;
  securityType: string | null;
  securitySubType: string | null;
  marketSector: string | null;
  securityClass: string | null;
  issuerIndustry: string | null;
  countryId: number | null;
  quotedCurrencyId: number | null;
  amountIssued: number | null;
  couponType: string | null;
  coupon: number | null;
  couponFrequency: string | null;
  issueDate: string | null;
  maturityDate: string | null;
  issuerName: string | null;
  issuerCode: string | null;
  isCashEquivalent: boolean | null;
  lastChangedUser: string;
  validFrom: string;
  validTo: string;
  // Frontend-enriched fields (joined from reference data)
  countryName?: string;
  currencyCode?: string;
  // Completeness tracking
  isComplete?: boolean;
  missingData?: string[];
}

/**
 * Paginated instrument list response
 */
export interface InstrumentList {
  items: Instrument[];
  meta: PaginationMeta;
}

/**
 * Request body for creating an instrument
 */
export interface CreateInstrumentRequest {
  isin?: string;
  instrumentCode?: string;
  name: string;
  securityType?: string;
  countryId?: number;
  quotedCurrencyId?: number;
}

/**
 * Request body for updating an instrument
 */
export interface UpdateInstrumentRequest {
  isin?: string;
  instrumentCode?: string;
  name?: string;
  securityType?: string;
  countryId?: number;
  quotedCurrencyId?: number;
  maturityDate?: string;
  coupon?: number;
  issuerName?: string;
}

/**
 * Instrument change history entry from temporal tables
 */
export interface InstrumentHistoryEntry extends Instrument {
  changeType: 'Created' | 'Updated';
}

/**
 * Query parameters for listing instruments
 */
export interface ListInstrumentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  securityType?: string;
  countryId?: number;
  isActive?: boolean;
  missingRatings?: boolean;
  missingRiskMetrics?: boolean;
  missingOnly?: boolean;
}

/**
 * List instruments with search, filters, and pagination.
 * Maps to GET /instruments
 */
export async function listInstruments(
  params?: ListInstrumentsParams,
): Promise<InstrumentList> {
  return get<InstrumentList>(
    '/instruments',
    params as Record<string, string | number | boolean | undefined>,
  );
}

/**
 * Get instrument details by ID.
 * Maps to GET /instruments/{id}
 */
export async function getInstrument(id: number): Promise<Instrument> {
  return get<Instrument>(`/instruments/${id}`);
}

/**
 * Create a new instrument.
 * Maps to POST /instruments
 */
export async function createInstrument(
  data: CreateInstrumentRequest,
): Promise<Instrument> {
  return post<Instrument>('/instruments', data);
}

/**
 * Update an existing instrument.
 * Maps to PUT /instruments/{id}
 */
export async function updateInstrument(
  id: number,
  data: UpdateInstrumentRequest,
): Promise<Instrument> {
  return put<Instrument>(`/instruments/${id}`, data);
}

/**
 * Get instrument change history from temporal tables.
 * Maps to GET /instruments/{id}/history
 */
export async function getInstrumentHistory(
  id: number,
  from?: string,
  to?: string,
): Promise<InstrumentHistoryEntry[]> {
  return get<InstrumentHistoryEntry[]>(`/instruments/${id}/history`, {
    from,
    to,
  } as Record<string, string | undefined>);
}

/**
 * Export instruments to Excel.
 * Maps to GET /instruments/export
 */
export async function exportInstruments(params?: {
  format?: 'xlsx' | 'csv';
  missingOnly?: boolean;
}): Promise<Blob> {
  return apiClient<Blob>('/instruments/export', {
    method: 'GET',
    params: params as Record<string, string | number | boolean | undefined>,
    isBinaryResponse: true,
  });
}
