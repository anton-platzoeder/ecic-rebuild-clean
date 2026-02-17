# Story: Instrument Create, View & Edit

**Epic:** Master Data Management & Reference Data | **Story:** 2 of 6 | **Wireframe:** Screen 7 (Instrument Master Management - Detail Modal)

## Story Metadata
| Field | Value |
|-------|-------|
| **Route** | N/A (modal overlay on `/master-data/instruments`) |
| **Target File** | `components/instruments/InstrumentDetailModal.tsx` |
| **Page Action** | `create_new` |

## User Story
**As an** Analyst **I want** to create, view, and edit instrument details with full audit history **So that** I can maintain accurate and complete instrument master data for portfolio reporting

## Acceptance Criteria

### Happy Path - View Instrument Details
- [ ] Given I click "View" on an instrument (e.g., Microsoft Corp, US5949181045), when the detail modal opens, then I see tabbed interface with tabs: General, Classification, Pricing, Related Data, Audit History
- [ ] Given I am on the General tab, when I view the instrument details, then I see fields: ISIN, Instrument Name, Short Name, Issuer, Issue Date, Maturity Date, all in read-only mode
- [ ] Given the instrument has complete classification data, when I view the Classification section, then I see Asset Class, Instrument Type, Sector, Industry fields
- [ ] Given the instrument has geographic data, when I view the Geographic & Currency section, then I see Country, Currency, Exchange fields
- [ ] Given the instrument has identifiers, when I view the Identifiers section, then I see SEDOL, CUSIP, Bloomberg Ticker fields
- [ ] Given I view the instrument details, when I look at the Status section, then I see Active/Inactive radio, Last Updated timestamp and user, and Created timestamp and source

### Completeness Check Panel
- [ ] Given I view an instrument with all required data, when I see the Completeness Check panel, then I see all items checked: Basic Information Complete, Classification Complete, Geographic Data Complete, Credit Rating Available, Risk Metrics Available, Volatility Metric Available
- [ ] Given I view an instrument missing credit rating and beta, when I see the Completeness Check panel, then I see "Credit Rating Available" and "Volatility Metric Available" unchecked with amber warning icons
- [ ] Given an item in the completeness check is missing, when I click the missing item text, then I navigate to the relevant management page (e.g., Credit Ratings page filtered to this instrument)

### Happy Path - Create New Instrument
- [ ] Given I am on the instrument list with the batch unlocked, when I click "Add New Instrument", then a blank detail modal opens in edit mode with the General tab active
- [ ] Given I fill in required fields (Name) and optional fields (ISIN, Security Type, Country, Currency), when I click "Save", then the instrument is created and I see success message "Instrument created successfully"
- [ ] Given I create an instrument with ISIN "US0378331005", when I check the instrument list, then the new instrument appears in the table
- [ ] Given I try to create an instrument with a duplicate ISIN that already exists, when I click "Save", then I see validation error "An instrument with this ISIN already exists"

### Happy Path - Edit Instrument
- [ ] Given I click "Edit" on an instrument with the batch in Data Preparation, when the detail modal opens, then all editable fields are enabled and I see "Save Changes" and "Cancel" buttons
- [ ] Given I change the Sector from "Information Technology" to "Technology", when I click "Save Changes", then the instrument is updated and I see success message "Instrument updated successfully"
- [ ] Given I am editing an instrument, when I click "Cancel", then my changes are discarded and the modal closes

### Deactivate Instrument
- [ ] Given I am viewing an active instrument that is NOT used in any current holdings, when I click "Deactivate Instrument", then a confirmation dialog appears: "Are you sure you want to deactivate this instrument?"
- [ ] Given I confirm deactivation, when the action completes, then the instrument status changes to Inactive and I see success message "Instrument deactivated"
- [ ] Given I try to deactivate an instrument used in current or historical holdings, when I click "Deactivate Instrument", then I see error "Cannot deactivate: this instrument is used in 145 holdings across 12 batches. You can only deactivate instruments not in use."

