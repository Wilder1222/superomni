---
name: executing-plans
description: |
  Use when executing an implementation plan step by step.
  Triggers: "execute plan", "implement this plan", "start executing", "run the plan".
  Requires: a docs/superomni/plans/plan-*.md or similar plan document to exist.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection

On session start, read: branch from `git branch --show-current`, proactive config from `bin/config get proactive` (default `true`), session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### PROACTIVE Mode

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


# Executing Plans

**Goal:** Execute a written implementation plan precisely, with verification at each stage — running independent steps in parallel to minimize elapsed time.

## Iron Laws

**1. Dependencies First, Then Parallelize**
Never execute a step before its dependencies are complete.
But DO run all independent steps in parallel within a wave — never serialize work that can be parallelized.

**2. Evaluate Before Advancing**
Every wave must pass an evaluation gate before the next wave begins.
A wave is not "done" until its outputs are verified — not just executed.

**3. Failures Are Harness Signals**
When a step fails on 3 consecutive attempts using different approaches, stop executing and treat the failure as a harness signal:
update the plan, skill, or constraint — then retry. Never brute-force through 3 failed approaches.

## Phase 1: Load the Plan

```bash
# Find the plan document
ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1
```

Read the plan. Confirm:
- [ ] Plan document exists and is readable
- [ ] Prerequisites are met
- [ ] You understand what "done" looks like for each step

## Phase 2: Dependency Analysis — Build the Execution Wave Plan

Before executing any step, analyze ALL steps for dependencies:

```
DEPENDENCY ANALYSIS
─────────────────────────────────
Step 1: [name] — depends on: none
Step 2: [name] — depends on: none
Step 3: [name] — depends on: Step 1
Step 4: [name] — depends on: none
Step 5: [name] — depends on: Step 2, Step 3
Step 6: [name] — depends on: none
...

WAVE EXECUTION PLAN
Wave 1 (parallel): Steps 1, 2, 4, 6  ← 4 agents dispatched simultaneously
Wave 2 (parallel): Steps 3, 5        ← unblocked after Wave 1 completes
Wave 3 (if needed): ...

Est. time: [N waves] instead of [N sequential steps]
```

Rule: A step is independent if its outputs are not required by any step in the same wave.
Rule: Aim for 5–10 steps per wave when sufficient independent steps exist — never artificially group dependent steps to meet this target.

## Phase 3: Execute Wave by Wave

For each wave, dispatch all steps in the wave simultaneously, then wait for all to complete before starting the next wave.

### Step Execution Protocol

For each step in a wave:

```
EXECUTING WAVE [N] — [M] STEPS IN PARALLEL
─────────────────────────────────
Steps: [list of step names/numbers]
```

For each individual step:

```
Step [N] — [Step Name]
─────────────────────────────────
What: [Description from plan]
Files: [Files to touch]
Involves code changes? [YES / NO]
```

1. **Read** — understand what the step requires
2. **TDD Check** — if this step involves writing or modifying source code: **apply the `test-driven-development` skill** (Red → Green → Refactor) before committing any code
3. **Frontend Check** — if this step involves UI files (`.html`, `.jsx`, `.tsx`, `.vue`, `.svelte`, `.css`, `.scss`): **apply the `frontend-design` skill** Phase 4 (Implementation) with the plan's design direction. After completing all UI steps in a wave, run the designer agent quality gate (Phase 5).
4. **Do** — make the minimum change needed for this step only
5. **Verify** — run the step's verification criterion
6. **Report** — confirm step complete or blocked

### TDD Integration for Code Steps

Every step that creates or modifies source code must follow this flow:

```
Step involves code? ─── NO ──→ Execute directly
        │
        YES
        ↓
Write failing test (RED) → confirm it fails
        ↓
Write minimum implementation (GREEN) → confirm test passes
        ↓
Refactor if needed → confirm tests still pass
        ↓
Continue to step verification
```

**If no test framework exists for this project:** document what the tests would look like and why they cannot be automated. This is a DONE_WITH_CONCERNS, not a skip.

### Frontend-Design Integration for UI Steps

```
Step involves UI files? ─── NO ──→ Skip
        │
        YES
        ↓
Load design direction from plan (## Design Direction section)
        ↓
Apply frontend-design Phase 4 (Implementation) rules
        ↓
After all UI steps in wave complete:
  Run designer agent quality gate (7+/10 on all dimensions)
        ↓
Gate PASS → continue | Gate FAIL → fix and re-run (2 retries)
```

