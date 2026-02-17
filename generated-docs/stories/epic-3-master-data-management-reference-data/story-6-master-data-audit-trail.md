# Story: Master Data Audit Trail Integration

**Epic:** Master Data Management & Reference Data | **Story:** 6 of 6 | **Wireframe:** Screen 16 (Audit Trail Viewer - Master Data Changes Tab)

## Story Metadata
| Field | Value |
|-------|-------|
| **Route** | `/admin/audit-trail` (modify existing) |
| **Target File** | `app/admin/audit-trail/page.tsx` |
| **Page Action** | `modify_existing` |

## User Story
**As an** Administrator or Auditor **I want** to view complete audit trails for all master data changes with filtering and export **So that** I can track who changed what, when, and why for compliance reporting and operational accountability

## Acceptance Criteria

### Happy Path - Master Data Changes Tab
- [ ] Given I navigate to `/admin/audit-trail`, when the page loads, then I see tab navigation with tabs: Master Data Changes, Workflow Events, User Activity, Admin Actions
- [ ] Given I click "Master Data Changes" tab, when the tab loads, then I see a filterable table of all master data change records in reverse chronological order
- [ ] Given I view the audit trail, when I see a record, then each row shows: Timestamp, User, Entity Type (e.g., "Credit Rating"), Action (Create/Update/Delete), and a summary description (e.g., "US1234567890: Rating changed BBB to BBB+")

### Filtering - Entity Type
- [ ] Given I am on the Master Data Changes tab, when I see the Entity Type filter, then I see options: All, Instruments, Index Prices, Risk Metrics, Volatility, Credit Ratings, Custom Holdings, Portfolios, Asset Managers, Currencies, Countries
- [ ] Given I select "Credit Rating" from the Entity Type filter, when the filter applies, then I see only credit rating change records
- [ ] Given I select "Instrument" from the Entity Type filter, when the filter applies, then I see only instrument change records

### Filtering - Date Range
- [ ] Given I am on the Master Data Changes tab, when I see the date range filter, then I see "From" and "To" date pickers with preset options (Last 7 Days, Last 30 Days, Last 90 Days)
- [ ] Given I select "Last 7 Days" preset, when the filter applies, then I see only records from the last 7 days
- [ ] Given I set a custom date range from 2026-01-01 to 2026-01-05, when I click "Apply", then I see only records within that date range

### Filtering - User and Action
- [ ] Given I select "Sarah Johnson" from the User filter, when the filter applies, then I see only changes made by Sarah Johnson
- [ ] Given I select "Update" from the Action Type filter, when the filter applies, then I see only update records (no creates or deletes)
- [ ] Given I have multiple filters active (Entity Type: Credit Rating, User: Sarah Johnson, Last 7 Days), when the filters apply, then I see only matching records

### Filtering - Batch
- [ ] Given I select "January 2026" from the Batch filter, when the filter applies, then I see only changes associated with that reporting batch
- [ ] Given I click "Clear Filters", when the action completes, then all filters reset and the full audit trail is displayed

### Audit Record Detail View
- [ ] Given I click "View" on an audit record (e.g., credit rating update), when the detail modal opens, then I see: Timestamp, User (name and username), Session ID, IP Address
- [ ] Given I view a record detail, when I see the Entity Information section, then I see Entity Type, Entity ID, related identifiers (e.g., Instrument ISIN), and Batch association
- [ ] Given I view a record detail for an update, when I see the Changes Made section, then I see each field changed with "Before" and "After" values (e.g., "Bloomberg Composite Rating: BBB -> BBB+")
- [ ] Given a change has multiple fields modified, when I view the Changes Made section, then I see all changed fields listed individually
- [ ] Given a change has a reason recorded, when I view the Change Metadata section, then I see "Reason: Updated rating per Bloomberg feed" and "Source: Manual entry"

### Pagination
- [ ] Given 1,247 audit records match the current filters, when I view the table, then I see "Showing 1,247 audit records" with pagination (10 per page by default)
- [ ] Given I navigate between pages, when I click page numbers, then the table updates to show the corresponding records
- [ ] Given I change rows per page to 25, when the table updates, then 25 records are shown per page

### Export
- [ ] Given I am viewing filtered audit records, when I click "Export Filtered Results", then an export options dialog opens
- [ ] Given the export dialog is open, when I see the options, then I can select format (Excel, CSV), date range, and choose which columns to include (Timestamp, User, Entity, Action, Before/After values, Reason, IP address)
- [ ] Given I click "Generate Export", when the export completes, then a file downloads containing all records matching the current filters
- [ ] Given I export with 1,247 records, when the download completes, then the Excel file contains all 1,247 records with the selected columns

### Access Control
- [ ] Given I am an Administrator, when I view the audit trail, then I have full access to all tabs and all records
- [ ] Given I am an Approver, when I view the audit trail, then I can see Master Data Changes and Workflow Events tabs but NOT User Activity details for other users
- [ ] Given I am a regular Analyst, when I try to access the audit trail, then I can see only my own activity records

### Record Count and Summary
- [ ] Given I view the Master Data Changes tab, when the page loads, then I see a summary showing total records, and a breakdown by entity type if filtered
- [ ] Given I apply filters that return 0 results, when the table updates, then I see "No audit records found matching your filters" with a "Clear Filters" button

### Error Handling
- [ ] Given the API fails to load audit records, when the tab loads, then I see error message "Failed to load audit trail. Please try again." with a retry button
- [ ] Given a large export is requested (>10,000 records), when I click export, then I see a progress indicator "Generating export..."

## API Endpoints (from OpenAPI spec)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/audit/changes` | Query audit trail with entityType, entityId, from, to, user, page, pageSize |
| GET | `/audit/export` | Export audit trail to Excel with entityType, from, to filters |

## Implementation Notes

- **Modifies Existing**: The audit trail viewer page at `/admin/audit-trail` was created in Epic 1 Story 6. This story adds the "Master Data Changes" tab with full filtering and detail view.
- **Component Structure**:
  - `components/audit/MasterDataChangesTab.tsx` - New tab component for master data audit
  - `components/audit/AuditRecordDetailModal.tsx` - Detail modal showing before/after values
  - `components/audit/AuditFilters.tsx` - Filter controls (date range, entity type, user, action, batch)
  - `components/audit/ExportOptionsModal.tsx` - Export configuration dialog
- **Existing Infrastructure**: `lib/api/audit.ts` already has `queryAuditTrail()` and `exportAuditTrail()` functions with proper types
- **Entity Type Mapping**: Use the `AuditableEntityType` type from `lib/api/audit.ts`
- **Before/After Display**: The `AuditTrailEntry.changes` array contains `AuditFieldChange` objects with field, oldValue, newValue
- **Shadcn Components**: Tabs (tab navigation), DataTable, Select (filters), DatePicker, Dialog (detail modal, export), Button, Badge, Pagination
- **BRD Requirements**: BR-AUD-001 (Complete Audit Trails), BR-AUD-002 (Audit Trail Coverage)
- **Testing Focus**: User sees audit records, can filter by entity type/date/user, can view details with before/after values, can export

## Dependencies
- Epic 1 Story 6 (User Activity Logging & Audit Trail) - modifies existing audit trail page
- Story 1-5 (All master data stories) - provides data that appears in audit trail

## Story Points
**5** - Extends existing page with new tab, complex filtering, detail modal with field-level changes, and export functionality