### State-Aware Locking
- [ ] Given the active batch is in "Level1Pending" (locked), when I open the instrument detail modal, then all form fields are disabled and I see "Locked - Approval" indicator in the header
- [ ] Given the batch is locked, when I view the modal, then the "Save Changes" and "Deactivate Instrument" buttons are hidden, and only "Close" is available
- [ ] Given the batch is rejected and returns to Data Preparation, when I open the instrument detail, then all fields are editable again

### Audit History Tab
- [ ] Given I click the "Audit History" tab for instrument US5949181045, when the tab loads, then I see a chronological list of all changes to this instrument from temporal tables
- [ ] Given the instrument has been modified 3 times, when I view the audit history, then I see 3 entries each showing: timestamp, user, field changed, before value, after value, and reason (if provided)
- [ ] Given I view an audit entry where Sector changed from "Information Technology" to "Technology", when I read the entry, then I see "Field Changed: Sector", "Before: Information Technology", "After: Technology", user name, and timestamp
- [ ] Given the instrument was created via system import, when I view the earliest audit entry, then I see "Action: Instrument Created", "Source: Asset Manager File Import"
- [ ] Given I want to export the audit history, when I click "Export Audit History", then an Excel file downloads with all change entries for this instrument

### Validation
- [ ] Given I try to save an instrument without a name (required field), when I click "Save", then I see validation error "Name is required"
- [ ] Given I enter an invalid ISIN format, when I click "Save", then I see validation error "Invalid ISIN format"
- [ ] Given the API returns a 409 Conflict (e.g., duplicate), when I try to save, then I see the error message from the API

### Error Handling
- [ ] Given the API fails to load instrument details, when I open the modal, then I see error message "Failed to load instrument details. Please try again."
- [ ] Given the API fails during save, when I click "Save Changes", then I see error message "Failed to save changes. Please try again." and my data is preserved in the form

## API Endpoints (from OpenAPI spec)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/instruments/{id}` | Get instrument details |
| POST | `/instruments` | Create new instrument |
| PUT | `/instruments/{id}` | Update instrument |
| GET | `/instruments/{id}/history` | Get instrument change history from temporal tables |

## Implementation Notes

- **Component Structure**:
  - `components/instruments/InstrumentDetailModal.tsx` - Main modal with tab navigation
  - `components/instruments/tabs/GeneralTab.tsx` - General information form
  - `components/instruments/tabs/ClassificationTab.tsx` - Classification fields
  - `components/instruments/tabs/AuditHistoryTab.tsx` - Temporal table history
  - `components/instruments/CompletenessCheckPanel.tsx` - Data completeness display
- **Tab Navigation**: Use Shadcn Tabs component
- **Form State**: Use React Hook Form for form management
- **Validation**: Zod schema for instrument validation
- **Lock State**: Check batch lock status from BatchContext before enabling edit
- **API Client**: Extend `lib/api/instruments.ts` with `getInstrument(id)`, `createInstrument(data)`, `getInstrumentHistory(id, from?, to?)`
- **Existing Types**: Extend the basic `Instrument` type in `lib/api/instruments.ts` to match full OpenAPI schema
- **Shadcn Components**: Dialog (modal), Tabs (tab navigation), Form (fields), Input, Select, RadioGroup (status), Button, Alert (completeness)
- **BRD Requirements**: BR-MASTER-001 (Instrument Master Data Management), BR-AUD-001 (Complete Audit Trails)
- **Testing Focus**: User can create/edit/view instruments, sees completeness, sees audit history, lock state enforced

## Dependencies
- Story 1 (Instrument Listing) - modal triggered from list page
- Epic 2 Story 2 (Batch Context) - lock state awareness
- Epic 2 Story 5 (State-Based Access Control) - lock enforcement

## Story Points
**8** - Tabbed modal with CRUD operations, validation, temporal audit history, completeness checks, and state-aware locking
