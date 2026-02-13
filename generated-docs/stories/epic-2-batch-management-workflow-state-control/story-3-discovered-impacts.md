# Story 3 Discovered Impacts Analysis: Workflow State Visualization

**Generated:** 2026-02-13
**Epic:** 2 (Batch Management & Workflow State Control)
**Story:** 3 (Workflow State Visualization)
**Route:** `/batches/[id]/workflow`

---

## Executive Summary

This analysis examines the existing codebase after Epic 2 Stories 1-2 to assess readiness for implementing workflow state visualization functionality.

**Key Findings:**
- ✅ **Excellent foundation from Stories 1-2** - Batch API, BatchContext, and date formatting utilities are production-ready
- ✅ **OpenAPI endpoint exists** - `GET /report-batches/{id}/status` returns BatchWorkflowStatus
- ✅ **All required Shadcn UI components installed** - Card, Badge, Tooltip available
- ✅ **Date formatting utilities ready** - Can format timestamps for status indicators
- ⚠️ **BatchWorkflowStatus schema is minimal** - Only provides `currentStage` string, missing stage completion details and timestamps per stage
- ⚠️ **No workflow stage enum exists** - Need to define stage constants with descriptions
- ⚠️ **No polling hook pattern exists** - Need to create reusable hook for real-time updates
- ⚠️ **Approval history endpoint separate** - `GET /report-batches/{id}/approvals` returns ApprovalLogEntry array (Story 6 will use this)

---

## 1. Existing Infrastructure Assessment

### 1.1 Batch API Client ✅

**Location:** `web/src/lib/api/batches.ts`

**What's Available:**
- `getReportBatch(id)` - Fetches batch details including status
- `ReportBatch` interface with all required fields
- Proper error handling and TypeScript types

**Relevance to Story 3:**
- Can fetch batch details for header/title
- `ReportBatch.status` field contains workflow stage information
- Can use for authorization checks (batch existence, permission validation)

**No Changes Needed** - Existing API functions work as-is.

---

### 1.2 OpenAPI Endpoint: GET /report-batches/{id}/status ✅

**Location:** `documentation/openapi.yaml` (lines 931-947)

**Endpoint Definition:**
```yaml
/report-batches/{id}/status:
  get:
    summary: Get batch workflow status
    description: Returns current workflow state, approval status, and data completeness
    responses:
      '200':
        schema:
          $ref: '#/components/schemas/BatchWorkflowStatus'
```

**Schema: BatchWorkflowStatus** (lines 3114-3132):
```yaml
BatchWorkflowStatus:
  type: object
  properties:
    batchId:
      type: integer
    currentStage:
      type: string
    isLocked:
      type: boolean
    canConfirm:
      type: boolean
    canApprove:
      type: boolean
    pendingApprovalLevel:
      type: integer
      nullable: true
    lastUpdated:
      type: string
      format: date-time
```

**Analysis:**
- ✅ Endpoint exists and is well-defined
- ✅ Returns `currentStage` (string) - e.g., "DataPreparation", "Level1Pending", "Level2Pending"
- ✅ Returns `lastUpdated` timestamp for status age calculation
- ✅ Returns `isLocked`, `canConfirm`, `canApprove` for action button states
- ⚠️ **Schema limitation:** No per-stage completion status or timestamps

**Implications for Story 3:**
- Progress bar must infer stage completion from `currentStage` (e.g., if current is "Level2Pending", then DataPreparation and Level1Pending are complete)
- Stage timestamps not available per-stage - only `lastUpdated` for current stage
- Will need to fetch `GET /report-batches/{id}/approvals` separately if we need precise completion timestamps per stage (Story 6 requirement)

**Action Required:**
Add `getBatchWorkflowStatus()` function to `lib/api/batches.ts`:
```typescript
export interface BatchWorkflowStatus {
  batchId: number;
  currentStage: string;
  isLocked: boolean;
  canConfirm: boolean;
  canApprove: boolean;
  pendingApprovalLevel: number | null;
  lastUpdated: string;
}

export async function getBatchWorkflowStatus(id: number): Promise<BatchWorkflowStatus> {
  return get<BatchWorkflowStatus>(`/report-batches/${id}/status`);
}
```

