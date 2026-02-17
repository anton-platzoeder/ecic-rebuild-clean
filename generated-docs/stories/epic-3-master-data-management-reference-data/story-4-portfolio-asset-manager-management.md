# Story: Portfolio & Asset Manager Management

**Epic:** Master Data Management & Reference Data | **Story:** 4 of 6 | **Wireframe:** Screen 13 (Reference Data Management - Portfolio & Asset Manager Views)

## Story Metadata
| Field | Value |
|-------|-------|
| **Route** | `/master-data/reference-data/portfolios`, `/master-data/reference-data/asset-managers` |
| **Target File** | `app/master-data/reference-data/portfolios/page.tsx`, `app/master-data/reference-data/asset-managers/page.tsx` |
| **Page Action** | `create_new` |

## User Story
**As an** Administrator or Analyst **I want** to manage portfolio definitions and asset manager records with full CRUD operations **So that** the system has accurate organizational reference data for batch processing, fee calculations, and reporting

## Acceptance Criteria

### Happy Path - View Portfolios List
- [ ] Given I navigate to `/master-data/reference-data/portfolios`, when the page loads, then I see a table showing portfolios with columns: Portfolio Name, Code, Manager, Currency, Status, and Actions (Edit, View, History)
- [ ] Given 5 active portfolios exist, when I view the list, then I see "Showing 5 active portfolios" summary and a "Back" link to the category landing page
- [ ] Given a portfolio "Global Equity Fund" exists, when I view its row, then I see portfolio name, code "GEF", asset manager "Manager A", base currency "USD", benchmark "MSCI World", inception date, and Active status badge

### Happy Path - Create Portfolio
- [ ] Given I click "Add Portfolio", when the edit modal opens, then I see a form with sections: Basic Information, Currency & Valuation, Benchmark, Fees, Reporting, and Status
- [ ] Given I fill in required fields (Asset Manager, Code, Name, Currency, Mandate, Benchmark), when I click "Save", then the portfolio is created and I see success message "Portfolio created successfully"
- [ ] Given I enter a portfolio code that already exists, when I click "Save", then I see validation error "A portfolio with this code already exists"

### Happy Path - Edit Portfolio
- [ ] Given I click "Edit" on the Global Equity Fund portfolio, when the edit modal opens, then I see all current values pre-populated in editable fields
- [ ] Given I change the Management Fee Rate from 0.75% to 0.80%, when I click "Save Changes", then the portfolio is updated and I see success message "Portfolio updated successfully"
- [ ] Given I modify portfolio fields, when I click "Cancel", then changes are discarded and the modal closes

### Portfolio Detail Fields
- [ ] Given I am editing a portfolio, when I view the Basic Information section, then I see fields: Portfolio Name, Portfolio Code, Short Name, Asset Manager (dropdown of active asset managers), Inception Date
- [ ] Given I am editing the Currency section, when I view it, then I see Base Currency (dropdown of currencies), Alternative Currencies (multi-select), and Valuation Frequency (Daily/Monthly/Quarterly)
- [ ] Given I am editing the Benchmark section, when I view it, then I see Primary Benchmark (dropdown of indexes) and optional Secondary Benchmark
- [ ] Given I am editing the Fees section, when I view it, then I see Management Fee Rate (%), Fee Type (AUM dropdown), Custody Fee Rate (%), VAT Rate (%), and VAT Treatment (Inclusive/Exclusive/Exempt)

### Referential Integrity - Portfolio
- [ ] Given I view a portfolio's edit modal, when I see the Referential Integrity Check panel, then I see checks for: Asset Manager exists and is active, Base currency exists, Primary benchmark exists
- [ ] Given the portfolio is used in 145 holdings across 12 batches, when I see the integrity panel, then I see warning "This portfolio is used in 145 holdings across 12 batches. Cannot be deleted (can only be deactivated)."
- [ ] Given I try to deactivate a portfolio used in an active (non-Approved) batch, when I click "Deactivate Portfolio", then I see error "Cannot deactivate: portfolio is in use by active batch January 2026"

