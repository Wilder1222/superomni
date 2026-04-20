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


# Vibe - Framework Entry Point

**Goal:** Activate the superomni skill framework, detect the current pipeline stage, and route to the right skill.

## Usage

```
/vibe              - activate framework, detect stage, continue workflow
/vibe status       - show current pipeline position and available next steps
/vibe reset        - clear superomni artifacts and restart from THINK
```

## Iron Law: One Entry Point, Full Pipeline

`/vibe` is the single unified entry point. It never executes work itself - it detects the current stage and delegates to the appropriate skill.

## Planning Route

If you feel the impulse to call `EnterPlanMode`, that impulse IS the trigger for a superomni skill:
- Need to design/explore? -> Invoke `brainstorm`
- Need to plan implementation? -> Invoke `writing-plans`
- Need to execute? -> Invoke `executing-plans` or `subagent-development`

Always follow this skill's phases directly. Route all planning through superomni skills.

## Phase 1: Detect Current Pipeline Stage

Scan for existing artifacts to determine where the project is in the sprint pipeline:

```bash
# Session-aware artifact detection
# Read current session start timestamp (written by hooks/session-start)
_SESSION_TS=$(cat ~/.omni-skills/sessions/current-session-ts 2>/dev/null || echo "0")
_SESSION_ID=$(cat ~/.omni-skills/sessions/current-session-id 2>/dev/null || echo "")

# Helper: create a reference file with session-start mtime (cross-platform: Git Bash / Linux / macOS)
_ref=$(mktemp 2>/dev/null || echo "/tmp/_omni_ref_$$")
touch -d "@${_SESSION_TS}" "$_ref" 2>/dev/null || \
  touch -t "$(date -d "@${_SESSION_TS}" +%Y%m%d%H%M.%S 2>/dev/null || \
              date -r "${_SESSION_TS}" +%Y%m%d%H%M.%S 2>/dev/null || echo "$(date +%Y%m%d%H%M.%S)")" \
  "$_ref" 2>/dev/null || touch "$_ref"

# Detect all artifact types in current session using find -newer (no stat dependency)
_HAS_SPEC=$(find docs/superomni/specs -name "spec-*.md" -newer "$_ref" 2>/dev/null | sort | tail -1)
_HAS_SPEC_APPROVAL=$(find docs/superomni/specs -name ".approved-spec-*" -newer "$_ref" 2>/dev/null | head -1)
# Also check non-session approval files (approval persists across sessions)
[ -z "$_HAS_SPEC_APPROVAL" ] && _HAS_SPEC_APPROVAL=$(ls docs/superomni/specs/.approved-spec-* 2>/dev/null | head -1)
_HAS_PLAN=$(find docs/superomni/plans -name "plan-*.md" -newer "$_ref" 2>/dev/null | sort | tail -1)
_HAS_REVIEW=$(find docs/superomni/reviews -name "review-*.md" -newer "$_ref" 2>/dev/null | head -1)
_HAS_EXECUTIONS=$(find docs/superomni/executions -name "*.md" -newer "$_ref" 2>/dev/null | head -1)
_HAS_EVALUATION=$(find docs/superomni/evaluations -name "evaluation-*.md" -newer "$_ref" 2>/dev/null | head -1)
_HAS_RELEASE=$(find docs/superomni/releases -name "release-*.md" -newer "$_ref" 2>/dev/null | head -1)
rm -f "$_ref" 2>/dev/null

# Cross-session fallback: if no current-session artifacts exist but
# last-session-artifacts.txt shows incomplete work, detect from disk
if [ -z "$_HAS_SPEC" ] && [ -z "$_HAS_PLAN" ]; then
  _LAST_ARTIFACTS="${HOME}/.omni-skills/sessions/last-session-artifacts.txt"
  if [ -f "$_LAST_ARTIFACTS" ] && [ -s "$_LAST_ARTIFACTS" ]; then
    # Last session had artifacts — detect from disk regardless of mtime
    _HAS_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
    _HAS_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
    _HAS_REVIEW=$(ls docs/superomni/reviews/review-*.md 2>/dev/null | head -1)
    _HAS_EXECUTIONS=$(ls docs/superomni/executions/*.md 2>/dev/null | head -1)
    _HAS_EVALUATION=$(ls docs/superomni/evaluations/evaluation-*.md 2>/dev/null | head -1)
    _HAS_RELEASE=$(ls docs/superomni/releases/release-*.md 2>/dev/null | head -1)
    _CROSS_SESSION=true
  fi
fi

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
| 1 | No artifacts at all | THINK | `brainstorm` |
| 2 | `spec-*.md` exists but no `.approved-spec-*` marker | THINK | `brainstorm` (spec awaiting approval) |
| 3 | `spec-*.md` + `.approved-spec-*` exist, no `plan-*.md` | PLAN | `writing-plans` - auto-advance |
| 4 | `plan-*.md` exists, no review doc matching its session | REVIEW | `plan-review` - auto-advance |
| 5 | Plan reviewed + approved, has open items (`- [ ]`) | BUILD | `executing-plans` (+ `frontend-design` if UI steps detected) - auto-advance |
| 6 | `plan-*.md` all checked | VERIFY | Required: `code-review` -> `qa` -> `verification`; Optional: `code-review` (`security` mode), `production-readiness` - auto-advance |
| 7 | Verified | RELEASE | `release` skill - auto-advance |

Session matching for REVIEW detection: extract `[session]` from the plan filename. Example: `plan-main-auth-refactor-20260404.md` -> `auth-refactor`. A matching review doc must contain the same session identifier.

### Auto-Advance Rule (Wave Mode)

THINK has exactly one human gate: spec review approval.

- At THINK: `brainstorm` can run without manual gate; once `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval.
- THINK stage with DONE (spec approved): auto-invoke `writing-plans`.
- All non-THINK stages with DONE: **verify artifact exists first**, then auto-invoke next stage. Print: `[STAGE] DONE -> advancing to [NEXT-STAGE] ([skill-name])`
- Any stage with DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT: STOP and wait for user.