---

### 1.3 BatchContext (Global State) ✅

**Location:** `web/src/contexts/BatchContext.tsx`

**What's Available:**
- `useBatch()` hook with `activeBatchId`, `currentBatch`, `isReadOnly`, `switchBatch()`
- BatchContext wraps entire application (from `app/layout.tsx`)
- Automatic batch loading from localStorage on mount
- Toast notifications for errors

**Relevance to Story 3:**
- Workflow page can use `useBatch()` to get current batch context
- No need to pass batch ID as prop - available globally
- `currentBatch.status` provides initial workflow state before API call

**No Changes Needed** - Perfect for workflow page integration.

---

### 1.4 Date Formatting Utilities ✅

**Location:** `web/src/lib/utils/date-formatting.ts`

**Available Functions:**
```typescript
export function formatReportDate(dateStr: string): string
  // Returns "January 2026"

export function formatDateTime(dateStr: string): string
  // Returns "Jan 15, 2026 at 10:30 AM"
```

**Relevance to Story 3:**
- Use `formatDateTime()` for "Status: Awaiting PM approval since [timestamp]"
- Use `formatReportDate()` for page title "Workflow State - Batch: January 2026"

**Additional Requirement:**
Need function to calculate relative time (e.g., "3 days ago"):
```typescript
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
```

**Action Required:**
Add `formatRelativeTime()` to `lib/utils/date-formatting.ts`.

---

### 1.5 Shadcn UI Components ✅

**Location:** `web/src/components/ui/`

**Installed Components:**
- ✅ `card.tsx` - For CurrentStagePanel
- ✅ `badge.tsx` - For stage status indicators (Complete, In Progress, Pending)
- ✅ `tooltip.tsx` - For stage hover details
- ✅ `button.tsx` - For navigation and action buttons
- ✅ `separator.tsx` - For visual dividers

**All Required Components Available** - No MCP installations needed.

---

### 1.6 Dynamic Route Pattern ✅

**Existing Pattern:** `app/batches/page.tsx` (server component with auth checks)

**Structure:**
```tsx
export default async function BatchesPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!hasPageAccess(user, '/batches')) redirect('/auth/forbidden');
  return <BatchesClient />;
}
```

**Action Required for Story 3:**
Create `app/batches/[id]/workflow/page.tsx` following same pattern:
```tsx
export default async function WorkflowPage({ params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!hasPageAccess(user, '/batches')) redirect('/auth/forbidden');
  return <WorkflowClient batchId={parseInt(params.id)} />;
}
```

---

## 2. New Infrastructure Needed

### 2.1 Workflow Stage Constants ❌

**Location:** Create `web/src/lib/constants/workflow-stages.ts`

**Required Structure:**
```typescript
export enum WorkflowStage {
  DataPreparation = 'DataPreparation',
  Level1Pending = 'Level1Pending',
  Level2Pending = 'Level2Pending',
  Level3Pending = 'Level3Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface WorkflowStageConfig {
  key: WorkflowStage;
  label: string;
  shortLabel: string;
  description: string;
  icon: 'check' | 'circle' | 'dot' | 'x';
  color: 'green' | 'yellow' | 'gray' | 'red';
}

export const WORKFLOW_STAGES: WorkflowStageConfig[] = [
  {
    key: WorkflowStage.DataPreparation,
    label: 'Data Preparation',
    shortLabel: 'Data Prep',
    description: 'All required data must be collected, validated, and confirmed before progression',
    icon: 'check', // when complete
    color: 'green',
  },
  {
    key: WorkflowStage.Level1Pending,
    label: 'Level 1 Approval',
    shortLabel: 'L1 Approval',
    description: 'Operations approval focusing on file receipt and data validation checks',
    icon: 'circle',
    color: 'yellow',
  },
  // ... etc
];

// Helper function to determine stage completion status
export function getStageStatus(
  stageName: string,
  currentStage: string
): 'complete' | 'current' | 'pending' {
  const stages = WORKFLOW_STAGES.map(s => s.key);
  const currentIndex = stages.indexOf(currentStage as WorkflowStage);
  const stageIndex = stages.indexOf(stageName as WorkflowStage);

  if (stageIndex < currentIndex) return 'complete';
  if (stageIndex === currentIndex) return 'current';
  return 'pending';
}
```

