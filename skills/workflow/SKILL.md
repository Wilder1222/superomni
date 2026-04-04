---
name: workflow
description: |
  Documents the end-to-end sprint workflow and inter-skill data flow.
  Use to understand which skills to use, in what order, and how data flows between them.
  Triggers: "workflow", "sprint", "pipeline", "what's next", "how do skills connect".
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

When a skill reports **DONE** (no concerns, no blockers):
1. Write the session artifact to `docs/superomni/`
2. Print a single-line transition: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill without waiting for user input

When a skill reports **DONE_WITH_CONCERNS**, **BLOCKED**, or **NEEDS_CONTEXT**:
1. Write the session artifact
2. STOP and present the status to the user
3. Wait for user decision before proceeding

Pipeline stage order: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → IMPROVE → REFLECT

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

# Workflow — Sprint Pipeline

**Goal:** Guide a complete feature from idea to shipped code by orchestrating the right skills in the right order, with clear data handoffs between each stage.

## The Pipeline

```
THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → IMPROVE → REFLECT
  │        │       │        │       │       │       │         │
  ▼        ▼       ▼        ▼       ▼       ▼       ▼         ▼
spec-*   plan-*  reviewed  code   green  release  actions    retro
```

Each stage uses specific skills and produces artifacts consumed by the next stage.

## Stage 1: THINK — Define the Problem

**Skills:** `brainstorm`, `investigate`

**Input:** Fuzzy idea, user request, bug report, or feature ask.

**Start-of-sprint context scan:**
```bash
# Always check for prior improvement actions from the last self-improvement run
LATEST_IMPROVE=$(find docs/superomni/improvements -name "*.md" -type f 2>/dev/null |   sort -t- -k2,3 | tail -1)
if [ -n "$LATEST_IMPROVE" ]; then
  echo "=== Applying improvement actions from last sprint ==="
  grep "^### ACTION" "$LATEST_IMPROVE" -A 4 | head -30
fi

# Check what spec/plan artifacts already exist
_LATEST_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
_LATEST_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
test -n "$_LATEST_SPEC" && echo "spec found: $_LATEST_SPEC" || echo "No spec"
test -n "$_LATEST_PLAN" && echo "plan found: $_LATEST_PLAN" || echo "No plan"
```

**Process:**
1. If the problem space is unclear → use `investigate` to map the system
2. Use `brainstorm` to crystallize the problem and explore solutions
3. Generate 3 candidate approaches, evaluate tradeoffs
4. Produce a spec document

**Output:** `docs/superomni/specs/spec-[branch]-[session]-[date].md` — problem statement, goals, non-goals, proposed solution, acceptance criteria.

**Data flow:**
```
user request → brainstorm → docs/superomni/specs/spec-[branch]-[session]-[date].md
                                  │
                                  ▼
                             [next stage]
```

**"What's next" check:** Does any `docs/superomni/specs/spec-*.md` exist and have acceptance criteria? → Move to PLAN.

## Stage 2: PLAN — Break It Down

**Skills:** `writing-plans`

**Input:** Latest `docs/superomni/specs/spec-*.md` from Stage 1.

**Process:**
1. Use `writing-plans` to decompose the spec into ordered, testable steps
2. Each step must have: description, files to touch, verification criterion

**Output:** `docs/superomni/plans/plan-[branch]-[session]-[date].md` — ordered steps with verification criteria, dependency graph, risk flags.

**Data flow:**
```
docs/superomni/specs/spec-*.md → writing-plans → docs/superomni/plans/plan-*.md
                                                       │
                                                       ▼
                                                  [next stage]
```

**"What's next" check:** Does any `docs/superomni/plans/plan-*.md` exist? → Move to REVIEW.

## Stage 3: REVIEW — Validate the Plan

**Skills:** `plan-review`, `autoplan`

**Input:** `docs/superomni/plans/plan-*.md` from Stage 2.

**Process:**
1. Use `plan-review` to validate the plan through 3 lenses: Strategy (CEO), Design (if UI), Engineering
2. Auto-resolve mechanical decisions using the 6 decision principles
3. Surface taste decisions to the user at the final gate
4. If issues found → revise the plan and re-review

**Output:** Reviewed plan — review doc saved to `docs/superomni/reviews/`, plan updated with revisions.

**Data flow:**
```
docs/superomni/plans/plan-*.md → plan-review → plan-*.md (revised) + review doc
                                                       │
                                                       ▼
                                                  [next stage]
```

**"What's next" check:** Plan reviewed and approved? → Move to BUILD.

## Stage 4: BUILD — Execute the Plan

**Skills:** `executing-plans`, `test-driven-development`, `careful`, `subagent-development`

**Input:** Reviewed `docs/superomni/plans/plan-*.md` from Stage 3.

**Process:**
1. Use `executing-plans` to work through the plan step by step
2. For each step, use `test-driven-development` (Red → Green → Refactor)
3. If high-risk operations are detected, `careful` activates automatically
4. For independent steps, consider `subagent-development` for parallel execution
5. Verify each step before moving to the next

**Output:** Working code with tests — committed to a feature branch.

**Data flow:**
```
docs/superomni/plans/plan-*.md → executing-plans ──┬──→ code changes (committed)
                            │
              test-driven-development → test files
                            │
                    careful (if triggered) → confirmation
                            │
                            ▼
                       [next stage]
```

**"What's next" check:** All plan steps complete? Tests passing? → Move to VERIFY.

## Stage 5: VERIFY — Code Review, QA & Production Readiness

