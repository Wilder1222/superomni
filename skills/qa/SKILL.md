---
name: qa
description: |
  Use when performing quality assurance on code changes.
  Identifies test gaps, writes missing tests, explores edge cases, and auto-fixes with caution.
  Triggers: "QA", "quality check", "test coverage", "run QA", "check quality".
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
1. Scan for **current-session** context (only artifacts modified after session start):
   ```bash
   _SESSION_TS=$(cat ~/.omni-skills/sessions/current-session-ts 2>/dev/null || echo "0")
   # List recent artifacts, filtering by session timestamp
   for f in docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md; do
     [ -f "$f" ] || continue
     fts=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo "0")
     [ "$fts" -ge "$_SESSION_TS" ] 2>/dev/null && echo "$f"
   done
   git log --oneline -3 2>/dev/null
   ```
   To find the latest current-session spec or plan:
   ```bash
   _SESSION_TS=$(cat ~/.omni-skills/sessions/current-session-ts 2>/dev/null || echo "0")
   _LATEST_SPEC=""
   _LATEST_PLAN=""
   for f in $(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort); do
     fts=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo "0")
     [ "$fts" -ge "$_SESSION_TS" ] 2>/dev/null && _LATEST_SPEC="$f"
   done
   for f in $(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort); do
     fts=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo "0")
     [ "$fts" -ge "$_SESSION_TS" ] 2>/dev/null && _LATEST_PLAN="$f"
   done
   ```
2. If current-session context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no current-session context → treat as a fresh session and offer the relevant skill from the
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

# Quality Assurance

**Goal:** Ensure code changes are correct, well-tested, and free of regressions through systematic test analysis, gap filling, and edge case exploration.

## Iron Law

**NEVER MARK A TEST GREEN BY WEAKENING THE ASSERTION.**

If a test fails, the fix is to fix the code or update the test to match a *correct* new behavior — never to loosen the assertion just to make it pass. A test that asserts nothing is worse than no test.

## Phase 1: Identify Test Scope

Determine what changed and what could break.

```bash
# What files changed?
git diff main...HEAD --stat 2>/dev/null || git diff HEAD~1 --stat

# What functions/classes were modified?
git diff main...HEAD 2>/dev/null | grep "^@@" | head -30

# What modules could be affected by these changes?
git diff main...HEAD --name-only 2>/dev/null | while read f; do
  grep -rl "$(basename "$f" | sed 's/\..*//')" . \
    --include="*.js" --include="*.ts" --include="*.py" --include="*.go" \
    2>/dev/null
done | sort -u | head -20

# Find existing tests for changed files
git diff main...HEAD --name-only 2>/dev/null | while read f; do
  base=$(basename "$f" | sed 's/\..*//')
  find . -name "*${base}*test*" -o -name "*${base}*spec*" -o -name "test_*${base}*" \
    2>/dev/null
done | sort -u | head -20
```

Produce a scope map:

```
QA SCOPE
─────────────────────────────────
Files changed:     [list]
Functions affected: [list key functions]
Existing tests:    [list test files that cover these changes]
Missing tests:     [files/functions with no test coverage]
Blast radius:      [what else could break]
─────────────────────────────────
```

## Phase 2: Run Existing Test Suite

Run the full test suite and capture results.

```bash
# Run tests with verbose output
npm test 2>&1 | tee qa-results.txt || true
# or
pytest -v 2>&1 | tee qa-results.txt || true
# or
go test -v ./... 2>&1 | tee qa-results.txt || true

# Summary
echo "---"
grep -cE "PASS|✓|ok " qa-results.txt 2>/dev/null || true
grep -cE "FAIL|✗|FAILED" qa-results.txt 2>/dev/null || true
rm -f qa-results.txt
```

Record results:

```
TEST SUITE RESULTS
─────────────────────────────────
Total:    [N]
Passing:  [N]
Failing:  [N]
Skipped:  [N]
Duration: [Ns]
─────────────────────────────────
```

If tests fail, classify each failure:

