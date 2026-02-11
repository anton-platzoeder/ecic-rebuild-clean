# REALIGN Report: Epic 1, Story 7
## Session Management & Authorization Checks

**Date:** 2026-02-10
**Current Phase:** REALIGN
**Epic:** 1 - Authentication, Authorization & User Management
**Story:** 7 of 8

---

## Executive Summary

Story 7 requires comprehensive session management and authorization middleware infrastructure. Analysis shows that **Stories 1-6 have established foundational auth infrastructure**, but several critical session management and state-based authorization features are **NOT yet implemented**.

**Key Findings:**
- ✅ **Basic session creation exists** (Story 1) - JWT tokens stored in httpOnly cookies
- ✅ **Client-side session timeout exists** (30 minutes, localStorage-based)
- ✅ **Basic middleware exists** - authentication check, route protection
- ✅ **Permission utility functions exist** - `hasPermission`, `hasRole`, `hasAnyRole`
- ❌ **Session refresh endpoint NOT called** - no automatic token refresh
- ❌ **State-based access control NOT implemented** - no batch state awareness
- ❌ **Segregation of duties NOT enforced** - no batch creator checks
- ❌ **CSRF protection NOT implemented** - no CSRF tokens
- ❌ **Security headers NOT set** - no X-Frame-Options, X-Content-Type-Options, etc.
- ⚠️ **API spec gaps identified** - 3 critical endpoints missing

---

## 1. What Already Exists from Stories 1-6

### 1.1 Session Infrastructure (Story 1)
**File:** `web/src/lib/auth/session.ts`

**Implemented:**
- ✅ Client-side session timeout (30 minutes via `SESSION_TIMEOUT_MS`)
- ✅ Activity tracking (mousemove, keydown, click)
- ✅ `isSessionExpired()` - checks localStorage for inactivity
- ✅ `resetSessionTimeout()` - updates lastActivityTime
- ✅ `logout()` - clears cookies and localStorage
- ✅ `useSession()` hook - tracks session state, activity listeners

**Limitations:**
- Uses **localStorage** for timeout tracking (not JWT expiration)
- No automatic token refresh before expiration
- No 5-minute warning toast implementation
- No backend session invalidation on logout

### 1.2 Authentication Client (Story 1)
**File:** `web/src/lib/auth/auth-client.ts`

**Implemented:**
- ✅ `signIn()` - calls `/auth/login`, stores accessToken/refreshToken in cookies
- ✅ `signOut()` - clears cookies and localStorage
- ✅ `getUser()` - calls `/auth/me` to get current user

**Limitations:**
- No call to `/auth/refresh` endpoint (exists in API spec but unused)
- Cookies set without `httpOnly` flag (client-side JS sets them - security issue)
- No CSRF token handling

### 1.3 Server-Side Auth Helpers (Stories 1-4)
**File:** `web/src/lib/auth/auth-server.ts`

**Implemented:**
- ✅ `requireAuth()` - reads accessToken cookie, decodes JWT, redirects to /login if missing
- ✅ `requirePermission(permission)` - checks user permissions, redirects to /auth/forbidden
- ✅ `requireAnyRole(roles)` - checks user roles, redirects to /auth/forbidden
- ✅ `getSession()` - returns AuthUser or null (no redirect)
- ✅ `decodeJwtPayload()` - decodes JWT payload without verification (API verifies)

**Limitations:**
- No state-based permission checks (no batch state awareness)
- No segregation of duties enforcement
- No returnUrl parameter on redirects

### 1.4 Permission Utilities (Story 4)
**File:** `web/src/lib/auth/auth-helpers.ts`

**Implemented:**
- ✅ `hasRole(user, role)` - checks if user has a specific role
- ✅ `hasAnyRole(user, roles)` - checks if user has any of the roles
- ✅ `hasPermission(user, permission)` - checks if user has a permission
- ✅ `hasAnyPermission(user, permissions)` - checks if user has any permission
- ✅ `hasAllPermissions(user, permissions)` - checks if user has all permissions

**Limitations:**
- No state-based checks - accepts only `user` and `permission`, no batch state parameter
- Multiple role permissions are cumulative (as per spec) ✅

### 1.5 Middleware (Story 2)
**File:** `web/src/middleware.ts`

**Implemented:**
- ✅ Route protection for authenticated routes (`/`, `/dashboard`, `/admin`, etc.)
- ✅ Redirect unauthenticated users to `/login`
- ✅ Redirect authenticated users away from `/login` to `/`
- ✅ Allow static assets without authentication

