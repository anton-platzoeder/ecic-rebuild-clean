---
description: Start the TDD workflow - kicks off feature-planner to process specs from documentation/
---

Start the feature development workflow.

## Commit Policy

**IMPORTANT:** To avoid loss of work, create commits at every logical point:

- After SCOPE phase completes (epics defined)
- After STORIES phase completes for each epic
- After each story's VERIFY phase passes (commit includes tests + implementation)
- After creating multiple files (e.g., after every 2-3 wireframes)
- Before handing off to another agent

Each story is committed AFTER its VERIFY phase passes, not after IMPLEMENT.

## Session Handoff Policy (MANDATORY)

**At every phase transition, you MUST stop and ask the user about clearing context.**

This is **NOT optional**. Context clearing checkpoints occur:
- Between major phases (DESIGN → SCOPE → STORIES)
- Between story phases (REALIGN → SPECIFY → IMPLEMENT → REVIEW → VERIFY)
- After each story's VERIFY phase (before next story's REALIGN)
- Between epics (after last story's VERIFY, before next epic's STORIES)

When an agent completes a phase or story:

1. **STOP** - Do not immediately launch the next agent or start the next story
2. **RELAY** - Show the user the agent's completion summary
3. **ASK** - Explicitly ask: "Would you like to clear context before proceeding to [next phase/story]? (Recommended: yes)"
4. **WAIT** - Do not proceed until the user responds
5. **ACT** - If user says yes, instruct them to use `/clear` then `/continue`. If no, proceed accordingly.

**Why this matters:**
- Clean context for the next agent/story
- No confusion from previous conversation state
- Clear boundaries between phases and stories
- Prevents token accumulation across long workflows
- Each story implementation starts fresh

**Example of CORRECT behavior (between phases):**
```
Agent: "Wireframes complete. Files saved to generated-docs/wireframes/."
You: "The ui-ux-designer has completed wireframes. Would you like to clear context before proceeding to the PLAN phase? (Recommended: yes)"
User: "Yes" or "No"
[Then proceed accordingly]
```

**Example of CORRECT behavior (between stories):**
```
Agent: "Story 1 complete. Committed and pushed to main."
You: "Story 1 is complete. Would you like to clear context before implementing Story 2? (Recommended: yes for stories with significant code changes)"
User: "Yes" or "No"
[Then proceed accordingly]
```

**Example of INCORRECT behavior (DO NOT DO THIS):**
```
Agent: "Wireframes complete."
You: [Immediately launches feature-planner without asking about context]
```

```
Agent: "Story 1 complete."
You: [Immediately starts implementing Story 2 without asking about context]
```

## User Approval Policy (CRITICAL)

**NEVER auto-approve on behalf of the user.** When an agent (feature-planner, ui-ux-designer, etc.) asks for approval:

1. **STOP** and display the proposed content to the user in the conversation
2. **WAIT** for the user to explicitly approve, modify, or reject
3. **Only proceed** after receiving actual user confirmation

**Examples of what NOT to do:**
- ❌ "The feature-planner proposed 3 epics. Let me continue..."
- ❌ "Epics look good, proceeding to stories..."
- ❌ Spawning another Task to auto-approve

**Examples of correct behavior:**
- ✅ "The feature-planner has proposed these epics: [show epics]. Do you approve this structure?"
- ✅ Wait for user to say "approved" or provide feedback
- ✅ Only then continue to the next phase

## Workflow Overview

The workflow has three stages:

**Stage 1: One-time setup (DESIGN → SCOPE)**
```
/start → [ui-ux-designer] → feature-planner
              DESIGN             SCOPE
```
- DESIGN (optional): Create wireframes for UI features
- SCOPE: Define ALL epics (no stories yet) → user approves the epic list

**Stage 2: Per-epic (STORIES)**
```
For each epic:
  feature-planner (STORIES) → Define stories for THIS epic → user approves
```
- STORIES: Define stories and acceptance criteria for the current epic only

