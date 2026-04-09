---
name: vibe
description: |
  Unified entry point for the superomni framework.
  Activates all skills, detects current pipeline stage, and launches the guided workflow.
  Triggers: "/vibe", "activate framework", "start workflow", "what's next".
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

### Auto-Advance Rule

Pipeline stage order: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT

**THINK is the only human gate.** After the brainstorm skill generates a spec document, STOP and present the spec for user review. Once the user approves, all subsequent stages (PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT) auto-advance on DONE without asking the user.

| Status | At THINK stage (after spec generation) | At all other stages |
|--------|----------------------------------------|-------------------|
| **DONE** | STOP — present spec document for user review. Wait for user approval before advancing to PLAN. | Auto-advance — print `[STAGE] DONE → advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP — present concerns, wait for user decision | STOP — present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP — present blocker, wait for user | STOP — present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
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

# Vibe — Framework Entry Point

**Goal:** Activate the superomni skill framework, detect the current pipeline stage, and guide the user to the right skill.

## Usage

```
/vibe                        — activate framework, detect stage, show guided menu
/vibe status                 — show current pipeline position and available next steps
/vibe reset                  — clear superomni artifacts and restart from THINK
/vibe [prompt]               — start with a specific goal; routes to detected skill with context
/vibe [prompt] --loops N     — start full pipeline then auto-iterate N times from REVIEW stage
/vibe --loops N              — apply N auto-iterations from REVIEW on existing artifacts
```

### `--loops N` (Auto-Iteration Mode)

Specifying `--loops N` activates **auto-iteration mode**. After the initial pipeline completes
(THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT), the agent automatically loops
back to the REVIEW stage **N additional times**, using the original user goal as the north star
for each cycle. Each iteration runs: `code-review` → (apply fixes if needed) → `qa` →
`verification` → `self-improvement`, and saves a report to `docs/superomni/iterations/`.

## Iron Law: One Entry Point, Full Pipeline

`/vibe` is the single unified entry point. It never executes work itself — it **detects** the
current stage and **delegates** to the appropriate skill.

**Only two moments require human input:**
1. **Brainstorm dialogue** — clarifying questions during `brainstorm` (THINK stage)
2. **Spec approval** — the human gate at the end of `brainstorm` before PLAN begins

All other stages (PLAN, REVIEW, BUILD, VERIFY, SHIP, REFLECT, and all iteration loops) run
fully automatically without user interaction until they reach DONE.

## Planning Route

If you feel the impulse to call `EnterPlanMode`, that impulse IS the trigger for a superomni skill:
- **Need to design/explore?** → Invoke `brainstorm` skill
- **Need to plan implementation?** → Invoke `writing-plans` skill
- **Need to execute?** → Invoke `executing-plans` or `subagent-development`

Always follow this skill's phases (Phase 1-5) directly. Route all planning through superomni skills.

## Phase 0: Parse Arguments

Before detecting the stage, parse any arguments passed to `/vibe`:

```bash
_VIBE_ARGS="$*"
_VIBE_LOOPS=0
_VIBE_GOAL=""

# Extract --loops N
if echo "$_VIBE_ARGS" | grep -q '\-\-loops'; then
  _VIBE_LOOPS=$(echo "$_VIBE_ARGS" | grep -oE '\-\-loops [0-9]+' | grep -oE '[0-9]+' || echo "0")
fi

