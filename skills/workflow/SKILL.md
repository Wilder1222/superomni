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

### Session Continuity
After reporting any terminal status (DONE / DONE_WITH_CONCERNS), **always** close with a
"What's next?" line that names the next logical superomni skill:

```
What's next → [skill-name]: [one-sentence reason]
```

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/specs/spec.md docs/superomni/plans/plan.md docs/superomni/ .superomni/ 2>/dev/null
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
| Planning | `docs/superomni/specs/spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `docs/superomni/plans/plan.md`, relevant source files | Unrelated modules, docs |
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
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# Workflow — Sprint Pipeline

**Goal:** Guide a complete feature from idea to shipped code by orchestrating the right skills in the right order, with clear data handoffs between each stage.

## The Pipeline

```
THINK → PLAN → BUILD → REVIEW → TEST → PROD-CHECK → SHIP → REFLECT
  │        │       │        │        │        │          │       │
  ▼        ▼       ▼        ▼        ▼        ▼          ▼       ▼
spec.md  plan.md  code   feedback  green  ready-report release  retro
```

Each stage uses specific skills and produces artifacts consumed by the next stage.

**Entry point:** Use `/vibe` to activate the framework and auto-detect your current stage. It scans for artifacts and routes you to the right skill.

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
test -f docs/superomni/specs/spec.md && echo "spec.md found" || echo "No spec.md"
test -f docs/superomni/plans/plan.md && echo "plan.md found" || echo "No plan.md"
```

**Process:**
1. If the problem space is unclear → use `investigate` to map the system
2. Use `brainstorm` to crystallize the problem and explore solutions
3. Generate 3 candidate approaches, evaluate tradeoffs
4. Produce a spec document

**Output:** `docs/superomni/specs/spec.md` — problem statement, goals, non-goals, proposed solution, acceptance criteria.

**Data flow:**
```
user request → brainstorm → docs/superomni/specs/spec.md
                                  │
                                  ▼
                             [next stage]
```

**"What's next" check:** Does `docs/superomni/specs/spec.md` exist and have acceptance criteria? → Move to PLAN.

## Stage 2: PLAN — Break It Down

**Skills:** `writing-plans`, `plan-review`

**Input:** `docs/superomni/specs/spec.md` from Stage 1.

**Process:**
1. Use `writing-plans` to decompose the spec into ordered, testable steps
2. Each step must have: description, files to touch, verification criterion
3. Use `plan-review` to validate the plan before execution

**Output:** `docs/superomni/plans/plan.md` — ordered steps with verification criteria, dependency graph, risk flags.

**Data flow:**
```
docs/superomni/specs/spec.md → writing-plans → docs/superomni/plans/plan.md → plan-review → docs/superomni/plans/plan.md (reviewed)
                                                       │
                                                       ▼
                                                  [next stage]
```

**"What's next" check:** Does `docs/superomni/plans/plan.md` exist and pass review? → Move to BUILD.

## Stage 3: BUILD — Execute the Plan

**Skills:** `executing-plans`, `test-driven-development`, `careful`, `subagent-development`

**Input:** `docs/superomni/plans/plan.md` from Stage 2.

**Process:**
1. Use `executing-plans` to work through the plan step by step
2. For each step, use `test-driven-development` (Red → Green → Refactor)
3. If high-risk operations are detected, `careful` activates automatically
4. For independent steps, consider `subagent-development` for parallel execution
5. Verify each step before moving to the next

**Output:** Working code with tests — committed to a feature branch.

**Data flow:**
```
docs/superomni/plans/plan.md → executing-plans ──┬──→ code changes (committed)
                            │
              test-driven-development → test files
                            │
                    careful (if triggered) → confirmation
                            │
                            ▼
                       [next stage]
```

**"What's next" check:** All plan steps complete? Tests passing? → Move to REVIEW.

## Stage 4: REVIEW — Get Feedback

**Skills:** `code-review`, `receiving-code-review`

**Input:** Code changes on feature branch.

**Process:**
1. Self-review first using `code-review` (catch obvious issues before asking others)
2. Submit for review (PR or equivalent)
3. When feedback arrives, use `receiving-code-review` to process it systematically
4. Triage comments (P0/P1/P2), fix issues, re-request review

**Output:** Approved code — review comments addressed, PR approved.

**Data flow:**
```
code (branch) → code-review (self) → PR
                                      │
                              reviewer feedback
                                      │
                                      ▼
                    receiving-code-review → fixes → re-review
                                                       │
                                                       ▼
                                                  [next stage]
```

**"What's next" check:** PR approved with no open P0/P1 comments? → Move to TEST.

## Stage 5: TEST — Verify Quality

**Skills:** `qa`, `security-audit`, `verification`

**Input:** Approved code from Stage 4.

