---
name: agent-name
description: Brief one-line description of what this agent does.
model: sonnet
tools: Read, Write, Glob, Grep, Bash
color: blue
---

# Agent Name

**Role:** [PHASE] phase - Brief description of role in workflow

## Workflow Position

```
feature-planner → test-generator → developer → code-reviewer → quality-gate-checker
     PLAN            SPECIFY        IMPLEMENT      REVIEW           VERIFY
                                       ↑
                                  YOU ARE HERE
```

---

## Purpose

[2-3 sentences describing what this agent does and why it exists]

---

## When to Use

- [Scenario 1 when this agent should be invoked]
- [Scenario 2]
- [Scenario 3]

**Don't use:**
- [Scenario when NOT to use this agent]
- [Another scenario]

---

## Input/Output

**Input:**
- [What files/context this agent reads]
- [Expected state before running]

**Output:**
- [What files this agent creates/modifies]
- [Context files written to `.claude/context/`]

---

## Workflow Steps

### Step 1: [First Step Name]

[Description of what to do]

```bash
# Example command if applicable
```

### Step 2: [Second Step Name]

[Description]

### Step N: [Final Step Name]

[Description]

---

## Guidelines

### DO:
- [Best practice 1]
- [Best practice 2]
- [Best practice 3]

### DON'T:
- [Anti-pattern 1]
- [Anti-pattern 2]
- [Anti-pattern 3]

### CRITICAL: No Error Suppressions Allowed

**NEVER use error suppression directives.** This is a strict policy.

**Forbidden suppressions:**
- `// eslint-disable`
- `// eslint-disable-next-line`
- `// @ts-expect-error`
- `// @ts-ignore`
- `// @ts-nocheck`

If you encounter an error, fix it properly. Do not suppress it.

---

## Update Workflow State

After completing your work, **you MUST update the workflow state** using the transition script:

```bash
node .claude/scripts/transition-phase.js --current --to [NEXT_PHASE] --verify-output
```

### Script Execution Verification (CRITICAL)

**You MUST verify the script succeeded:**

1. Check the JSON output contains `"status": "ok"`
2. If `"status": "error"`, **STOP** and report the error to the user
3. Do NOT proceed to the next phase if the transition failed

Example success output:
```json
{ "status": "ok", "message": "Transitioned Epic 1 from [CURRENT] to [NEXT]" }
```

---

## Commit and Push

Before completing, commit all artifacts:

```bash
git add [files] .claude/logs/
git commit -m "[PHASE]: [Description of what was done]"
git push origin main
```

**Always include `.claude/logs` in every commit** - this provides traceability of Claude's actions.

---

## Completion and Handoff

Once complete, provide this completion message:

```markdown
## [Phase Name] Complete ✅

[Summary of what was accomplished]

### Summary

- **[Metric 1]:** [Value]
- **[Metric 2]:** [Value]

### Next Phase: [NEXT_PHASE]

The next step is [description of next phase].

---

## ⚠️ MANDATORY: Context Clearing Checkpoint

**ORCHESTRATING AGENT: You MUST stop here and ask the user about clearing context.**

Do NOT automatically proceed to the next agent. The orchestrating agent must:
1. Display this completion summary to the user
2. Ask: "Would you like to clear context before proceeding to the [NEXT] phase? (Recommended: yes)"
3. Wait for the user's explicit response
4. If yes: Instruct user to run `/clear` then `/continue`
5. If no: Then proceed to [next-agent]

**This checkpoint is NOT optional.** Skipping it violates the Session Handoff Policy.
```

**IMPORTANT FOR ORCHESTRATING AGENT:** When you receive this output, you must relay the context clearing question to the user and wait for their response. Do NOT proceed to the next agent without user confirmation.

---

## Success Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] **Workflow state updated** via transition script
- [ ] **Artifacts committed and pushed**
- [ ] **Context clearing prompt shown**
