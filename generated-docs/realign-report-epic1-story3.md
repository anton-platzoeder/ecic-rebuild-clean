# REALIGN Report - Epic 1, Story 3: User Lifecycle Management

**Generated:** 2026-02-09
**Epic:** 1 - Authentication, Authorization & User Management
**Story:** 3 of 8 - User Lifecycle Management
**Target Route:** `/admin/users`
**Target File:** `app/admin/users/page.tsx`
**Story Points:** 8

---

## Executive Summary

Story 3 implements a comprehensive user administration interface for creating, editing, viewing, deactivating, and reactivating users. This REALIGN analysis identifies:

1. **Critical Issue:** Missing user management endpoints in OpenAPI spec - **BLOCKING**
2. **Available Infrastructure:** Strong auth/RBAC foundation from Stories 1-2
3. **Reusable Components:** AppHeader, RoleGate, and auth helpers ready for reuse
4. **New Impacts:** Story 3 defines user management patterns that will affect Stories 4-8

---

## 1. Current Implementation Status (Stories 1-2)

### Story 1: User Authentication (AD/LDAP) - ✅ COMPLETE

**Implemented:**
- Login page at `/login` with form validation
- JWT token storage using HttpOnly cookies (`accessToken`, `refreshToken`)
- Session management with 30-minute inactivity timeout
- API client with automatic token injection
- Auth utilities: `getCurrentUser()`, `login()`, `refreshToken()`
- Session tracking via `localStorage.lastActivityTime`
- Client-side auth helpers: `signIn()`, `signOut()`, `getUser()`

**Key Files:**
- `web/src/app/login/page.tsx` - Login UI
- `web/src/lib/api/auth.ts` - Auth API functions
- `web/src/lib/auth/session.ts` - Session timeout logic
- `web/src/lib/auth/auth-client.ts` - Client-side auth utilities

**Auth Flow:**
1. User submits credentials → `POST /auth/login`
2. Backend returns `accessToken`, `refreshToken`, `expiresIn`, `user` object
3. Frontend stores tokens as cookies
4. All API calls automatically include tokens via `client.ts`
5. Session expires after 30 minutes of inactivity

### Story 2: Role-Based Dashboard Landing - ✅ COMPLETE

**Implemented:**
- Home page dashboard at `/` (root route)
- Welcome message with `displayName` and `roles`
- Role-based content display using `AuthUser.roles[]`
- App header component with user info
- Auth check on mount (redirects to `/login` if not authenticated)
- Dashboard panels: Pending Actions, Active Batches, Recent Activity, Data Quality Alerts
- Loading states with skeleton UI
- Error handling with user-friendly messages

**Key Files:**
- `web/src/app/page.tsx` - Dashboard UI (home page)
- `web/src/components/layout/AppHeader.tsx` - Reusable header
- `web/src/components/dashboard/WorkflowProgress.tsx` - Workflow status indicator
- `web/src/lib/api/dashboard.ts` - Dashboard API functions

**Reusable Patterns:**
- Auth check pattern: `useEffect(() => { const user = await getCurrentUser(); ... })`
- Error handling: `Promise.allSettled()` for multiple API calls
- Loading states: Skeleton UI with `role="progressbar"`
- Navigation: `router.push()` for client-side routing

### RBAC Infrastructure - ✅ AVAILABLE

**Components:**
- `RoleGate` (Server Component) - Conditional rendering based on role/permission
  - Props: `allowedRoles`, `requiredPermission`, `requireAuth`, `fallback`
  - Uses: `getSession()` for server-side auth check
  - Example: `<RoleGate allowedRoles={[UserRole.Administrator]}><AdminPanel /></RoleGate>`

**Helper Functions:**
- `hasRole(user, role)` - Check if user has specific role
- `hasAnyRole(user, roles[])` - Check if user has any of specified roles
- `hasPermission(user, permission)` - Check if user has specific permission
- `hasAnyPermission(user, permissions[])` - Check if user has any permissions
- `hasAllPermissions(user, permissions[])` - Check if user has all permissions

