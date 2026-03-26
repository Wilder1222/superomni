---
name: verification
description: |
  Use before claiming any task is complete.
  Performs a structured self-check to ensure all acceptance criteria are met.
  Triggers: "I'm done", "that's complete", "finished", before reporting DONE.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection
```bash
mkdir -p ~/.omni-skills/sessions
_PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_TEL_START=$(date +%s)
echo "Branch: $_BRANCH | PROACTIVE: $_PROACTIVE"
```

### PROACTIVE Mode
If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Session Continuity
After reporting any terminal status (DONE / DONE_WITH_CONCERNS), **always** close with a
"What's next?" line that names the next logical superomni skill:

```
What's next → [skill-name]: [one-sentence reason]
```

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls spec.md plan.md .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# Verification Before Completion

**Goal:** Systematically verify that work is complete and correct before declaring done.

## Iron Law: Evidence Required

"I think it works" is not evidence. "I believe it's correct" is not evidence.
Evidence is: running the code and showing output, passing test results, or observable behavior.

## The Verification Checklist

Run through this before reporting any status:

### 1. Functional Verification

- [ ] Does it do what the spec/plan/ticket says it should do?
- [ ] Run the actual code and observe the actual output
- [ ] Test the happy path: does it work for the normal case?
- [ ] Test edge cases: empty input, max values, null/nil?
- [ ] Test error conditions: does it fail gracefully?

```bash
# Run tests
npm test 2>&1 | tail -20
# or
pytest -v 2>&1 | tail -20
# or
go test ./... 2>&1 | tail -20
```

### 2. Test Verification

- [ ] Are there tests? (If no, is that intentional? If yes, why not?)
- [ ] Do all tests pass?
- [ ] Do tests verify behavior (not just implementation)?
- [ ] Are tests independent (can run in any order)?

### 3. Regression Verification

- [ ] Do existing tests still pass?
- [ ] Did you break anything adjacent?

```bash
# Run full test suite (not just new tests)
npm test 2>&1 | grep -E "(PASS|FAIL|Error)" | head -20
```

### 4. Completeness Verification

- [ ] Are all acceptance criteria from the spec/plan met?
- [ ] Are error paths handled?
- [ ] Is there appropriate logging for debuggability?
- [ ] Are edge cases covered?
- [ ] Is the code readable without requiring comments to explain "what"?

### 5. No Regressions Checklist

- [ ] Reviewed the diff: `git diff HEAD`
- [ ] No unintended files changed
- [ ] No debug code left in (console.log, print, debugger)
- [ ] No TODO left unresolved that blocks the task

```bash
# Quick diff review
git diff HEAD --stat
git diff HEAD | grep "console.log\|debugger\|TODO\|FIXME\|print(" | head -10
```

### 6. Blast Radius Check

- [ ] How many files were changed? (`git diff HEAD --stat | tail -1`)
- [ ] If >5 files: was this flagged to the user?
- [ ] Any unexpected files in the diff?

## Verification Report

After completing the checklist:

```
VERIFICATION REPORT
════════════════════════════════════════
Task:              [what was being implemented/fixed]
Tests run:         [N tests, N passing, N failing]
Acceptance criteria:
  ✓ [criterion 1]
  ✓ [criterion 2]
  ✗ [criterion 3] — FAILED (explain why)
Files changed:     [N files]
Regressions:       [none | list any]
Evidence:          [test output snippet or observed behavior]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Concerns (if any):
  - [concern 1 with recommendation]
════════════════════════════════════════
```

## When Verification Fails

If any check fails:

1. **P0 failure** (tests fail, criteria not met): report BLOCKED or go fix it
2. **P1 failure** (edge case missing, partial coverage): report DONE_WITH_CONCERNS with specific notes
3. **Ambiguous** (can't tell if it's working): report NEEDS_CONTEXT with specific question
