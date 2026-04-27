---
name: refactoring
description: |
  Systematic code refactoring with safety gates.
  Improves code structure without changing behavior.
  Dispatches refactoring-agent for execution.
  Triggers: "refactor", "clean up code", "reduce tech debt", "improve code quality",
  "extract method", "rename", "make this cleaner".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection

On session start, read: branch from `git branch --show-current`, session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Auto-Advance Rule

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE) auto-advance on DONE.

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
1. Read `~/.omni-skills/sessions/current-session-ts` to get session start timestamp. Find artifacts in `docs/superomni/specs/`, `docs/superomni/plans/` newer than that timestamp using `find -newer`. Check `git log --oneline -3`.
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

**Custom Input Option Rule:** Always append `Other — describe your own idea: ___` to predefined choice lists. Treat custom text as the chosen option; ask one clarifying question only if ambiguous.

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
Before reporting final status, answer: (1) **Process** — all phases followed? (2) **Evidence** — every claim backed by output or file reference? (3) **Scope** — stayed within task boundary? If any NO, address it or report DONE_WITH_CONCERNS. For full sprint evaluation, use `self-improvement`.

### Anti-Sycophancy Rules

Never say these — they are sycophantic filler that delays real analysis:
- "That's an interesting approach" → Take a position instead
- "There are many ways to think about this" → Pick one, state what evidence would change your mind
- "You might want to consider..." → Say "This is wrong because..." or "This works because..."
- "That could work" → Say whether it WILL work based on evidence
- "I can see why you'd think that" → If they're wrong, say so and why

Always do:
- Take a position on every significant question. State the position AND what evidence would change it.
- If the user's approach has a flaw, name the flaw directly before suggesting alternatives.
- Calibrated acknowledgment only: if an answer is specific and evidence-based, name what was good and pivot to the next hard question.

### TACIT-DENSE Detection (Tacit Knowledge Density Check)

Before executing substantive decisions, check if any falls into these high-tacit-density categories.
These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
has enough tacit knowledge to judge correctly.

| Category | Trigger | Action |
|----------|---------|--------|
| **D1** Domain Expertise | Security, compliance, legal, financial judgment | State `TACIT-DENSE [D1]`, present trade-offs, wait for user |
| **D2** User-Facing UX | UI copy, interaction flow, error messaging | Draft with explicit review markers |
| **D3** Team Culture | Workflow, naming conventions, file organization | Check `style-profiles/` first; ask if none |
| **D4** Novel Pattern | Fewer than 3 precedents in project history | Reduce autonomy, add checkpoints before executing |

When TACIT-DENSE detected, output: `TACIT-DENSE [D#]: [category] — [question] — My default: [recommendation]`

**Relationship with careful skill:** careful = "can we undo this?" (operational). TACIT-DENSE = "can we judge this correctly?" (knowledge). Complementary.

### Telemetry (Local Only)

At session end, log skill name, duration, and outcome to `~/.omni-skills/analytics/` via `bin/analytics-log`. Nothing is sent to external servers.

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


# Refactoring

**Goal:** Improve the structure and readability of existing code without changing its observable behavior, using systematic refactoring patterns with safety gates at every step.

## Iron Law: Green Before You Refactor

**Never start refactoring if tests are failing.** Refactoring broken code creates two problems from one. Run the full test suite first and get it green, then refactor.

### Good Example (Safe Refactoring)

```
Refactoring: extract calculateTax() from 45-line processOrder() function
BEFORE: npm test → 47 passing, 0 failing
Refactor: extract 12 lines into calculateTax(), update all call sites
AFTER:  npm test → 47 passing, 0 failing
Result: DONE — behavior preserved, code cleaner
```

### Bad Example (AVOID)

```
Refactoring: "clean up the order processing module"
BEFORE: (didn't run tests)
Refactored: moved logic, renamed variables, fixed a bug I noticed
AFTER:  npm test → 44 passing, 3 failing
[VIOLATED: Mixed refactoring with bug fix; no baseline established]
```

---

## Phase 1: Scope Definition

Identify what needs refactoring and why:

```bash
# Review the code to be refactored
git diff main...HEAD --stat 2>/dev/null | head -20
git log --oneline -5

# Find complexity hotspots
find . -name "*.js" -o -name "*.ts" -o -name "*.py" | \
  xargs wc -l 2>/dev/null | sort -rn | head -15

# Find code smells
grep -rn "TODO\|FIXME\|HACK\|SMELL\|DUPLICATE" \
  --include="*.js" --include="*.ts" --include="*.py" . \
  | grep -v "node_modules\|.git" | head -15
```