**Limitations:**
- No returnUrl parameter when redirecting to login
- No role-based page access (e.g., non-admins can access /admin routes until server component runs)
- No security headers (X-Frame-Options, etc.)
- No CSRF token validation

### 1.6 API Client (Stories 1-6)
**File:** `web/src/lib/api/client.ts`

**Implemented:**
- ✅ Automatic JWT token injection from accessToken cookie
- ✅ Error handling (401, 403, 404, 500)
- ✅ JSON request/response handling
- ✅ `lastChangedUser` header support (for audit trails)

**Limitations:**
- No CSRF token header injection
- No session refresh on 401 errors
- No automatic retry logic

### 1.7 Auth API Endpoints (Story 1)
**File:** `web/src/lib/api/auth.ts`

**Implemented:**
- ✅ `login(credentials)` - POST `/auth/login`
- ✅ `getCurrentUser()` - GET `/auth/me`
- ✅ `refreshToken(token)` - POST `/auth/refresh` (defined but not called anywhere)
- ✅ `logActivity(data)` - POST `/auth/activity`

**Gaps:**
- No function for `GET /auth/session` (if it existed)
- No function for `POST /auth/logout` (backend logout)
- No function for `GET /auth/permissions` (if needed)

---

## 2. What Story 7 Needs to Add/Modify

### 2.1 Session Refresh Logic
**Target Files:** `web/src/lib/auth/session.ts`, `web/src/lib/api/auth.ts`, `web/src/lib/auth/auth-client.ts`

**Requirements:**
- Decode JWT to get expiration timestamp
- When 15 minutes remaining, call `/auth/refresh` automatically
- When 5 minutes remaining, show warning toast
- On session expiration, show "Your session has expired" and redirect to /login
- Update cookies with new tokens after refresh

**Acceptance Criteria Covered:**
- [ ] Given a user's session is valid but nearing expiration (15 minutes remaining), when the frontend detects this, then it automatically calls `/v1/auth/refresh` to extend the session
- [ ] Given a user's session is about to expire (5 minutes remaining), when they are on any page, then they see a warning toast "Your session will expire in 5 minutes. Save your work."
- [ ] Given a user's session has expired, when they attempt any operation, then they see the message "Your session has expired. Please log in again." and are redirected to `/login`

### 2.2 Middleware Enhancements
**Target File:** `web/src/middleware.ts`

**Requirements:**
- Add returnUrl parameter when redirecting to /login
- Add security headers to all responses:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
- Add CSRF token validation for POST/PUT/DELETE requests