**Why Needed:** Centralized source of truth for stage labels, descriptions, and visual indicators.

---

### 2.2 Real-Time Polling Hook ❌

**Location:** Create `web/src/hooks/usePolling.ts`

**Required Functionality:**
```typescript
import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => void | Promise<void>,
  interval: number,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
}
```

**Usage in WorkflowClient:**
```typescript
const [workflowStatus, setWorkflowStatus] = useState<BatchWorkflowStatus | null>(null);

const fetchStatus = async () => {
  const status = await getBatchWorkflowStatus(batchId);
  setWorkflowStatus(status);
};

usePolling(fetchStatus, 30000, true); // Poll every 30 seconds
```

**Why Needed:** Acceptance criterion requires real-time updates within 5 seconds (Story specifies 30s polling).

---

### 2.3 WorkflowProgressBar Component ❌

**Location:** Create `web/src/components/workflow/WorkflowProgressBar.tsx`

**Required Functionality:**
- Display horizontal timeline with 5 stages
- Show icons for each stage: ✓ (complete), ● (current), ○ (pending)
- Clickable stages with tooltips
- Responsive layout (stack vertically on mobile)
- Color-coded: green (complete), yellow (current), gray (pending)
- Rejection state: red warning icon on rejected stage

**Props Interface:**
```typescript
interface WorkflowProgressBarProps {
  currentStage: string;
  lastRejection: { level: string; reason: string } | null;
  onStageClick?: (stageName: string) => void;
}
```

**Component Structure:**
```tsx
<div className="flex items-center justify-between">
  {WORKFLOW_STAGES.map((stage, index) => (
    <div key={stage.key} className="flex items-center">
      <Tooltip content={getStageTooltipContent(stage)}>
        <button onClick={() => onStageClick?.(stage.key)}>
          <Badge variant={getStatusVariant(stage.key)}>
            {getStatusIcon(stage.key)} {stage.shortLabel}
          </Badge>
        </button>
      </Tooltip>
      {index < WORKFLOW_STAGES.length - 1 && (
        <ArrowRight className="mx-2 text-gray-400" />
      )}
    </div>
  ))}
</div>
```

**Dependencies:**
- `WORKFLOW_STAGES` constants
- `Badge`, `Tooltip` from Shadcn UI
- `lucide-react` for icons (ArrowRight, Check, Circle, Dot, X)

---

### 2.4 CurrentStagePanel Component ❌

**Location:** Create `web/src/components/workflow/CurrentStagePanel.tsx`

**Required Functionality:**
- Display current stage name and description
- Show status message with timestamp
- Display "Next: [stage name]" indicator
- Show rejection warning if applicable
- Action buttons (Confirm Data Ready, View Batch Details)

**Props Interface:**
```typescript
interface CurrentStagePanelProps {
  currentStage: string;
  lastUpdated: string;
  isLocked: boolean;
  canConfirm: boolean;
  lastRejection: { level: string; reason: string; date: string } | null;
}
```

**Component Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Current Workflow Stage</CardTitle>
  </CardHeader>
  <CardContent>
    <h3>{getCurrentStageConfig().label}</h3>
    <p className="text-sm text-gray-600">{getCurrentStageConfig().description}</p>

    <div className="mt-4">
      <p>Status: {getStatusMessage()}</p>
      <p>Next: {getNextStageMessage()}</p>
    </div>

    {lastRejection && (
      <Alert variant="destructive">
        <AlertTitle>Returned to Data Preparation</AlertTitle>
        <AlertDescription>{lastRejection.reason}</AlertDescription>
      </Alert>
    )}

    <div className="mt-4 flex gap-2">
      {canConfirm && <Button>Confirm Data Ready</Button>}
      <Button variant="outline" asChild>
        <Link href={`/batches/${batchId}`}>View Batch Details</Link>
      </Button>
    </div>
  </CardContent>
