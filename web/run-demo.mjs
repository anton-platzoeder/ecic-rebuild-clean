/**
 * InvestInsight - Automated Steerco Demo
 *
 * Run from project root:
 *   cd web && node ../demo/run-demo.mjs
 *
 * Press ENTER in the terminal to advance to the next step.
 * A speech bubble appears on screen describing what is being shown.
 */

import { chromium } from 'playwright';
import * as readline from 'readline';

const BASE_URL = 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function waitForEnter(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`\n>>> ${prompt}  [Press ENTER to continue] `, () => {
      rl.close();
      resolve();
    });
  });
}

async function showBubble(page, text) {
  await page.evaluate((msg) => {
    // Remove any existing bubble
    const old = document.getElementById('demo-bubble');
    if (old) old.remove();

    const bubble = document.createElement('div');
    bubble.id = 'demo-bubble';
    bubble.textContent = msg;
    Object.assign(bubble.style, {
      position: 'fixed',
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '99999',
      background: '#1e293b',
      color: '#f8fafc',
      padding: '16px 28px',
      borderRadius: '12px',
      fontSize: '17px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '700px',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      lineHeight: '1.5',
      animation: 'fadeIn 0.3s ease-out',
    });

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`;
    document.head.appendChild(style);

    document.body.appendChild(bubble);
  }, text);
}

async function removeBubble(page) {
  await page.evaluate(() => {
    const el = document.getElementById('demo-bubble');
    if (el) el.remove();
  });
}

async function login(page, username, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[name="username"], input[id="username"], input[type="text"]');
  const usernameInput = page.locator('input').first();
  const passwordInput = page.locator('input[type="password"]');
  await usernameInput.fill(username);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

async function logout(page) {
  // Click user menu / avatar to open dropdown, then sign out
  // Try common patterns
  try {
    // Look for a user menu button or avatar
    const userButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), button:has-text("Sign out")');
    if (await userButton.count() > 0) {
      await userButton.first().click();
      await page.waitForTimeout(500);
      return;
    }

    // Try clicking avatar/user area first to open dropdown
    const avatar = page.locator('[data-testid="user-menu"], button:has(.avatar), button:has-text("Sarah"), button:has-text("Emily"), button:has-text("David"), button:has-text("admin")');
    if (await avatar.count() > 0) {
      await avatar.first().click();
      await page.waitForTimeout(500);
      const signOut = page.locator('text=Sign Out, text=Logout, text=Sign out');
      if (await signOut.count() > 0) {
        await signOut.first().click();
        await page.waitForTimeout(500);
        return;
      }
    }
  } catch {
    // Fallback: clear cookies and navigate to login
  }

  // Fallback: clear cookies
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`);
}

async function step(page, bubble, terminalPrompt) {
  await showBubble(page, bubble);
  await waitForEnter(terminalPrompt);
  await removeBubble(page);
}

// ---------------------------------------------------------------------------
// Demo Script
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n===========================================');
  console.log('  InvestInsight - Steerco Demo');
  console.log('  Press ENTER to advance each step');
  console.log('===========================================\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });
  const context = await browser.newContext({
    viewport: null, // Use full window size
  });
  const page = await context.newPage();

  try {
    // -----------------------------------------------------------------------
    // PART 1: Login & Dashboard (Admin)
    // -----------------------------------------------------------------------
    await waitForEnter('Ready to start the demo?');

    await page.goto(`${BASE_URL}/login`);
    await step(page,
      'Welcome to InvestInsight - Investment Compliance & Insights Platform. Let\'s start by logging in as an Administrator.',
      'STEP 1: Login page shown'
    );

    await login(page, 'admin', 'password');
    await page.waitForTimeout(1000);
    await step(page,
      'Dashboard - The central hub showing Pending Actions, Active Batches, Recent Activity, and Data Quality Alerts. Each user sees role-specific information here.',
      'STEP 2: Dashboard overview'
    );

    // Scroll down to show more of dashboard
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await page.waitForTimeout(500);
    await step(page,
      'Active Batches & Recent Activity - The January 2026 batch is currently in Data Preparation. The activity feed shows an audit trail of recent actions across the system.',
      'STEP 3: Dashboard - batches & activity'
    );

    // -----------------------------------------------------------------------
    // PART 2: Admin Pages
    // -----------------------------------------------------------------------
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(300);

    await page.locator('a:has-text("Users"), nav >> text=Users').first().click();
    await page.waitForTimeout(1000);
    await step(page,
      'User Management - Administrators can search, filter, and manage all system users. Each user has assigned roles that control their access to pages and features.',
      'STEP 4: User Management page'
    );

    await page.locator('a:has-text("Roles"), nav >> text=Roles').first().click();
    await page.waitForTimeout(1000);
    await step(page,
      'Role & Permission Management - Defines what each role can do. Roles include Analyst, Approver L1/L2/L3, and Administrator. Permissions are granular and assigned per role.',
      'STEP 5: Roles page'
    );

    await page.locator('a:has-text("Audit"), nav >> text=Audit').first().click();
    await page.waitForTimeout(1000);
    await step(page,
      'Audit Trail - Full compliance log of all changes in the system. Tracks who changed what and when. Supports 7-year retention requirements and SOX compliance.',
      'STEP 6: Audit Trail page'
    );

    // -----------------------------------------------------------------------
    // PART 3: Batch Workflow (Analyst)
    // -----------------------------------------------------------------------
    await step(page,
      'Now let\'s switch to the Analyst role to demonstrate the batch workflow. Notice how the navigation changes based on the user\'s role.',
      'STEP 7: Switching to Analyst'
    );

    await logout(page);
    await page.waitForTimeout(500);
    await login(page, 'analyst', 'password');
    await page.waitForTimeout(1000);
    await step(page,
      'Logged in as Analyst (Emily Johnson). Notice the nav bar now shows Dashboard and Batches only - no Admin pages. Role-based access control in action.',
      'STEP 8: Analyst dashboard'
    );

    await page.locator('a:has-text("Batches"), nav >> text=Batches').first().click();
    await page.waitForTimeout(1000);
    await step(page,
      'Batch Management - Lists all report batches. The January 2026 batch is in "Data Preparation" status. New batches can only be created when all existing ones are Approved.',
      'STEP 9: Batch list'
    );

    // Click on the January 2026 batch card (scoped to <article> to avoid the nav batch switcher)
    const batchCard = page.locator('article a:has-text("January 2026"), article:has-text("January 2026") a').first();
    if (await batchCard.count() > 0) {
      await batchCard.click();
    } else {
      // Fallback: navigate directly
      await page.goto(`${BASE_URL}/batches/1/workflow`);
    }
    await page.waitForTimeout(1500);
    await step(page,
      'Workflow State Visualization - Shows the 5-stage pipeline: Data Prep \u2192 L1 Approval \u2192 L2 Approval \u2192 L3 Approval \u2192 Published. Currently in Data Preparation.',
      'STEP 10: Workflow page'
    );

    await step(page,
      'The "Confirm Data Ready" button triggers a validation check before locking the batch. Let\'s click it to see the validation dialog.',
      'STEP 11: About to click Confirm Data Ready'
    );

    // Click Confirm Data Ready
    const confirmBtn = page.locator('button:has-text("Confirm Data Ready"), button:has-text("Confirm")').first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    await step(page,
      'Validation Dialog - Shows file completeness (3 of 5 received) and reference data warnings. The Analyst can review issues or proceed anyway. This ensures data quality before entering the approval pipeline.',
      'STEP 12: Validation dialog shown'
    );

    // Click Proceed Anyway
    const proceedBtn = page.locator('button:has-text("Proceed Anyway"), button:has-text("Proceed")').first();
    if (await proceedBtn.count() > 0) {
      await proceedBtn.click();
      await page.waitForTimeout(2000);
    }

    await step(page,
      'Batch confirmed! The status has moved to "Level 1 Pending". The batch is now locked - no more edits. It enters the 3-level approval pipeline: Operations \u2192 Portfolio Manager \u2192 Executive.',
      'STEP 13: Batch confirmed, moved to L1'
    );

    // -----------------------------------------------------------------------
    // PART 4: Approval Visibility
    // -----------------------------------------------------------------------
    await step(page,
      'Now let\'s see the approval experience. We\'ll log in as the Level 1 Approver (Operations). Notice how each approver only sees their own approval level.',
      'STEP 14: Switching to Approver L1'
    );

    await logout(page);
    await page.waitForTimeout(500);
    await login(page, 'approver1', 'password');
    await page.waitForTimeout(1000);
    await step(page,
      'Logged in as Approver L1 (David Kim). The nav shows only Dashboard and Approval L1 - strict role separation ensures segregation of duties. The Analyst cannot approve their own batch.',
      'STEP 15: Approver L1 dashboard'
    );

    const approvalLink = page.locator('a:has-text("Approval"), nav >> text=Approval').first();
    if (await approvalLink.count() > 0) {
      await approvalLink.click();
      await page.waitForTimeout(1000);
    }
    await step(page,
      'Level 1 Approval Review - The Operations approver reviews file completeness and data validation. They can approve (advancing to L2) or reject (sending back to Data Preparation). This UI is the next epic to be built.',
      'STEP 16: Approval L1 page'
    );

    // -----------------------------------------------------------------------
    // PART 5: Role Differences
    // -----------------------------------------------------------------------
    await step(page,
      'Let\'s quickly show the other approval levels to demonstrate role isolation.',
      'STEP 17: Switching to Approver L2'
    );

    await logout(page);
    await page.waitForTimeout(500);
    await login(page, 'approver2', 'password');
    await page.waitForTimeout(1000);

    const approvalL2Link = page.locator('a:has-text("Approval"), nav >> text=Approval').first();
    if (await approvalL2Link.count() > 0) {
      await approvalL2Link.click();
      await page.waitForTimeout(1000);
    }
    await step(page,
      'Level 2 Approval (Portfolio Manager) - Lisa Wang only sees her approval level. She reviews holdings reasonableness and performance results before approving.',
      'STEP 18: Approver L2 page'
    );

    await logout(page);
    await page.waitForTimeout(500);
    await login(page, 'approver3', 'password');
    await page.waitForTimeout(1000);

    const approvalL3Link = page.locator('a:has-text("Approval"), nav >> text=Approval').first();
    if (await approvalL3Link.count() > 0) {
      await approvalL3Link.click();
      await page.waitForTimeout(1000);
    }
    await step(page,
      'Level 3 Approval (Executive) - James Thompson gives the final sign-off before publication. Three independent reviewers must approve before any report goes live.',
      'STEP 19: Approver L3 page'
    );

    // -----------------------------------------------------------------------
    // WRAP UP
    // -----------------------------------------------------------------------
    await step(page,
      'Demo Complete! Summary: Role-based access control, 5-stage workflow pipeline, data validation with quality gates, batch locking, full audit trail, and 3-level approval separation. Next phase: approval review UI.',
      'DEMO COMPLETE'
    );

  } catch (err) {
    console.error('\nDemo error:', err.message);
  } finally {
    await waitForEnter('Press ENTER to close the browser');
    await browser.close();
  }
}

main();