**Available Roles (from `types/roles.ts`):**
```typescript
enum UserRole {
  OperationsLead = 'OperationsLead',
  Analyst = 'Analyst',
  ApproverL1 = 'ApproverL1',
  ApproverL2 = 'ApproverL2',
  ApproverL3 = 'ApproverL3',
  Administrator = 'Administrator',
  ReadOnly = 'ReadOnly',
}
```

**User Type (from `types/auth.ts`):**
```typescript
interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  roles: UserRole[];
  permissions: string[];
}
```

---

## 2. Discovered Impacts from Stories 1-2

### Impact 2.1: Authentication Pattern Established ✅

**Source:** Story 1 (User Authentication)
**Affects:** Story 3 (Admin page must verify authentication)
**Severity:** Medium - Required Integration

**Description:**

Story 3's admin page at `/admin/users` must verify:
1. User is authenticated (has valid session)
2. User has `Administrator` role

**Available Infrastructure:**

From Story 1, we have the auth check pattern:
```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      // User is authenticated
    } catch {
      router.push('/login');
    }
  };
  checkAuth();
}, [router]);
```

From Story 2, we have the `RoleGate` component:
```typescript
<RoleGate allowedRoles={[UserRole.Administrator]}>
  <UserAdminContent />
</RoleGate>
```

**Recommended Implementation:**

Use `RoleGate` wrapper for the entire admin page, OR use client-side check at page mount:

```typescript
// Option 1: RoleGate (Server Component)
export default async function AdminUsersPage() {
  return (
    <RoleGate
      allowedRoles={[UserRole.Administrator]}
      fallback={<AccessDenied />}
    >
      <UserAdminContent />
    </RoleGate>
  );
}

// Option 2: Client-side check (Client Component)
'use client';
export default function AdminUsersPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!hasRole(currentUser, UserRole.Administrator)) {
          router.push('/');
        }
        setUser(currentUser);
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
  }, []);

  // Render admin UI
}
```

**Action Required:** ✅ No changes needed - infrastructure ready.

---

### Impact 2.2: Cookie-Based Token Storage Pattern ✅

**Source:** Story 1 (User Authentication)
**Affects:** Story 3 (All user management API calls will use tokens)
**Severity:** Low - Informational

**Description:**

Story 1 established cookie-based token storage:
- `accessToken` cookie (expires in `expiresIn` seconds)
- `refreshToken` cookie (expires in `expiresIn * 2` seconds)

The API client (`@/lib/api/client.ts`) automatically includes these cookies in all requests.

**Impact on Story 3:**

All user management API calls will automatically include authentication tokens:
- `GET /v1/users` - List users
- `POST /v1/users` - Create user
- `PUT /v1/users/{userId}` - Update user
- `POST /v1/users/{userId}/deactivate` - Deactivate user
- etc.

**Action Required:** ✅ None - automatic via existing infrastructure.

---

### Impact 2.3: AppHeader Component Available ✅

**Source:** Story 2 (Role-Based Dashboard)
**Affects:** Story 3 (Can reuse AppHeader for consistent navigation)
**Severity:** Low - Enhancement Opportunity

**Description:**

Story 2 created `AppHeader` component that displays:
- User's `displayName`
- User's `roles` array
- Navigation menu
- Logout button

**Available Props:**
```typescript
interface AppHeaderProps {
  displayName: string;
  roles: string[];
}
```

**Recommended Usage in Story 3:**

```typescript
import { AppHeader } from '@/components/layout/AppHeader';

export default function AdminUsersPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  // ... auth check

  return (
    <>
      {user && <AppHeader displayName={user.displayName} roles={user.roles} />}
      <main className="container mx-auto px-4 py-8">
        {/* User admin content */}
      </main>
    </>
  );
}
```

**Action Required:** ✅ Optional - improves consistency.

---

