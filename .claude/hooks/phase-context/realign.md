<!-- Source: .claude/agents/feature-planner.md (REALIGN mode) — keep in sync when agent process steps change -->

## REALIGN Phase Process

1. **Check** `generated-docs/discovered-impacts.md` for impacts affecting the upcoming story
2. **If no impacts**: Skip to handoff (auto-completes)
3. **If impacts exist**:
   - Present proposed revisions in conversation
   - **STOP and wait** for user approval (mandatory approval point)
   - Update the story file with approved revisions
   - Remove processed impacts from discovered-impacts.md
4. **Commit and transition**:
   ```bash
   git add generated-docs/
   git commit -m "REALIGN: Update Story M based on implementation learnings"
   node .claude/scripts/transition-phase.js --current --story M --to WRITE-TESTS --verify-output
   ```
5. **Proceed directly to WRITE-TESTS** (no context clearing at this boundary)

## What Happens Next
- WRITE-TESTS phase: test-generator creates failing tests for this story
- Then IMPLEMENT → QA → commit
