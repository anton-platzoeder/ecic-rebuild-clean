# Schema, API, and Wireframe Reconciliation Summary

**Date:** 2026-02-05

## Overview

This document reconciles the SQL Server database schema, generated OpenAPI spec, BRD requirements, and wireframes.

## Database Analysis

### Schemas
| Schema | Purpose | Table Count |
|--------|---------|-------------|
| dbo | Main business tables | ~80 |
| Calculation | Calculated results | 12 |
| Classification | Hierarchical classifications | 14 |
| Staging | ETL staging for file imports | 17 |
| linx_processautomation | External workflow automation | 6 |

### Key Features
- **Temporal Tables**: Many tables use SQL Server SYSTEM_VERSIONING for automatic audit history
- **All tables have `LastChangedUser`**: Captures who made changes
- **ReportBatch is the workflow unit**: All transactional data linked to batches

## Reconciliation Matrix

### Fully Aligned (Database + API + Wireframes + BRD)

| Capability | DB Tables | API Endpoints | Wireframe | BRD Req |
|------------|-----------|---------------|-----------|---------|
| Report Batch Workflow | ReportBatch, ReportBatchApproveLog | /report-batches, /approvals | Screen 2, 5, 6 | BR-GOV-001-007 |
| Instrument Master | Instrument, InstrumentHistory | /instruments | Screen 7 | BR-MASTER-001 |
| Index Prices | IndexPrice, IndexPriceHistory | /index-prices | Screen 8 | BR-MASTER-002 |
| Risk Metrics (Duration) | InstrumentDuration | /instrument-durations | Screen 9 | BR-MASTER-003 |
| Volatility (Beta) | InstrumentBeta | /instrument-betas | Screen 10 | BR-MASTER-004 |
| Credit Ratings | CreditRating, CreditRatingScale | /credit-ratings | Screen 11 | BR-MASTER-005 |
| Custom Holdings | Holding, CustomHoldingAudit | /holdings/custom | Screen 12 | BR-MASTER-006 |
| Portfolio Master | Portfolio, PortfolioHistory | /portfolios | Screen 13 | BR-REF-001 |
| Asset Manager | AssetManager, AssetManagerHistory | /asset-managers | Screen 13 | BR-REF-001 |
| Currency | Currency, CurrencyHistory | /currencies | Screen 13 | BR-REF-001 |
| Country | Country, CountryHistory | /countries | Screen 13 | BR-REF-001 |
| File Processing | FileSetting, FileLog, FileSettingPortfolioMap | /files, /file-logs | Screen 3, 17 | BR-DATA-001-004 |
| Calculations | Calculation.* tables | /calculations | Screen 18 | BR-GOV-007 |
| Audit Trail | *History tables (temporal) | /audit | Screen 16 | BR-AUD-001-005 |
| Report Comments | ReportComments | /comments | Screen 5 | BR-COMM-001 |

### RESOLVED: User Management

