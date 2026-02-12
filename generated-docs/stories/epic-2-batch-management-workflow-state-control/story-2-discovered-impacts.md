# Story 2 Discovered Impacts Analysis: Batch Context Switching

**Generated:** 2026-02-12
**Epic:** 2 (Batch Management & Workflow State Control)
**Story:** 2 (Batch Context Switching)
**Route:** N/A (global context state + header modification)

---

## Executive Summary

This analysis examines the existing codebase after Epic 1 and Epic 2 Story 1 to identify infrastructure for implementing global batch context switching functionality.

**Key Findings:**
- ✅ **Story 1 provides excellent foundation** - Batch types, API client, and components are ready
- ✅ **Toast context pattern exists** - Can be replicated for BatchContext
- ✅ **AppHeader already exists** - Needs modification for batch switcher dropdown
- ✅ **Root layout ready** - Can add BatchContextProvider wrapper
- ✅ **DropdownMenu and Tooltip installed** - UI components available
- ⚠️ **date-fns NOT installed** - Need to add for batch date formatting
- ⚠️ **localStorage pattern not established** - Need to create utility for persistence
- ⚠️ **No batch components directory** - Story 1 implementation is monolithic in BatchesClient.tsx

---

## 1. Existing Infrastructure from Story 1

### 1.1 Batch Types and API Client ✅

**Location:** `web/src/lib/api/batches.ts`

**What's Available:**
- `ReportBatch` interface with all required fields (id, reportBatchType, reportDate, workflowInstanceId, status)
- `listReportBatches()` function for fetching batches
- `createReportBatch()` function for creating batches
- `PaginationMeta` interface

**Perfect for Story 2:**
- Can use `listReportBatches()` to populate batch switcher dropdown
- `ReportBatch.status` field enables read-only detection (status === 'Approved')
- `ReportBatch.reportDate` for display in switcher

**No Changes Needed** - API client is production-ready.

---

### 1.2 Date Formatting (Manual Implementation) ⚠️

**Location:** `web/src/app/batches/BatchesClient.tsx` (lines 26-43)

**Current Implementation:**
```typescript
function formatReportDate(dateString: string): string {
  const date = new Date(dateString);
  const monthNames = ['January', 'February', ...];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}
```

**Issue:** Manual date formatting is implemented inline. Story 2 will need the same formatting for batch switcher dropdown.

**Options:**
1. **Extract to utility** - Move `formatReportDate()` to `lib/utils/date-formatting.ts` for reuse
2. **Install date-fns** - Use industry-standard library (recommended by Story 1 impacts doc)

**Recommendation:** Install `date-fns` and refactor existing code to use it. This ensures consistency and supports future date operations (e.g., "2 hours ago" for batch age).

**Action Required:**
```bash
cd web && npm install date-fns
```

Then create `lib/utils/date-formatting.ts`:
```typescript
import { format } from 'date-fns';

export function formatReportDate(dateString: string): string {
  return format(new Date(dateString), 'MMMM yyyy'); // "January 2026"
}
```

Update `BatchesClient.tsx` to import from utility.

---

### 1.3 Existing Context Pattern (ToastContext) ✅

**Location:** `web/src/contexts/ToastContext.tsx`

**What It Provides:**
- Context creation with `createContext()`
- Provider component pattern (`ToastProvider`)
- Custom hook (`useToast()`) with error handling
- Root layout integration (line 27 in `app/layout.tsx`)

**Perfect Template for BatchContext:**
```typescript
// contexts/BatchContext.tsx (NEW)
const BatchContext = createContext<BatchContextValue | undefined>(undefined);

export function BatchContextProvider({ children }: { children: ReactNode }) {
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Load from localStorage on mount
  // Provide switchBatch(), clearBatch() methods
  // Expose activeBatchId, isReadOnly, currentBatch
}

export function useBatch(): BatchContextValue {
  const context = useContext(BatchContext);
  if (!context) throw new Error('useBatch must be used within BatchContextProvider');
  return context;
}
```