**Stage 3: Per-story iteration (REALIGN → SPECIFY → IMPLEMENT → REVIEW → VERIFY)**
```
For each story in the epic:
  feature-planner → test-generator → developer → code-reviewer → quality-gate-checker → commit & push
      REALIGN          SPECIFY        IMPLEMENT      REVIEW           VERIFY
```

**REALIGN:** Reviews any discovered impacts from previous stories and revises the upcoming story. Auto-completes if no impacts exist.

This ensures:
- ✅ Full epic scope visibility before story implementation begins
- ✅ Stories defined per-epic (not all upfront) for flexibility
- ✅ Tests written immediately before each story (true TDD)
- ✅ Quality gates always pass (no skipped tests)
- ✅ One commit per story after VERIFY passes
- ✅ Early feedback through per-story review
- ✅ Faster pivots - discover issues per-story, not per-epic
- ✅ Implementation learnings feed back into future story planning via REALIGN

## What to Do

### Step 0: Initialize Workflow State

**Before doing anything else, initialize the workflow state file.** This ensures `/continue` can resume the workflow if interrupted.

Based on whether wireframes will be created:
- **With wireframes:** `node .claude/scripts/transition-phase.js --init DESIGN`
- **Without wireframes:** `node .claude/scripts/transition-phase.js --init PLAN`

If state already exists, the script returns `"status": "exists"` - this is fine, proceed with the workflow.

### Step 1: Determine Starting Phase

**Check if wireframes would be helpful for this feature.**

If the feature involves UI screens, ask the user:

> "This feature appears to involve UI. Would you like me to create wireframes first using the **ui-ux-designer** agent, or proceed directly to scoping?"

- **If yes to wireframes:** Use the **ui-ux-designer** agent first, then continue to feature-planner
- **If no wireframes needed:** Use the **feature-planner** agent directly

## Option A: Start with Wireframes (UI Features)

**First, initialize state for DESIGN phase:**
```bash
node .claude/scripts/transition-phase.js --init DESIGN
```

Then use the **ui-ux-designer** agent to create wireframes:

```
Create wireframes for the feature specification in documentation/
```

The ui-ux-designer will:
1. Read the spec from `documentation/`
2. Identify screens needed (with your approval)
3. Create ASCII wireframes for each screen
4. Save to `generated-docs/wireframes/`
5. Hand off to feature-planner

## Option B: Start with Scoping (Default)

**First, initialize state for SCOPE phase:**
```bash
node .claude/scripts/transition-phase.js --init SCOPE
```

Then use the **feature-planner** agent to begin processing feature specifications.

**Default spec location:** `documentation/` directory

The feature-planner will:
1. Search for specs in `documentation/` (or ask for a path if none found)
2. Check for existing wireframes in `generated-docs/wireframes/`
3. Break the spec into ALL epics (no stories yet) → **STOP: Wait for user approval**
4. Transition to STORIES phase for Epic 1

**IMPORTANT:** SCOPE only defines epics. Stories are defined per-epic in the STORIES phase, just before that epic's implementation begins.

## Starting the Agent

Invoke the appropriate agent based on user preference:

**For wireframes first:**
```
Look for feature specifications in the documentation/ directory and create wireframes for the UI screens.
```

**For scoping directly:**
```
Look for feature specifications in the documentation/ directory and begin the scoping process.
```

If no specs are found, ask the user to provide a spec or specify its location.

## Script Execution Verification

**When agents run transition scripts, they MUST verify success:**

1. Check JSON output contains `"status": "ok"`
2. If `"status": "error"`, the agent must **STOP** and report the error
3. If `"status": "warning"`, inform user but may proceed

**You (as the orchestrator) should also verify** that agents are correctly transitioning state. If an agent reports a transition error, help troubleshoot:
- Check current state with: `node .claude/scripts/transition-phase.js --show`
- Validate artifacts with: `node .claude/scripts/validate-phase-output.js --phase <PHASE> --epic <N>`
- Repair if needed: `node .claude/scripts/transition-phase.js --repair`
