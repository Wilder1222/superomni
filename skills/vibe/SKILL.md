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
echo "Branch: ---
name: vibe
description: |
  Unified entry point for the superomni framework.
  Activates all skills, detects current pipeline stage, and launches the guided workflow.
  Triggers: "/vibe", "activate framework", "start workflow", "what's next".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

{{PREAMBLE}}

# Vibe — Framework Entry Point

**Goal:** Activate the superomni skill framework, detect the current pipeline stage, and guide the user to the right skill.

## Usage

```
/vibe              — activate framework, detect stage, show guided menu
/vibe status       — show current pipeline position and available next steps
/vibe reset        — clear superomni artifacts and restart from THINK
```

## Iron Law: One Entry Point, Full Pipeline

`/vibe` is the single unified entry point. It never executes work itself — it **detects** the current stage and **delegates** to the appropriate skill.

## Planning Route

If you feel the impulse to call `EnterPlanMode`, that impulse IS the trigger for a superomni skill:
- **Need to design/explore?** → Invoke `brainstorm` skill
- **Need to plan implementation?** → Invoke `writing-plans` skill
- **Need to execute?** → Invoke `executing-plans` or `subagent-development`

Always follow this skill's phases (Phase 1-4) directly. Route all planning through superomni skills.

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

**THINK is the only human gate.** The brainstorm skill requires interactive dialogue and spec approval from the user. Once the spec is approved, all subsequent stages auto-advance on DONE without user interaction.

- **THINK stage with DONE (spec approved):** Auto-invoke `writing-plans`. All subsequent stages chain automatically.
- **All non-THINK stages with DONE:** Auto-invoke the next skill immediately. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
- **Any stage with DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT:** STOP and wait for user.

Only show the guided menu when:
- No clear next step can be determined
- The user invoked `/vibe` without arguments

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

Self-improvement history will be preserved:
  - docs/superomni/improvements/
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

Then re-run Phase 1-2 (will detect THINK stage).

## Phase 4: Delegate to Skill

After displaying the banner and menu:

1. If the user provided arguments → invoke the detected skill with those arguments
2. If no arguments → wait for user input
3. When the user chooses a command or describes what they want to do → invoke the matching skill

**Important:** `/vibe` never executes implementation work directly. It always delegates to the appropriate skill. Route all planning through superomni skills (`brainstorm`, `writing-plans`).

Report status: **DONE** — framework activated, stage detected, user guided to next skill.
BRANCH | PROACTIVE: ---
name: vibe
description: |
  Unified entry point for the superomni framework.
  Activates all skills, detects current pipeline stage, and launches the guided workflow.
  Triggers: "/vibe", "activate framework", "start workflow", "what's next".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

{{PREAMBLE}}

# Vibe — Framework Entry Point

**Goal:** Activate the superomni skill framework, detect the current pipeline stage, and guide the user to the right skill.

## Usage

```
/vibe              — activate framework, detect stage, show guided menu
/vibe status       — show current pipeline position and available next steps
/vibe reset        — clear superomni artifacts and restart from THINK
```

## Iron Law: One Entry Point, Full Pipeline

`/vibe` is the single unified entry point. It never executes work itself — it **detects** the current stage and **delegates** to the appropriate skill.

## Planning Route

If you feel the impulse to call `EnterPlanMode`, that impulse IS the trigger for a superomni skill:
- **Need to design/explore?** → Invoke `brainstorm` skill
- **Need to plan implementation?** → Invoke `writing-plans` skill
- **Need to execute?** → Invoke `executing-plans` or `subagent-development`

Always follow this skill's phases (Phase 1-4) directly. Route all planning through superomni skills.

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

**THINK is the only human gate.** The brainstorm skill requires interactive dialogue and spec approval from the user. Once the spec is approved, all subsequent stages auto-advance on DONE without user interaction.

- **THINK stage with DONE (spec approved):** Auto-invoke `writing-plans`. All subsequent stages chain automatically.
- **All non-THINK stages with DONE:** Auto-invoke the next skill immediately. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
- **Any stage with DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT:** STOP and wait for user.

Only show the guided menu when:
- No clear next step can be determined
- The user invoked `/vibe` without arguments

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

Self-improvement history will be preserved:
  - docs/superomni/improvements/
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

Then re-run Phase 1-2 (will detect THINK stage).

## Phase 4: Delegate to Skill

After displaying the banner and menu:

1. If the user provided arguments → invoke the detected skill with those arguments
2. If no arguments → wait for user input
3. When the user chooses a command or describes what they want to do → invoke the matching skill