**If no design direction exists in the plan:** run `frontend-design` Phase 1-2 (Context Gathering + Design Direction) before implementing. This is a one-time cost per session.

### Step Completion Format

```
✓ Step N COMPLETE
  Changed: [files modified]
  Evidence: [test output or verification proof]
```

### Step Blocked Format

```
✗ Step N BLOCKED
  Blocker: [what prevents completion]
  Tried: [what was attempted]
  Options:
    A) [approach 1]
    B) [approach 2]
    C) Skip this step (explain consequences)
    D) Other — describe your own approach: ___________
```

## Phase 4: Wave Evaluation Gate

**Before advancing to the next wave, run the evaluation gate:**

```
WAVE [N] EVALUATION GATE
─────────────────────────────────
Steps completed: [list]
Tests passing:   [run: npm test or equivalent]
Regressions:     [any pre-existing tests broken?]
Output contract: [do outputs match what dependent steps expect?]
Gate result:     PASS → proceed to Wave N+1 | FAIL → address before advancing
```

If the gate **FAILS**:
1. Identify which step produced the failing output
2. Determine if this is a harness signal (update plan/skill) or an implementation error (fix and re-run)
3. Do NOT advance to the next wave until the gate passes

Spawn the `evaluator` agent for complex waves or when the gate result is ambiguous.

## Phase 5: Mid-Plan Check-ins

After every wave completes, or when scope is expanding:

1. Report progress: "Completed N/M steps (Wave X of Y done)"
2. Flag if actual work diverges from plan
3. Surface any blast radius discovered mid-execution
4. Ask before proceeding if scope has changed

## Phase 6: Handling Plan Deviations

If you discover the plan is wrong or incomplete:

1. **Stop** — do not improvise silently
2. **Assess** — is this a small mechanical fix or a fundamental issue?
3. **Small fix** (mechanical, <5 min): note it, fix it, continue
4. **Large issue** (taste or architectural): surface to user, wait for input

```
PLAN DEVIATION DETECTED
Step N: [Original plan says X, but actually Y]
Impact: [Low/Medium/High]
Recommendation: [Proposed resolution]
Awaiting: [Your decision before continuing]
```

## Phase 7: Completion

When all steps are done:

```
PLAN EXECUTION COMPLETE
════════════════════════════════════════
Steps completed:    N/N
Waves executed:     W
Deviations noted:   N
Files changed:      [list]
Tests passing:      [output]
Status:             DONE | DONE_WITH_CONCERNS
Concerns (if any):
  - [concern 1]
════════════════════════════════════════
```

## Save Execution Results Document

After completing execution, save the results as a Markdown document:

```bash
_EXEC_DATE=$(date +%Y%m%d)
_EXEC_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_PLAN_FILE=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)

if [ -n "$_PLAN_FILE" ]; then
        _PLAN_BASE=$(basename "$_PLAN_FILE" .md)
        _EXEC_SESSION=$(echo "$_PLAN_BASE" | sed -E "s/^plan-${_EXEC_BRANCH}-//" | sed -E 's/-[0-9]{8}$//')
fi

if [ -z "$_EXEC_SESSION" ]; then
        _EXEC_SESSION="execution-run"
fi

_EXEC_FILE="execution-${_EXEC_BRANCH}-${_EXEC_SESSION}-${_EXEC_DATE}.md"
mkdir -p docs/superomni/executions
cat > "docs/superomni/executions/${_EXEC_FILE}" << EOF
# Execution Results: ${_EXEC_BRANCH}

**Date:** ${_EXEC_DATE}
**Branch:** ${_EXEC_BRANCH}

[Paste the full PLAN EXECUTION COMPLETE block here]

## Wave Log

[Paste wave-by-wave summary: steps in each wave, outcomes]

## Steps Log

[Paste all step completion/blocked entries here]
EOF
echo "Execution results saved to docs/superomni/executions/${_EXEC_FILE}"
```

Write the full execution log (wave plan, all step outcomes + the final PLAN EXECUTION COMPLETE block, formatted as Markdown) to `docs/superomni/executions/execution-[branch]-[session]-[date].md`. This file serves as the permanent record of the execution run for the user to revisit.

Then trigger the `verification` skill.
