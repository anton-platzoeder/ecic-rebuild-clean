# Story: Instrument Master Data Listing & Search

**Epic:** Master Data Management & Reference Data | **Story:** 1 of 6 | **Wireframe:** Screen 7 (Instrument Master Management - List View)

## Story Metadata
| Field | Value |
|-------|-------|
| **Route** | `/master-data/instruments` |
| **Target File** | `app/master-data/instruments/page.tsx` |
| **Page Action** | `create_new` |

## User Story
**As an** Analyst managing instrument data **I want** to view, search, and filter the complete instrument master list with completeness indicators **So that** I can quickly find instruments, identify incomplete records, and export data for external sharing

## Acceptance Criteria

### Happy Path - View Instrument List
- [ ] Given I navigate to `/master-data/instruments`, when the page loads, then I see a paginated table showing instruments with columns: ISIN, Name, Type, Country, Currency, and Actions (View, Edit, History)
- [ ] Given 245 instruments exist with 12 incomplete, when I view the instrument list, then I see "Showing 245 instruments (12 incomplete)" summary above the table
- [ ] Given an instrument is complete (has all required data), when I view its row, then I see a green checkmark badge "Complete" next to the instrument name
- [ ] Given an instrument is incomplete (missing credit rating, duration, or beta), when I view its row, then I see an amber warning badge "Incomplete" with details like "Missing: Duration, YTM" shown below the instrument name
- [ ] Given the page loads, when I view the header area, then I see the active batch context indicator showing "Batch: January 2026" with lock status icon

### Search Functionality
- [ ] Given I type "Apple" in the search box, when I press Enter or click the search icon, then the table filters to show only instruments matching "Apple" in name, ISIN, issuer, or ticker
- [ ] Given I search for ISIN "US0378331005", when the search executes, then I see the matching instrument "Apple Inc" in the results
- [ ] Given I search for a term with no matches (e.g., "ZZZZZ"), when the search executes, then I see an empty state message "No instruments found matching your search"
- [ ] Given I have an active search, when I clear the search box, then the full unfiltered instrument list is restored

### Filter Functionality
- [ ] Given I am on the instrument list page, when I see the filter controls, then I see dropdowns for: Security Type (All, Equity, Fixed Income, etc.), Country (All + list), and Status (Active, Inactive, All)
- [ ] Given I select "Equity" from the Security Type filter, when the filter applies, then the table shows only equity instruments
- [ ] Given I select "USA" from the Country filter and "Active" from Status, when the filters apply, then the table shows only active instruments from USA
- [ ] Given I have active filters showing 50 results, when I click "Clear Filters", then all filters reset to "All" and the full instrument list is restored

### Completeness Filter Checkboxes
- [ ] Given I am on the instrument list page, when I see the "Show Only" filter section, then I see checkboxes for "Missing Ratings", "Missing Risk Metrics", and "Incomplete"
- [ ] Given I check "Missing Ratings", when the filter applies, then the table shows only instruments that are missing credit rating data
- [ ] Given I check "Missing Risk Metrics", when the filter applies, then the table shows only instruments missing duration or YTM values
- [ ] Given I check "Incomplete" (general), when the filter applies, then the table shows all instruments missing any required data

### Pagination
- [ ] Given more than 10 instruments match the current filters, when the page loads, then I see 10 instruments per page with pagination controls showing page numbers
- [ ] Given I am on page 1 of 25 pages, when I click page 2, then the table shows instruments 11-20 with page 2 highlighted
- [ ] Given I am viewing the instrument list, when I change the "Rows per page" dropdown to 25, then 25 instruments are shown per page

### Export to Excel
- [ ] Given I am viewing the instrument list (filtered or unfiltered), when I click "Export to Excel", then an Excel file downloads containing all instruments matching current filters with columns: ISIN, Name, Type, Country, Currency, Status, Completeness
- [ ] Given I check "Missing Ratings" filter and 5 instruments are shown, when I click "Export to Excel", then only those 5 instruments are exported
- [ ] Given instruments include incomplete ones, when I click "Export Missing ISINs", then an Excel file downloads containing only the ISINs of instruments missing required data (for sharing with data providers)

### Batch Context & State Awareness
- [ ] Given the active batch is in "Data Preparation" status, when I view the instrument page, then I see action buttons enabled: "Add New Instrument", "Bulk Import", "Export to Excel"
- [ ] Given the active batch is in "Level1Pending" (locked), when I view the instrument page, then I see "Add New Instrument" and "Bulk Import" buttons disabled with a lock icon and the page header shows "Locked" badge
- [ ] Given the batch is locked, when I hover over the disabled "Add New Instrument" button, then I see tooltip "Data locked during approval process"

### Action Buttons
- [ ] Given I am viewing the instrument list, when I click "View" on an instrument row, then the instrument detail modal opens in read-only mode
- [ ] Given the batch is unlocked, when I click "Edit" on an instrument row, then the instrument detail modal opens in edit mode
- [ ] Given I click "History" on an instrument row, then the instrument detail modal opens on the Audit History tab

### Empty State
- [ ] Given no instruments exist in the system, when I navigate to the instrument list page, then I see "No instruments found. Add your first instrument to get started." with an "Add New Instrument" button

### Navigation
- [ ] Given I am on the instrument list page, when I look at the navigation, then I see "Master Data" highlighted in the top nav with a sub-navigation showing: Instruments (active), Index Prices, Risk Metrics, Volatility, Credit Ratings, Custom Holdings, Reference Data

## API Endpoints (from OpenAPI spec)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/instruments` | List instruments with search, filters, pagination |
| GET | `/instruments/export` | Export instruments to Excel (xlsx/csv) |

## Implementation Notes

- **Route**: `/master-data/instruments` - new page
- **Component Structure**:
  - `app/master-data/instruments/page.tsx` - Server component page
  - `app/master-data/instruments/InstrumentsClient.tsx` - Client component with state
  - `components/instruments/InstrumentTable.tsx` - Data table with columns
  - `components/instruments/InstrumentFilters.tsx` - Search + filter controls
  - `components/instruments/CompletenessIndicator.tsx` - Badge showing complete/incomplete
- **Master Data Sub-Navigation**: Create shared `components/master-data/MasterDataNav.tsx` for sub-page navigation
- **API Client**: Add to `lib/api/instruments.ts`: `listInstruments(params)`, `exportInstruments(params)`
- **Existing Code**: `lib/api/instruments.ts` already has basic `updateInstrument` - extend it
- **Shadcn Components**: DataTable, Input (search), Select (filters), Checkbox (completeness filters), Badge (completeness), Button (actions, export), Pagination, Tooltip
- **BRD Requirements**: BR-MASTER-001 (Instrument Master Data Management)
- **Testing Focus**: User sees instruments, can search/filter, sees completeness indicators, can export

## Dependencies
- Epic 2 Story 2 (Batch Context Switching) - uses active batch context for lock state
- Epic 1 Story 1 (Authentication) - must be logged in

## Story Points
**8** - New page with search, multi-filter, pagination, completeness logic, export, and batch state awareness
