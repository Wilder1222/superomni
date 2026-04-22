---
name: systematic-debugging
description: |
  Use when encountering any bug, test failure, or unexpected behavior.
  Iron Law: no fixes without root cause investigation first.
  Four phases: Investigate → Analyze → Hypothesize → Implement.
  Triggers: any error, test failure, "it's broken", "why isn't X working".
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

# Systematic Debugging

## Iron Law

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

If you haven't completed Phase 1, you cannot propose fixes. "I think it might be X" is not a root cause. A root cause is a specific, testable claim about what is wrong.

### Good Execution Example
```
User reports: Button click has no response
Agent:
  1. Check event listener bindings -> confirmed bound correctly
  2. Check if handler function is called -> found it is NOT called
  3. Check for event propagation blockers -> found parent element has e.stopPropagation()
  4. Root cause identified: parent stopPropagation() prevents click from reaching button
  5. Fix: remove incorrect stopPropagation() call
```

### Bad Execution Example (AVOID)
```
User reports: Button click has no response
Agent:
  Guesses it might be CSS pointer-events: none
  -> Adds pointer-events: auto
  -> Still broken
  -> Guesses it might be z-index
  -> Adjusts z-index
  -> Still broken
  [VIOLATED: Started fixing without root cause investigation]
```

### Common Excuse Rebuttals
| Excuse | Rebuttal |
|--------|----------|
| "The problem is obvious, root cause is X" | "Obvious" is not evidence — spend 2 minutes verifying |
| "Similar bug was fixed this way before" | Similar is not identical — verify root cause before applying fix |
| "User described the cause already" | User describes symptoms, not causes — investigate anyway |

## Phase 1: Root Cause Investigation

### Scope Lock (built-in freeze)

Before investigating, lock the edit scope to the affected area to prevent accidental changes elsewhere:

```bash
FREEZE_DIR=$(cd "<affected-directory>" 2>/dev/null && pwd || echo "")
if [ -n "$FREEZE_DIR" ]; then
  mkdir -p "${HOME}/.omni-skills"
  echo "${FREEZE_DIR%/}/" > "${HOME}/.omni-skills/debug-scope.txt"
  echo "Debug scope locked to: ${FREEZE_DIR%/}/"
fi
```

While scope lock is active, do NOT edit files outside the locked directory. Flag out-of-scope fixes as follow-up tasks. Say "unfreeze" or remove `~/.omni-skills/debug-scope.txt` when done debugging.

### Investigation Steps

1. **Read error messages carefully** — read the full stack trace; note exact file names and line numbers
2. **Reproduce consistently** — can you reproduce the error every time? If not, gather more data first
3. **Check recent changes** — `git log --oneline -20 -- <affected-files>`
4. **Gather evidence in multi-component systems** — add logging at each boundary; don't guess
5. **Trace data flow** — see `root-cause-tracing.md` for backward tracing technique

```bash
# Check recent changes to affected area
git log --oneline -20 -- <file-or-directory>

# Search for related error patterns
grep -r "<error-string>" . --include="*.log" -l 2>/dev/null | head -5

# Check for recent changes across the codebase
git diff HEAD~5 HEAD -- <affected-area>
```

Required output: **"Root cause hypothesis: ..."** — a specific, testable claim.
Example: "Root cause hypothesis: The `authenticate()` function returns `null` when the JWT is expired, but the caller doesn't handle `null` and passes it directly to `getUserData()`, causing a NullPointerException at line 47."

## Scope Lock

After forming a hypothesis, lock edits to the affected module to prevent scope creep:

```bash
STATE_DIR="${HOME}/.omni-skills"
mkdir -p "$STATE_DIR"
AFFECTED_DIR="<detected-directory>"
echo "${AFFECTED_DIR}/" > "$STATE_DIR/debug-scope.txt"
echo "Debug scope locked to: ${AFFECTED_DIR}/"
echo "Run 'rm ~/.omni-skills/debug-scope.txt' to unlock scope."
```

**You may only edit files within the locked scope during debugging.**
If the fix requires touching files outside scope → flag to user and unlock explicitly.

## Phase 2: Pattern Analysis

Match the symptom to known patterns:

| Pattern | Signature | Where to look |
|---------|-----------|---------------|
| Race condition | Intermittent, timing-dependent failures | Shared mutable state, async code |
| Nil/null propagation | NullPointerError, TypeError on access | Missing null guards, unexpected returns |
| State corruption | Inconsistent data after operations | DB transactions, event hooks, caches |
| Integration failure | Timeout, unexpected response format | Service boundaries, API contracts |
| Configuration drift | Works locally, fails in CI/staging | Env vars, feature flags, secrets |
| Stale cache | Old data returned, fixes on cache clear | Redis, CDN, browser cache, memoize |
| Off-by-one | Wrong count, missing last element | Loop bounds, array indexing |

Also: **Find a working example** → compare with broken case → list every difference.

See `root-cause-tracing.md` for systematic backward tracing techniques.

## Phase 3: Hypothesis Testing

1. **State your hypothesis:** "I think X is happening because Y"
2. **Write it down** — if you can't write it, you don't understand it yet
3. **Test minimally** — make the SMALLEST possible change to test the hypothesis
4. **One variable at a time** — change exactly one thing per test; never two
5. **Verify** — did the change fix it?
   - Yes → proceed to Phase 4
   - No → form a new hypothesis (go back to step 1)

### 3-Strike Rule

After 3 failed hypotheses, **STOP**. Do not guess further. Choose:

**A)** Form a completely different hypothesis (change your mental model, not just the details)
**B)** Add more logging/instrumentation and gather more data before hypothesizing
**C)** Escalate: report BLOCKED with your 3 hypotheses and evidence gathered
**D)** Other — describe your own next step: ___________

## Phase 4: Implementation

1. **Create failing test first** — see `test-driven-development` skill
2. **Single fix** — fix the root cause only; ONE change; no "while I'm here" modifications
3. **Verify** — test passes, no regressions
4. **Check blast radius** — if the fix touches >5 files, flag to user before applying
5. **If 3+ different fixes failed** — question the architecture, not just the code

See `defense-in-depth.md` for multi-layer validation after finding root cause.
See `condition-based-waiting.md` for async/timing issues.

## Phase 5: Debug Report

```
DEBUG REPORT
════════════════════════════════════════
Symptom:         [what the user observed]
Root cause:      [what was actually wrong — specific, verified]
Fix:             [what changed, with file:line references]
Evidence:        [test output or command + result proving fix works]
Regression test: [file:line of new test added]
Scope unlocked:  [yes/no — was debug-scope.txt removed?]
Status:          DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

## Supporting Techniques

- `root-cause-tracing.md` — backward tracing through call stack
- `defense-in-depth.md` — multi-layer validation after finding root cause
- `condition-based-waiting.md` — replace fragile timeouts with condition polling
