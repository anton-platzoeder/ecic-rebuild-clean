# REALIGN Report - Epic 1, Story 4
## Role Assignment & Permission Management

**Date:** 2026-02-09
**Story File:** `generated-docs/stories/epic-1-authentication-authorization-user-management/story-4-role-assignment-permission-management.md`
**Target Route:** `/admin/roles`
**Target File:** `app/admin/roles/page.tsx`

---

## Executive Summary

Story 4 builds a comprehensive Role & Permission Management screen for administrators. After analyzing the existing codebase from Stories 1-3, significant reusable infrastructure exists. However, **3 critical gaps** were identified:

1. **Missing API endpoints** - The story references endpoints not in the OpenAPI spec
2. **Missing TypeScript types** - Need `Permission`, `RoleWithPermissions`, and role assignment types
3. **New API client functions** - Need role-specific API wrappers

**Recommendation:** Proceed with Story 4 after addressing the missing API endpoints in the OpenAPI specification.

---

## Part 1: Reusable Infrastructure from Stories 1-3

### 1.1 Authentication & Authorization (Story 1)

**Available:**
- ✅ `lib/auth/auth-server.ts` - Server-side session retrieval via `getSession()`
- ✅ `lib/auth/auth-client.ts` - Client-side current user via `getCurrentUser()`
- ✅ `lib/auth/auth-helpers.ts` - Role checking utilities (`hasRole`, `hasAnyRole`, `hasPermission`)
- ✅ `lib/auth/session.ts` - Session management
- ✅ JWT token in httpOnly cookie (Authorization header auto-added by API client)

**Story 4 can reuse:**
- Admin authorization check pattern from Story 3 (`if (!user.roles.includes('Administrator'))`)
- `getCurrentUser()` to identify who is making role changes (for `lastChangedUser` audit header)

### 1.2 Admin Page Layout (Story 3)

**Available:**
- ✅ `app/admin/users/page.tsx` - Comprehensive admin page with:
  - Authorization check and redirect pattern
  - Search/filter UI patterns
  - Multi-tab modal dialogs
  - Error handling and loading states
  - Success/error message display
  - Export functionality

**Story 4 can reuse:**
- Page layout structure (header with title + action buttons)
- Authorization check pattern (check admin role on mount, redirect if unauthorized)
- Error/loading state management patterns
- Modal dialog patterns (create, edit, view)

### 1.3 API Client Infrastructure (Stories 1-3)

**Available:**
- ✅ `lib/api/client.ts` - Base API client with:
  - `get()`, `post()`, `put()`, `del()` convenience methods
  - Automatic JWT token injection from cookie
  - `lastChangedUser` header support for audit trails
  - Error handling with APIError types
  - Binary response support (for exports)

**Story 4 can reuse:**
- All HTTP method wrappers
- Audit header pattern (`lastChangedUser` parameter)
- Error handling patterns

### 1.4 TypeScript Types (Stories 1-3)

**Available:**
- ✅ `types/roles.ts` - `UserRole` enum with all 7 system roles
- ✅ `types/auth.ts` - `AuthUser` interface with roles and permissions
- ✅ `lib/api/users.ts` - `Role` interface (id, name, description, isSystemRole)
- ✅ `lib/api/users.ts` - `UserDetail` interface with roles array
- ✅ `lib/api/users.ts` - `UpdateUserRolesRequest` interface

**Story 4 can reuse:**
- `Role` type for basic role information
- `UserDetail` type when displaying user assignments
- Existing role enum for type safety

### 1.5 UI Components (Shadcn UI)

**Available:**
- ✅ `components/ui/dialog.tsx` - Modal dialogs
- ✅ `components/ui/tabs.tsx` - Tab navigation
- ✅ `components/ui/table.tsx` - Data tables
- ✅ `components/ui/button.tsx` - Buttons
- ✅ `components/ui/input.tsx` - Text inputs
- ✅ `components/ui/label.tsx` - Form labels
- ✅ `components/ui/select.tsx` - Dropdowns
- ✅ `components/ui/checkbox.tsx` - Checkboxes
- ✅ `components/ui/badge.tsx` - Status badges
- ✅ `components/RoleGate.tsx` - Server-side role-based rendering