**Action:** Replicate ToastContext pattern for batch context.

---

### 1.4 Root Layout Integration Point ✅

**Location:** `web/src/app/layout.tsx`

**Current Structure:**
```tsx
<ToastProvider>
  <div className="min-h-screen flex flex-col">
    <AuthenticatedNav />
    <main className="flex-1">{children}</main>
  </div>
  <ToastContainer />
</ToastProvider>
```

**Modification Needed:**
Add `BatchContextProvider` wrapper inside `ToastProvider`:
```tsx
<ToastProvider>
  <BatchContextProvider>
    <div className="min-h-screen flex flex-col">
      <AuthenticatedNav />
      <main className="flex-1">{children}</main>
    </div>
  </BatchContextProvider>
  <ToastContainer />
</ToastProvider>
```

**No Conflicts** - Safe to add another provider layer.

---

### 1.5 AppHeader Component (Modification Required) ⚠️

**Location:** `web/src/components/layout/AppHeader.tsx`

**Current State:**
- Displays user info (avatar, name, roles)
- Navigation links
- Logout dropdown menu
- Already uses `DropdownMenu` component (lines 11-15)

**Modification Plan:**
Add batch switcher dropdown between navigation and user section (line 106):

```tsx
{/* NEW: Batch Switcher */}
<div className="flex items-center gap-3">
  <BatchSwitcher /> {/* NEW COMPONENT */}

  <Badge variant="secondary" className="hidden sm:inline-flex">
    {roles[0]}
  </Badge>
  {/* existing user dropdown */}
</div>
```

**Visual Layout:**
```
[Logo] [Nav Links] | [Batch Switcher] [Role Badge] [User Avatar ▼]
```

**Action:** Create `components/batch/BatchSwitcher.tsx` and integrate into AppHeader.

---

### 1.6 Shadcn UI Components ✅

**Installed Components:**
- ✅ `DropdownMenu` (lines 11-15 in AppHeader.tsx)
- ✅ `Tooltip` (confirmed in web/src/components/ui/tooltip.tsx)
- ✅ `Badge` (line 8 in AppHeader.tsx)
- ✅ `Button` (line 7 in AppHeader.tsx)
- ✅ `Separator` (line 9 in AppHeader.tsx)

**All Required Components Available** - No MCP installations needed.

---

## 2. New Infrastructure Needed

### 2.1 BatchContext (Global State) ❌

**Location:** Create `web/src/contexts/BatchContext.tsx`

**Required Functionality:**
```typescript
interface BatchContextValue {
  activeBatchId: number | null;
  currentBatch: ReportBatch | null;
  isReadOnly: boolean;
  switchBatch: (batchId: number) => Promise<void>;
  clearBatch: () => void;
  isLoading: boolean;
}
```

**Implementation Requirements:**
1. **Load from localStorage on mount** - Check `localStorage.getItem('activeBatchId')`
2. **Fetch batch details** - Call `listReportBatches()` to get batch by ID
3. **Detect read-only** - Set `isReadOnly = currentBatch.status === 'Approved'`
4. **Persist on change** - `localStorage.setItem('activeBatchId', batchId)` when switched
5. **Auto-select on first login** - If no active batch, fetch latest and set as active
6. **Error handling** - Handle API failures gracefully (show toast, revert to null)

**Dependencies:**
- `listReportBatches()` from `lib/api/batches.ts`
- `useToast()` from `contexts/ToastContext.tsx` (for success/error messages)
- `localStorage` for persistence

---

### 2.2 BatchSwitcher Component ❌

**Location:** Create `web/src/components/batch/BatchSwitcher.tsx`

**UI Specification:**
```tsx
// When batch is active:
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="ghost">
      Active Batch: January 2026 | Status: Data Preparation
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {recentBatches.map(batch => (
      <DropdownMenuItem onClick={() => switchBatch(batch.id)}>
        {formatReportDate(batch.reportDate)} - {batch.status}
      </DropdownMenuItem>
    ))}
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
      <Link href="/batches">View All Batches</Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// When no batch is active:
<Button variant="outline" asChild>
  <Link href="/batches">No Active Batch - Select Batch</Link>
</Button>
```