### Impact 2.4: Review Findings from Story 2 ⚠️ INFORMATIONAL

**Source:** Story 2 (Role-Based Dashboard) - Review phase
**Affects:** Story 3 (Informational - not blocking)
**Severity:** Low - Informational

**Description:**

Story 2's code review identified a HIGH issue:

**H1: API Endpoints Not in OpenAPI Spec**
- Story 2 used endpoints like `/v1/dashboard/pending-actions` that aren't in `openapi.yaml`
- OpenAPI spec has `/report-batches` (not `/batches`)
- No `/dashboard/*` endpoints defined

**Impact on Story 3:**

Story 3 will face the **same issue** - the story specifies user management endpoints that **do NOT exist in openapi.yaml**:

Story 3 specifies:
- `GET /v1/users`
- `POST /v1/users`
- `GET /v1/users/{userId}`
- `PUT /v1/users/{userId}`
- `POST /v1/users/{userId}/deactivate`
- `POST /v1/users/{userId}/reactivate`
- `GET /v1/users/{userId}/activity`
- `GET /v1/users/export`

**Current OpenAPI spec has:**
- `/auth/login`, `/auth/me`, `/auth/refresh` (from Story 1)
- `/report-batches/*` (not `/batches/*`)
- NO `/users/*` endpoints
- NO user management operations

**Action Required:** 🚨 **CRITICAL - BLOCKING**

This is a **CRITICAL issue** that must be resolved before implementing Story 3. Two options:

1. **Update OpenAPI spec** to include user management endpoints (recommended)
2. **Implement Story 3 anyway** and update spec later (risky - may cause rework)

**Recommendation:** STOP and ask the user:
- "Should I update the OpenAPI spec to include user management endpoints before implementing Story 3?"
- "Or should I proceed with implementation and update the spec later?"

---

## 3. Critical Issue: Missing User Management Endpoints in OpenAPI Spec

### 🚨 BLOCKING ISSUE

**Title:** User Management Endpoints Not Defined in OpenAPI Spec
**Severity:** CRITICAL - Blocking Story 3 implementation
**Impact:** All 8 user management endpoints required by Story 3 are missing from `documentation/openapi.yaml`

**Required Endpoints (from Story 3 specification):**

| Method | Endpoint | Purpose | Story AC |
|--------|----------|---------|----------|
| GET | `/v1/users` | Get all users with filtering | AC: View Users, Search/Filter |
| POST | `/v1/users` | Create new user | AC: Create New User |
| GET | `/v1/users/{userId}` | Get user details by ID | AC: View User Details |
| PUT | `/v1/users/{userId}` | Update user information | AC: Edit Existing User |
| POST | `/v1/users/{userId}/deactivate` | Deactivate user account | AC: Deactivate User |
| POST | `/v1/users/{userId}/reactivate` | Reactivate user account | AC: Reactivate User |
| GET | `/v1/users/{userId}/activity` | Get user activity log | AC: View User Details (Activity Log tab) |
| GET | `/v1/users/export` | Export user list to Excel | AC: Export User List |

**Current State:**

```bash
$ grep -r "/v1/users" documentation/openapi.yaml
# No results - NO user management endpoints exist
```

**Expected Request/Response Types (not defined):**

```typescript
// Missing from spec - needed for implementation
interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle?: string;
  employeeId?: string;
  manager?: string;
  roles: UserRole[];
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastLogin?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  deactivationReason?: string;
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  department: string;
  jobTitle?: string;
  employeeId?: string;
  manager?: string;
  roles: UserRole[];
  forcePasswordChange?: boolean;
  sendWelcomeEmail?: boolean;
}

interface DeactivateUserRequest {
  reason: string;
  transferPendingApprovalsTo?: string; // userId if deactivating an approver
}

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

// ... (7 more request/response types needed)
```

**Root Cause:**

The BRD (Section 7.1) clearly requires user lifecycle management with SQL Server database storage, but the OpenAPI spec was not updated to include these endpoints. This is likely an oversight from the SCOPE/STORIES phase.