**Artifact verification before auto-advance** (run this check before invoking the next skill):

```bash
_verify_stage_artifact() {
  local from_stage="$1"
  case "$from_stage" in
    THINK)   [ -n "$_HAS_SPEC" ] && [ -n "$_HAS_SPEC_APPROVAL" ] ;;
    PLAN)    [ -n "$_HAS_PLAN" ] ;;
    REVIEW)  [ -n "$_HAS_REVIEW" ] ;;
    BUILD)   [ -n "$_HAS_EXECUTIONS" ] ;;
    VERIFY)  [ -n "$_HAS_EVALUATION" ] ;;
    RELEASE) [ -n "$_HAS_RELEASE" ] ;;
  esac
}

# Usage: before auto-advancing from stage X to stage Y:
# if ! _verify_stage_artifact "X"; then
#   echo "DONE_WITH_CONCERNS: Missing artifact for stage X"
#   echo "Cannot auto-advance. Please complete the current stage first."
#   # STOP and wait for user
# fi
```

### Stage Artifact Contract (Required for Auto-Advance)

Before advancing, verify at least one stage artifact exists for the current stage:

| Stage | Required artifact(s) |
|-------|-----------------------|
| THINK | `docs/superomni/specs/spec-[branch]-[session]-[date].md` + `docs/superomni/specs/.approved-spec-[branch]-[session]-[date]` |
| PLAN | `docs/superomni/plans/plan-[branch]-[session]-[date].md` |
| REVIEW | `docs/superomni/reviews/review-[branch]-[session]-[date].md` |
| BUILD | `docs/superomni/executions/execution-[branch]-[session]-[date].md` or `docs/superomni/subagents/subagent-[branch]-[session]-[date].md` |
| VERIFY | `docs/superomni/evaluations/evaluation-[branch]-[session]-[date].md` |
| RELEASE | `docs/superomni/releases/release-[branch]-[session]-[date].md` (must contain `## Release` and `## Retrospective`) |

If a required artifact is missing, do not advance. Report `DONE_WITH_CONCERNS` with the missing artifact path.

Only show the guided menu when:
- No clear next step can be determined
- The user invoked `/vibe` without arguments

### Session-Aware Routing

The artifact detection above first checks for files created or modified during the current session.
If the current session has no artifacts but the previous session left incomplete work
(tracked in `~/.omni-skills/sessions/last-session-artifacts.txt`), detection falls back
to scanning all files on disk, enabling the pipeline to resume across sessions.

- If NO artifacts exist (current or prior session) → stage resolves to THINK (Priority 1) → `brainstorm`
- If current-session artifacts exist → normal stage detection applies
- If only prior-session artifacts exist (`_CROSS_SESSION=true`) → normal stage detection applies,
  and announce: *"Resuming incomplete pipeline from previous session — picking up at [stage]."*

If the user passes arguments with `/vibe` (example: `/vibe I want to build a CLI tool`),
treat the arguments as the starting prompt and route to the detected skill with that context.
Since a new session has no artifacts yet, this will naturally route to `brainstorm`.

## Phase 2: Show Guided Menu

Present the available commands only when auto-advance does not apply:

```
| Command | What it does |
|---------|-------------|
| /brainstorm | Design a feature - produces spec-[branch]-[session]-[date].md |
| /write-plan | Turn a spec into an executable plan |
| /execute-plan | Run the plan step by step |
| /review | Plan review (before BUILD) |
| /qa | Quality assurance and test coverage |
| /verify | Verify task completion |
| /production-readiness | Pre-deploy readiness check |
| /investigate | Exploratory investigation |
| /self-improve | Post-task performance evaluation |
| /self-improve --scope retro | Engineering retrospective |
| /workflow | See the full sprint pipeline |
| /ship | Release workflow |
| /front-design | Unified frontend optimization with automatic mode detection |

Suggested next step -> [skill-name]: [reason based on detected stage]
```

## Phase 3: Handle Subcommands

### `/vibe status`

Run stage detection from Phase 1 and display:

```
Pipeline: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE
Stage: [current] | Branch: [branch]
Artifacts: spec-*.md [Y/N] | .approved-spec-* [Y/N] | plan-*.md [Y/N] | executions [N] | reviews [N] | releases [N]
Next -> [skill-name]: [reason]
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
Self-improvement history will be preserved:
  - docs/superomni/releases/
  - docs/superomni/evaluations/
  - docs/superomni/harness-audits/

Proceed? (Y/N)
```

If confirmed:

```bash
rm -f docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md
rm -rf docs/superomni/executions/ docs/superomni/reviews/ docs/superomni/subagents/ docs/superomni/production-readiness/
echo "Reset complete. Starting fresh from THINK stage."
```

Then re-run Phase 1-2.

## Phase 4: Delegate to Skill

1. If the user provided arguments -> invoke the detected skill with those arguments
2. If no arguments -> wait for user input
3. When the user chooses a command or describes what they want to do -> invoke the matching skill

Important: `/vibe` never executes implementation work directly. It always delegates to the appropriate skill.

Report status: DONE - framework activated, stage detected, user guided to next skill.