**Acceptance Criteria Covered:**
- [ ] Given an unauthenticated user attempts to access `/admin/users`, when the middleware runs, then the user is redirected to `/login` with returnUrl parameter
- [ ] Given an authenticated user returns to login after being redirected, when they log in successfully, then they are redirected to the original returnUrl they were trying to access
- [ ] Given any API request is made, when I inspect the response headers, then I see security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`
- [ ] Given a POST/PUT/DELETE request is made from the frontend, when the request is sent, then it includes a CSRF token in the headers
- [ ] Given a POST/PUT/DELETE request without a valid CSRF token is received, when the backend validates it, then it returns HTTP 403 with message "Invalid CSRF token"

### 2.3 State-Based Access Control
**Target Files:** `web/src/lib/auth/auth-helpers.ts`, NEW: `web/src/lib/auth/state-based-permissions.ts`

**Requirements:**
- Add batch state type (Data Preparation, Level 1 Approval, Level 2 Approval, Level 3 Approval, Complete)
- Create `hasPermissionInState(user, permission, batchState)` function
- Lock editing permissions when batch state is "Approval" or "Complete"
- Unlock when returned to "Data Preparation" after rejection

**Acceptance Criteria Covered:**
- [ ] Given a user has 'instrument.update' permission, when the current batch is in Data Preparation state, then `hasPermission(user, 'instrument.update')` returns `true`
- [ ] Given a user has 'instrument.update' permission, when the current batch is in Level 1 Approval state, then `hasPermission(user, 'instrument.update')` returns `false` (locked)
- [ ] Given a user has 'instrument.update' permission, when the current batch state changes from Approval back to Data Preparation (after rejection), then `hasPermission(user, 'instrument.update')` returns `true` (unlocked)
- [ ] Given I call `hasPermission(user, 'instrument.create')` with a user who has Operations Lead role, when I check the result during Data Preparation phase, then it returns `true`
- [ ] Given I call `hasPermission(user, 'instrument.create')` with a user who has Operations Lead role, when I check the result during Approval phase, then it returns `false` (state-based lock)

### 2.4 Segregation of Duties Enforcement
**Target File:** NEW: `web/src/lib/auth/segregation-of-duties.ts`

**Requirements:**
- Create `canApprove(user, batch)` function
- Check if user created the batch (batch.createdBy === user.id)
- Return error "Cannot approve batch you prepared (segregation of duties)" if same user
- Allow approval if different user (even if user has both prep and approval roles)

**Acceptance Criteria Covered:**
- [ ] Given a user has both Operations Lead and Approver Level 1 roles, when they attempt to approve a batch they created, then the system returns error "Cannot approve batch you prepared (segregation of duties)"
- [ ] Given a user has both Operations Lead and Approver Level 1 roles, when they attempt to approve a batch created by another user, then the approval is allowed

### 2.5 Role-Based Page Access (Server Components)
**Target Files:** `web/src/app/admin/*/page.tsx`, `web/src/app/approvals/page.tsx` (when created)

**Requirements:**
- Use `requireAnyRole(['Administrator'])` in admin pages
- Use `requireAnyRole(['ApproverL1', 'ApproverL2', 'ApproverL3'])` in approvals page
- Show "Access denied. [Role] required." message
- Redirect to dashboard

**Acceptance Criteria Covered:**
- [ ] Given a user without the Administrator role attempts to access `/admin/users`, when the page loads, then they see "Access denied. Administrator role required." and are redirected to the dashboard
- [ ] Given a user without any approver role attempts to access `/approvals`, when the page loads, then they see "Access denied. Approver role required." and are redirected to the dashboard
- [ ] Given a user with the Operations Lead role attempts to access `/batches`, when the page loads, then the page renders successfully (they have permission)

### 2.6 Session Invalidation on User Changes
**Requirements:**
- When user roles change, force session refresh on next request
- When user is deactivated, terminate all sessions
- Password change does NOT invalidate sessions (as per spec)

**Acceptance Criteria Covered:**
- [ ] Given a user's roles are modified by an administrator, when the user attempts their next action, then the session is refreshed with updated roles
- [ ] Given a user is deactivated by an administrator, when the user attempts any action, then they see "Your account has been deactivated. Please contact your administrator." and their session is terminated
- [ ] Given a user's password is changed, when they attempt any action, then their existing sessions remain valid (password change doesn't invalidate active sessions unless explicitly logged out)

**Note:** Backend responsibility - frontend just needs to handle 403 with deactivation message.

### 2.7 Concurrent Session Handling
**Requirements:**
- Multiple sessions allowed (no enforcement needed)
- Logout only affects current session (backend handles session ID in JWT)

**Acceptance Criteria Covered:**
- [ ] Given a user is logged in on one browser, when they log in on a different browser, then both sessions are valid (concurrent sessions allowed)
- [ ] Given a user has multiple active sessions, when they log out from one browser, then only that session is terminated (other sessions remain active)

**Note:** Backend responsibility - frontend stores cookies per-browser naturally.

---

## 3. API Spec Gaps Identified

### 3.1 Missing Endpoints in OpenAPI Spec

**Story 7 acceptance criteria reference these endpoints, but they are NOT in `documentation/openapi.yaml`:**

| Endpoint | Method | Purpose | Referenced in AC |
|----------|--------|---------|------------------|
| `/v1/auth/session` | GET | Retrieve current session and permissions | Line 86 (API Endpoints table) |
| `/v1/auth/logout` | POST | Terminate current session | Line 87 (API Endpoints table) |
| `/v1/auth/permissions` | GET | Get all permissions for current user | Line 88 (API Endpoints table) |

**Analysis:**

1. **`POST /v1/auth/refresh`** - ✅ EXISTS in OpenAPI spec (line 105-126), but NOT called by frontend
2. **`GET /v1/auth/session`** - ❌ NOT in OpenAPI spec - **possibly redundant** (`/auth/me` serves this purpose)
3. **`POST /v1/auth/logout`** - ❌ NOT in OpenAPI spec - **NEEDED** for server-side session invalidation
4. **`GET /v1/auth/permissions`** - ❌ NOT in OpenAPI spec - **possibly redundant** (`/auth/me` returns permissions)

**Recommendation:**

**Option A (Minimal Changes):**
- Add `POST /v1/auth/logout` endpoint to OpenAPI spec
- Use existing `/auth/me` for session/permissions retrieval
- Update Story 7's "API Endpoints" table to reflect actual endpoints:
  - POST `/v1/auth/refresh` - Refresh session token
  - POST `/v1/auth/logout` - Terminate current session (NEW)
  - GET `/v1/auth/me` - Get current user session and permissions (existing)

**Option B (Match Story Exactly):**
- Add all 3 missing endpoints to OpenAPI spec
- Create separate endpoints for session vs. user info

**Preferred:** Option A - minimal changes, leverage existing `/auth/me` endpoint.

---

## 4. Acceptance Criteria Coverage Analysis

### 4.1 Already Partially Implemented (Needs Enhancement)

| AC | Status | What Exists | What's Needed |
|----|--------|-------------|---------------|
| Session created with JWT token | ✅ Partial | Story 1 creates JWT with userId, username, roles, permissions | Verify JWT contains `displayName` field, verify expiration timestamp |
| Session token validated before processing request | ✅ Partial | Middleware checks accessToken cookie | Add API client 401 handler to trigger refresh/logout |
| httpOnly cookie storage | ⚠️ **ISSUE** | Client-side sets cookies (not httpOnly) | **Backend must set httpOnly cookies in Set-Cookie header** |
| Session timeout 30 minutes | ✅ Partial | Client-side timeout via localStorage | Add JWT expiration check (authoritative) |
| Session timeout reset on activity | ✅ Complete | `resetSessionTimeout()` called on mousemove/keydown/click | No changes needed |
| Permission check utilities | ✅ Complete | `hasPermission`, `hasRole`, `hasAnyRole` exist | Add state-based variant |
| Multiple role cumulative permissions | ✅ Complete | JWT includes all permissions from all roles | No changes needed |
| Middleware redirects unauthenticated users | ✅ Complete | Middleware redirects to /login | Add returnUrl parameter |
| Authenticated users redirected from /login | ✅ Complete | Middleware redirects to `/` | Support returnUrl after login |

### 4.2 Not Yet Implemented

| AC Category | Count | Status |
|-------------|-------|--------|
| Session refresh (automatic, 15 min warning) | 1 | ❌ Not implemented |
| Session expiration warning toast (5 min) | 1 | ❌ Not implemented |
| Security headers | 1 | ❌ Not implemented |
| CSRF protection | 2 | ❌ Not implemented |
| State-based access control | 5 | ❌ Not implemented |
| Segregation of duties | 2 | ❌ Not implemented |
| Role-based page access | 3 | ❌ Not implemented (middleware doesn't check roles) |
| Session invalidation on user changes | 3 | ⚠️ Backend responsibility (frontend handles 403 response) |
| Concurrent sessions | 2 | ✅ Allowed by design (no changes needed) |
| Permission performance (10ms, caching) | 2 | ⚠️ Backend responsibility |

---

## 5. Story Revision Proposals

### 5.1 Revise Acceptance Criteria for httpOnly Cookies

**Current AC (Line 22):**
> Given a user's session token is stored, when I check its format, then it is stored in an httpOnly cookie (not accessible to JavaScript for XSS protection)

**Issue:** Frontend cannot set httpOnly cookies. This must be done by backend in `Set-Cookie` header.

**Proposed Revision:**
> Given a user's session token is stored, when I inspect the response headers from `/auth/login`, then the backend sets the accessToken cookie with `HttpOnly; Secure; SameSite=Strict` flags

**Rationale:** This is a backend requirement. Frontend Story 1 implementation incorrectly sets cookies via `document.cookie`. This needs backend fix OR acceptance that cookies are not httpOnly (security risk).

### 5.2 Revise "API Endpoints" Table

**Current (Lines 82-88):**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/auth/refresh` | Refresh session token before expiration |
| GET | `/v1/auth/session` | Retrieve current session and permissions |
| POST | `/v1/auth/logout` | Terminate current session |
| GET | `/v1/auth/permissions` | Get all permissions for current user |

**Proposed (Option A - Minimal Changes):**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/auth/refresh` | Refresh session token before expiration |
| GET | `/v1/auth/me` | Get current user info (includes session and permissions) |
| POST | `/v1/auth/logout` | Terminate current session (backend invalidates JWT) |

**Rationale:** Reduce endpoint duplication. `/auth/me` already returns user with permissions. Add `/auth/logout` to OpenAPI spec.

### 5.3 Clarify State-Based Access Control Scope

**Current AC (Lines 55-59)** reference batch state, but:
- No batch types exist in `web/src/types/` yet
- Batch workflow is Epic 2-6, not Epic 1
- Story 7 is in Epic 1 (Auth/User Management)

**Recommendation:** Story 7 should create **infrastructure** for state-based checks, but **NOT implement batch state logic** (that's Epic 2+).

**Proposed Revision to Implementation Notes (Line 95):**
> **State-Based Access Control Infrastructure**: Create `hasPermissionInState(user, permission, currentState)` utility function. Batch state determination is handled by Epic 2+ (Workflow Management). This story provides the permission-checking mechanism only.

**Acceptance Criteria Update:**
- Keep ACs 55-59, but mark them as "Infrastructure only - batch state mocking required for tests"
- Epic 2 will implement actual batch state retrieval

### 5.4 Remove Backend-Only Acceptance Criteria

**These ACs are backend responsibilities, not frontend:**

| Line | AC | Responsibility |
|------|-----|----------------|
| 65 | User roles modified → session refreshed | Backend must update JWT, frontend detects 401 or decodes new token |
| 66 | User deactivated → account deactivated message | Backend returns 403 with specific message, frontend displays it |
| 67 | Password changed → sessions remain valid | Backend does not invalidate JWT on password change |
| 70-71 | Concurrent sessions allowed | Backend allows multiple valid JWTs, frontend has no logic needed |
| 79-80 | Permission check performance (10ms, caching) | Backend caches role/permission lookups |

**Proposed Action:** Mark these as "Backend validation required" in test plan. Frontend tests will mock backend responses.

---

## 6. Risk Assessment

### 6.1 High-Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| **httpOnly cookie issue** - Frontend sets cookies, not backend | HIGH - XSS vulnerability | Clarify with user: Is backend setting httpOnly cookies, or should we document this as technical debt? |
| **Missing `/auth/logout` endpoint** | MEDIUM - Cannot invalidate sessions server-side | Add endpoint to OpenAPI spec, implement backend logout |
| **State-based access requires batch types** | MEDIUM - Cannot test without batch state | Create mock batch state for Story 7 tests, Epic 2 will implement real batch state |
| **CSRF token generation** | MEDIUM - Requires backend CSRF endpoint | Verify backend provides CSRF token endpoint (not in OpenAPI spec) |

### 6.2 Assumptions to Validate with User

1. **Backend provides CSRF tokens** - Is there a `/auth/csrf` endpoint?
2. **Backend sets httpOnly cookies** - Does `/auth/login` use Set-Cookie header?
3. **Backend supports session invalidation** - Does `/auth/logout` exist?
4. **Batch state types defined** - Should Story 7 create batch state types, or wait for Epic 2?

---

## 7. Recommended Next Steps

### 7.1 Pre-SPECIFY Phase

**Before generating tests, clarify with user:**

1. ✅ Approve API endpoint table revision (use `/auth/me`, add `/auth/logout`)
2. ✅ Approve httpOnly cookie AC revision (backend responsibility)
3. ✅ Confirm CSRF token endpoint exists in backend (or mark as backend-only AC)
4. ✅ Approve creating batch state types in Story 7 (or defer to Epic 2)

### 7.2 OpenAPI Spec Updates Required

**Before implementing Story 7, add to `documentation/openapi.yaml`:**

```yaml
/auth/logout:
  post:
    tags: [Auth]
    summary: Logout and invalidate session
    operationId: logout
    security:
      - bearerAuth: []
    responses:
      '204':
        description: Session terminated successfully
      '401':
        $ref: '#/components/responses/Unauthorized'
```

**Optional (if CSRF protection is in scope):**

```yaml
/auth/csrf:
  get:
    tags: [Auth]
    summary: Get CSRF token for current session
    operationId: getCsrfToken
    security:
      - bearerAuth: []
    responses:
      '200':
        description: CSRF token
        content:
          application/json:
            schema:
              type: object
              properties:
                csrfToken:
                  type: string
```

### 7.3 Story 7 Implementation Plan

**New Files to Create:**
1. `web/src/lib/auth/state-based-permissions.ts` - State-based access control
2. `web/src/lib/auth/segregation-of-duties.ts` - Batch creator checks
3. `web/src/lib/auth/csrf.ts` - CSRF token management
4. `web/src/types/batch.ts` - Batch state types (if approved)

**Files to Modify:**
1. `web/src/lib/auth/session.ts` - Add automatic refresh, expiration warnings
2. `web/src/lib/api/auth.ts` - Add `logout()` endpoint function
3. `web/src/middleware.ts` - Add returnUrl, security headers, CSRF validation
4. `web/src/lib/api/client.ts` - Add CSRF token injection
5. `web/src/app/admin/*/page.tsx` - Add role checks (use `requireAnyRole`)

**Test Files to Create:**
1. `web/src/lib/auth/__tests__/state-based-permissions.test.ts`
2. `web/src/lib/auth/__tests__/segregation-of-duties.test.ts`
3. `web/src/lib/auth/__tests__/csrf.test.ts`
4. `web/src/middleware.test.ts` (enhance existing or create new)

---

## 8. Transition to SPECIFY

**Workflow State:**
- Current Phase: REALIGN
- Next Phase: SPECIFY
- Epic: 1 | Story: 7 of 8

**Ready to Proceed:** ⚠️ **PENDING USER APPROVAL**

**User must approve:**
1. API endpoint revisions (use `/auth/me`, add `/auth/logout`)
2. httpOnly cookie responsibility clarification
3. Batch state types creation in Story 7 (or defer to Epic 2)
4. Backend CSRF token endpoint confirmation

**Once approved, run:**
```bash
node .claude/scripts/transition-phase.js --epic 1 --story 7 --to SPECIFY --verify-output
```

---

## Appendix A: Current Auth Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  Cookies: accessToken (30min), refreshToken (60min)         │
│  localStorage: lastActivityTime                             │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                │
│    - Login page → signIn() → stores cookies                 │
│    - useSession() hook → tracks activity, checks timeout    │
│    - Server components → requireAuth() → decode JWT         │
├─────────────────────────────────────────────────────────────┤
│  Middleware (middleware.ts):                                │
│    - Check accessToken cookie exists                        │
│    - Redirect unauthenticated to /login                     │
│    - Redirect authenticated away from /login                │
├─────────────────────────────────────────────────────────────┤
│  API Client (lib/api/client.ts):                            │
│    - Read accessToken from cookie                           │
│    - Add Authorization: Bearer <token> header               │
│    - Handle 401/403 errors                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API SERVER                       │
├─────────────────────────────────────────────────────────────┤
│  POST /auth/login                                           │
│    → Validate credentials (AD/LDAP)                         │
│    → Generate JWT (userId, username, roles, permissions)    │
│    → Return tokens: { accessToken, refreshToken, expiresIn }│
│                                                             │
│  GET /auth/me                                               │
│    → Verify JWT token                                       │
│    → Return user: { id, username, email, roles, permissions }│
│                                                             │
│  POST /auth/refresh (exists but not called)                 │
│    → Validate refreshToken                                  │
│    → Generate new accessToken                               │
│                                                             │
│  ❌ POST /auth/logout (MISSING)                             │
│  ❌ GET /auth/csrf (MISSING - if CSRF protection enabled)   │
└─────────────────────────────────────────────────────────────┘
```