**Resolution Options:**

### Option A: Update OpenAPI Spec First (RECOMMENDED) ✅

**Pros:**
- Follows "API spec as source of truth" principle (CLAUDE.md Rule #3)
- Defines request/response types before implementation (TDD approach)
- Backend team can implement endpoints in parallel
- Type-safe frontend implementation

**Cons:**
- Delays Story 3 implementation by ~30 minutes

**Steps:**
1. Update `documentation/openapi.yaml` to add:
   - `/v1/users` paths (8 endpoints)
   - `User` schema component
   - `CreateUserRequest` schema
   - `DeactivateUserRequest` schema
   - `UserListResponse` schema
   - `UserActivityLog` schema
2. Generate TypeScript types from spec
3. Proceed with Story 3 implementation

### Option B: Implement Without Spec Update (NOT RECOMMENDED) ❌

**Pros:**
- Faster short-term progress

**Cons:**
- Violates "Use the API Client" rule (CLAUDE.md Rule #3)
- Types must be manually defined (duplicates work)
- Backend team has no API contract to implement against
- May require rework if backend implements differently
- Creates technical debt

**Decision Required:** 🚨 User must choose Option A or B before proceeding.

---

## 4. New Impacts Story 3 Will Create

### Impact 4.1: User Management API Client Functions

**Affects:** Stories 4-8 (any story that needs to check user data)
**Severity:** Medium - Architectural Pattern

**Description:**

Story 3 will create a new API client module at `web/src/lib/api/users.ts` with functions like:

```typescript
export async function getUsers(filters?: UserFilters): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.role) query.set('role', filters.role);
  if (filters?.department) query.set('department', filters.department);
  if (filters?.search) query.set('search', filters.search);

  return get<UserListResponse>(`/users?${query.toString()}`);
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  return post<User>('/users', data);
}

export async function getUserById(userId: string): Promise<User> {
  return get<User>(`/users/${userId}`);
}

// ... 5 more functions
```

**Impact on Future Stories:**

These functions will be reusable for:
- Story 4: Approval Authority Configuration (need to list users by role for assignment)
- Story 6: Audit Trail Viewer (need to filter activity by user)
- Story 7: Instrument Master Data Management (need to track who created/modified records)
- Story 8: Role & Permission Management (need to list users to assign permissions)

**Action Required:** Design API client with reusability in mind.

---

### Impact 4.2: User Data Type Definitions

**Affects:** Stories 4-8 (any story referencing users)
**Severity:** Medium - Type System

**Description:**

Story 3 will define comprehensive user types in `web/src/types/user.ts`:

```typescript
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle?: string;
  employeeId?: string;
  manager?: string;
  roles: UserRole[];
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastLogin?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  deactivationReason?: string;
}
```

**Current `AuthUser` Type (from Story 1):**

```typescript
interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  roles: UserRole[];
  permissions: string[];
}
```

**Conflict:**

`AuthUser` (authentication context) vs `User` (admin management) have overlapping fields but different purposes:
- `AuthUser` - Minimal fields for authentication/authorization (currently logged-in user)
- `User` - Full profile for admin management (any user in the system)

**Resolution:**

Option 1: Keep separate types (recommended)
- `AuthUser` for `/auth/me` response
- `User` for `/users/*` responses
- `User` extends `AuthUser` with additional fields

Option 2: Merge into single type
- Replace `AuthUser` with `User`
- Update Stories 1-2 to use `User` type
- Risk: Breaking changes

**Recommendation:** Keep separate types. Future stories should use:
- `AuthUser` when checking permissions/roles of current user
- `User` when displaying/editing user profiles

**Action Required:** Document type usage in `web/src/types/README.md`.

---

### Impact 4.3: Audit Trail Pattern for User Actions

**Affects:** Stories 6, 7 (any story with audit requirements)
**Severity:** Medium - Architectural Pattern

**Description:**

Story 3's Acceptance Criteria include audit trail requirements (BR-SEC-005):

- AC: "Given I create a new user, when I check the UserActivityLog table, then a record exists with Action='user.created'"
- AC: "Given I update a user's email, when I check the audit trail via temporal tables, then I can see the before and after values"
- AC: "Given I deactivate a user, when I check the UserActivityLog table, then a record exists with Action='user.deactivated'"

**Pattern Established:**

User actions trigger audit log entries via backend:
1. Frontend calls `POST /v1/users` to create user
2. Backend inserts user record
3. Backend automatically inserts audit log entry:
   ```sql
   INSERT INTO UserActivityLog (UserId, Action, EntityType, EntityId, Timestamp)
   VALUES (@currentUserId, 'user.created', 'User', @newUserId, GETUTCDATE())
   ```
4. SQL Server temporal tables automatically track row-level changes

**Impact on Future Stories:**

Stories 6-7 will follow the same audit pattern:
- Story 6: Audit Trail Viewer - **reads** `UserActivityLog` to display actions
- Story 7: Instrument Master Data Management - **writes** audit entries for instrument CRUD

**Frontend Responsibility:**

Frontend does NOT manually log actions. Backend handles all audit logging. Frontend only:
1. Calls API endpoints
2. Displays audit data (in Story 6)

**Action Required:** ✅ No frontend changes needed - backend responsibility.

---

### Impact 4.4: Admin Navigation Pattern

**Affects:** Stories 4, 6, 8 (other admin features)
**Severity:** Low - UI Consistency

**Description:**

Story 3 introduces the first admin-only route: `/admin/users`

**Future Admin Routes:**

Based on remaining stories:
- Story 4: Approval Authority Configuration → `/admin/approval-authorities`
- Story 6: Audit Trail Viewer → `/admin/audit` or `/audit`
- Story 8: Role & Permission Management → `/admin/roles`

**Navigation Pattern:**

Option 1: Add "Admin" menu in AppHeader
```typescript
{hasRole(user, UserRole.Administrator) && (
  <DropdownMenu>
    <DropdownMenuTrigger>Admin</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => router.push('/admin/users')}>
        User Management
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => router.push('/admin/approval-authorities')}>
        Approval Authorities
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => router.push('/admin/roles')}>
        Roles & Permissions
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

Option 2: Add admin section to dashboard
```typescript
{hasRole(user, UserRole.Administrator) && (
  <Card>
    <CardHeader>Administration</CardHeader>
    <CardContent>
      <Link href="/admin/users">User Management</Link>
      <Link href="/admin/approval-authorities">Approval Authorities</Link>
    </CardContent>
  </Card>
)}
```

**Recommendation:** Defer navigation pattern to Story 4 (after we know all admin routes). For Story 3, users can access `/admin/users` directly via URL.

**Action Required:** Document admin navigation pattern in Story 4 REALIGN.

---

## 5. Story 3 Acceptance Criteria Review

### Acceptance Criteria That Need Revision: NONE ✅

All acceptance criteria in Story 3 are clear and implementable, **assuming the OpenAPI spec is updated** (see Section 3).

**Criteria Status:**

| Category | Count | Status |
|----------|-------|--------|
| Happy Path - View Users | 3 | ✅ Ready |
| Search and Filtering | 4 | ✅ Ready |
| Create New User | 5 | ✅ Ready |
| Create New User - Validation | 5 | ✅ Ready |
| Edit Existing User | 4 | ✅ Ready |
| View User Details | 4 | ✅ Ready |
| Deactivate User | 5 | ✅ Ready |
| Deactivate User - Validation | 1 | ✅ Ready |
| Reactivate User | 2 | ✅ Ready |
| Audit Trail | 3 | ✅ Ready (backend responsibility) |
| Export User List | 1 | ✅ Ready |
| Authorization Check | 1 | ✅ Ready (use RoleGate) |

**Total:** 38 acceptance criteria - all clear and testable.

---

## 6. Implementation Approach Recommendations

### 6.1. Architecture

**Page Structure:**

```
app/admin/users/
├── page.tsx                    # Main admin page (client component)
├── __tests__/
│   └── page.test.tsx          # Integration tests (38 test cases)
└── components/
    ├── UserList.tsx           # Table with search/filter
    ├── CreateUserModal.tsx    # Create user form (4 tabs)
    ├── EditUserModal.tsx      # Edit user form
    ├── UserDetailsModal.tsx   # View user details (4 tabs)
    └── DeactivateUserModal.tsx # Deactivation confirmation
```

**API Client:**

```
lib/api/users.ts               # 8 user management functions
```

**Types:**

```
types/user.ts                  # User, CreateUserRequest, etc.
```

### 6.2. Component Breakdown

**UserList Component:**
- Data table with columns: Name, Email, Username, Roles, Department, Last Login, Status
- Search input (filters by name/email/username)
- Filter dropdowns: Status (Active/Inactive), Role, Department
- Action buttons per row: View, Edit, Deactivate/Reactivate
- Export button in header
- Pagination (if needed)

**CreateUserModal Component:**
- Tabs: Basic Info, Roles & Permissions, Contact Details, Security
- Form validation using Zod (see `web/src/lib/validation/README.md`)
- Checkboxes: "Force password change on first login", "Send welcome email"
- Submit → `POST /v1/users`

**EditUserModal Component:**
- Same tab structure as CreateUserModal
- Pre-filled with current user data
- Shows "Last modified" timestamp
- Submit → `PUT /v1/users/{userId}`

**UserDetailsModal Component:**
- Tabs: Overview, Activity Log, Permissions, Audit Trail
- Overview: Read-only display of all user fields
- Activity Log: Last 30 days of user actions (from `GET /v1/users/{userId}/activity`)
- Permissions: Breakdown of permissions granted by roles
- Audit Trail: History of changes to this user record (temporal tables)

**DeactivateUserModal Component:**
- Text area: "Reason for Deactivation" (required)
- If user has ApproverL1/L2/L3 role: Dropdown to select user to transfer pending approvals to
- Confirmation button: "Confirm Deactivation"
- Submit → `POST /v1/users/{userId}/deactivate`

### 6.3. State Management

Use React `useState` for:
- `users: User[]` - List of users
- `filteredUsers: User[]` - After search/filter applied
- `selectedUser: User | null` - For modals
- `searchTerm: string`
- `filters: { status: 'active' | 'inactive', role?: UserRole, department?: string }`
- `modalState: 'create' | 'edit' | 'view' | 'deactivate' | null`
- `loading: boolean`
- `errors: Record<string, string>`

### 6.4. Testing Strategy

**38 Test Cases (matching 38 acceptance criteria):**

1-3. View Users (list display, count, row details)
4-7. Search/Filter (by name, status, role, department)
8-12. Create User (modal tabs, form submission, role assignment, security options)
13-17. Create User Validation (required fields, duplicate email/username, role requirement)
18-21. Edit User (modal pre-fill, email update, add role, remove role)
22-25. View Details (modal tabs, overview, activity log, permissions)
26-30. Deactivate User (confirmation modal, reason required, status change, login block, transfer approvals)
31. Deactivate Validation (reason required)
32-33. Reactivate User (reactivation, status change)
34-36. Audit Trail (create log, update log, deactivate log) - backend tests
37. Export (Excel download)
38. Authorization (non-admin redirect)

**Test Patterns (from Story 2):**

- Use `getByRole()`, `getByLabelText()`, `getByText()` (accessibility-first)
- Mock API responses with MSW or `vi.fn()`
- Test user-observable behavior only (not implementation)
- No error suppressions (`// @ts-ignore`, `// eslint-disable`)

### 6.5. Shadcn UI Components Needed

**Likely already installed:**
- `Button`, `Card`, `Input`, `Label`, `Badge`

**Need to install via MCP:**
- `Dialog` (for modals)
- `Table` (for user list)
- `Tabs` (for modal tabs)
- `Select` (for dropdowns)
- `Checkbox` (for role selection)
- `Textarea` (for deactivation reason)

**Installation command (via MCP):**
```
mcp__shadcn__add_component
components: ["dialog", "table", "tabs", "select", "checkbox", "textarea"]
```

---

## 7. Recommendations for Story 3

### 7.1. Before Implementation Starts

1. **🚨 CRITICAL: Resolve OpenAPI Spec Issue** (see Section 3)
   - Ask user: "Should I update the OpenAPI spec to include user management endpoints?"
   - If yes: Update `documentation/openapi.yaml` with 8 new endpoints
   - If no: Proceed with manual type definitions (not recommended)

2. **Install Required Shadcn Components**
   - Use MCP to add: `dialog`, `table`, `tabs`, `select`, `checkbox`, `textarea`

3. **Review User Type Structure**
   - Confirm `User` type extends `AuthUser` appropriately
   - Document difference between `AuthUser` (current user) vs `User` (any user)

### 7.2. During Implementation

1. **Reuse Existing Infrastructure**
   - ✅ Use `RoleGate` for admin-only access check
   - ✅ Use `AppHeader` for consistent navigation
   - ✅ Use `getCurrentUser()` for auth check pattern
   - ✅ Use `hasRole()` helper for authorization logic

2. **Follow Established Patterns**
   - ✅ API client functions in `lib/api/users.ts`
   - ✅ Use `Promise.allSettled()` for multiple API calls (error resilience)
   - ✅ Loading states with skeleton UI
   - ✅ Error handling with user-friendly messages
   - ✅ No error suppressions

3. **Test Quality**
   - ✅ Write 38 tests (1 per acceptance criterion)
   - ✅ Use accessibility-first queries (`getByRole`, `getByLabelText`)
   - ✅ Test user-observable behavior only
   - ✅ Ensure `npm run test:quality` passes

### 7.3. After Implementation

1. **Document New Patterns**
   - Update `web/src/lib/api/README.md` with user management examples
   - Update `web/src/types/README.md` with `User` vs `AuthUser` usage

2. **Update Discovered Impacts**
   - Add entry to `generated-docs/discovered-impacts.md` if any cross-story impacts found

3. **Prepare for Story 4**
   - Export reusable user selection components (for approval authority assignment)
   - Document admin navigation pattern for future admin routes

---

## 8. Summary and Next Steps

### ✅ Ready to Proceed (with caveat)

**Green Flags:**
- Strong auth/RBAC foundation from Stories 1-2
- Reusable components available (AppHeader, RoleGate)
- Clear acceptance criteria (38 ACs)
- Established patterns for auth checks, error handling, API calls

**🚨 BLOCKING ISSUE:**
- User management endpoints missing from OpenAPI spec
- Must resolve before implementation

**Recommended Next Steps:**

1. **STOP** - Do not proceed to SPECIFY phase yet
2. **Ask user** to choose resolution path (Option A or B from Section 3)
3. **If Option A chosen:**
   - Update `documentation/openapi.yaml` with 8 user management endpoints
   - Generate TypeScript types from spec
   - Proceed to SPECIFY phase
4. **If Option B chosen:**
   - Define types manually in `web/src/types/user.ts`
   - Proceed to SPECIFY phase (with risk of rework)

---

## 9. Appendix: Missing OpenAPI Endpoints (Detailed)

### Endpoint 1: GET /v1/users

**Purpose:** Get all users with optional filtering

**Query Parameters:**
- `status` (optional): `active` | `inactive`
- `role` (optional): `UserRole` enum value
- `department` (optional): string
- `search` (optional): string (searches name, email, username)
- `page` (optional): number (default: 1)
- `pageSize` (optional): number (default: 50)

**Response 200:**
```json
{
  "users": [
    {
      "id": "user-123",
      "username": "jsmith",
      "displayName": "John Smith",
      "email": "jsmith@company.com",
      "firstName": "John",
      "lastName": "Smith",
      "department": "Operations",
      "jobTitle": "Portfolio Analyst",
      "roles": ["Analyst"],
      "permissions": ["portfolios.view", "instruments.edit"],
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00Z",
      "createdBy": "admin-001",
      "lastLogin": "2026-02-09T08:00:00Z"
    }
  ],
  "total": 24,
  "page": 1,
  "pageSize": 50
}
```

### Endpoint 2: POST /v1/users

**Purpose:** Create new user

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "jsmith@company.com",
  "username": "jsmith",
  "department": "Operations",
  "jobTitle": "Portfolio Analyst",
  "employeeId": "EMP-12345",
  "manager": "Sarah Johnson",
  "roles": ["Analyst"],
  "forcePasswordChange": true,
  "sendWelcomeEmail": true
}
```

**Response 201:**
```json
{
  "id": "user-123",
  "username": "jsmith",
  "displayName": "John Smith",
  "email": "jsmith@company.com",
  "firstName": "John",
  "lastName": "Smith",
  "department": "Operations",
  "jobTitle": "Portfolio Analyst",
  "employeeId": "EMP-12345",
  "manager": "Sarah Johnson",
  "roles": ["Analyst"],
  "permissions": ["portfolios.view", "instruments.edit"],
  "isActive": true,
  "createdAt": "2026-02-09T10:00:00Z",
  "createdBy": "admin-001"
}
```

**Error 400:** Validation error
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Email address already in use" }
  ]
}
```

### Endpoint 3: GET /v1/users/{userId}

**Purpose:** Get user details by ID

**Response 200:** (Same as POST response above)

**Error 404:**
```json
{
  "error": "User not found",
  "userId": "user-999"
}
```

### Endpoint 4: PUT /v1/users/{userId}

**Purpose:** Update user information

**Request Body:** (Same as POST, all fields optional except roles)

**Response 200:** (Same as POST response)

**Error 400:** Validation error (duplicate email/username)

### Endpoint 5: POST /v1/users/{userId}/deactivate

**Purpose:** Deactivate user account

**Request Body:**
```json
{
  "reason": "Left company for new opportunity",
  "transferPendingApprovalsTo": "user-456" // Required if user is an approver
}
```

**Response 200:**
```json
{
  "id": "user-123",
  "username": "jsmith",
  "displayName": "John Smith",
  "isActive": false,
  "deactivatedAt": "2026-02-09T10:00:00Z",
  "deactivatedBy": "admin-001",
  "deactivationReason": "Left company for new opportunity"
}
```

**Error 400:** Missing reason or transfer user
```json
{
  "error": "Deactivation reason is required for audit trail"
}
```

### Endpoint 6: POST /v1/users/{userId}/reactivate

**Purpose:** Reactivate deactivated user

**Request Body:** (none)

**Response 200:**
```json
{
  "id": "user-123",
  "username": "jsmith",
  "displayName": "John Smith",
  "isActive": true,
  "reactivatedAt": "2026-02-09T11:00:00Z",
  "reactivatedBy": "admin-001"
}
```

### Endpoint 7: GET /v1/users/{userId}/activity

**Purpose:** Get user activity log (last 30 days)

**Response 200:**
```json
{
  "userId": "user-123",
  "activities": [
    {
      "id": "act-001",
      "action": "batch.approved",
      "entityType": "ReportBatch",
      "entityId": "batch-456",
      "timestamp": "2026-02-09T09:00:00Z",
      "details": {
        "reportDate": "2026-01-31",
        "approvalLevel": "L1"
      }
    }
  ],
  "total": 45
}
```

### Endpoint 8: GET /v1/users/export

**Purpose:** Export user list to Excel

**Query Parameters:** (Same as GET /v1/users)

**Response 200:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="users-2026-02-09.xlsx"`
- Body: Binary Excel file

---

**End of REALIGN Report**
