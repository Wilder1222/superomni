---
name: vibe
description: |
  Unified entry point: detect current pipeline stage, launch guided workflow, auto-delegate to next skill. Triggers: "/vibe", "activate framework", "start workflow". NOT a reference document — use workflow for that.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use to enter the framework, resume mid-sprint work, or auto-chain through stages. The primary user-facing entry command.
argument-hint: "[idea-or-status-or-reset-or-auto]"
produces: ~
consumes: ~
---


<!-- Inlined into every SKILL.md via {{PREAMBLE_CORE}}. Keep ≤30 lines. -->

## Preamble (Core)

**Status protocol** — end every session with one of: `DONE` (evidence provided) · `DONE_WITH_CONCERNS` (list each) · `BLOCKED` (state what blocks you) · `NEEDS_CONTEXT` (state what you need).

**Auto-advance** — pipeline: `THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE`. Only human gate is spec approval at THINK. On `DONE` at other stages, print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and invoke the next skill. On any non-DONE status at any stage, STOP.

**Output directory** — all artifacts go in `docs/superomni/<kind>/<kind>-[branch]-[session]-[date].md`. See `CLAUDE.md` for the full directory map.

**TACIT-DENSE** — before high-tacit decisions, classify D1 (domain expertise) · D2 (user-facing UX) · D3 (team culture) · D4 (novel pattern). On hit, output `TACIT-DENSE [D#]: [question] — My default: [recommendation]`. See reference for actions.

**Anti-sycophancy** — take a position on every significant question. Name flaws directly. No filler ("that's interesting", "you might consider", "that could work").

**Telemetry (local only)** — at session end, log `bin/analytics-log`. Nothing leaves the machine.

_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._

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

## Iron Law: /vibe Always Triggers the Complete Workflow

**Invoking `/vibe` is an unconditional commitment to running the complete pipeline.** No exceptions.

1. `/vibe` ALWAYS triggers the full THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE pipeline starting from the detected stage.
2. **Task difficulty / complexity does NOT shorten the workflow.** The pipeline runs in full regardless of whether the task appears simple or trivial.
3. **If the agent is about to skip any pipeline stage, abbreviate the workflow, or stop before RELEASE**, it MUST ask the user first:

   > "⚠️ Full pipeline requires completing [stage(s)]. Do you want to:
   > A) Run the complete workflow (recommended)
   > B) Skip to [specific stage] — [brief reason]
   >
   > Please choose A or B."

   The agent MUST wait for user response before proceeding. It MUST NOT silently skip stages.

## Planning Route

If you feel the impulse to call `EnterPlanMode`, that impulse IS the trigger for a superomni skill:
- Need to design/explore? -> Invoke `brainstorm`
- Need to plan implementation? -> Invoke `writing-plans`
- Need to execute? -> Invoke `executing-plans` or `subagent-development`

Always follow this skill's phases directly. Route all planning through superomni skills.

## Phase 1: Detect Current Pipeline Stage

Scan for existing artifacts to determine where the project is in the sprint pipeline. The full session-aware detection script + artifact-verification helper is in [reference/stage-detection.md](${CLAUDE_SKILL_DIR}/reference/stage-detection.md). Run it for the full matrix; the high-signal subset is auto-injected below.

### Current State (auto-injected at skill-load)

The `!`<command>`` syntax is Anthropic's dynamic context injection — runtime resolves each command before the skill body reaches the LLM.

- Branch / status: !`git branch --show-current && git status -s`
- Recent commits: !`git log --oneline -5 2>/dev/null`
- Latest spec / plan / evaluation: !`ls -t docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md docs/superomni/evaluations/evaluation-*.md docs/superomni/releases/release-*.md 2>/dev/null | head -4`

### Stage Detection Matrix

Use the following priority-ordered rules (first match wins):

| Priority | Condition | Stage | Skill |
|----------|-----------|-------|-------|
| 1 | No artifacts at all | THINK | `brainstorm` |
| 2 | `spec-*.md` exists but no `.approved-spec-*` marker | THINK | `brainstorm` (spec awaiting approval) |
| 3 | `spec-*.md` + `.approved-spec-*` exist, no `plan-*.md` | PLAN | `writing-plans` - auto-advance |
| 4 | `plan-*.md` exists, no review doc matching its session | REVIEW | `plan-review` - auto-advance |
| 5 | Plan reviewed + approved, has open items (`- [ ]`) | BUILD | `executing-plans` (+ `frontend-design` if UI steps detected) - auto-advance |
| 6 | `plan-*.md` all checked | VERIFY | Required: `code-review` -> `qa` -> `verification`; Optional: `code-review` (`security` mode), `production-readiness` (required when change involves server-side code, a versioned release, DB migrations, or new external dependencies) - auto-advance |
| 7 | Verified | RELEASE | `release` skill - auto-advance |

Session matching for REVIEW detection: extract `[session]` from the plan filename. Example: `plan-main-auth-refactor-20260404.md` -> `auth-refactor`. A matching review doc must be a `plan-review-*.md` file containing the same session identifier.

### Auto-Advance Rule (Wave Mode)

THINK has exactly one human gate: spec review approval.