**Functionality:**
1. **Use `useBatch()` hook** - Get `currentBatch`, `switchBatch()`, `isReadOnly`
2. **Fetch recent batches** - Call `listReportBatches({ pageSize: 5 })` on mount
3. **Display active batch** - Show `formatReportDate(currentBatch.reportDate)` and status
4. **Dropdown list** - Show 5 most recent batches
5. **Switch action** - Call `switchBatch(batchId)` on click
6. **Loading state** - Show spinner while switching
7. **Read-only indicator** - Badge or icon when `isReadOnly === true`

**Dependencies:**
- `useBatch()` hook from `contexts/BatchContext.tsx`
- `listReportBatches()` from `lib/api/batches.ts`
- `formatReportDate()` utility function (NEW - see 2.3)
- `DropdownMenu`, `Badge`, `Button` from Shadcn UI

---

### 2.3 Date Formatting Utility ❌

**Location:** Create `web/src/lib/utils/date-formatting.ts`

**Required Functions:**
```typescript
import { format } from 'date-fns';

export function formatReportDate(dateString: string): string {
  return format(new Date(dateString), 'MMMM yyyy'); // "January 2026"
}

export function formatDateTime(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a'); // "Jan 15, 2026 3:45 PM"
}
```

**Refactoring Required:**
- Update `web/src/app/batches/BatchesClient.tsx` (line 26) to import from utility
- Remove manual `formatReportDate()` function

**Dependency:** Install `date-fns` via npm.

---

### 2.4 localStorage Utility ❌

**Location:** Create `web/src/lib/utils/storage.ts`

**Required Functions:**
```typescript
export function getActiveBatchId(): number | null {
  const stored = localStorage.getItem('activeBatchId');
  return stored ? parseInt(stored, 10) : null;
}

export function setActiveBatchId(batchId: number): void {
  localStorage.setItem('activeBatchId', batchId.toString());
}

export function clearActiveBatchId(): void {
  localStorage.removeItem('activeBatchId');
}
```

**Why Needed:** Centralized localStorage access with type safety and error handling.

---

## 3. Impacts on Existing Code

### 3.1 AppHeader.tsx (Modification Required)

**File:** `web/src/components/layout/AppHeader.tsx`

**Change:** Add `BatchSwitcher` component between navigation and user section.

**Before (line 106-110):**
```tsx
<div className="flex items-center gap-3">
  <Badge variant="secondary" className="hidden sm:inline-flex">
    {roles[0]}
  </Badge>
  <Separator orientation="vertical" className="h-6" />
```

**After:**
```tsx
<div className="flex items-center gap-3">
  <BatchSwitcher /> {/* NEW */}
  <Separator orientation="vertical" className="h-6" />
  <Badge variant="secondary" className="hidden sm:inline-flex">
    {roles[0]}
  </Badge>
  <Separator orientation="vertical" className="h-6" />
```

**Impact:** Visual layout change. No functional breaking changes.

---

### 3.2 Root Layout (Provider Addition)

**File:** `web/src/app/layout.tsx`

**Change:** Wrap application in `BatchContextProvider`.

**Before (line 27-33):**
```tsx
<ToastProvider>
  <div className="min-h-screen flex flex-col">
    <AuthenticatedNav />
    <main className="flex-1">{children}</main>
  </div>
  <ToastContainer />
</ToastProvider>
```

**After:**
```tsx
<ToastProvider>
  <BatchContextProvider> {/* NEW */}
    <div className="min-h-screen flex flex-col">
      <AuthenticatedNav />
      <main className="flex-1">{children}</main>
    </div>
  </BatchContextProvider> {/* NEW */}
  <ToastContainer />
</ToastProvider>
```

**Impact:** Adds global batch context availability. No breaking changes.