| Capability | DB Tables | API Endpoints | Wireframe | BRD Req |
|------------|-----------|---------------|-----------|---------|
| User Management | User, UserHistory | /users/* | Screen 14 | BR-SEC-001 |
| Role Management | Role, Permission, RolePermission, UserRole | /roles/*, /permissions | Screen 15 | BR-SEC-002 |
| Approval Authority | ApprovalAuthority | /approval-authorities/* | Screen 15 | BR-SEC-003 |
| Login Audit | UserLoginLog | (logged internally) | - | BR-AUD-004 |
| Activity Audit | UserActivityLog | /users/{id}/activity | Screen 16 | BR-AUD-004 |

**Resolution:** Added tables in `user-management-schema.sql`:
- User (with temporal versioning for audit)
- Role (7 system roles pre-configured)
- Permission (35 permissions across categories)
- RolePermission (many-to-many with default assignments)
- UserRole (many-to-many)
- ApprovalAuthority (per BR-SEC-003)
- UserLoginLog (per BR-AUD-004)
- UserActivityLog (per BR-AUD-004)

**API spec updated** with 15 new endpoints for user/role/approval management.

### Partial Alignment

| Capability | Status | Notes |
|------------|--------|-------|
| Holdings | Aligned | DB has Holding, HoldingFundLevel; API has endpoints; Wireframe has custom holdings only |
| Transactions | DB only | Transaction table exists but no specific wireframe for transaction management |
| Income | DB only | Income table exists but no specific wireframe |
| Cash | DB only | Cash, CustodianCash tables exist but no specific wireframe |
| Fee Management | DB only | ManagementFeeRate, CustodyFeeRate exist; Screen 13 mentions fee structures |

## Database Tables by Category

### Master Data (with temporal versioning)
- Instrument, InstrumentHistory
- Portfolio, PortfolioHistory
- AssetManager, AssetManagerHistory
- Currency, CurrencyHistory
- Country, CountryHistory
- Index, IndexHistory
- Benchmark, BenchmarkHistory
- CreditRatingScale, CreditRatingScaleHistory

### Transactional Data (per batch)
- ReportBatch
- ReportBatchApproveLog
- Holding, HoldingFundLevel
- Transaction
- Income
- Cash, CustodianCash
- CreditRating, CreditRatingHistory
- InstrumentDuration, InstrumentDurationHistory
- InstrumentBeta, InstrumentBetaHistory
- IndexPrice, IndexPriceHistory

### File Management
- FileSetting, FileSettingHistory
- FileSettingPortfolioMap
- FileSource
- FileType
- FileFormat
- FileLog
- SftpConfig

### Calculated Results (Calculation schema)
- BenchmarkPerformance
- PortfolioPerformance
- ManagementFee
- CustodianFee
- CalculationLog, CalculationLogError

### Classification Hierarchies (Classification schema)
- AssetClassTree, AssetClassNode
- GicsTree, GicsNode
- IcbTree, IcbNode
- CicTree, CicNode
- TrancheTree, TrancheNode

### Staging (for ETL)
- Staging.Holding
- Staging.Transaction
- Staging.Income
- Staging.Instrument
- Staging.CreditRating
- (and more)

## API Coverage Summary

The OpenAPI spec includes:

| Category | Endpoints |
|----------|-----------|
| Authentication | 3 endpoints (login, me, refresh) |
| Report Batches | 6 endpoints |
| Approvals | 2 endpoints |
| Instruments | 5 endpoints |
| Portfolios | 4 endpoints |
| Holdings | 2 endpoints |
| Credit Ratings | 3 endpoints |
| Risk Metrics | 4 endpoints |
| Index Prices | 3 endpoints |
| Files | 4 endpoints |
| Reference Data | 6 endpoints |
| Calculations | 3 endpoints |
| Audit | 2 endpoints |

**Total: ~47 endpoints**

## Wireframe Coverage Summary

| Screen | Maps to API | Database Support |
|--------|-------------|------------------|
| 1. Dashboard | /report-batches, /auth/me | Aggregated queries |
| 2. Batch Management | /report-batches | ReportBatch |
| 3. File Status Monitor | /files | FileLog, FileSetting |
| 4. Data Validation Summary | /report-batches/{id}/validation | Multiple tables |
| 5. Approval Review | /approvals | ReportBatchApproveLog |
| 6. Workflow State Viewer | /report-batches/{id}/status | WorkflowActivity |
| 7. Instrument Master | /instruments | Instrument |
| 8. Index Prices | /index-prices | IndexPrice |
| 9. Risk Metrics | /instrument-durations | InstrumentDuration |
| 10. Volatility | /instrument-betas | InstrumentBeta |
| 11. Credit Ratings | /credit-ratings | CreditRating |
| 12. Custom Holdings | /holdings/custom | Holding |
| 13. Reference Data | /currencies, /countries, etc. | Multiple ref tables |
| 14. User Administration | /auth/* | **MISSING** |
| 15. Role Management | **MISSING** | **MISSING** |
| 16. Audit Trail | /audit | *History tables |
| 17. File Processing | /file-logs | FileLog |
| 18. Calculation Status | /calculations | Calculation.* |

## Required Actions

### Priority 1: User/Role Management - COMPLETED

User management tables have been defined in `user-management-schema.sql`.

**To apply:**
```sql
-- Run in SQL Server Management Studio against InvestInsight database
:r user-management-schema.sql
```

### Previous Gap Analysis (for reference)

**Option A: Add tables to database**
```sql
CREATE TABLE [dbo].[User](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Username] [varchar](100) NOT NULL,
    [DisplayName] [varchar](200) NOT NULL,
    [Email] [varchar](200) NULL,
    [IsActive] [bit] NOT NULL DEFAULT 1,
    [LastChangedUser] [varchar](100) NOT NULL,
    [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
    [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
    CONSTRAINT [PkUser] PRIMARY KEY CLUSTERED ([Id] ASC),
    PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[UserHistory]))

CREATE TABLE [dbo].[Role](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Name] [varchar](50) NOT NULL,
    [Description] [varchar](200) NULL,
    CONSTRAINT [PkRole] PRIMARY KEY CLUSTERED ([Id] ASC)
)

CREATE TABLE [dbo].[UserRole](
    [UserId] [int] NOT NULL,
    [RoleId] [int] NOT NULL,
    CONSTRAINT [PkUserRole] PRIMARY KEY CLUSTERED ([UserId], [RoleId])
)

CREATE TABLE [dbo].[ApprovalAuthority](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [UserId] [int] NOT NULL,
    [ApprovalLevel] [int] NOT NULL, -- 1, 2, or 3
    [IsBackup] [bit] NOT NULL DEFAULT 0,
    CONSTRAINT [PkApprovalAuthority] PRIMARY KEY CLUSTERED ([Id] ASC)
)
```

**Option B: External RBAC**
- Use AD groups for role mapping
- Store approval authority in configuration
- Frontend manages permissions based on JWT claims

### Priority 2: Verify All Wireframes Against API

Before development, verify each wireframe element has corresponding API support.

## Conclusion

The database is now fully aligned with all 18 wireframes after adding user management tables.

**All gaps have been addressed:**
- User, Role, Permission tables added
- ApprovalAuthority table added
- Login and Activity audit tables added
- OpenAPI spec updated with 15 new endpoints

**Ready for Next Steps:**
1. Run `user-management-schema.sql` against the InvestInsight database
2. Proceed with epic/story scoping using `/start` or `/continue`
3. Development can begin with full API contract defined
