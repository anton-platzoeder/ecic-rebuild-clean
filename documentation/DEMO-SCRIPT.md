# InvestInsight - Steerco Demo Script

## Setup

Make sure the dev server is running:

```bash
cd web
npm run dev
```

Open `http://localhost:3000` in your browser.

## Demo Users

| Username    | Password   | Role           | Use for                          |
|-------------|------------|----------------|----------------------------------|
| `admin`     | `password` | Administrator  | Dashboard, user/role mgmt, audit |
| `analyst`   | `password` | Analyst         | Batch creation, data confirm     |
| `approver1` | `password` | ApproverL1      | L1 approval visibility           |
| `approver2` | `password` | ApproverL2      | L2 approval visibility           |
| `approver3` | `password` | ApproverL3      | L3 approval visibility           |

---

## Part 1: Login & Dashboard (as Admin)

1. Open `http://localhost:3000` - you'll be redirected to `/login`
2. Log in as **admin** / **password**
3. You land on the **Dashboard** - walk through:
   - **Pending Actions** - approval tasks, validation warnings, file alerts
   - **Active Batches** - January 2026 batch in Data Preparation
   - **Recent Activity** feed
   - **Data Quality Alerts**

---

## Part 2: Admin Pages (still as Admin)

4. Click **Users** in the nav - show user list, search/filter, click a user to view details
5. Click **Roles** in the nav - show role definitions and permissions
6. Click **Audit Trail** - show the compliance audit log

---

## Part 3: Batch Workflow (switch to Analyst)

7. **Log out** (user menu top-right -> Sign Out)
8. Log in as **analyst** / **password**
9. Click **Batches** - show the batch list with January 2026 in "Data Preparation"
10. Click the **January 2026 batch** - you'll see the Workflow State page with:
    - Progress bar (Data Prep -> L1 -> L2 -> L3 -> Published)
    - Current Stage panel showing "Data Preparation"
    - "Confirm Data Ready" button
11. Click **"Confirm Data Ready"** - validation dialog appears showing:
    - 2 missing files warning
    - Reference data warnings
12. Click **"Proceed Anyway"** - batch transitions to "Level 1 Pending"
13. Progress bar updates to show L1 as the current stage

---

## Part 4: Approval Visibility (switch to Approver)

14. **Log out**
15. Log in as **approver1** / **password**
16. Note the nav only shows **Dashboard** and **Approval L1** - role-based access in action
17. Click **Approval L1** - show the approval review page
18. **Talking point:** "This is where the L1 approver reviews file completeness and approves or rejects. The approval workflow UI is the next epic to be built - the backend states and permissions are already wired up."

---

## Part 5: Role Differences (optional, if time allows)

19. Log out, log in as **approver2** / **password** - only sees Approval L2
20. Log out, log in as **approver3** / **password** - only sees Approval L3

---

## Key Talking Points

- **Role-based access control** is fully working - each user sees different nav items and pages
- **5-stage workflow pipeline** is implemented: Data Prep -> L1 -> L2 -> L3 -> Published
- **Data validation** with warnings/errors before confirmation
- **Batch locking** once data is confirmed (no edits possible)
- **Audit trail** for compliance and SOX requirements
- **Next phase:** approval review UI and the approve/reject actions

## Business Rules to Highlight

- **Sequential enforcement** - can't create a new batch until the previous one is fully Approved
- **Batch locks on confirmation** - no edits once the Analyst confirms data
- **3-level approval** - L1 (Operations) -> L2 (Portfolio Manager) -> L3 (Executive), no skipping
- **Rejection goes back to start** - any rejection sends the batch back to Data Preparation
- **Segregation of duties** - Analyst cannot approve their own batch

## Things to Avoid During the Demo

- **Don't** click "Create New Batch" - it will fail because the existing batch isn't Approved yet
- **Don't** try to approve/reject on the approval pages - those buttons don't exist yet
- **Don't** navigate to `/batches` as an approver - they may not have access
- If something breaks, the mock data resets on server restart - just refresh