---

### 3.3 BatchesClient.tsx (Refactoring Recommended)

**File:** `web/src/app/batches/BatchesClient.tsx`

**Change:** Use `useBatch()` hook and `formatReportDate()` utility.

**Opportunities:**
1. **Use batch context** - Replace local state with `const { activeBatchId, switchBatch } = useBatch()`
2. **Extract date formatting** - Import `formatReportDate()` from utility instead of inline function
3. **Add "Switch to Batch" button** - On each BatchCard, call `switchBatch(batch.id)`

**Impact:** Refactoring improves consistency. Optional for MVP (can defer to later story).

---

## 4. Story 2 Acceptance Criteria Mapping

### AC: Batch Switching
- ✅ **"Switch to Batch" on card** → Add button to BatchCard (Story 1 code) that calls `switchBatch(batch.id)`
- ✅ **Active batch context changes** → `BatchContext` state updates
- ✅ **Success message displayed** → Use `useToast()` in `switchBatch()` function

### AC: Active Batch Indicator
- ✅ **Header shows "Active Batch: January 2026"** → `BatchSwitcher` component displays `currentBatch.reportDate`
- ✅ **Dropdown shows recent batches** → `BatchSwitcher` fetches 5 recent batches
- ✅ **Clicking batch switches context** → `switchBatch(batchId)` called on item click

### AC: Historical Batch (Read-Only)
- ✅ **Detect closed batch** → `isReadOnly = currentBatch.status === 'Approved'`
- ✅ **Show read-only banner** → Conditional rendering in pages that modify data
- ⚠️ **Block modifications** → Not implemented in Story 2 (deferred to data entry stories)

### AC: Context Persistence
- ✅ **Survives page refresh** → `localStorage.getItem('activeBatchId')` on mount
- ⚠️ **Survives logout/login** → Requires backend user preference API (future enhancement)
- ✅ **Auto-select most recent** → Fetch latest batch if no `activeBatchId` in localStorage

### AC: Multi-User Scenarios
- ✅ **Independent batch selection** → Client-side only (no server sync in MVP)
- ⚠️ **Notification for new batch** → Requires WebSocket or polling (future enhancement)

### AC: Status Constraints
- ✅ **Locked batch notification** → Check `currentBatch.status` includes "Pending" → show toast
- ✅ **Rejection unlock message** → Check `currentBatch.lastRejection !== null` → show banner

---

## 5. Implementation Order (TDD)

### Phase 1: Dependencies & Utilities
1. **Install date-fns** - `cd web && npm install date-fns`
2. **Create `lib/utils/date-formatting.ts`** - Extract `formatReportDate()`
3. **Create `lib/utils/storage.ts`** - localStorage wrapper functions
4. **Refactor BatchesClient.tsx** - Use date formatting utility

### Phase 2: Context & Provider
5. **Create `contexts/BatchContext.tsx`** - Global batch state management
6. **Add `BatchContextProvider` to layout** - Root level integration
7. **Write tests** - Context initialization, switching, persistence

### Phase 3: UI Component
8. **Create `components/batch/BatchSwitcher.tsx`** - Dropdown component
9. **Modify `AppHeader.tsx`** - Integrate BatchSwitcher
10. **Write tests** - Switcher UI, dropdown interactions

### Phase 4: Integration
11. **Add "Switch to Batch" button** - Modify BatchCard in BatchesClient.tsx
12. **Add read-only indicator** - Badge in BatchSwitcher when `isReadOnly === true`
13. **E2E tests** - Full switching workflow

---

## 6. Test Strategy

### 6.1 BatchContext Tests

**File:** `contexts/__tests__/BatchContext.test.tsx`

**Test Scenarios:**
- ✅ Initializes with `null` active batch
- ✅ Loads batch ID from localStorage on mount
- ✅ Fetches batch details when ID is loaded
- ✅ Sets `isReadOnly = true` when batch status is "Approved"
- ✅ `switchBatch()` updates `activeBatchId` and persists to localStorage
- ✅ `switchBatch()` shows success toast
- ✅ `switchBatch()` handles API errors gracefully
- ✅ Auto-selects most recent batch when no localStorage value