**Story 4 can reuse:**
- All Shadcn UI components from Story 3 admin page
- Tab navigation for Role Definitions / User Role Assignments / Approval Authority Config
- Modal dialogs for View Permissions, View Assigned Users, Modify User Roles
- Table for displaying users with role assignments

### 1.6 Utility Functions

**Available:**
- ✅ `formatRoleName()` function from `app/admin/users/page.tsx` - Converts "OperationsLead" to "Operations Lead"

**Story 4 can reuse:**
- Role name formatting for display purposes

---

## Part 2: New Infrastructure Needed for Story 4

### 2.1 Missing API Endpoints ⚠️ CRITICAL

**Story 4 references these endpoints:**
- ❌ `GET /v1/roles/{roleId}/users` - Get users assigned to a specific role
- ❌ `GET /v1/roles/{roleId}/permissions` - Get detailed permissions for a role
- ❌ `POST /v1/users/{userId}/roles` - Assign roles to a user (with effective date, reason)
- ❌ `DELETE /v1/users/{userId}/roles/{roleId}` - Remove role from a user

**OpenAPI spec actually has:**
- ✅ `GET /v1/roles` - List all roles with permissions (returns `RoleWithPermissions[]`)
- ✅ `GET /v1/roles/{id}` - Get role details with permissions (returns `RoleWithPermissions`)
- ✅ `PUT /v1/users/{id}/roles` - Update user roles (REPLACES all roles, not individual add/remove)
- ❌ `GET /v1/permissions` - List all permissions (exists but Story 4 doesn't reference it)

**Recommendation:**
The existing endpoints can be adapted:
1. **Get users for a role**: Use `GET /v1/users?roleId={roleId}` (already exists from Story 3)
2. **Get role permissions**: Use `GET /v1/roles/{id}` which returns `RoleWithPermissions`
3. **Assign/remove roles**: Use `PUT /v1/users/{id}/roles` with `roleIds` array (existing endpoint)

**However, Story 4 acceptance criteria mention:**
- "Effective Date" field when assigning roles
- "Reason for Change" field (required for audit)

**The existing `PUT /v1/users/{id}/roles` endpoint only accepts `roleIds` array.** It does NOT support effective dates or reasons.

**ACTION REQUIRED:**
Either:
1. **Update the OpenAPI spec** to add `effectiveDate` and `reason` fields to the role assignment endpoint
2. **Update Story 4** to remove effective date/reason requirements and use the existing endpoint as-is

For now, I'll note this as a **discovered impact** that needs user decision.

### 2.2 Missing TypeScript Types

**Need to create:**
1. **`Permission` interface** (for detailed permission breakdown)
   ```typescript
   interface Permission {
     id: number;
     name: string;
     description: string | null;
     category: string; // "Batch Management", "File Operations", etc.
   }
   ```

2. **`RoleWithPermissions` interface** (role + permissions array)
   ```typescript
   interface RoleWithPermissions extends Role {
     permissions: Permission[];
   }
   ```

3. **`AssignRoleRequest` interface** (if we extend the API to support effective date/reason)
   ```typescript
   interface AssignRoleRequest {
     roleIds: number[];
     effectiveDate?: string; // ISO date
     reason: string; // Required for audit
   }
   ```

**Location:** Add to `web/src/lib/api/roles.ts` (new file) or extend `web/src/lib/api/users.ts`

### 2.3 New API Client Functions

**Need to create in `web/src/lib/api/roles.ts`:**
1. `getRoleWithPermissions(roleId: number): Promise<RoleWithPermissions>` - Get role details with permissions
2. `getUsersWithRole(roleId: number): Promise<UserDetail[]>` - Get users assigned to a role
3. `assignUserRoles(userId: number, data: AssignRoleRequest, lastChangedUser: string): Promise<Role[]>` - Assign roles with effective date/reason (IF API is updated)

**Note:** Functions 1 and 2 can be implemented with existing OpenAPI endpoints. Function 3 requires API spec update.

### 2.4 New Validation Schema

**Need to create in `web/src/lib/validation/schemas.ts`:**
```typescript
export const assignRolesSchema = z.object({
  roleIds: z.array(z.number()).min(1, 'At least one role must be assigned'),
  effectiveDate: z.string().optional(),
  reason: z.string().min(5, 'Reason for change is required for audit trail'),
});
```

**Usage:** Validate role assignment form before API call.

### 2.5 Segregation of Duties Logic

**Story 4 acceptance criteria mention:**
- Warning modal when assigning both "Operations Lead" and "Approver Level 1"
- Two options: "Allow with System Check" or "Restrict to Single Role"

**Implementation approach:**
1. **Client-side validation** - Check for conflicting role combinations before API call
2. **Define conflicting role pairs:**
   ```typescript
   const CONFLICTING_ROLE_PAIRS = [
     ['OperationsLead', 'ApproverL1'],
     ['OperationsLead', 'ApproverL2'],
     ['OperationsLead', 'ApproverL3'],
   ];
   ```
3. **Show warning modal** if conflict detected
4. **Backend enforcement** - The actual "cannot approve own work" rule is enforced at approval time (BR-SEC-003), not at role assignment time

**Location:** Create utility function `checkSegregationOfDuties(roleIds: number[]): ConflictInfo | null` in `web/src/lib/utils/role-validation.ts`

### 2.6 Permission Category Mapping

**Story 4 shows permissions grouped by category:**
- Batch Management
- File Operations
- Master Data
- Validation & Calculations
- Workflow
- Reporting

**Need to create:**
- Utility function to group permissions by category
- Display component for permission breakdown

**Location:** `web/src/lib/utils/permission-utils.ts`

---

## Part 3: Discovered Impacts & Story Adjustments

### Impact 4.1: Effective Date & Reason Fields Not Supported by API ⚠️

**Description:**
Story 4 acceptance criteria include:
- "Given I am in the Modify User Roles modal, when I check '[✓] Analyst' role, enter Effective Date '2026-01-06', Reason 'Promotion to team lead role', and click '[Save Role Changes]', then the role is assigned effective on that date"
- "Given I am in the Modify User Roles modal, when I leave the 'Reason for Change' field empty and click '[Save Role Changes]', then I see the error message 'Reason for change is required for audit trail'"

**Current API endpoint:**
```yaml
PUT /users/{id}/roles
requestBody:
  schema:
    type: object
    properties:
      roleIds:
        type: array
        items:
          type: integer
```

The API **does not support** `effectiveDate` or `reason` fields.

**Options:**
1. **Update OpenAPI spec** to add these fields to `PUT /v1/users/{id}/roles` endpoint
2. **Update Story 4** to remove effective date/reason requirements (simplify to just role selection)
3. **Use audit headers** - Store reason in `LastChangedUser-Reason` custom header

**Recommendation:**
Option 3 (audit header) is the cleanest for MVP. The reason can be logged in the audit trail via the `LastChangedUser-Reason` header, and effective dates can be a future enhancement.

**Proposed Story Revision:**
- Remove "Effective Date" field from Modify User Roles modal
- Keep "Reason for Change" field but pass it via custom header instead of request body
- Update acceptance criteria to remove effective date validation

### Impact 4.2: Approval Authority Config Tab Not Defined

**Description:**
Story 4 acceptance criteria mention "three tabs: Role Definitions, User Role Assignments, Approval Authority Config" but only the first two tabs have detailed acceptance criteria.

The OpenAPI spec has `/approval-authorities` endpoints, but Story 4 doesn't define what this tab should do.

**Recommendation:**
Approval Authority Config should be a **separate story** (likely Story 5 or 6 in Epic 1). For Story 4:
- Show only 2 tabs: "Role Definitions" and "User Role Assignments"
- Update acceptance criteria to remove references to third tab
- Create placeholder tab that shows "Coming soon" or remove entirely

**Proposed Story Revision:**
- Change "three tabs" to "two tabs"
- Remove Approval Authority Config tab from Story 4 scope

### Impact 4.3: Role Assignment Uses Replace-All Pattern

**Description:**
Story 4 acceptance criteria say:
- "Given I am modifying user roles, when I check '[✓] Analyst' role... then the role is assigned"
- "Given I am modifying user roles, when I uncheck a currently assigned role... then the role is removed"

This implies individual add/remove operations. However, the API uses a **replace-all** pattern (`PUT /users/{id}/roles` with full `roleIds` array).

**Impact:**
The UI must:
1. Load current roles (`GET /users/{id}/roles`)
2. Present checkboxes with current roles checked
3. User modifies checkboxes
4. Submit ALL selected role IDs to API (not just added/removed)

**No story revision needed** - this is an implementation detail. The acceptance criteria can be satisfied with the replace-all API pattern.

---

## Part 4: Implementation Recommendations

### 4.1 File Structure

```
web/src/
├── app/admin/roles/
│   ├── page.tsx                    # Main Role & Permission Management page (NEW)
│   └── __tests__/
│       └── page.test.tsx           # Integration tests (NEW)
├── lib/api/
│   └── roles.ts                    # Role API functions (NEW)
├── lib/utils/
│   ├── role-validation.ts          # Segregation of duties checks (NEW)
│   └── permission-utils.ts         # Permission grouping utilities (NEW)
└── types/
    └── permissions.ts              # Permission and RoleWithPermissions types (NEW)
```

### 4.2 Component Structure

**Main page (`app/admin/roles/page.tsx`):**
- Client component (needs state management)
- Two tabs: Role Definitions, User Role Assignments
- Authorization check (Administrator role required)
- Modals: View Permissions, View Assigned Users, Modify User Roles, Segregation of Duties Warning

**Reuse from Story 3:**
- Page layout structure
- Modal dialog patterns
- Table display
- Search/filter UI
- Error handling

### 4.3 Data Flow

**Role Definitions Tab:**
1. Load roles: `GET /v1/roles` → `RoleWithPermissions[]`
2. Display 7 system roles with user counts
3. View Permissions: Show `role.permissions` grouped by category
4. View Assigned Users: `GET /v1/users?roleId={roleId}` → `UserDetail[]`

**User Role Assignments Tab:**
1. Load users: `GET /v1/users` → `UserList`
2. Search/filter by name, role
3. Modify Roles:
   - Load current roles: `GET /v1/users/{userId}/roles`
   - Show checkboxes (current roles checked)
   - On save: Check for conflicts → Show warning if needed → `PUT /v1/users/{userId}/roles`
4. Audit trail: Logged by backend via temporal tables

### 4.4 Segregation of Duties Implementation

**Client-side warning only** - backend enforces at approval time:
1. User selects roles in Modify User Roles modal
2. On "Save Role Changes", check for conflicts:
   ```typescript
   const hasConflict = selectedRoles.includes('OperationsLead') &&
     (selectedRoles.includes('ApproverL1') ||
      selectedRoles.includes('ApproverL2') ||
      selectedRoles.includes('ApproverL3'));
   ```
3. If conflict: Show warning modal with two options:
   - "Allow with System Check" → Proceed with API call + note in audit
   - "Restrict to Single Role" → Cancel and return to role selection
4. Backend enforces "cannot approve own work" at approval time (separate logic)

### 4.5 Testing Strategy

**Integration tests must cover:**
1. Admin authorization check
2. Role list display (7 system roles)
3. View Permissions modal with category grouping
4. View Assigned Users modal
5. Search/filter on User Role Assignments tab
6. Modify User Roles modal (check/uncheck roles)
7. Segregation of duties warning modal
8. Validation: "At least one role must be assigned"
9. Validation: "Reason for change is required"
10. API error handling

**Follow Story 3 test patterns:**
- Mock API calls with `mockResolvedValue`
- Mock `getCurrentUser()` for auth
- Use `waitFor` for async state updates
- Query by role/label (accessibility-first)

---

## Part 5: Dependency Analysis

### 5.1 Story Dependencies

**Story 4 depends on:**
- ✅ Story 1 (User Authentication) - Required for admin authentication
- ✅ Story 3 (User Lifecycle Management) - Required for users to exist and role assignment patterns

**No blocking dependencies.** Stories 1 and 3 are complete.

### 5.2 External Dependencies

**OpenAPI Specification:**
- ⚠️ May need updates for effective date/reason fields (see Impact 4.1)

**Database Schema:**
- ✅ `Role` table exists (7 system roles)
- ✅ `Permission` table exists (38 permissions)
- ✅ `RolePermission` junction table exists
- ✅ `UserRole` junction table exists with audit fields

**Backend Implementation:**
- ⚠️ Ensure role assignment endpoint supports `LastChangedUser-Reason` header for audit

---

## Part 6: Risk Assessment

### 6.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API endpoint mismatch | Medium | High | Clarify with user: use existing endpoints or update spec |
| Effective date not supported | High | Medium | Use audit header for reason, defer effective dates to future |
| Permission category mapping missing | Low | Low | Hardcode categories based on BRD permission list |
| Segregation of duties edge cases | Medium | Medium | Define clear conflict rules upfront, document in code |

### 6.2 User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Too many tabs (3) for MVP | Low | Low | Reduce to 2 tabs, defer Approval Authority Config |
| Complex permission breakdown | Medium | Low | Group by category, use collapsible sections |
| Effective date confusion | Medium | Medium | Remove from MVP, add in future story |

---

## Part 7: Action Items Before SPECIFY Phase

### Required Actions

1. **User Decision Required:**
   - Should we update the OpenAPI spec to add `effectiveDate` and `reason` fields to `PUT /v1/users/{id}/roles`?
   - OR should we simplify Story 4 to use the existing replace-all endpoint and pass reason via custom header?

2. **Story Revisions:**
   - Remove "Approval Authority Config" tab from Story 4 (defer to separate story)
   - Update acceptance criteria based on API endpoint decision

3. **OpenAPI Spec Updates (if needed):**
   - Add missing fields to role assignment endpoint
   - OR document that existing endpoints will be used

### Optional Actions

1. Create `web/src/lib/api/roles.ts` stub before TDD phase
2. Define segregation of duties conflict rules in design doc
3. Map permissions to categories (reference BRD BR-SEC-002)

---

## Part 8: Recommended Implementation Approach

### Phase 1: API Client & Types (SPECIFY)
1. Define TypeScript types: `Permission`, `RoleWithPermissions`
2. Create `lib/api/roles.ts` with role API functions
3. Write tests for API functions

### Phase 2: Role Definitions Tab (IMPLEMENT)
1. Create page skeleton with authorization check
2. Implement role list display
3. Implement View Permissions modal
4. Implement View Assigned Users modal

### Phase 3: User Role Assignments Tab (IMPLEMENT)
1. Implement user list with search/filter
2. Implement Modify User Roles modal
3. Implement segregation of duties warning
4. Implement validation

### Phase 4: Integration & Testing (VERIFY)
1. Integration tests for all user flows
2. Error handling tests
3. Authorization tests
4. Quality gates

---

## Conclusion

**Story 4 is ready to proceed** with the following conditions:

1. **User decides** on API endpoint approach (effective date/reason fields)
2. **Story revised** to remove Approval Authority Config tab
3. **Missing types and API functions** will be created during SPECIFY phase

**Reusable infrastructure:** ~70% of UI patterns, auth checks, and API client code can be reused from Stories 1-3.

**New infrastructure needed:** Role-specific API functions, permission types, segregation of duties logic.

**Estimated implementation complexity:** Story points accurate (8) - multi-tab UI, complex validation, role conflict logic, comprehensive audit trail.

**No discovered impacts requiring immediate story revision.** Proceed to SPECIFY phase.