</Card>
```

**Dependencies:**
- `WORKFLOW_STAGES` constants
- `Card`, `Button`, `Alert` from Shadcn UI
- `formatDateTime()`, `formatRelativeTime()` utilities

---

### 2.5 Dynamic Route: app/batches/[id]/workflow/page.tsx ❌

**Location:** Create `web/src/app/batches/[id]/workflow/page.tsx`

**Required Structure:**
```tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-server';
import { hasPageAccess } from '@/lib/auth/auth-helpers';
import WorkflowClient from './WorkflowClient';

export default async function WorkflowPage({ params }: { params: { id: string } }) {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  if (!hasPageAccess(user, '/batches')) {
    redirect('/auth/forbidden');
  }

  const batchId = parseInt(params.id, 10);

  if (isNaN(batchId)) {
    redirect('/batches');
  }

  return <WorkflowClient batchId={batchId} />;
}
```

**Client Component:** `app/batches/[id]/workflow/WorkflowClient.tsx`
```tsx
'use client';

export default function WorkflowClient({ batchId }: { batchId: number }) {
  const [workflowStatus, setWorkflowStatus] = useState<BatchWorkflowStatus | null>(null);
  const [batch, setBatch] = useState<ReportBatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchBatchAndStatus();
  }, [batchId]);

  usePolling(fetchBatchAndStatus, 30000, true);

  const fetchBatchAndStatus = async () => {
    try {
      const [batchData, statusData] = await Promise.all([
        getReportBatch(batchId),
        getBatchWorkflowStatus(batchId),
      ]);
      setBatch(batchData);
      setWorkflowStatus(statusData);
    } catch (err) {
      setError('Failed to load workflow status');
    }
  };

  if (error) return <ErrorDisplay message={error} />;
  if (!workflowStatus) return <LoadingSpinner />;

  return (
    <div>
      <h1>Workflow State - Batch: {formatReportDate(batch.reportDate)}</h1>
      <WorkflowProgressBar
        currentStage={workflowStatus.currentStage}
        lastRejection={batch.lastRejection}
      />
      <CurrentStagePanel
        currentStage={workflowStatus.currentStage}
        lastUpdated={workflowStatus.lastUpdated}
        isLocked={workflowStatus.isLocked}
        canConfirm={workflowStatus.canConfirm}
        lastRejection={batch.lastRejection}
      />
    </div>
  );
}
```

---

## 3. Impacts on Existing Code

### 3.1 lib/api/batches.ts (Addition Required)

**File:** `web/src/lib/api/batches.ts`

**Change:** Add `getBatchWorkflowStatus()` function and `BatchWorkflowStatus` interface.

**Addition (after line 101):**
```typescript
/**
 * Get workflow status for a report batch.
 */
export interface BatchWorkflowStatus {
  batchId: number;
  currentStage: string;
  isLocked: boolean;
  canConfirm: boolean;
  canApprove: boolean;
  pendingApprovalLevel: number | null;
  lastUpdated: string;
}

