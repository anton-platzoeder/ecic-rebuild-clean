# Discovered Impacts

This file tracks cross-story impacts discovered during implementation.

**Last Updated:** 2026-02-09

---

## Impact 4.1: Effective Date & Reason Fields Not Supported by API (Story 4)

**Discovered During:** REALIGN phase for Epic 1, Story 4 (Role Assignment & Permission Management)
**Affects:** Story 4 acceptance criteria
**Severity:** Medium - Requires user decision

**Description:**
Story 4 acceptance criteria include:
- "Given I am in the Modify User Roles modal, when I check '[✓] Analyst' role, enter Effective Date '2026-01-06', Reason 'Promotion to team lead role', and click '[Save Role Changes]', then the role is assigned effective on that date"
- "Given I am in the Modify User Roles modal, when I leave the 'Reason for Change' field empty and click '[Save Role Changes]', then I see the error message 'Reason for change is required for audit trail'"

**Current API endpoint:**
```yaml
PUT /users/{id}/roles
requestBody:
  schema:
    properties:
      roleIds: array of integers
```

The API **does not support** `effectiveDate` or `reason` fields in the request body.

**Options:**
1. **Update OpenAPI spec** to add `effectiveDate` and `reason` fields to `PUT /v1/users/{id}/roles` endpoint
2. **Simplify Story 4** to remove effective date/reason requirements (just role selection)
3. **Use audit headers** - Store reason in `LastChangedUser-Reason` custom header, defer effective dates to future

**Recommendation:** Option 3 (audit header) for MVP. Reason can be logged via custom header, effective dates can be future enhancement.

**Proposed Story Revision:**
- Remove "Effective Date" field from Modify User Roles modal
- Keep "Reason for Change" field but pass it via `LastChangedUser-Reason` header instead of request body
- Update acceptance criteria to remove effective date validation
- Update API client to support custom reason header

**Status:** Pending user decision

---

## Impact 4.2: Approval Authority Config Tab Not Defined (Story 4)

**Discovered During:** REALIGN phase for Epic 1, Story 4
**Affects:** Story 4 scope and acceptance criteria
**Severity:** Low - Scope clarification

**Description:**
Story 4 acceptance criteria mention "three tabs: Role Definitions, User Role Assignments, Approval Authority Config" but only the first two tabs have detailed acceptance criteria.

The OpenAPI spec has `/approval-authorities` endpoints, but Story 4 doesn't define what this tab should do.

**Recommendation:**
Approval Authority Config should be a **separate story** (likely Story 5 or 6 in Epic 1). For Story 4:
- Show only 2 tabs: "Role Definitions" and "User Role Assignments"
- Remove Approval Authority Config from Story 4 scope

**Proposed Story Revision:**
- Change "three tabs" to "two tabs"
- Remove all references to Approval Authority Config tab from Story 4
- Create new story for Approval Authority Config if needed

**Status:** Pending user approval

---

## Previous Impacts (Resolved)

- Story 2 impacts (route mismatch, auth check, cookie storage): Resolved during Story 2 implementation
- Story 3 Impact 3.1 (Missing API endpoints): False positive - endpoints already existed in OpenAPI spec. Added missing `/users/export` endpoint, `DeactivateUserRequest` schema with reason field, expanded `UserDetail` schema, and added department/role filter parameters.

---

## Instructions

When processing impacts:
1. Read this file before implementing each story (REALIGN phase)
2. Check if any impacts affect the current story
3. Propose story revisions if needed
4. Remove impacts from this file after processing