### Happy Path - View Asset Managers List
- [ ] Given I navigate to `/master-data/reference-data/asset-managers`, when the page loads, then I see a table showing asset managers with columns: Name, Code, Location, CIO, Status, and Actions
- [ ] Given 12 active asset managers exist, when I view the list, then I see all asset managers with their details

### Happy Path - Create Asset Manager
- [ ] Given I click "Add Asset Manager", when the form opens, then I see fields: External Code, Code, Name, CIO, CEO, Client Relationship Manager, Inception Year, Location, B-BBEE Level, Website
- [ ] Given I fill in required fields (External Code, Code, Name, Location), when I click "Save", then the asset manager is created successfully
- [ ] Given I enter a code that already exists, when I click "Save", then I see validation error "An asset manager with this code already exists"

### Happy Path - Edit Asset Manager
- [ ] Given I click "Edit" on an asset manager, when the form opens, then I see all current values pre-populated
- [ ] Given I update the CIO name, when I click "Save Changes", then the asset manager is updated and I see success message

### Referential Integrity - Asset Manager
- [ ] Given an asset manager is linked to 3 portfolios, when I try to deactivate it, then I see error "Cannot deactivate: this asset manager is linked to 3 active portfolios"
- [ ] Given an asset manager has no linked portfolios, when I click "Deactivate", then a confirmation dialog appears and deactivation proceeds after confirmation

### View & History
- [ ] Given I click "View" on a portfolio, when the modal opens, then I see all portfolio details in read-only mode
- [ ] Given I click "History" on a portfolio or asset manager, when the action triggers, then I navigate to the Audit Trail Viewer filtered to that entity
- [ ] Given I click "Export" on the portfolios page, when the action executes, then an Excel file downloads with all portfolio data

### Error Handling
- [ ] Given the API fails to load portfolios, when the page loads, then I see error message "Failed to load portfolios. Please try again." with a retry button
- [ ] Given the API returns a 403 Forbidden on create, when I try to save, then I see "You do not have permission to create portfolios"

## API Endpoints (from OpenAPI spec)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/portfolios` | List portfolios with optional filters |
| POST | `/portfolios` | Create new portfolio |
| GET | `/portfolios/{id}` | Get portfolio details |
| PUT | `/portfolios/{id}` | Update portfolio |
| GET | `/asset-managers` | List asset managers |
| POST | `/asset-managers` | Create new asset manager |
| GET | `/audit/changes?entityType=Portfolio` | Get portfolio audit history |
| GET | `/audit/changes?entityType=AssetManager` | Get asset manager audit history |

## Implementation Notes

- **Routes**: Two new pages under `/master-data/reference-data/`
- **Component Structure**:
  - `app/master-data/reference-data/portfolios/page.tsx` - Portfolio list page
  - `app/master-data/reference-data/asset-managers/page.tsx` - Asset Manager list page
  - `components/reference-data/PortfolioTable.tsx` - Portfolio data table
  - `components/reference-data/PortfolioEditModal.tsx` - Create/Edit portfolio form
  - `components/reference-data/AssetManagerTable.tsx` - Asset Manager data table
  - `components/reference-data/AssetManagerEditModal.tsx` - Create/Edit asset manager form
  - `components/reference-data/ReferentialIntegrityPanel.tsx` - Shared referential integrity check display
- **Dropdown Dependencies**: Portfolio form requires asset managers, currencies, and indexes/benchmarks loaded as dropdown options
- **API Client**: Add to `lib/api/reference-data.ts`: `createPortfolio(data)`, `updatePortfolio(id, data)`, `getPortfolio(id)`, `createAssetManager(data)`
- **Shadcn Components**: Dialog (edit modal), Form, Input, Select, Button, DataTable, Badge, Alert
- **BRD Requirements**: BR-REF-001 (Reference Data Management), BR-REF-002 (Reference Data Validation)
- **Testing Focus**: User can view, create, edit portfolios and asset managers; referential integrity enforced; validation works

## Dependencies
- Story 3 (Category Landing) - navigation from category cards
- Story 5 (Geographic & Financial Reference Data) - currencies and benchmarks needed as dropdown data

## Story Points
**8** - Two full CRUD pages with complex portfolio form, referential integrity, dropdown dependencies, and validation
