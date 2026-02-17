# Story: Reference Data Category Landing

**Epic:** Master Data Management & Reference Data | **Story:** 3 of 6 | **Wireframe:** Screen 13 (Reference Data Management - Landing)

## Story Metadata
| Field | Value |
|-------|-------|
| **Route** | `/master-data/reference-data` |
| **Target File** | `app/master-data/reference-data/page.tsx` |
| **Page Action** | `create_new` |

## User Story
**As a** user managing reference data **I want** to see all reference data categories organized by type with active record counts **So that** I can quickly navigate to the specific reference data I need to view or manage

## Acceptance Criteria

### Happy Path - View Category Landing
- [ ] Given I navigate to `/master-data/reference-data`, when the page loads, then I see "Reference Data Management" as the page title
- [ ] Given the page loads, when I view the content, then I see four category groups: Geographic, Organizational, Financial, and Operational
- [ ] Given each category group has reference data types, when I view the Geographic group, then I see cards for "Countries" and "Currencies" each showing active record count (e.g., "132 active", "28 active")
- [ ] Given the Organizational group is displayed, when I view it, then I see cards for "Asset Managers" (e.g., "12 active") and "Portfolios" (e.g., "5 active")
- [ ] Given the Financial group is displayed, when I view it, then I see cards for "Indexes" (e.g., "24 active"), "Benchmarks" (e.g., "8 active"), "Rating Scales" (e.g., "4 active"), and "Rating Agencies" (e.g., "6 active")
- [ ] Given the Operational group is displayed, when I view it, then I see cards for "Fee Rate Structures", "File Processing Config", "Data Transformation Rules", and "Report Definitions"

### Navigation to Category Detail
- [ ] Given I click the "Countries" card, when the navigation occurs, then I am taken to `/master-data/reference-data/countries` showing the countries list
- [ ] Given I click the "Portfolios" card, when the navigation occurs, then I am taken to `/master-data/reference-data/portfolios`
- [ ] Given I click the "Asset Managers" card, when the navigation occurs, then I am taken to `/master-data/reference-data/asset-managers`
- [ ] Given I click any category card, when the page loads, then I see a "Back" link that returns me to the category landing page

### Active Record Counts
- [ ] Given the API returns 132 active countries, when I view the Countries card, then I see "132 active" displayed on the card
- [ ] Given the API returns 0 active records for a category, when I view that card, then I see "0 active" displayed
- [ ] Given the API is slow to respond, when the page loads, then I see loading skeletons for the count values before they populate

### Sub-Navigation Context
- [ ] Given I am on the reference data landing page, when I look at the Master Data sub-navigation, then I see "Reference Data" highlighted as the active tab
- [ ] Given I navigate from Instruments to Reference Data, when I click "Reference Data" in the sub-nav, then I arrive at the category landing page

### Error Handling
- [ ] Given the API fails to load record counts, when the page loads, then I see the category cards with "Unable to load count" message and a "Retry" button
- [ ] Given I click a category card but the detail page fails to load, when the navigation occurs, then I see an error page with "Return to Reference Data" link

## API Endpoints (from OpenAPI spec)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/countries` | Get countries list (count from array length) |
| GET | `/currencies` | Get currencies list |
| GET | `/asset-managers` | Get asset managers list |
| GET | `/portfolios` | Get portfolios list |
| GET | `/indexes` | Get indexes list |
| GET | `/benchmarks` | Get benchmarks list |
| GET | `/credit-rating-scales` | Get rating scales list |

## Implementation Notes

- **Route**: `/master-data/reference-data` - new page
- **Component Structure**:
  - `app/master-data/reference-data/page.tsx` - Server component page
  - `app/master-data/reference-data/ReferenceDataClient.tsx` - Client component
  - `components/reference-data/CategoryCard.tsx` - Card showing name, count, and link
  - `components/reference-data/CategoryGroup.tsx` - Group of cards with section header
- **Record Counts**: Fetch all reference data endpoints in parallel, use array lengths for counts
- **API Client**: Add to `lib/api/reference-data.ts`: `getCountries()`, `getCurrencies()`, `getAssetManagers()`, `getPortfolios()`, `getIndexes()`, `getBenchmarks()`, `getCreditRatingScales()`
- **Shadcn Components**: Card (category cards), Badge (count), Skeleton (loading states)
- **BRD Requirements**: BR-REF-001 (Comprehensive Reference Data Management)
- **Testing Focus**: User sees all categories, counts load, navigation works

## Dependencies
- Epic 1 Story 1 (Authentication) - must be logged in
- Story 1 (Instrument Listing) - shared Master Data sub-navigation

## Story Points
**3** - Landing page with category cards, API count fetching, and navigation routing