**Gap:** No automatic token refresh, no CSRF protection, no state-based checks.

---

## Appendix B: Batch State Model (for State-Based Access Control)

**Source:** BRD BR-GOV-005, OpenAPI `BatchWorkflowStatus.currentStage`

**Batch States:**
1. `DataPreparation` - Editing allowed
2. `PendingLevel1Approval` - Read-only (locked)
3. `PendingLevel2Approval` - Read-only (locked)
4. `PendingLevel3Approval` - Read-only (locked)
5. `Complete` - Read-only (locked)
6. `Rejected` - Returns to DataPreparation (unlocked)

**Lock Rules:**
- **DataPreparation**: All edit permissions active
- **PendingLevel*Approval**: All edit permissions return `false`
- **Complete**: All edit permissions return `false`

**Implementation in Story 7:**
```typescript
// web/src/lib/auth/state-based-permissions.ts
export type BatchState =
  | 'DataPreparation'
  | 'PendingLevel1Approval'
  | 'PendingLevel2Approval'
  | 'PendingLevel3Approval'
  | 'Complete';

export function hasPermissionInState(
  user: AuthUser,
  permission: string,
  batchState: BatchState
): boolean {
  // Base permission check
  if (!user.permissions.includes(permission)) {
    return false;
  }

  // Edit permissions locked during approval/complete
  const editPermissions = [
    'instrument.create', 'instrument.update', 'instrument.delete',
    'portfolio.create', 'portfolio.update', 'portfolio.delete',
    'holding.create', 'holding.update', 'holding.delete',
    'batch.confirm', // Lock confirm during approval
  ];

  if (editPermissions.includes(permission)) {
    return batchState === 'DataPreparation';
  }

  // View permissions always allowed
  return true;
}
```

---

**End of REALIGN Report**