- At THINK: `brainstorm` can run without manual gate; once `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval.
- THINK stage with DONE (spec approved): auto-invoke `writing-plans`.
- All non-THINK stages with DONE: **verify artifact exists first**, then auto-invoke next stage. Print: `[STAGE] DONE -> advancing to [NEXT-STAGE] ([skill-name])`
- Any stage with DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT: STOP and wait for user.
- **Any stage where the agent considers stopping early or skipping stages**: STOP and ask the user (see Iron Law above).

**Artifact verification before auto-advance.** The `_verify_stage_artifact` helper is in [reference/stage-detection.md § Artifact Verification Helper](${CLAUDE_SKILL_DIR}/reference/stage-detection.md#artifact-verification-helper). Call it before invoking the next skill; on miss, report `DONE_WITH_CONCERNS` and STOP.

### Stage Artifact Contract (Required for Auto-Advance)

Before advancing, verify at least one stage artifact exists for the current stage:

| Stage | Required artifact(s) |
|-------|-----------------------|
| THINK | `docs/superomni/specs/spec-[branch]-[session]-[date].md` + `docs/superomni/specs/.approved-spec-[branch]-[session]-[date]` |
| PLAN | `docs/superomni/plans/plan-[branch]-[session]-[date].md` |
| REVIEW | `docs/superomni/reviews/plan-review-[branch]-[session]-[date].md` |
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

Present the available commands only when auto-advance does not apply (i.e., the stage is ambiguous or multiple options exist). **After showing the menu, immediately invoke the suggested skill** — do not wait indefinitely. The menu is informational context, not a blocking gate.

**Rule: Phase 2 MUST always conclude with a skill invocation.** If the user doesn't respond within the same turn, default to the "Suggested next step" skill and proceed.

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
| /release | Ship and retrospective in one step |
| /front-design | Unified frontend optimization with automatic mode detection |

Suggested next step -> [skill-name]: [reason based on detected stage]
```

## Phase 3: Handle Subcommands

### `/vibe auto`

Runs the full pipeline end-to-end. Only human gate is spec approval at THINK; every other stage auto-advances on `DONE`.

**Protocol:**

1. **If no spec exists** (THINK stage): dispatch `brainstorm` skill. It produces `spec-[branch]-[session]-[date].md` and stops at the approval gate. User reviews and approves (single human interaction). Once approved (marker file `.approved-spec-*` written), continue.
2. **Chain the rest:** dispatch each stage's skill in order, passing the upstream artifact as context. After each `DONE`, check the next stage's `consumes:` (from the skill's frontmatter) is satisfied, then invoke the next skill.
3. **Respect the status protocol strictly.** Any status other than `DONE` stops the chain:
   - `DONE_WITH_CONCERNS` → surface concerns, stop and wait for user decision
   - `BLOCKED` → report blocker, stop
   - `NEEDS_CONTEXT` → request missing info, stop
4. **Enforce the artifact contract.** After each skill reports `DONE`, verify the declared `produces:` artifact exists on disk. If missing, treat as `DONE_WITH_CONCERNS` and stop.

**Stage dispatch sequence:**

```
THINK    brainstorm
         └─ STOP at approval gate, resume on marker .approved-spec-*
PLAN     writing-plans            (consumes spec, produces plan)
REVIEW   plan-review              (consumes plan, produces review)
BUILD    executing-plans          (consumes plan + review, produces execution)
         └─ delegates to: subagent-development, test-driven-development,
            frontend-design, refactoring, systematic-debugging as needed
VERIFY   code-review → qa → verification
         └─ produces evaluation artifact
RELEASE  release                  (consumes evaluation, produces release)
```

**Termination:**
- On `release` DONE → print summary of all artifacts produced and exit.
- On any non-DONE → print current stage, the non-DONE reason, and which skill/agent is holding the chain.

**Output format after completion:**

```
PIPELINE COMPLETE (auto mode)
════════════════════════════════════════
Branch:   [branch]
Session:  [session]
Artifacts produced:
  ✓ spec:       [path]
  ✓ plan:       [path]
  ✓ review:     [path]
  ✓ execution:  [path]
  ✓ evaluation: [path]
  ✓ release:    [path]
Total human interactions: 1 (spec approval)
════════════════════════════════════════
```

### `/vibe status`

Run stage detection from Phase 1 and display:

```
Pipeline: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE
Stage: [current] | Branch: [branch]
Artifacts: spec-*.md [Y/N] | .approved-spec-* [Y/N] | plan-*.md [Y/N] | plan-review-*.md [Y/N] | executions [N] | code-reviews [N] | releases [N]
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

**Rule: `/vibe` ALWAYS invokes a skill. It never ends with "waiting for user input."**

1. If the user provided arguments → invoke the detected skill with those arguments as context.
2. If no arguments → **auto-invoke the skill for the detected stage immediately.** Do NOT wait for user input. The user's invocation of `/vibe` is the trigger.
3. If stage is ambiguous (multiple plausible stages) → show the guided menu from Phase 2, then immediately invoke the chosen skill when the user responds.

**If you find yourself about to stop without invoking a skill**, that is a workflow violation. Either:
- Invoke the correct pipeline skill, OR
- Ask the user: "I was about to stop without triggering the full workflow. Do you want me to proceed with [skill-name] for [stage]? (Y/N)"

Important: `/vibe` never executes implementation work directly. It always delegates to the appropriate skill.

### Stage Dispatch Brief

Before invoking any skill, always print a stage-dispatch brief. The brief format, the canonical Stage → Skill / Agent / Output table, and a worked example are in [reference/dispatch-brief.md](${CLAUDE_SKILL_DIR}/reference/dispatch-brief.md).

Report status: DONE - framework activated, stage detected, delegated to [skill-name] for [stage].