**Skills:** `code-review`, `receiving-code-review`, `qa`, `security-audit`, `verification`, `production-readiness`

**Input:** Code changes from Stage 4.

**Process:**
1. Use `code-review` for structured code review (self-review first, then submit PR)
2. When feedback arrives, use `receiving-code-review` to process comments systematically
3. Use `qa` for comprehensive quality assurance:
   - Run existing tests, write missing tests, explore edge cases
4. Use `security-audit` if changes touch auth, data handling, or external input
5. Use `verification` as final pre-completion checklist — includes explicit **goal alignment check** against the latest spec's acceptance criteria
6. Use `production-readiness` to run the pre-deploy gate:
   - Check observability (logging, metrics), reliability (health, timeouts, degradation), operability (rollback, runbook, alerts)
   - Verdict must be READY or READY_WITH_CONCERNS before proceeding

**Output:** Verified code — reviewed, tested, security audited, goal-aligned, production readiness report saved to `docs/superomni/production-readiness/`.

**Data flow:**
```
code → code-review → qa → security-audit → verification → production-readiness
                                                            │
                                           READY or READY_WITH_CONCERNS?
                                                            │ YES → [next stage]
                                                            │ NO  → fix blockers → re-run
```

**"What's next" check:** Code reviewed? QA passed? Security clean? Verification complete? Production readiness READY? → Move to SHIP.

## Stage 6: SHIP — Release

**Skills:** `ship`, `finishing-branch`, `careful`

**Input:** Verified and production-ready code from Stage 5.

**Process:**
1. Use `finishing-branch` to prepare the branch for merge
2. Use `ship` for the release workflow (version bump, changelog, deploy)
3. `careful` activates automatically for production deployments

**Output:** Released software — merged to main, deployed, tagged.

**Data flow:**
```
verified code → finishing-branch → merge to main → ship → deploy
                                                            │
                                                            ▼
                                                       [next stage]
```

**"What's next" check:** Code merged? Deployed? Version tagged? → Move to IMPROVE.

## Stage 7: IMPROVE — Self-Evaluation

**Skills:** `self-improvement`

**Input:** Completed feature — the full journey from idea to deployment.

**Process:**
1. Use `self-improvement` to evaluate *how* you worked:
   - Process adherence (were phases followed?)
   - Agent behavior (scope management, instruction following, escalation)
   - Skill effectiveness (were the right skills used correctly?)
2. Generate 3 concrete improvement actions for the next sprint
3. Save the improvement report

**Output:** Improvement report with 3 action items saved to `docs/superomni/improvements/`.

**Data flow:**
```
shipped feature → self-improvement → improvement report (docs/superomni/improvements/)
                                            │
                                     3 action items
                                            │
                                            ▼
                                       [next stage]
```

**"What's next" check:** Improvement report saved with action items? → Move to REFLECT.

## Stage 8: REFLECT — Retrospective

**Skills:** `retro`

**Input:** Improvement report from Stage 7 + full sprint history.

**Process:**
1. Use `retro` to analyze what was shipped: commits, LOC, active days, streak
2. Review improvement actions from Stage 7
3. Capture team/process patterns and lessons learned

**Output:** Retrospective notes.

**Data flow:**
```
improvement report → retro → retrospective notes
                               │
                        feed into next sprint THINK stage
```

**"What's next" check:** Retro saved? → Start next sprint at THINK.

## Quick Reference: Which Skill When?

| I need to... | Use this skill |
|--------------|---------------|
| Understand a fuzzy idea | `brainstorm` |
| Explore an unfamiliar system | `investigate` |
| Break work into steps | `writing-plans` |
| Validate a plan | `plan-review` |
| Execute a plan | `executing-plans` |
| Write code with tests | `test-driven-development` |
| Run parallel tasks | `subagent-development`, `dispatching-parallel` |
| Review code | `code-review` |
| Respond to review feedback | `receiving-code-review` |
| Run QA checks | `qa` |
| Audit for security | `security-audit` |
| Handle risky operations | `careful` |
| Verify work is complete | `verification` |
| Check production readiness | `production-readiness` |
| Debug an error | `systematic-debugging` |
| Prepare branch for merge | `finishing-branch` |
| Release software | `ship` |
| Run a retrospective | `retro` |
| Evaluate sprint performance | `self-improvement` |
| Create a new skill | `writing-skills` |

## Picking Up Mid-Sprint

If you're joining a sprint already in progress:

```bash
# Check what exists
ls docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md 2>/dev/null
git log --oneline -10
git status --short
```

- Nothing exists → You're at THINK stage
- `docs/superomni/specs/spec-*.md` exists but no `docs/superomni/plans/plan-*.md` → You're at PLAN stage
- `docs/superomni/plans/plan-*.md` exists but no review docs → You're at REVIEW stage (plan review)
- Plan reviewed, has unchecked items → You're at BUILD stage
- Code complete but not verified/production-ready → You're at VERIFY stage (code review + QA)
- `docs/superomni/production-readiness/` files exist but not yet shipped → You're at SHIP stage
- Shipped but no improvement report → You're at IMPROVE stage
- `docs/superomni/improvements/` files exist → You're at REFLECT stage

## Report

```
Pipeline: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → IMPROVE → REFLECT
Stage: [current] | Branch: [branch]
Artifacts: spec-*.md [Y/N] | plan-*.md [Y/N] | executions [N] | reviews [N] | prod-readiness [N] | improvements [N]
Next → [skill-name]: [reason]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
```