**Important:** `/vibe` never executes implementation work directly. It always delegates to the appropriate skill. Route all planning through superomni skills (`brainstorm`, `writing-plans`).

Report status: **DONE** — framework activated, stage detected, user guided to next skill.
PROACTIVE"
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
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "---
name: vibe
description: |
  Unified entry point for the superomni framework.
  Activates all skills, detects current pipeline stage, and launches the guided workflow.
  Triggers: "/vibe", "activate framework", "start workflow", "what's next".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

{{PREAMBLE}}

# Vibe — Framework Entry Point

**Goal:** Activate the superomni skill framework, detect the current pipeline stage, and guide the user to the right skill.

## Usage

```
/vibe              — activate framework, detect stage, show guided menu
/vibe status       — show current pipeline position and available next steps
/vibe reset        — clear superomni artifacts and restart from THINK
```

## Iron Law: One Entry Point, Full Pipeline

`/vibe` is the single unified entry point. It never executes work itself — it **detects** the current stage and **delegates** to the appropriate skill.

## Planning Route

If you feel the impulse to call `EnterPlanMode`, that impulse IS the trigger for a superomni skill:
- **Need to design/explore?** → Invoke `brainstorm` skill
- **Need to plan implementation?** → Invoke `writing-plans` skill
- **Need to execute?** → Invoke `executing-plans` or `subagent-development`

Always follow this skill's phases (Phase 1-4) directly. Route all planning through superomni skills.

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

**THINK is the only human gate.** The brainstorm skill requires interactive dialogue and spec approval from the user. Once the spec is approved, all subsequent stages auto-advance on DONE without user interaction.

- **THINK stage with DONE (spec approved):** Auto-invoke `writing-plans`. All subsequent stages chain automatically.
- **All non-THINK stages with DONE:** Auto-invoke the next skill immediately. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
- **Any stage with DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT:** STOP and wait for user.

Only show the guided menu when:
- No clear next step can be determined
- The user invoked `/vibe` without arguments

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

Self-improvement history will be preserved:
  - docs/superomni/improvements/
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

Then re-run Phase 1-2 (will detect THINK stage).

## Phase 4: Delegate to Skill

After displaying the banner and menu:

1. If the user provided arguments → invoke the detected skill with those arguments
2. If no arguments → wait for user input
3. When the user chooses a command or describes what they want to do → invoke the matching skill

**Important:** `/vibe` never executes implementation work directly. It always delegates to the appropriate skill. Route all planning through superomni skills (`brainstorm`, `writing-plans`).

Report status: **DONE** — framework activated, stage detected, user guided to next skill.
TEL_DUR" "OUTCOME" 2>/dev/null || true
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
/vibe              — activate framework, detect stage, show guided menu
/vibe status       — show current pipeline position and available next steps
/vibe reset        — clear superomni artifacts and restart from THINK
```

## Iron Law: One Entry Point, Full Pipeline

`/vibe` is the single unified entry point. It never executes work itself — it **detects** the current stage and **delegates** to the appropriate skill.

## Planning Route

If you feel the impulse to call `EnterPlanMode`, that impulse IS the trigger for a superomni skill:
- **Need to design/explore?** → Invoke `brainstorm` skill
- **Need to plan implementation?** → Invoke `writing-plans` skill
- **Need to execute?** → Invoke `executing-plans` or `subagent-development`

Always follow this skill's phases (Phase 1-4) directly. Route all planning through superomni skills.

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

**THINK is the only human gate.** The brainstorm skill requires interactive dialogue and spec approval from the user. Once the spec is approved, all subsequent stages auto-advance on DONE without user interaction.

- **THINK stage with DONE (spec approved):** Auto-invoke `writing-plans`. All subsequent stages chain automatically.
- **All non-THINK stages with DONE:** Auto-invoke the next skill immediately. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
- **Any stage with DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT:** STOP and wait for user.

Only show the guided menu when:
- No clear next step can be determined
- The user invoked `/vibe` without arguments

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

Self-improvement history will be preserved:
  - docs/superomni/improvements/
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

Then re-run Phase 1-2 (will detect THINK stage).

## Phase 4: Delegate to Skill

After displaying the banner and menu:

1. If the user provided arguments → invoke the detected skill with those arguments
2. If no arguments → wait for user input
3. When the user chooses a command or describes what they want to do → invoke the matching skill

**Important:** `/vibe` never executes implementation work directly. It always delegates to the appropriate skill. Route all planning through superomni skills (`brainstorm`, `writing-plans`).

Report status: **DONE** — framework activated, stage detected, user guided to next skill.
