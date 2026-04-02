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

### Session Continuity
After reporting any terminal status (DONE / DONE_WITH_CONCERNS), **always** close with a
"What's next?" line that names the next logical superomni skill:

```
What's next → [skill-name]: [one-sentence reason]
```

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/spec.md docs/superomni/plan.md docs/superomni/ .superomni/ 2>/dev/null
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
| Planning | `docs/superomni/spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `docs/superomni/plan.md`, relevant source files | Unrelated modules, docs |
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
~/.claude/skills/superomni/bin/analytics-log "vibe" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

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

## Phase 1: Detect Current Pipeline Stage

Scan for existing artifacts to determine where the project is in the sprint pipeline:

```bash
# Artifact detection
_HAS_SPEC=$(test -f docs/superomni/spec.md && echo "yes" || echo "no")
_HAS_PLAN=$(test -f docs/superomni/plan.md && echo "yes" || echo "no")
_HAS_EXECUTIONS=$(ls docs/superomni/executions/*.md 2>/dev/null | head -1)
_HAS_REVIEWS=$(ls docs/superomni/reviews/*.md 2>/dev/null | head -1)
_HAS_PROD_READINESS=$(ls docs/superomni/production-readiness/*.md 2>/dev/null | head -1)
_HAS_IMPROVEMENTS=$(ls .superomni/improvements/*.md 2>/dev/null | head -1)

# Plan completion check (if plan exists)
if [ "$_HAS_PLAN" = "yes" ]; then
  _PLAN_OPEN=$(grep -c '^\- \[ \]' docs/superomni/plan.md 2>/dev/null || echo "0")
  _PLAN_DONE=$(grep -c '^\- \[x\]' docs/superomni/plan.md 2>/dev/null || echo "0")
fi

# Recent git activity
git log --oneline -5 2>/dev/null
git status --short 2>/dev/null
```

### Stage Detection Matrix

Use the following priority-ordered rules (first match wins):

| Priority | Condition | Stage | Suggested Skill |
|----------|-----------|-------|-----------------|
| 1 | No artifacts at all | **THINK** | `brainstorm` |
| 2 | `spec.md` exists, no `plan.md` | **PLAN** | `writing-plans` |
| 3 | `plan.md` exists with open items (`- [ ]`) | **BUILD** | `executing-plans` |
| 4 | `plan.md` all checked, no review docs | **REVIEW** | `code-review` |
| 5 | Review docs exist, no execution/QA verification | **TEST** | `qa` then `verification` |
| 6 | Verified, no production-readiness report | **PROD-CHECK** | `production-readiness` |
| 7 | Production readiness confirmed | **SHIP** | `ship` |
| 8 | Shipped (tagged release or merged PR) | **REFLECT** | `retro` |

If the user passes **arguments** with `/vibe` (e.g., `/vibe I want to build a CLI tool`), treat the arguments as the starting prompt and route to the detected skill with that context.

## Phase 2: Display Welcome Banner

Print the following banner after stage detection:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  superomni — Plan Lean, Execute Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Branch:    [current branch]
  Stage:     [detected stage] ← YOU ARE HERE
  Pipeline:  THINK → PLAN → BUILD → REVIEW → TEST → PROD-CHECK → SHIP → REFLECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Show the pipeline with the current stage highlighted:

```
  THINK → PLAN → BUILD → REVIEW → TEST → PROD-CHECK → SHIP → REFLECT
    ^
    YOU ARE HERE
```

## Phase 3: Show Guided Menu

After the banner, present the available commands:

```
Available commands:

| Command | What it does |
|---------|-------------|
| /brainstorm | Design a feature — produces spec.md |
| /write-plan | Turn a spec into an executable plan |
| /execute-plan | Run the plan step by step |
| /review | Structured code review |
| /qa | Quality assurance and test coverage |
| /verify | Verify task completion |
| /production-readiness | Pre-deploy readiness check |
| /investigate | Exploratory investigation |
| /retro | Engineering retrospective |
| /workflow | See the full sprint pipeline |
| /ship | Release workflow |

Suggested next step → [skill-name]: [reason based on detected stage]
```

If the user provided arguments with `/vibe`, skip the menu and immediately invoke the suggested skill with the user's arguments as context.

## Phase 4: Handle Subcommands

### `/vibe status`

Run the stage detection from Phase 1 and display:

```
PIPELINE STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Branch:  [branch]
  Stage:   [stage]

  Artifacts found:
    spec.md:              [exists / missing]
    plan.md:              [exists / missing] ([N open / M total] items)
    executions/:          [N files / empty]
    reviews/:             [N files / empty]
    production-readiness/: [N files / empty]

  Suggested next → [skill-name]: [reason]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### `/vibe reset`

Warn before clearing artifacts:

```
WARNING: This will remove all superomni artifacts:
  - docs/superomni/spec.md
  - docs/superomni/plan.md
  - docs/superomni/executions/
  - docs/superomni/reviews/
  - docs/superomni/subagents/
  - docs/superomni/production-readiness/

Internal state (.superomni/) will be preserved.

Proceed? (Y/N)
```

If confirmed:
```bash
rm -f docs/superomni/spec.md docs/superomni/plan.md
rm -rf docs/superomni/executions/ docs/superomni/reviews/ docs/superomni/subagents/ docs/superomni/production-readiness/
echo "Reset complete. Starting fresh from THINK stage."
```

Then re-run Phase 1-3 (will detect THINK stage).

## Phase 5: Delegate to Skill

After displaying the banner and menu:

1. If the user provided arguments → invoke the detected skill with those arguments
2. If no arguments → wait for user input
3. When the user chooses a command or describes what they want to do → invoke the matching skill

**Important:** `/vibe` never executes implementation work directly. It always delegates to the appropriate skill. Do NOT use Claude Code's built-in `EnterPlanMode` — always delegate to the superomni skill (e.g., `writing-plans` for planning).

Report status: **DONE** — framework activated, stage detected, user guided to next skill.
