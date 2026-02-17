/**
 * Instruments Client Component
 *
 * Displays instruments master data with search, filtering, pagination,
 * completeness indicators, and export functionality.
 * This is the client-side component rendered by the server-side page wrapper.
 */
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBatch } from '@/contexts/BatchContext';
import {
  listInstruments,
  exportInstruments,
  type Instrument,
  type ListInstrumentsParams,
} from '@/lib/api/instruments';
import { PaginationMeta } from '@/lib/api/batches';
import { Download, Lock, Plus, Upload } from 'lucide-react';
import Link from 'next/link';

export default function InstrumentsClient() {
  const { activeBatch } = useBatch();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchInput, setSearchInput] = useState(''); // Input value (immediate)
  const [search, setSearch] = useState(''); // Debounced search value (triggers API)
  const [securityType, setSecurityType] = useState<string | undefined>(
    undefined,
  );
  const [countryId, setCountryId] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [missingRatings, setMissingRatings] = useState(false);
  const [missingRiskMetrics, setMissingRiskMetrics] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Determine if batch is locked
  const isLocked = Boolean(
    activeBatch &&
    ['Level1Pending', 'Level2Pending', 'Level3Pending', 'Approved'].includes(
      activeBatch.status,
    ),
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load instruments
  useEffect(() => {
    const loadInstruments = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: ListInstrumentsParams = {
          page: currentPage,
          pageSize: 10,
          search: search || undefined,
          securityType,
          countryId,
          isActive,
          missingRatings: missingRatings || undefined,
          missingRiskMetrics: missingRiskMetrics || undefined,
          missingOnly: missingOnly || undefined,
        };

        const result = await listInstruments(params);
        setInstruments(result.items);
        setMeta(result.meta);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load instruments',
        );
      } finally {
        setLoading(false);
      }
    };

    loadInstruments();
  }, [
    currentPage,
    search,
    securityType,
    countryId,
    isActive,
    missingRatings,
    missingRiskMetrics,
    missingOnly,
  ]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setSecurityType(undefined);
    setCountryId(undefined);
    setIsActive(true);
    setMissingRatings(false);
    setMissingRiskMetrics(false);
    setMissingOnly(false);
    setCurrentPage(1);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await exportInstruments({ format: 'xlsx' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `instruments-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to export instruments',
      );
    }
  };

  // Render completeness indicator
  const renderCompletenessIndicator = (instrument: Instrument) => {
    if (instrument.isComplete) {
      return (
        <Badge className="bg-green-500 text-white hover:bg-green-600">
          Complete
        </Badge>
      );
    }

    return (
      <div className="space-y-1">
        <Badge className="bg-amber-500 text-white hover:bg-amber-600">
          Incomplete
        </Badge>
        {instrument.missingData && instrument.missingData.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Missing: {instrument.missingData.join(', ')}
          </p>
        )}
      </div>
    );
  };

  // Render pagination
  const renderPagination = () => {
    if (!meta || meta.totalPages <= 1) return null;

    const pages: number[] = [];
    for (let i = 1; i <= meta.totalPages; i++) {
      pages.push(i);
    }

    return (
      <nav aria-label="pagination" className="flex items-center gap-2 mt-4">
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentPage(page)}
            aria-label={`page ${page}`}
          >
            {page}
          </Button>
        ))}
      </nav>
    );
  };

  if (loading && instruments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div role="progressbar">Loading instruments...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Master Data Sub-Navigation */}
      <nav className="flex items-center gap-4 border-b pb-4">
        <Link
          href="/master-data/instruments"
          className="font-medium text-primary border-b-2 border-primary pb-2"
        >
          Instruments
        </Link>
        <Link
          href="/master-data/reference-data"
          className="text-muted-foreground hover:text-foreground"
        >
          Reference Data
        </Link>
      </nav>

      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instrument Master Data</h1>
          {meta && (
            <p className="text-sm text-muted-foreground mt-2">
              {meta.totalItems} instruments
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={instruments.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <Button variant="outline" disabled={isLocked}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button disabled={isLocked}>
            {isLocked && <Lock className="mr-2 h-4 w-4" />}
            <Plus className="mr-2 h-4 w-4" />
            Add New Instrument
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 p-4 text-destructive"
        >
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="search by isin, name, issuer"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Security Type Filter */}
          <div>
            <Label htmlFor="securityType">Security Type</Label>
            <Select
              value={securityType || 'all'}
              onValueChange={(value) =>
                setSecurityType(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger id="securityType" aria-label="security type">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Equity">Equity</SelectItem>
                <SelectItem value="Fixed Income">Fixed Income</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country Filter */}
          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={countryId?.toString() || 'all'}
              onValueChange={(value) =>
                setCountryId(value === 'all' ? undefined : parseInt(value))
              }
            >
              <SelectTrigger id="country" aria-label="country">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">United States</SelectItem>
                <SelectItem value="2">United Kingdom</SelectItem>
                <SelectItem value="3">South Africa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Completeness Filters */}
        <div className="space-y-2">
          <Label>Show Only</Label>
          <div className="flex items-center gap-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="missingRatings"
                checked={missingRatings}
                onCheckedChange={(checked) =>
                  setMissingRatings(checked === true)
                }
                aria-label="Missing Ratings"
              />
              <span className="text-sm">Missing Ratings</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="missingRiskMetrics"
                checked={missingRiskMetrics}
                onCheckedChange={(checked) =>
                  setMissingRiskMetrics(checked === true)
                }
                aria-label="Missing Risk Metrics"
              />
              <span className="text-sm">Missing Risk Metrics</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="incomplete"
                checked={missingOnly}
                onCheckedChange={(checked) => setMissingOnly(checked === true)}
                aria-label="Incomplete"
              />
              <span className="text-sm">All Incomplete</span>
            </label>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Instruments Table */}
      {instruments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No instruments found</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ISIN</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Completeness</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instruments.map((instrument) => (
                <TableRow key={instrument.id}>
                  <TableCell className="font-mono">
                    {instrument.isin || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {instrument.name || '-'}
                  </TableCell>
                  <TableCell>{instrument.securityType || '-'}</TableCell>
                  <TableCell>{instrument.countryName || '-'}</TableCell>
                  <TableCell>{instrument.currencyCode || '-'}</TableCell>
                  <TableCell>
                    {renderCompletenessIndicator(instrument)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                      <Button variant="ghost" size="sm" disabled={isLocked}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        History
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
}
