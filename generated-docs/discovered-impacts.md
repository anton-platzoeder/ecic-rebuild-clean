# Discovered Impacts

This file tracks cross-story impacts discovered during implementation.

**Last Updated:** 2026-02-09

---

## Epic 1, Story 3: User Lifecycle Management

### Impact 3.1: Missing User Management Endpoints in OpenAPI Spec

**Discovered During:** REALIGN phase (Story 3)
**Source:** N/A - Gap in initial API design
**Affects:** Epic 1, Story 3 (User Lifecycle Management)
**Severity:** CRITICAL - Blocking
**Type:** API Specification Gap

**Description:**

Story 3 requires 8 user management endpoints that do not exist in `documentation/openapi.yaml`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/users` | Get all users with filtering |
| POST | `/v1/users` | Create new user |
| GET | `/v1/users/{userId}` | Get user details by ID |
| PUT | `/v1/users/{userId}` | Update user information |
| POST | `/v1/users/{userId}/deactivate` | Deactivate user account |
| POST | `/v1/users/{userId}/reactivate` | Reactivate user account |
| GET | `/v1/users/{userId}/activity` | Get user activity log |
| GET | `/v1/users/export` | Export user list to Excel |

**Current State:**

The OpenAPI spec (`documentation/openapi.yaml`) includes only authentication endpoints:
- `/auth/login`
- `/auth/me`
- `/auth/refresh`

It does NOT include user management CRUD operations.

**Impact:**

Story 3 cannot proceed to implementation without:
1. Defined request/response types for user management
2. API contract for backend team to implement against
3. TypeScript types generated from OpenAPI spec

**Resolution Options:**

**Option A: Update OpenAPI Spec First (RECOMMENDED)**

1. Add 8 user management endpoints to `documentation/openapi.yaml`
2. Define schemas:
   - `User` component
   - `CreateUserRequest` component
   - `DeactivateUserRequest` component
   - `UserListResponse` component
   - `UserActivityLog` component
3. Generate TypeScript types from spec
4. Proceed with Story 3 implementation

**Option B: Implement Without Spec Update (NOT RECOMMENDED)**

1. Manually define types in `web/src/types/user.ts`
2. Implement Story 3 with manual types
3. Update spec later (risk of rework if types don't match backend)

**Recommendation:** Choose Option A - update the OpenAPI spec before implementing Story 3.

**Detailed Endpoint Specifications:** See Section 9 of `generated-docs/realign-report-epic1-story3.md`

**Action Required:**

User must choose Option A or Option B before proceeding to SPECIFY phase.

---

## Instructions

When processing impacts:
1. Read this file before implementing each story (REALIGN phase)
2. Check if any impacts affect the current story
3. Propose story revisions if needed
4. Remove impacts from this file after processing