**Process:**
1. Use `qa` for comprehensive quality assurance:
   - Run existing tests, write missing tests, explore edge cases
2. Use `security-audit` if changes touch auth, data handling, or external input
3. Use `verification` as final pre-completion checklist — includes explicit **goal alignment check** against docs/superomni/specs/spec.md acceptance criteria

**Output:** Verified code — all tests green, security reviewed, goal alignment confirmed.

**Data flow:**
```
approved code → qa ──────────────→ QA report
                │
                ├── security-audit → security report (if applicable)
                │
                └── verification ──→ verification report (with goal alignment)
                                          │
                                          ▼
                                     [next stage]
```

**"What's next" check:** QA passed? Security clean? Verification complete? Goal alignment confirmed? → Move to PROD-CHECK.

## Stage 5.5: PROD-CHECK — Production Readiness

**Skills:** `production-readiness`

**Input:** Verified code from Stage 5.

**Process:**
1. Use `production-readiness` to run the pre-deploy gate
2. Check observability (logging, metrics), reliability (health, timeouts, degradation), and operability (rollback, runbook, alerts)
3. Verdict must be READY or READY_WITH_CONCERNS before proceeding

**Output:** Production readiness report saved to `docs/superomni/production-readiness/`.

**Data flow:**
```
verified code → production-readiness ──→ readiness report
                                               │
                              READY or READY_WITH_CONCERNS?
                                               │ YES
                                               ▼
                                          [next stage]
                                               │ NO (NOT_READY)
                                               ▼
                                    fix blockers → re-run check
```

**"What's next" check:** Verdict is READY or READY_WITH_CONCERNS? → Move to SHIP.

## Stage 6: SHIP — Release

**Skills:** `ship`, `finishing-branch`, `careful`

**Input:** Verified code from Stage 5.

**Process:**
1. Use `finishing-branch` to prepare the branch for merge
2. Use `ship` for the release workflow (version bump, changelog, deploy)
3. `careful` activates automatically for production deployments

**Output:** Released software — merged to main, deployed, tagged.

**Data flow:**
```
verified code → finishing-branch → merge to main
                                       │
                                   ship → version bump → changelog → deploy
                                                                       │
                                                                       ▼
                                                                  [next stage]
```

**"What's next" check:** Code merged? Deployed? Version tagged? → Move to REFLECT.

## Stage 7: REFLECT — Learn and Improve

**Skills:** `retro`, `self-improvement`

**Input:** Completed feature — the full journey from idea to deployment.

**Process:**
1. Use `retro` to analyze what was shipped: commits, LOC, active days, streak
2. Use `self-improvement` to evaluate *how* you worked:
   - Process adherence (were phases followed?)
   - Agent behavior (scope management, instruction following, escalation)
   - Skill effectiveness (were the right skills used correctly?)
3. Generate 3 concrete improvement actions for the next sprint
4. Save both the retro report and the improvement report

**Output:** Retrospective notes + Improvement report with 3 action items.

**Data flow:**
```
completed feature → retro → retrospective notes (.context/retros/)
                  ↓
           self-improvement → improvement report (docs/superomni/improvements/)
                  ↓
          3 action items → [next sprint — feed into THINK stage]
```

**"What's next" check:** Retro saved? Improvement actions defined? → Start next sprint at THINK.

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

If you're joining a sprint already in progress, use `/vibe` or `/vibe status` to auto-detect your current stage. Or scan manually:

```bash
# Check what exists
ls docs/superomni/specs/spec.md docs/superomni/plans/plan.md 2>/dev/null
git log --oneline -10
git status --short
```

- `docs/superomni/specs/spec.md` exists but no `docs/superomni/plans/plan.md` → You're at PLAN stage
- `docs/superomni/plans/plan.md` exists with unchecked items → You're at BUILD stage
- Feature branch with code but no review → You're at REVIEW stage
- PR approved but not merged → You're at TEST or PROD-CHECK stage
- `docs/superomni/production-readiness/` files exist but not yet shipped → You're at SHIP stage
- Nothing exists → You're at THINK stage

## Report

```
WORKFLOW STATUS
════════════════════════════════════════
Current stage:    [THINK/PLAN/BUILD/REVIEW/TEST/PROD-CHECK/SHIP/REFLECT]
Artifacts:
  docs/superomni/specs/spec.md:  [exists/missing]
  docs/superomni/plans/plan.md:  [exists/missing]
  code:           [branch name or N/A]
  tests:          [passing/failing/none]
  review:         [approved/pending/not started]
  prod-check:     [READY/READY_WITH_CONCERNS/NOT_READY/not run]
  release:        [deployed/not deployed]
Next step:        [specific action to take]
Blocking issues:  [none or list]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
════════════════════════════════════════
```