Define scope:
```
REFACTORING SCOPE
────────────────────────────────────────
Target files:    [list of files to refactor]
Reason:          [why this code needs improvement]
Boundaries:      [what files/modules are out of scope]
Behavior contract: [what must remain unchanged]
────────────────────────────────────────
```

## Phase 2: Safety Baseline

**This phase is a hard gate — do not proceed until tests pass.**

```bash
# Run the full test suite and save results
npm test 2>&1 | tee /tmp/refactor-baseline.txt
# or:  pytest -v 2>&1 | tee /tmp/refactor-baseline.txt
# or:  go test ./... 2>&1 | tee /tmp/refactor-baseline.txt

# Extract the test count
grep -cE "pass|PASS|✓|ok " /tmp/refactor-baseline.txt 2>/dev/null || \
  tail -5 /tmp/refactor-baseline.txt
```

Record:
```
SAFETY BASELINE
────────────────────────────────────────
Tests passing:   [N]
Tests failing:   [N]  ← must be 0 to proceed
Test command:    [npm test | pytest | go test | etc.]
Baseline saved:  /tmp/refactor-baseline.txt
────────────────────────────────────────
```

**Gate:** If `Tests failing > 0` → report BLOCKED. Do not proceed.

## Phase 3: Smell Detection

Identify refactoring targets using the standard smell catalog:

| Smell | Detection | Refactoring |
|-------|----------|-------------|
| Long function | > 30 lines with multiple concerns | Extract method |
| Duplicate code | Same logic in 2+ places | Extract and DRY |
| Magic numbers/strings | `if (code === 42)` | Extract named constant |
| God object | Class handling too many responsibilities | Extract class |
| Deep nesting | > 3 levels of if/for/try | Guard clauses, early returns |
| Long parameter list | > 4 parameters | Introduce parameter object |
| Feature envy | Method uses another class's data more than its own | Move method |
| Data clump | 3+ params always passed together | Extract into type/struct |
| Dead code | Unused variables, functions, imports | Delete safely |
| Inconsistent naming | Mixed conventions in same module | Systematic rename |

Produce:
```
SMELL INVENTORY
────────────────────────────────────────
[file:line] — [smell name] — [priority: P0|P1|P2]
[file:line] — [smell name] — [priority: P0|P1|P2]
────────────────────────────────────────
Total smells found: [N]
```

## Phase 4: Dispatch `refactoring-agent`

**Dispatch the `refactoring-agent`** with:
- The smell inventory from Phase 3
- The target files and their current content
- The safety baseline (test command + passing count)
- Explicit constraints: "do NOT change behavior, do NOT mix bug fixes"

The agent will:
1. Execute refactorings from lowest to highest risk
2. Run tests after each change step
3. Return a REFACTORING REPORT with before/after test counts and diff summary

**Handoff:**
- `DONE` → proceed to Phase 5 verification
- `DONE_WITH_CONCERNS` → review concerns, proceed if only style-level (not behavior-level)
- `BLOCKED` → test failure during refactoring — agent will have reverted; review what went wrong

## Phase 5: Verification

After the agent completes:

```bash
# Re-run the full test suite
npm test 2>&1 | tee /tmp/refactor-after.txt

# Compare to baseline
echo "Before: $(grep -cE 'pass|PASS|✓' /tmp/refactor-baseline.txt 2>/dev/null) passing"
echo "After:  $(grep -cE 'pass|PASS|✓' /tmp/refactor-after.txt 2>/dev/null) passing"

# Confirm the diff is structural, not behavioral
git diff HEAD | grep "^[+-]" | grep -v "^---\|^+++" | \
  grep -vE "^[+-][[:space:]]*$" | head -30
```

Verification checklist:
- [ ] Test count matches baseline (no tests added or removed)
- [ ] All tests still pass
- [ ] Diff shows structural changes only (no logic changes)
- [ ] No new files outside the defined scope were touched

## Phase 6: Refactoring Report

```
REFACTORING COMPLETE
════════════════════════════════════════
Target:         [files/modules refactored]
Smells fixed:   [N of N found]

Changes:
  [file] — [smell] → [refactoring applied]
  [file] — [smell] → [refactoring applied]

Tests:          [N] before → [N] after (must be equal)
Behavior:       PRESERVED | CHANGES_NEEDED
Code delta:     [shorter by N lines | flatter by N indentation levels]

Skipped (out of scope or too risky):
  [file] — [reason]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

## Save Refactoring Artifact

```bash
mkdir -p docs/superomni/executions
_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_DATE=$(date +%Y%m%d)
_REF_FILE="docs/superomni/executions/refactoring-${_BRANCH}-${_DATE}.md"
echo "Refactoring record saved to ${_REF_FILE}"
```
