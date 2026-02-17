# Story: Geographic & Financial Reference Data

**Epic:** Master Data Management & Reference Data | **Story:** 5 of 6 | **Wireframe:** Screen 13 (Reference Data Management - Detail Views)

## Story Metadata
| Field | Value |
|-------|-------|
| **Route** | `/master-data/reference-data/countries`, `/master-data/reference-data/currencies`, `/master-data/reference-data/indexes`, `/master-data/reference-data/benchmarks`, `/master-data/reference-data/credit-rating-scales` |
| **Target File** | `app/master-data/reference-data/[category]/page.tsx` |
| **Page Action** | `create_new` |

## User Story
**As a** user managing reference data **I want** to view countries, currencies, indexes, benchmarks, and rating scales **So that** I can verify the foundational data used across the system and manage indexes and benchmarks for portfolio reporting

## Acceptance Criteria

### Happy Path - Countries List
- [ ] Given I navigate to `/master-data/reference-data/countries`, when the page loads, then I see a table showing countries with columns: Name, Alpha-2 Code, Alpha-3 Code
- [ ] Given 132 countries exist, when I view the list, then I see "Showing 132 countries" with a searchable table
- [ ] Given I search for "United States", when the search executes, then I see the matching country row with Alpha-2 "US" and Alpha-3 "USA"
- [ ] Given countries are system-managed reference data, when I view the page, then I do NOT see "Add" or "Edit" buttons (read-only list)

### Happy Path - Currencies List
- [ ] Given I navigate to `/master-data/reference-data/currencies`, when the page loads, then I see a table showing currencies with columns: Name, Code, Numeric Code
- [ ] Given 28 currencies exist, when I view the list, then I see all currencies (e.g., "US Dollar", "USD", "840")
- [ ] Given currencies are system-managed reference data, when I view the page, then I do NOT see "Add" or "Edit" buttons (read-only list)

### Happy Path - Indexes List
- [ ] Given I navigate to `/master-data/reference-data/indexes`, when the page loads, then I see a table showing indexes with columns: Name, Code, Currency, and Actions (Edit)
- [ ] Given 24 active indexes exist, when I view the list, then I see all indexes with their currency associations
- [ ] Given I click "Add Index", when the form opens, then I see fields: Name, Code, Currency (dropdown of currencies)
- [ ] Given I fill in the required fields and click "Save", when the action completes, then the new index is created and appears in the table

### Happy Path - Benchmarks List
- [ ] Given I navigate to `/master-data/reference-data/benchmarks`, when the page loads, then I see a table showing benchmarks with columns: Name, Code, and Actions
- [ ] Given 8 active benchmarks exist, when I view the list, then I see all benchmarks
- [ ] Given I click "Add Benchmark", when the form opens, then I see fields: Name and Code
- [ ] Given I create a new benchmark, when I check the portfolios page, then the new benchmark is available as a dropdown option

### Happy Path - Credit Rating Scales
- [ ] Given I navigate to `/master-data/reference-data/credit-rating-scales`, when the page loads, then I see a table showing rating scales with columns: Description, EU Credit Quality Step, Bloomberg Composite, Moody's, S&P, Fitch
- [ ] Given rating scales are pre-defined, when I view the page, then I see all rating scale mappings (e.g., "Prime" = Aaa/AAA/AAA)
- [ ] Given rating scales are system-managed, when I view the page, then I do NOT see "Add" or "Edit" buttons (read-only reference)

### Search Across All Categories
- [ ] Given I am on any reference data detail page, when I type in the search box, then the table filters to matching records
- [ ] Given I search with no results, when the search completes, then I see "No records found matching your search"

### Export
- [ ] Given I am viewing any reference data list, when I click "Export", then an Excel file downloads with the current data

### Back Navigation
- [ ] Given I am on any reference data detail page, when I click "Back" or the breadcrumb, then I return to the Reference Data category landing page

### Referential Integrity Warnings
- [ ] Given I try to deactivate currency "USD" that is used by 4 portfolios and 198 instruments, when the action triggers, then I see warning dialog listing all usage and options to "Deactivate Currency" or "Keep Active"
- [ ] Given I see the referential integrity warning, when I click "Keep Active", then no changes are made and the dialog closes

### Error Handling
- [ ] Given the API fails to load a reference data list, when the page loads, then I see error message "Failed to load data. Please try again." with a retry button

## API Endpoints (from OpenAPI spec)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/countries` | List all countries |
| GET | `/currencies` | List all currencies |
| GET | `/indexes` | List all indexes |
| GET | `/benchmarks` | List all benchmarks |
| GET | `/credit-rating-scales` | List credit rating scale mappings |

## Implementation Notes

- **Route Pattern**: Use dynamic route `app/master-data/reference-data/[category]/page.tsx` to handle all categories with a single page component that renders different tables based on category
- **Component Structure**:
  - `app/master-data/reference-data/[category]/page.tsx` - Dynamic route page
  - `app/master-data/reference-data/[category]/ReferenceDataListClient.tsx` - Client component
  - `components/reference-data/ReferenceDataTable.tsx` - Generic table that adapts columns based on category
  - `components/reference-data/IndexEditModal.tsx` - Create/edit index form
  - `components/reference-data/BenchmarkEditModal.tsx` - Create/edit benchmark form
  - `components/reference-data/ReferentialIntegrityWarning.tsx` - Warning dialog for delete/deactivate
- **Read-Only vs CRUD**: Countries, Currencies, Rating Scales are read-only lists. Indexes and Benchmarks have create/edit capabilities.
- **API Client**: Extend `lib/api/reference-data.ts` with category-specific fetch functions
- **Shadcn Components**: DataTable, Input (search), Button (export, add), Dialog (edit/warning), Badge
- **BRD Requirements**: BR-REF-001 (Comprehensive Reference Data), BR-REF-002 (Reference Data Validation)
- **Testing Focus**: User can view all category lists, search works, CRUD for indexes/benchmarks, referential integrity warnings shown

## Dependencies
- Story 3 (Category Landing) - navigation from category cards
- Story 4 (Portfolio & Asset Manager) - indexes and benchmarks used as portfolio dropdowns

## Story Points
**5** - Multiple list views with dynamic routing, mix of read-only and CRUD, referential integrity checks