export async function getBatchWorkflowStatus(id: number): Promise<BatchWorkflowStatus> {
  return get<BatchWorkflowStatus>(`/report-batches/${id}/status`);
}
```

**Impact:** Additive only - no breaking changes.

---

### 3.2 lib/utils/date-formatting.ts (Addition Required)

**File:** `web/src/lib/utils/date-formatting.ts`

**Change:** Add `formatRelativeTime()` function.

**Addition (after line 34):**
```typescript
/**
 * Format an ISO datetime string to relative time (e.g., "2 days ago").
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays > 1) return `${diffDays} days ago`;

  // Future dates (shouldn't happen, but handle gracefully)
  return formatDateTime(dateStr);
}
```

**Impact:** Additive only - no breaking changes.

---

### 3.3 No Changes to BatchContext or Other Files

**No modifications needed** to existing components or contexts.

---

## 4. Acceptance Criteria Mapping

### AC: Happy Path - Current Stage Display
- ✅ **"Current Workflow Stage" panel shows "Level 2 Approval (Portfolio Manager Review)"** → `CurrentStagePanel` component displays `WORKFLOW_STAGES[currentStage].label`
- ✅ **Progress bar shows `[Data Prep ✓] → [L1 Approval ✓] → [L2 Approval ●] → [L3] → [Publish]`** → `WorkflowProgressBar` uses `getStageStatus()` helper to determine icon per stage
- ✅ **Status message shows "Awaiting PM approval since [timestamp]"** → Use `formatDateTime(workflowStatus.lastUpdated)`

### AC: Workflow Stage Icons
- ✅ **Green checkmark (✓) for complete stages** → Badge with green variant + Check icon from lucide-react
- ✅ **Yellow dot (●) for current stage** → Badge with yellow variant + Dot icon
- ✅ **Gray circle (○) for pending stages** → Badge with gray variant + Circle icon
- ✅ **Red warning for rejected stages** → Check `batch.lastRejection` and show red X icon on relevant stage

### AC: Stage Descriptions
- ✅ **Display stage descriptions** → `WORKFLOW_STAGES` constant provides descriptions for each stage
- ✅ **Description shown in CurrentStagePanel** → `<p>{getCurrentStageConfig().description}</p>`

### AC: Status Timestamps
- ✅ **"Status: Awaiting PM approval since 2026-01-06 11:30"** → Use `formatDateTime(workflowStatus.lastUpdated)`
- ✅ **"In preparation for 3 days"** → Use `formatRelativeTime(workflowStatus.lastUpdated)`

### AC: Navigation and Actions
- ✅ **"View Batch Details" button navigates to batch details** → `<Link href={/batches/${batchId}}>View Batch Details</Link>`
- ✅ **Stage tooltips show completion details** → `<Tooltip content="Level 1 Approval - Completed on [date]">`
- ⚠️ **Tooltip completion timestamps not available** → API only provides `lastUpdated` for current stage, not per-stage timestamps. Story 6 (Workflow History) will use `/report-batches/{id}/approvals` endpoint for detailed timestamps. For Story 3, tooltips will show stage description only.
- ✅ **"Confirm Data Ready" button shown for Analyst role** → Conditional rendering based on `workflowStatus.canConfirm`

### AC: Real-Time Updates
- ✅ **Page updates automatically within 5 seconds** → Story specifies 30s polling via `usePolling()` hook
- ⚠️ **Notification on workflow change** → Requires comparing previous state to new state in polling callback, then calling `showToast()`. Implementation: store previous `currentStage`, compare on each poll, show toast if changed.

### AC: Error States
- ✅ **"Batch not found" for non-existent batch** → API call will throw 404 error, catch and display error message
- ✅ **"Access denied" for unauthorized users** → Server component auth check in `page.tsx` redirects to `/auth/forbidden`

### AC: Rejection State Indicators
- ✅ **Red warning icon on rejected stage** → Check `batch.lastRejection.level` and show red icon on corresponding stage in progress bar
- ✅ **"Status: Returned to Data Preparation after Level 1 rejection"** → Display in CurrentStagePanel if `batch.lastRejection` exists

---

## 5. Implementation Order (TDD)

### Phase 1: Constants & Utilities
1. **Create `lib/constants/workflow-stages.ts`** - Stage enum, config array, helper functions
2. **Add `formatRelativeTime()` to `lib/utils/date-formatting.ts`** - Relative time formatting
3. **Create `hooks/usePolling.ts`** - Reusable polling hook
4. **Write tests** - Workflow stage helpers, relative time formatting, polling hook

### Phase 2: API Integration
5. **Add `getBatchWorkflowStatus()` to `lib/api/batches.ts`** - API function and types
6. **Write tests** - API function mocking and response handling

### Phase 3: UI Components
7. **Create `components/workflow/WorkflowProgressBar.tsx`** - Progress bar with stage icons
8. **Create `components/workflow/CurrentStagePanel.tsx`** - Current stage display panel
9. **Write tests** - Component rendering, icon states, tooltips, rejection indicators

### Phase 4: Page & Integration
10. **Create `app/batches/[id]/workflow/page.tsx`** - Server component with auth
11. **Create `app/batches/[id]/workflow/WorkflowClient.tsx`** - Client component with polling
12. **Write tests** - Page rendering, polling behavior, error states, auth checks

### Phase 5: Notification Enhancement
13. **Add state change detection** - Compare previous vs current stage in polling callback
14. **Show toast notification** - Call `showToast()` when stage changes
15. **Write tests** - Notification triggers, state comparison logic

---

## 6. Test Strategy

### 6.1 Workflow Stage Helpers Tests

**File:** `lib/constants/__tests__/workflow-stages.test.ts`

**Test Scenarios:**
- ✅ `getStageStatus()` returns 'complete' for stages before current
- ✅ `getStageStatus()` returns 'current' for current stage
- ✅ `getStageStatus()` returns 'pending' for stages after current
- ✅ Stage config array contains all required fields (label, description, icon, color)
- ✅ Stage descriptions match BRD requirements

---

### 6.2 Polling Hook Tests

**File:** `hooks/__tests__/usePolling.test.tsx`

**Test Scenarios:**
- ✅ Callback is called on interval
- ✅ Callback is not called when `enabled` is false
- ✅ Interval is cleared on unmount
- ✅ Callback updates are respected (latest callback is used)

**Mock Strategy:**
```typescript
vi.useFakeTimers();
vi.spyOn(global, 'setInterval');
vi.spyOn(global, 'clearInterval');
```

---

### 6.3 WorkflowProgressBar Component Tests

**File:** `components/workflow/__tests__/WorkflowProgressBar.test.tsx`

**Test Scenarios:**
- ✅ Renders all 5 workflow stages
- ✅ Shows checkmark icon for completed stages
- ✅ Shows dot icon for current stage
- ✅ Shows circle icon for pending stages
- ✅ Shows red warning icon when rejection exists
- ✅ Stage labels are displayed correctly
- ✅ Tooltips appear on stage hover
- ✅ `onStageClick` is called when stage is clicked

**Mock Strategy:**
```typescript
const mockProps = {
  currentStage: 'Level2Pending',
  lastRejection: null,
  onStageClick: vi.fn(),
};
```

---

### 6.4 CurrentStagePanel Component Tests

**File:** `components/workflow/__tests__/CurrentStagePanel.test.tsx`

**Test Scenarios:**
- ✅ Displays current stage name and description
- ✅ Shows status message with formatted timestamp
- ✅ Shows "Next: [stage]" indicator
- ✅ Displays rejection alert when `lastRejection` exists
- ✅ Shows "Confirm Data Ready" button when `canConfirm` is true
- ✅ Hides "Confirm Data Ready" button when `canConfirm` is false
- ✅ "View Batch Details" button links to correct URL
- ✅ Uses `formatDateTime()` for timestamp formatting
- ✅ Uses `formatRelativeTime()` for status age

**Mock Strategy:**
```typescript
vi.mock('@/lib/utils/date-formatting', () => ({
  formatDateTime: vi.fn(() => 'Jan 6, 2026 11:30 AM'),
  formatRelativeTime: vi.fn(() => '2 days ago'),
}));
```

---

### 6.5 WorkflowClient Integration Tests

**File:** `app/batches/[id]/workflow/__tests__/WorkflowClient.test.tsx`

**Test Scenarios:**
- ✅ Fetches batch and workflow status on mount
- ✅ Displays WorkflowProgressBar with correct props
- ✅ Displays CurrentStagePanel with correct props
- ✅ Shows loading spinner while fetching data
- ✅ Shows error message when API fails
- ✅ Polls for updates every 30 seconds
- ✅ Shows toast notification when stage changes
- ✅ Formats report date in page title

**Mock Strategy:**
```typescript
vi.mock('@/lib/api/batches', () => ({
  getReportBatch: vi.fn(),
  getBatchWorkflowStatus: vi.fn(),
}));

vi.mock('@/hooks/usePolling', () => ({
  usePolling: vi.fn((callback) => {
    // Simulate polling by calling callback immediately in test
    callback();
  }),
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));
```

---

### 6.6 Server Component Tests

**File:** `app/batches/[id]/workflow/__tests__/page.test.tsx`

**Test Scenarios:**
- ✅ Redirects to `/login` when user is not authenticated
- ✅ Redirects to `/auth/forbidden` when user lacks permission
- ✅ Redirects to `/batches` when batch ID is invalid (NaN)
- ✅ Renders WorkflowClient when authenticated and authorized
- ✅ Passes correct batch ID to WorkflowClient

**Mock Strategy:**
```typescript
vi.mock('@/lib/auth/auth-server', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/auth/auth-helpers', () => ({
  hasPageAccess: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));
```

---

## 7. Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| BatchWorkflowStatus schema is minimal (no per-stage timestamps) | Medium | Accept limitation for Story 3. Story 6 will use `/report-batches/{id}/approvals` for detailed history. For Story 3, tooltips show stage description only. |
| Polling creates excessive API load | Low | Use 30s interval (per Story spec). Consider adding exponential backoff if no changes detected. |
| API fails during polling | Medium | Catch errors silently - keep displaying previous state. Show toast only if initial load fails. |
| Batch deleted while viewing workflow | Low | Handle 404 errors - show error message and redirect to `/batches`. |
| Stage constants out of sync with backend | Medium | Document stage names in OpenAPI spec as enum. Validate against backend response in tests. |
| No WebSocket support (polling only) | Low | Accept polling for MVP. Future enhancement: add WebSocket support for real-time updates. |
| Real-time update notification may be too frequent | Low | Add debounce logic - only show toast if stage changes, not on every poll. |

---

## 8. Quality Gates Checklist

Before transitioning to SPECIFY phase, verify:

- [x] Story 1-2 infrastructure is understood and documented
- [x] OpenAPI endpoint `/report-batches/{id}/status` exists and schema is documented
- [x] API schema limitations identified (no per-stage timestamps)
- [x] All required Shadcn components are available (Card, Badge, Tooltip)
- [x] Date formatting utilities exist and additional function identified (`formatRelativeTime`)
- [x] BatchContext integration strategy is clear
- [x] Dynamic route pattern is understood (server component + client component split)
- [x] Polling strategy is defined (30s interval via `usePolling()` hook)
- [x] Test strategy follows Epic 1/2 patterns
- [x] No breaking changes to existing code

---

## 9. Open Questions for SPECIFY Phase

1. **Stage completion timestamps:** Story 3 AC says "tooltips show completion date" but API doesn't provide per-stage timestamps. Should tooltips just show stage description, or fetch approval history separately? **Decision:** Show description only in Story 3. Story 6 will add detailed history.

2. **Notification frequency:** Should we show toast on every stage change, or only major transitions (e.g., Data Prep → Approval)? **Recommendation:** Show toast for all stage changes to match AC "Workflow updated: Batch moved to Level 2 Approval".

3. **Rejection stage identification:** If a batch was rejected at Level 1, should the progress bar show the rejection icon on "Level 1" or on "Data Prep" (current stage after rejection)? **Decision:** Show rejection icon on the stage where rejection occurred (Level 1), and show current stage (Data Prep) with yellow dot.

4. **Action button implementation:** Story 3 includes "Confirm Data Ready" button. Should this call an API endpoint, or is it just a placeholder for future stories? **Decision:** Show button based on `canConfirm` flag, but actual API call is Story 4 (Data Confirmation & Locking).

5. **Navigation from progress bar:** When user clicks a stage in progress bar, what should happen? **Recommendation:** Show tooltip on hover, no action on click for Story 3. Story 6 (Workflow History) will add navigation to detailed event log.

---

## Conclusion

**Ready for SPECIFY Phase:** ✅ Yes

Story 1-2 provides excellent foundation:
- Batch API client is production-ready with `getReportBatch()`
- BatchContext provides global batch state
- Date formatting utilities exist (add `formatRelativeTime()` only)
- All required Shadcn UI components are installed
- OpenAPI endpoint exists for workflow status

**Critical Actions Before Implementation:**
1. Add `getBatchWorkflowStatus()` to `lib/api/batches.ts`
2. Create `lib/constants/workflow-stages.ts` with stage enum and helpers
3. Create `hooks/usePolling.ts` for real-time updates
4. Create `components/workflow/WorkflowProgressBar.tsx` component
5. Create `components/workflow/CurrentStagePanel.tsx` component
6. Create dynamic route `app/batches/[id]/workflow/page.tsx` and `WorkflowClient.tsx`

**Known Limitations (Acceptable for Story 3):**
- API schema doesn't provide per-stage completion timestamps (deferred to Story 6)
- Polling uses 30s interval instead of WebSocket (acceptable for MVP)
- Tooltips show stage description only (not completion timestamps)

**Next Step:** Transition to SPECIFY phase to write comprehensive test specifications for this story.