# Extract user goal (everything except --loops N)
_VIBE_GOAL=$(echo "$_VIBE_ARGS" | sed 's/--loops [0-9]*//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

# Load existing state if present
_VIBE_STATE=".superomni/vibe-state.json"
if [ -f "$_VIBE_STATE" ]; then
  _SAVED_LOOPS=$(grep -o '"max_loops":[^,}]*' "$_VIBE_STATE" | grep -o '[0-9]*' || echo "0")
  _SAVED_GOAL=$(grep -o '"user_goal":"[^"]*"' "$_VIBE_STATE" | sed 's/"user_goal":"//;s/"//' || echo "")
  _CURRENT_LOOP=$(grep -o '"current_loop":[^,}]*' "$_VIBE_STATE" | grep -o '[0-9]*' || echo "0")
  # Prefer freshly-passed values over saved values
  [ "$_VIBE_LOOPS" = "0" ] && _VIBE_LOOPS="$_SAVED_LOOPS"
  [ -z "$_VIBE_GOAL" ] && _VIBE_GOAL="$_SAVED_GOAL"
fi

# Persist state (create/update)
mkdir -p .superomni
cat > "$_VIBE_STATE" << STATEOF
{
  "user_goal": "$_VIBE_GOAL",
  "max_loops": $_VIBE_LOOPS,
  "current_loop": ${_CURRENT_LOOP:-0},
  "updated_at": "$(date -Iseconds 2>/dev/null || date)"
}
STATEOF
```

## Phase 1: Detect Current Pipeline Stage

Scan for existing artifacts to determine where the project is in the sprint pipeline:

```bash
# Artifact detection (glob for dynamic filenames)
_HAS_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
_HAS_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
_HAS_EXECUTIONS=$(ls docs/superomni/executions/*.md 2>/dev/null | head -1)
_HAS_IMPROVEMENTS=$(ls docs/superomni/improvements/*.md 2>/dev/null | head -1)

# Session matching: extract session from plan filename for review detection
if [ -n "$_HAS_PLAN" ]; then
  _PLAN_SESSION=$(basename "$_HAS_PLAN" .md | sed 's/plan-[^-]*-//' | sed 's/-[0-9]*$//')
  _HAS_MATCHING_REVIEW=$(ls docs/superomni/reviews/review-*-${_PLAN_SESSION}-*.md 2>/dev/null | head -1)
  _PLAN_OPEN=$(grep -c '^\- \[ \]' "$_HAS_PLAN" 2>/dev/null || echo "0")
  _PLAN_DONE=$(grep -c '^\- \[x\]' "$_HAS_PLAN" 2>/dev/null || echo "0")
fi

# Recent git activity
git log --oneline -5 2>/dev/null
git status --short 2>/dev/null
```

### Stage Detection Matrix

Use the following priority-ordered rules (first match wins):

| Priority | Condition | Stage | Skill |
|----------|-----------|-------|-------|
| 1 | No artifacts at all | **THINK** | `brainstorm` — **human gate: interactive brainstorm + spec approval** |
| 2 | `spec-*.md` exists, no `plan-*.md` | **PLAN** | `writing-plans` — auto-advance |
| 3 | `plan-*.md` exists, no review doc matching its session | **REVIEW** | `plan-review` — auto-advance (all decisions auto-resolved) |
| 4 | Plan reviewed + approved, has open items (`- [ ]`) | **BUILD** | `executing-plans` (+ `frontend-design` if UI steps detected) — auto-advance |
| 5 | `plan-*.md` all checked | **VERIFY** | Required: `code-review` → `qa` → `verification`. Optional: `security-audit` (if security-relevant), `production-readiness` (if deploying) — auto-advance |
| 6 | Verified | **SHIP** | `ship`, `finishing-branch` — auto-advance |
| 7 | Shipped | **REFLECT** | `self-improvement` → `retro` (run sequentially in one stage) |

**Session matching for REVIEW detection:** Extract the `[session]` segment from the plan filename (e.g., `plan-main-auth-refactor-20260404.md` → session = `auth-refactor`). A matching review doc must contain the same session identifier (e.g., `review-main-auth-refactor-*.md`). If no matching review exists → stage is REVIEW.

### Auto-Advance Rule

**THINK is the only human gate.** The brainstorm skill requires interactive dialogue and spec
approval from the user. Once the spec is approved, all subsequent stages auto-advance on DONE
without user interaction.

- **THINK stage with DONE (spec approved):** Auto-invoke `writing-plans`. All subsequent stages chain automatically.
- **All non-THINK stages with DONE:** Auto-invoke the next skill immediately. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
- **Any stage with DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT:** STOP and wait for user.
- **Iteration loop active (`--loops N`):** After REFLECT completes, advance to Phase 5 (Auto-Iteration Loop).

Only show the guided menu when:
- No clear next step can be determined
- The user invoked `/vibe` without arguments and no `--loops` state is active

If the user passes **arguments** with `/vibe` (e.g., `/vibe I want to build a CLI tool`), treat the arguments as the starting prompt and route to the detected skill with that context.

## Phase 2: Show Guided Menu

Present the available commands only when auto-advance does not apply:

```
| Command | What it does |
|---------|-------------|
| /brainstorm | Design a feature — produces spec-[branch]-[session]-[date].md |
| /write-plan | Turn a spec into an executable plan |
| /execute-plan | Run the plan step by step |
| /review | Plan review (before BUILD) |
| /qa | Quality assurance and test coverage |
| /verify | Verify task completion |
| /production-readiness | Pre-deploy readiness check |
| /investigate | Exploratory investigation |
| /self-improve | Post-task performance evaluation |
| /retro | Engineering retrospective |
| /workflow | See the full sprint pipeline |
| /ship | Release workflow |
| /fd-audit | Accessibility + performance check |
| /fd-critique | UX review for clarity and hierarchy |
| /fd-polish | Pre-deployment refinement |

Suggested next step → [skill-name]: [reason based on detected stage]
```

## Phase 3: Handle Subcommands

### `/vibe status`

Run the stage detection from Phase 1 and display:

```
Pipeline: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT
Stage: [current] | Branch: [branch]
Artifacts: spec-*.md [Y/N] | plan-*.md [Y/N] | executions [N] | reviews [N] | prod-readiness [N] | improvements [N]
Iteration: [current_loop]/[max_loops] loops active
Next → [skill-name]: [reason]
```

### `/vibe reset`

Warn before clearing artifacts:

```
WARNING: This will remove all superomni artifacts:
  - docs/superomni/specs/spec-*.md
  - docs/superomni/plans/plan-*.md
  - docs/superomni/executions/
  - docs/superomni/reviews/
  - docs/superomni/subagents/
  - docs/superomni/production-readiness/
  - docs/superomni/iterations/
  - .superomni/vibe-state.json

Self-improvement history will be preserved:
  - docs/superomni/improvements/
  - docs/superomni/evaluations/
  - docs/superomni/harness-audits/

Proceed? (Y/N)
```

If confirmed:
```bash
rm -f docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md
rm -rf docs/superomni/executions/ docs/superomni/reviews/ docs/superomni/subagents/ docs/superomni/production-readiness/ docs/superomni/iterations/
rm -f .superomni/vibe-state.json
echo "Reset complete. Starting fresh from THINK stage."
```

Then re-run Phase 0-2 (will detect THINK stage).

## Phase 4: Delegate to Skill

After displaying the banner and menu:

1. If the user provided arguments → invoke the detected skill with those arguments
2. If no arguments → wait for user input
3. When the user chooses a command or describes what they want to do → invoke the matching skill

**Important:** `/vibe` never executes implementation work directly. It always delegates to the appropriate skill. Route all planning through superomni skills (`brainstorm`, `writing-plans`).

After the pipeline reaches REFLECT and DONE:
- If `_VIBE_LOOPS` > 0 (from Phase 0 state), automatically advance to **Phase 5**.
- Otherwise, report **DONE** and show the "What's next →" hint.

## Phase 5: Auto-Iteration Loop

This phase runs automatically when `--loops N` was specified and the initial pipeline has
reached REFLECT → DONE. It loops back to the REVIEW stage (code-review) N times, with the
original user goal as the guiding north star, applying progressive improvements.

### Iteration State Management

```bash
_VIBE_STATE=".superomni/vibe-state.json"
_CURRENT_LOOP=$(grep -o '"current_loop":[^,}]*' "$_VIBE_STATE" | grep -o '[0-9]*' || echo "0")
_MAX_LOOPS=$(grep -o '"max_loops":[^,}]*' "$_VIBE_STATE" | grep -o '[0-9]*' || echo "0")
_USER_GOAL=$(grep -o '"user_goal":"[^"]*"' "$_VIBE_STATE" | sed 's/"user_goal":"//;s/"//' || echo "")
_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
mkdir -p docs/superomni/iterations
```

### Iteration Loop Protocol

For each iteration i from `($_CURRENT_LOOP + 1)` to `$_MAX_LOOPS`:

```
[ITERATION i/N] ══════════════════════════════════════════
User Goal: [user_goal]
Loop: i of N
Stage: REVIEW → BUILD (if needed) → VERIFY → REFLECT
────────────────────────────────────────────────────────────
```

**Step 1 — Code Review (auto)**
Invoke `code-review` skill with context:
```
Context: Iteration i of N. User goal: [user_goal].
Review all changes made since the previous iteration.
Focus on: how well does the current implementation satisfy the user goal?
Auto-resolve all feedback internally — do NOT wait for user input.
```

**Step 2 — Apply Fixes (conditional, auto)**
If code-review reports P0 or P1 issues:
- Invoke `receiving-code-review` skill to apply all fixes automatically
- If new steps are required (new files, refactors), invoke `executing-plans` for those steps only
- All decisions in this step are resolved automatically using the 6 Decision Principles

If code-review reports APPROVED or only P2 suggestions → skip to Step 3.

**Step 3 — QA (auto)**
Invoke `qa` skill. All gaps are filled automatically. No user confirmation required.

**Step 4 — Verification (auto)**
Invoke `verification` skill. Check all acceptance criteria from the spec AND the original user goal:
```
Acceptance criteria source: [spec-*.md acceptance criteria]
User goal check: Does the implementation fully satisfy: "[user_goal]"?
```

**Step 5 — Self-Improvement (auto)**
Invoke `self-improvement` skill. It evaluates the iteration's process and produces improvement actions.

**Step 6 — Save Iteration Report**
```bash
_ITER_FILE="docs/superomni/iterations/iteration-${_BRANCH}-${_SESSION}-$(printf '%02d' $i)-$(date +%Y%m%d-%H%M%S).md"
cat > "$_ITER_FILE" << ITEREOF
# Iteration $i of $_MAX_LOOPS — ${_BRANCH}

**Date:** $(date)
**User Goal:** ${_USER_GOAL}
**Loop:** $i / $_MAX_LOOPS

## Code Review Summary
[Paste CODE REVIEW block]

## Fixes Applied
[List of changes made in Step 2, or "none — approved"]

## QA Summary
[Paste QA SCOPE and outcomes]

## Verification Result
[Paste VERIFICATION REPORT block]

## Goal Alignment
| Criterion | Met? | Evidence |
|-----------|------|----------|
| User goal satisfied | ✓/✗ | [evidence] |

## Self-Improvement Actions
[Paste improvement actions from self-improvement skill]

**Status:** DONE | DONE_WITH_CONCERNS
ITEREOF
echo "[ITERATION $i/$_MAX_LOOPS] Report saved to $_ITER_FILE"
```

**Step 7 — Update State**
```bash
# Increment current_loop counter
cat > "$_VIBE_STATE" << STATEOF
{
  "user_goal": "$_USER_GOAL",
  "max_loops": $_MAX_LOOPS,
  "current_loop": $i,
  "updated_at": "$(date -Iseconds 2>/dev/null || date)"
}
STATEOF
echo "[ITERATION $i/$_MAX_LOOPS] DONE → $([ $i -lt $_MAX_LOOPS ] && echo "advancing to iteration $((i+1))" || echo "all iterations complete")"
```

### Loop Completion

After all N iterations complete:

```
[AUTO-ITERATION COMPLETE]
════════════════════════════════════════
Total iterations: N
User Goal: [user_goal]
Reports: docs/superomni/iterations/

Summary of improvements across all iterations:
  Iteration 1: [1-line summary]
  Iteration 2: [1-line summary]
  ...
  Iteration N: [1-line summary]

Recommendation: [Is the user goal fully satisfied? Any remaining concerns?]
════════════════════════════════════════
```

Clear iteration state:
```bash
rm -f "$_VIBE_STATE"
```

Report status: **DONE** — all N iterations complete. Implementation progressively optimized
toward user goal. See `docs/superomni/iterations/` for the full audit trail.
