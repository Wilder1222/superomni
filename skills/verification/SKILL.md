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

Check proactive configuration:
```bash
_PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
```

**Legacy mode (single value):**
If `proactive=true`: auto-invoke skills. If `proactive=false`: ask first.

If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

**5-Level Trust Matrix (when configured):**

Before executing any decision, classify its tacit knowledge intensity:

| Decision Type | Config Key | Default | When to Use |
|--------------|------------|---------|-------------|
| Mechanical | proactive.mechanical | true | Iron Law applies, Gate Check is deterministic |
| Structural | proactive.structural | true | Architecture, interface, module boundaries |
| Stylistic | proactive.stylistic | ask | Naming, formatting, UI layout, comment style |
| Strategic | proactive.strategic | ask | Approach selection, architecture trade-offs |
| Destructive | proactive.destructive | false | Delete, overwrite, irreversible operations |

Classification rules:
- If a style profile exists (`docs/superomni/style-profiles/`), stylistic decisions
  that match the profile can be treated as mechanical
- Strategic decisions ALWAYS surface to user unless `proactive.strategic=true`
- Destructive decisions ALWAYS confirm (integrates with `careful` Skill) regardless of config

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Auto-Advance Rule

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT) auto-advance on DONE.

| Status | At THINK stage (after spec generation) | At all other stages |
|--------|----------------------------------------|-------------------|
| **DONE** | STOP - present spec document for user review. Wait for user approval before advancing to PLAN. | Auto-advance - print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP - present concerns, wait for user decision | STOP - present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP - present blocker, wait for user | STOP - present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE -> advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

**Note:** The REVIEW stage (plan-review) runs fully automatically — all decisions (mechanical and taste) are auto-resolved using the 6 Decision Principles. No user input is requested during REVIEW.

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md docs/superomni/ .superomni/ 2>/dev/null | head -20
   git log --oneline -3 2>/dev/null
   ```
   To find the latest spec or plan:
   ```bash
   _LATEST_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
   _LATEST_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
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
| Planning | Latest `docs/superomni/specs/spec-*.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | Latest `docs/superomni/plans/plan-*.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

### Output Directory
All skill artifacts are written to `docs/superomni/` (relative to project root).
See the Document Output Convention in CLAUDE.md for the full directory map.

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

### TACIT-DENSE Detection (Tacit Knowledge Density Check)

Before executing substantive decisions, check if any falls into these high-tacit-density categories.
These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
has enough tacit knowledge to judge correctly.

**D1 - Domain Expertise Decision**
  Trigger: Requires judgment in a specialized domain (security, compliance, legal, medical, financial)
  Examples: choosing encryption algorithm, deciding data retention policy, HIPAA compliance choice
  Action: State "TACIT-DENSE [D1]", present options with trade-offs, wait for user selection

**D2 - User-Facing Experience Decision**
  Trigger: Substantive choices about UI copy, interaction flow, error messaging, onboarding
  Examples: writing onboarding guidance text, choosing error message tone, designing empty states
  Action: Provide draft with explicit markers on parts needing user review

**D3 - Team Culture & Convention Decision**
  Trigger: Major choices about team workflow, naming conventions, documentation style, file organization
  Examples: naming convention for new module, choosing between monorepo approaches, doc format
  Action: Check docs/superomni/style-profiles/ first; if no profile, ask user

**D4 - Novel Pattern Decision**
  Trigger: Task type has fewer than 3 precedents in project execution history
  Examples: first-time integration of a new framework, first use of a new deployment target
  Action: Reduce autonomy — add intermediate checkpoints, present approach before executing

**Output format when TACIT-DENSE detected:**
```
TACIT-DENSE [D1/D2/D3/D4]: This is a [category] decision requiring your judgment.
Question: [single most important question]
My default recommendation: [recommendation + rationale]
Please confirm or share your preference.
```

**Relationship with careful skill:** careful handles "can we undo this?" (operational risk).
TACIT-DENSE handles "can we judge this correctly?" (knowledge risk). They are complementary.

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

### Plan Mode Fallback

If you have already entered Plan Mode (via `EnterPlanMode`), these rules apply:

1. **Skills take precedence over plan mode.** Treat loaded skill instructions as executable steps, not reference material. Follow them exactly — do not summarize, skip, or reorder.
2. **STOP points in skills must be respected.** Do NOT call `ExitPlanMode` prematurely to bypass a skill's STOP/gate.
3. **Safe operations in plan mode** — these are always allowed because they inform the plan, not produce code:
   - Reading files, searching code, running `git log`/`git status`
   - Writing to `docs/superomni/` (specs, plans, reviews)
   - Writing to `~/.omni-skills/` (sessions, analytics)
4. **Route planning through vibe workflow.** Even inside plan mode, follow the pipeline: brainstorm → writing-plans → plan-review → executing-plans. Write the plan to `docs/superomni/plans/`, not to Claude's built-in plan file.
5. **ExitPlanMode timing:** Only call `ExitPlanMode` after the current skill workflow is complete and has reported a status (DONE/BLOCKED/etc).


# Verification Before Completion

**Goal:** Systematically verify that work is complete and correct before declaring done.

## Iron Law: Evidence Required

"I think it works" is not evidence. "I believe it's correct" is not evidence.
Evidence is: running the code and showing output, passing test results, or observable behavior.

### Good Example (Evidence Required)
```
Agent claims feature is complete.
Evidence provided:
  1. npm test output: "15 tests, 15 passing, 0 failing"
  2. Manual verification: curl -X POST /api/users -> 201 Created
  3. Edge case tested: curl -X POST /api/users (empty body) -> 400 Bad Request
  4. Screenshot: UI renders correctly with new component
Result: DONE — all evidence is observable and reproducible
```

### Bad Example (AVOID)
```
Agent claims feature is complete.
Evidence provided:
  "I believe the implementation is correct based on the logic"
  "It should work because I followed the pattern from the other module"
Result: NOT ACCEPTABLE — "believe" and "should" are not evidence
[VIOLATED: No test output, no command results, no observable behavior shown]
```

### Common Excuse Rebuttals
| Excuse | Rebuttal |
|--------|----------|
| "The logic is straightforward, it must work" | Straightforward logic still needs proof — run the test |
| "I followed the same pattern as module X" | Pattern match is not verification — show the output |
| "Tests aren't set up for this area" | Then set them up — untestable claims cannot be verified |

## The Verification Checklist

Run through this before reporting any status:

### 0. Goal Alignment Check (run first)

Before any technical checks, verify the output achieves what the user originally asked for.

```bash
# Read acceptance criteria from spec or plan
_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
cat "$_SPEC" 2>/dev/null | grep -A 30 "Acceptance Criteria" | head -40 || \
  cat "$_PLAN" 2>/dev/null | grep -A 20 "Success Criteria" | head -30 || \
  echo "No docs/superomni/specs/spec-*.md or docs/superomni/plans/plan-*.md found"
```

For **each acceptance criterion** in docs/superomni/specs/spec-*.md or docs/superomni/plans/plan-*.md:

| Criterion | Met? | Evidence |
|-----------|------|----------|
| [criterion from spec] | ✓/✗ | [specific proof: test output, observable behavior, or code reference] |

**If no docs/superomni/specs/spec-*.md exists:**
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
  Spec/plan used:  [docs/superomni/specs/spec-*.md | docs/superomni/plans/plan-*.md | user request]
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
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
EVAL_FILE="$EVAL_DIR/evaluation-${BRANCH}-${TIMESTAMP}.md"
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

Spec/plan used: [docs/superomni/specs/spec-*.md | docs/superomni/plans/plan-*.md | user request]

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
