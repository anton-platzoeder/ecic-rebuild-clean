# Project Progress: InvestInsight Portfolio Reporting Platform

> Last updated: 2026-02-17

## Summary

| Epic | Title | Stories | Completed | Status |
|------|-------|---------|-----------|--------|
| 1 | Authentication, Authorization & User Management | 8 | 8 | Done |
| 2 | Batch Management & Workflow State Control | 8 | 6 | In Progress |
| 3 | Master Data Management & Reference Data | TBD | 0 | Not Started |
| 4 | File Processing & Data Acquisition | TBD | 0 | Not Started |
| 5 | Portfolio Analytics & Risk Metrics | TBD | 0 | Not Started |
| 6 | Multi-Level Approval Workflow & Publication | TBD | 0 | Not Started |

---

## Epic 1: Authentication, Authorization & User Management

**Status: Done**
All 8 stories implemented. Auth infrastructure, RBAC, user management, and audit logging are in place. A realignment pass is verifying TDD coverage across stories.

- [x] Story 1 - User Authentication with AD/LDAP Integration
  - Route: `/login` | Commit: `af8c57d`
- [x] Story 2 - Role-Based Dashboard Landing
  - Route: `/` | Commit: `f1eab94`
- [x] Story 3 - User Lifecycle Management
  - Route: `/admin/users` | Commit: `4c1fc35`
- [x] Story 4 - Role Assignment & Permission Management
  - Route: `/admin/roles` | Commit: `18f0324`
- [x] Story 5 - Approval Authority Configuration
  - Route: `/approvals` | Commit: `642db1e`
- [x] Story 6 - User Activity Logging & Audit Trail
  - Route: `/admin/audit-trail` | Commit: `7b76dab`
- [x] Story 7 - Session Management & Authorization Checks
  - Commit: `6366d2e`
- [x] Story 8 - Login Activity Monitoring
  - Route: `/admin/users/login-activity` | Commit: `a7e9455`

---

## Epic 2: Batch Management & Workflow State Control

**Status: In Progress**
6 of 8 stories implemented. Batch lifecycle, workflow visualization, workflow history, and batch status summary are working. State-based access control and dashboard enhancements are pending.

- [x] Story 1 - Batch Creation & Listing
  - Route: `/batches` | Commit: `ff46b21`
- [x] Story 2 - Batch Context Switching
  - Component: `BatchSwitcher` | Commit: `8e45fb5`
- [x] Story 3 - Workflow State Visualization
  - Route: `/batches/[id]/workflow` | Commit: `b27d01b`
- [x] Story 4 - Data Confirmation & Workflow Transition
  - Component: `ConfirmDataButton` | Commit: `c498c6a`
- [ ] Story 5 - State-Based Access Control
  - Status: Realign phase (impact analysis done, commit `cf1eb58`)
- [x] Story 6 - Workflow History & Audit Trail
  - Route: `/batches/[id]/workflow` (history section) | Commit: `af8c57d`
  - Components: `WorkflowHistoryTimeline`, `WorkflowEvent`
  - API: `/report-batches/{id}/approvals`, `/report-batches/{id}/audit`
- [ ] Story 7 - Dashboard Pending Actions
  - Story spec ready, not yet implemented
- [x] Story 8 - Batch Status Summary
  - Route: `/batches/[id]` | Commit: `af8c57d`
  - Components: `BatchDetailClient`, `BatchHeader`, `OverallStatusBanner`, `FileStatusSection`, `ValidationSummarySection`, `CalculationStatusSection`, `WorkflowInfoSection`, `KeyMetricsPanel`
  - API: `/report-batches/{id}/files`, `/report-batches/{id}/calculations`

---

## Epic 3: Master Data Management & Reference Data

**Status: Not Started**
Stories not yet scoped. Expected scope: instrument master data, reference data CRUD, audit trails, state-aware operations.

- [ ] Stories to be defined

---

## Epic 4: File Processing & Data Acquisition

**Status: Not Started**
Stories not yet scoped. Expected scope: multi-source file integration, automated imports, file monitoring, error handling.

- [ ] Stories to be defined

---

## Epic 5: Portfolio Analytics & Risk Metrics

**Status: Not Started**
Stories not yet scoped. Expected scope: index prices, risk metrics (duration, YTM), volatility, credit ratings, custom holdings.

- [ ] Stories to be defined

---

## Epic 6: Multi-Level Approval Workflow & Publication

**Status: Not Started**
Stories not yet scoped. Expected scope: three-level approval, rejection workflow, Power BI integration, Excel export, commentary.

- [ ] Stories to be defined

---

## Dependency Chain

```
Epic 1 (Auth/Users)  -->  Done
  |
  v
Epic 2 (Batch Management)  -->  In Progress (6/8)
  |
  v
Epic 3 (Master Data)  -->  Not Started
  |
  v
Epic 4 (File Processing)  -->  Not Started
  |
  v
Epic 5 (Analytics/Metrics)  -->  Not Started
  |
  v
Epic 6 (Approvals/Publication)  -->  Not Started
```
