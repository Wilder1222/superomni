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
_PROACTIVE=$(~/.claude/skills/super-omni/bin/config get proactive 2>/dev/null || echo "true")
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

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/super-omni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# Workflow — Sprint Pipeline

**Goal:** Guide a complete feature from idea to shipped code by orchestrating the right skills in the right order, with clear data handoffs between each stage.

## The Pipeline

```
THINK → PLAN → BUILD → REVIEW → TEST → SHIP → REFLECT
  │        │       │        │        │       │       │
  ▼        ▼       ▼        ▼        ▼       ▼       ▼
spec.md  plan.md  code   feedback  green  release  retro
```

Each stage uses specific skills and produces artifacts consumed by the next stage.

## Stage 1: THINK — Define the Problem

**Skills:** `brainstorming`, `investigate`

**Input:** Fuzzy idea, user request, bug report, or feature ask.

**Process:**
1. If the problem space is unclear → use `investigate` to map the system
2. Use `brainstorming` to crystallize the problem and explore solutions
3. Generate 3 candidate approaches, evaluate tradeoffs
4. Produce a spec document

**Output:** `spec.md` — problem statement, goals, non-goals, proposed solution, acceptance criteria.

**Data flow:**
```
user request → brainstorming → spec.md
                                  │
                                  ▼
                             [next stage]
```

**"What's next" check:** Does `spec.md` exist and have acceptance criteria? → Move to PLAN.

## Stage 2: PLAN — Break It Down

**Skills:** `writing-plans`, `plan-review`

**Input:** `spec.md` from Stage 1.

**Process:**
1. Use `writing-plans` to decompose the spec into ordered, testable steps
2. Each step must have: description, files to touch, verification criterion
3. Use `plan-review` to validate the plan before execution

**Output:** `plan.md` — ordered steps with verification criteria, dependency graph, risk flags.

**Data flow:**
```
spec.md → writing-plans → plan.md → plan-review → plan.md (reviewed)
                                                       │
                                                       ▼
                                                  [next stage]
```

**"What's next" check:** Does `plan.md` exist and pass review? → Move to BUILD.

## Stage 3: BUILD — Execute the Plan

**Skills:** `executing-plans`, `test-driven-development`, `careful`, `subagent-development`

**Input:** `plan.md` from Stage 2.

**Process:**
1. Use `executing-plans` to work through the plan step by step
2. For each step, use `test-driven-development` (Red → Green → Refactor)
3. If high-risk operations are detected, `careful` activates automatically
4. For independent steps, consider `subagent-development` for parallel execution
5. Verify each step before moving to the next

**Output:** Working code with tests — committed to a feature branch.

**Data flow:**
```
plan.md → executing-plans ──┬──→ code changes (committed)
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
3. Use `verification` as final pre-completion checklist

**Output:** Verified code — all tests green, security reviewed, verification checklist complete.

**Data flow:**
```
approved code → qa ──────────────→ QA report
                │
                ├── security-audit → security report (if applicable)
                │
                └── verification ──→ verification report
                                          │
                                          ▼
                                     [next stage]
```

**"What's next" check:** QA passed? Security clean? Verification complete? → Move to SHIP.

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

## Stage 7: REFLECT — Learn

**Skills:** `retro`

**Input:** Completed feature — the full journey from idea to deployment.

**Process:**
1. Use `retro` to analyze what went well and what didn't
2. Capture metrics: time spent, deviations from plan, bugs found
3. Identify process improvements for next sprint

**Output:** Retrospective notes — lessons learned, action items.

**Data flow:**
```
completed feature → retro → retrospective notes
                              │
                              ▼
                         [next sprint — back to THINK]
```

## Quick Reference: Which Skill When?

| I need to... | Use this skill |
|--------------|---------------|
| Understand a fuzzy idea | `brainstorming` |
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
| Debug an error | `systematic-debugging` |
| Prepare branch for merge | `finishing-branch` |
| Release software | `ship` |
| Run a retrospective | `retro` |
| Create a new skill | `writing-skills` |

## Picking Up Mid-Sprint

If you're joining a sprint already in progress:

```bash
# Check what exists
ls spec.md plan.md 2>/dev/null
git log --oneline -10
git status --short
```

- `spec.md` exists but no `plan.md` → You're at PLAN stage
- `plan.md` exists with unchecked items → You're at BUILD stage
- Feature branch with code but no review → You're at REVIEW stage
- PR approved but not merged → You're at TEST or SHIP stage
- Nothing exists → You're at THINK stage

## Report

```
WORKFLOW STATUS
════════════════════════════════════════
Current stage:    [THINK/PLAN/BUILD/REVIEW/TEST/SHIP/REFLECT]
Artifacts:
  spec.md:        [exists/missing]
  plan.md:        [exists/missing]
  code:           [branch name or N/A]
  tests:          [passing/failing/none]
  review:         [approved/pending/not started]
  release:        [deployed/not deployed]
Next step:        [specific action to take]
Blocking issues:  [none or list]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
════════════════════════════════════════
```