**Mock Strategy:**
```typescript
vi.mock('@/lib/api/batches', () => ({
  listReportBatches: vi.fn(),
}));

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
```

---

### 6.2 BatchSwitcher Component Tests

**File:** `components/batch/__tests__/BatchSwitcher.test.tsx`

**Test Scenarios:**
- ✅ Displays "No Active Batch" when `activeBatchId === null`
- ✅ Displays active batch name and status when batch is active
- ✅ Shows dropdown with 5 recent batches when clicked
- ✅ Calls `switchBatch()` when dropdown item is clicked
- ✅ Closes dropdown after batch switch
- ✅ Shows "View All Batches" link in dropdown
- ✅ Displays read-only indicator (badge) when `isReadOnly === true`
- ✅ Shows loading state while switching

**Mock Strategy:**
```typescript
vi.mock('@/contexts/BatchContext', () => ({
  useBatch: vi.fn(() => ({
    activeBatchId: 1,
    currentBatch: createMockBatch(),
    isReadOnly: false,
    switchBatch: vi.fn(),
    isLoading: false,
  })),
}));
```

---

### 6.3 Integration Tests (AppHeader)

**File:** `components/layout/__tests__/AppHeader.test.tsx`

**Test Scenarios:**
- ✅ Renders BatchSwitcher component
- ✅ BatchSwitcher is positioned between navigation and user section
- ✅ Layout remains intact with batch switcher added

---

## 7. Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| localStorage unavailable (private browsing) | Low | Gracefully degrade to session-only context |
| API failure when switching batches | Medium | Show error toast, keep previous batch active |
| Race condition (multiple API calls) | Low | Use `isLoading` flag to disable switcher during fetch |
| Batch deleted while active | Medium | Handle 404 errors, clear active batch, redirect to /batches |
| Context initialization delay (async) | Low | Show loading state in BatchSwitcher until context ready |
| No batches exist (new user) | Low | Display "No batches available - Create your first batch" |

---

## 8. Quality Gates Checklist

Before transitioning to SPECIFY phase, verify:

- [x] Story 1 infrastructure is understood and documented
- [x] Context pattern identified (ToastContext as template)
- [x] AppHeader modification approach is clear
- [x] Root layout integration plan is defined
- [x] All required Shadcn components are available (DropdownMenu, Tooltip, Badge)
- [x] date-fns installation requirement identified
- [x] localStorage strategy is defined
- [x] Test strategy follows Epic 1/2 Story 1 patterns
- [x] No breaking changes to existing code

---

## 9. Open Questions for SPECIFY Phase

1. **Server-side persistence:** Should active batch preference be stored in backend user preferences? (Deferred to future story)
2. **Batch deletion handling:** What happens if active batch is deleted by another user? (Error toast + clear context)
3. **Notification for new batches:** Should users be notified when new batches are created? (Deferred to future story)
4. **Read-only enforcement:** Where should we block modifications for historical batches? (Data entry screens in future stories)
5. **Auto-refresh:** Should batch status auto-update if changed by approvers? (Deferred to future story)

---

## Conclusion

**Ready for SPECIFY Phase:** ✅ Yes

Story 1 provides excellent foundation:
- Batch types and API client are production-ready
- DropdownMenu and Tooltip components are installed
- ToastContext pattern can be replicated for BatchContext
- Root layout and AppHeader are ready for modifications

**Critical Actions Before Implementation:**
1. Install `date-fns` package
2. Create `BatchContext` and `BatchContextProvider`
3. Create `BatchSwitcher` component
4. Modify `AppHeader.tsx` to include BatchSwitcher
5. Update `layout.tsx` to wrap in `BatchContextProvider`

**Next Step:** Transition to SPECIFY phase to write comprehensive test specifications for this story.
