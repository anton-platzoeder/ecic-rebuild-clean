# Discovered Impacts

This file tracks cross-story impacts discovered during implementation.

**Last Updated:** 2026-02-17

---

## Active Impacts

### Impact 3.1 (Medium): Approval Transfer on Deactivation
**Source:** Epic 1 Story 3 - User Lifecycle Management
**Affected Area:** `web/src/app/admin/users/users-client.tsx` - Deactivate modal

When deactivating a user with an Approver role, the UI should show a dropdown to select another user to transfer pending approvals to. The API already supports `transferApprovalsTo` parameter in `DeactivateUserRequest` (see `web/src/lib/api/users.ts`), but the UI does not present this option.

### Impact 3.2 (Low): Table Caption for Accessibility
**Source:** Epic 1 Story 3 - User Lifecycle Management
**Affected Area:** `web/src/app/admin/users/users-client.tsx` - User table

The user data table should include a `<caption>` element for screen reader users to understand the table's purpose.

---

## Previous Impacts (Resolved)

- Story 2 impacts (route mismatch, auth check, cookie storage): Resolved during Story 2 implementation
- Story 3 Impact 3.1 (Missing API endpoints): False positive - endpoints already existed in OpenAPI spec. Added missing `/users/export` endpoint, `DeactivateUserRequest` schema with reason field, expanded `UserDetail` schema, and added department/role filter parameters.
- Story 4 Impact 4.1 (Effective Date & Reason fields): Resolved - OpenAPI spec updated to add `effectiveDate` (optional date) and `reason` (required string) fields to `PUT /users/{id}/roles` endpoint. Story 4 acceptance criteria now fully supported by API.
- Story 4 Impact 4.2 (Approval Authority Config tab): Resolved - Story 4 scoped to 2 tabs (Role Definitions, User Role Assignments). Approval Authority Config is handled by Story 5.

---

## Instructions

When processing impacts:
1. Read this file before implementing each story (REALIGN phase)
2. Check if any impacts affect the current story
3. Propose story revisions if needed
4. Remove impacts from this file after processing