| Failure | Type | Action |
|---------|------|--------|
| Test broke due to your change | Regression | Fix the code (not the test) |
| Test was already broken | Pre-existing | Note it, don't fix during QA |
| Test is flaky (passes on re-run) | Flaky | Note it, consider stabilizing |
| Test assertion is wrong (spec changed) | Outdated | Update test to match new spec |

## Phase 3: Write Missing Tests

For each uncovered code path identified in Phase 1:

1. **Identify the behavior** — what should this code do?
2. **Write a test** — one behavior per test, descriptive name
3. **Run the test** — verify it passes (and would fail if the behavior broke)

### Test Naming Convention

Follow the project's existing convention. If none exists, use:

```
test_[function]_[scenario]_[expected result]

# Examples:
test_calculateTotal_emptyCart_returnsZero
test_authenticate_expiredToken_throwsAuthError
test_parseConfig_missingRequiredField_usesDefault
```

### What to Cover

- **Happy path** — does it work for normal input?
- **Boundary values** — 0, 1, max, empty, null
- **Error conditions** — invalid input, missing dependencies, timeout
- **State transitions** — before/after key operations

```bash
# Check coverage after writing tests (if coverage tool exists)
npm run test:coverage 2>/dev/null | tail -20 || true
pytest --cov 2>/dev/null | tail -20 || true
go test -cover ./... 2>/dev/null | tail -20 || true
```

## Phase 4: Edge Case Exploration

Go beyond the obvious. For each changed function, consider:

| Category | Examples |
|----------|----------|
| Empty/null | `null`, `undefined`, `""`, `[]`, `{}` |
| Boundary | `0`, `-1`, `MAX_INT`, single character, max length |
| Type coercion | `"123"` vs `123`, `true` vs `1`, `0` vs `false` |
| Concurrency | Two simultaneous calls, race conditions |
| Encoding | Unicode, emoji, special characters, RTL text |
| Large input | Very long strings, huge arrays, deep nesting |
| Malicious input | SQL injection strings, XSS payloads, path traversal |

For each edge case found:
1. Write a test that exercises the edge case
2. If the code handles it correctly — great, the test documents this
3. If the code fails — report the bug, write a regression test

## Phase 5: Auto-Fix Failing Tests

**Only fix a failing test if the root cause is understood.**

Decision tree:

```
Test fails → Do you understand WHY it fails?
  ├── YES → Is the test correct (matches spec)?
  │     ├── YES → Fix the CODE (the code has a bug)
  │     └── NO  → Fix the TEST (spec changed, test is outdated)
  └── NO  → STOP. Investigate root cause first.
            Do NOT change the test or code without understanding.
```

Rules:
- **Never delete a failing test** without understanding why it fails
- **Never weaken an assertion** (e.g., changing `assertEquals` to `assertNotNull`)
- **Never add `skip` / `xit` / `@pytest.mark.skip`** without documenting the reason
- **If fixing the code causes other tests to fail**, stop and reassess — the change may be wrong

```bash
# After fixes, run the full suite again
npm test 2>&1 | tail -20
# Verify no new failures introduced
```

## Phase 6: QA Report

```
QA REPORT
════════════════════════════════════════
Scope:           [what was tested]
Changes tested:  [N files, N functions]

Test Results (before QA):
  Passing:   [N]
  Failing:   [N]
  Skipped:   [N]

Test Results (after QA):
  Passing:   [N]
  Failing:   [N]
  Skipped:   [N]
  New tests: [N added]

Coverage:
  Before:    [N% or "not measured"]
  After:     [N% or "not measured"]

Edge Cases Found:
  - [edge case 1] — [handled/bug filed]
  - [edge case 2] — [handled/bug filed]

Bugs Found:
  - [bug 1]: [description] — [fixed/reported]
  - [bug 2]: [description] — [fixed/reported]

Flaky Tests:
  - [test name] — [observed behavior]

Risk Assessment:
  [LOW/MEDIUM/HIGH] — [1-sentence justification]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
════════════════════════════════════════
```
