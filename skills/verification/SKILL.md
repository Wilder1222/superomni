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
   ls docs/superomni/specs/spec.md docs/superomni/plans/plan.md docs/superomni/ .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Question Confirmation Protocol

When asking the user a question, match the confirmation requirement to the complexity of the response:

| Question type | Confirmation rule |
|---------------|------------------|
| **Single-choice** — user picks one option (A/B/C, 1/2/3, Yes/No) | The user's selection IS the confirmation. Do NOT ask "Are you sure?" or require a second submission. |
| **Free-text input** — user types a value and presses Enter | The submitted text IS the confirmation. No secondary prompt needed. |
| **Multi-choice** — user selects multiple items from a list | After the user lists their selections, ask once: "Confirm these selections? (Y to proceed)" before acting. |
| **Complex / open-ended discussion** — back-and-forth clarification | Collect all input, then present a summary and ask: "Ready to proceed with the above? (Y/N)" before acting. |

**Rule: never add a redundant confirmation layer on top of a single-choice or text-input answer.**

**Custom Input Option Rule:** Whenever you present a predefined list of choices (A/B/C, numbered options, etc.), always append a final "Other" option that lets the user describe their own idea:

```
  [last letter/number + 1]) Other — describe your own idea: ___________
```

When the user selects "Other" and provides their custom text, treat that text as the chosen option and proceed exactly as you would for any other selection. If the custom text is ambiguous, ask one clarifying question before proceeding.

### Context Window Management
Load context progressively — only what is needed for the current phase:

| Phase | Load these | Defer these |
|-------|-----------|------------|
| Planning | `docs/superomni/specs/spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `docs/superomni/plans/plan.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

### Feedback Signal Protocol
Agent failures are harness signals — not reasons to retry the same approach:

- **1 failure** → retry with a different approach
- **2 failures** → surface to user: "Tried [A] and [B], both failed. Recommend [C]."
- **3 consecutive failures** → STOP. Report BLOCKED. Treat as a harness deficiency signal.
  Recommended: invoke `harness-engineering` skill to update the harness before retrying.
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

### Performance Checkpoint
After completing any skill session, run a 3-question self-check before writing the final status:

1. **Process** — Did I follow all defined phases? If any were skipped, state why.
2. **Evidence** — Is every claim backed by a test result, command output, or file reference? If not, gather the missing evidence now.
3. **Scope** — Did I stay within the task boundary? If I touched files outside the original scope, flag them explicitly.

If any answer is NO, address it before reporting DONE. If it cannot be addressed, report DONE_WITH_CONCERNS and name the gap.

For a full performance evaluation spanning the entire sprint, use the `self-improvement` skill.

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

### 0. Goal Alignment Check (run first)

Before any technical checks, verify the output achieves what the user originally asked for.

```bash
# Read acceptance criteria from spec or plan
cat docs/superomni/specs/spec.md 2>/dev/null | grep -A 30 "Acceptance Criteria" | head -40 || \
  cat docs/superomni/plans/plan.md 2>/dev/null | grep -A 20 "Success Criteria" | head -30 || \
  echo "No docs/superomni/specs/spec.md or docs/superomni/plans/plan.md found"
```

For **each acceptance criterion** in docs/superomni/specs/spec.md or docs/superomni/plans/plan.md:

| Criterion | Met? | Evidence |
|-----------|------|----------|
| [criterion from spec] | ✓/✗ | [specific proof: test output, observable behavior, or code reference] |

**If docs/superomni/specs/spec.md does not exist:**
- State what user goal this change fulfills
- List observable outcomes that prove the goal is met

**Gate:** Cannot report DONE if any P0 acceptance criterion is unmet.

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

- [ ] Are there tests? (If new code was written, tests are **mandatory** — this is a hard gate)
- [ ] Do all tests pass?
- [ ] Do tests verify behavior (not just implementation)?
- [ ] Are tests independent (can run in any order)?
- [ ] Was TDD followed? (test written before implementation)

**Hard gate for new code:** If new source code was written and no tests exist for it, report BLOCKED — do not advance to DONE until tests are added. The only valid exception is a documented reason (pure UI layout, throw-away prototype).

```bash
# Step 1: List source files changed (exclude tests and docs)
git diff HEAD --name-only | grep -vE "(test|spec|\.md$|\.txt$)" | head -10

# Step 2: List test files changed
git diff HEAD --name-only | grep -E "(test|spec|_test\.|\.test\.)" | head -10

# Step 3: Check if any source file has a corresponding test file
# For each changed source file, search for a test file by base name
for f in $(git diff HEAD --name-only | grep -vE "(test|spec|\.md$)"); do
  base=$(basename "$f" | sed 's/\..*//')
  found=$(find . -name "*${base}*test*" -o -name "*${base}*spec*" -o \
          -name "test_*${base}*" 2>/dev/null | head -1)
  if [ -z "$found" ]; then
    echo "MISSING TESTS: $f (no test file found for '$base')"
  else
    echo "HAS TESTS: $f → $found"
  fi
done
```

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

Goal Alignment:
  Spec/plan used:  [docs/superomni/specs/spec.md | docs/superomni/plans/plan.md | user request]
  ✓/✗ [acceptance criterion 1] — [evidence]
  ✓/✗ [acceptance criterion 2] — [evidence]
  User goal achieved: YES | PARTIAL | NO

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

## Save Evaluation Report

After completing verification, save the report as a persistent Markdown document:

```bash
EVAL_DIR="docs/superomni/evaluations"
mkdir -p "$EVAL_DIR"
BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "main")
SESSION="<session>"  # Auto-generate from conversation context, e.g. "vibe-skill", "auth-refactor"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
EVAL_FILE="$EVAL_DIR/evaluation-${BRANCH}-${SESSION}-${TIMESTAMP}.md"
```

Write the full VERIFICATION REPORT block (including all checklist results, test output, and goal alignment table) to `$EVAL_FILE` in this format:

```markdown
# Verification Evaluation: [branch]

**Date:** [date]
**Branch:** [branch]
**Task:** [what was being verified]

## Checklist Results

| Check | Result | Notes |
|-------|--------|-------|
| Functional verification | ✓/✗ | |
| Test verification | ✓/✗ | |
| Regression verification | ✓/✗ | |
| Completeness | ✓/✗ | |
| No regressions | ✓/✗ | |
| Blast radius | ✓/✗ | |

## Goal Alignment

Spec/plan used: [docs/superomni/specs/spec.md | docs/superomni/plans/plan.md | user request]

| Criterion | Met? | Evidence |
|-----------|------|----------|
| [criterion 1] | ✓/✗ | [proof] |

## Evidence

[Test output snippet or observed behavior]

## Verdict

[Paste full VERIFICATION REPORT block here]

**Status:** DONE | DONE_WITH_CONCERNS | BLOCKED
```

```bash
echo "Evaluation saved to $EVAL_FILE"
```

This file is the permanent task evaluation record. It feeds into `self-improvement` and future sprint retrospectives.

## When Verification Fails

If any check fails:

1. **P0 failure** (tests fail, criteria not met): report BLOCKED or go fix it
2. **P1 failure** (edge case missing, partial coverage): report DONE_WITH_CONCERNS with specific notes
3. **Ambiguous** (can't tell if it's working): report NEEDS_CONTEXT with specific question
