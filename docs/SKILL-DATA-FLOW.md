# Skill Data Flow Conventions

This document defines the **output format contracts** between skills in the superomni pipeline.
When a skill produces output that another skill consumes as input, these conventions ensure
reliable handoffs without depending on AI context memory.

## The Problem This Solves

Without explicit data contracts, skill handoffs rely on the AI "remembering" what the
previous skill produced. This is fragile. Each skill should:
1. **Produce** structured output in a known location
2. **Declare** what it produces (output contract)
3. **Read** the previous skill's output (input contract)

## Contract Directory

All workflow artifacts go in `docs/superomni/` (single source of truth):

```
docs/superomni/
├── specs/spec-[branch]-[session]-[date].md  ← brainstorm output
├── plans/plan-[branch]-[session]-[date].md  ← writing-plans output
├── reviews/               ← plan-review and code-review output
├── executions/            ← executing-plans output
├── subagents/             ← subagent-development session records
├── production-readiness/  ← production-readiness output
├── evaluations/            ← verification output
├── improvements/           ← self-improvement output
├── loops/                  ← loop output
├── harness-audits/         ← harness-engineering output
└── retros/                 ← self-improvement (`retro` scope) output
```

## Per-Skill Contracts

### `brainstorm` → `writing-plans`

**Produces:** `docs/superomni/specs/spec-[branch]-[session]-[date].md`

Required sections in `docs/superomni/specs/spec-[branch]-[session]-[date].md`:
```markdown
## Problem Statement
[Clear description of the problem]

## Goals
- [Goal 1]

## Non-Goals
- [Non-goal 1]

## Proposed Solution
[High-level approach]

## Acceptance Criteria
- [ ] [Criterion 1] — verifiable, specific
- [ ] [Criterion 2] — verifiable, specific
```

**Consumed by:** `writing-plans` reads `docs/superomni/specs/spec-*.md` to build `docs/superomni/plans/plan-[branch]-[session]-[date].md`

---

### `writing-plans` → `executing-plans`

**Produces:** `docs/superomni/plans/plan-[branch]-[session]-[date].md`

Required structure in `docs/superomni/plans/plan-[branch]-[session]-[date].md`:
```markdown
## Steps

### Step 1: [Name]
- **What:** [Description]
- **Files:** [Files to touch]
- **Involves code:** YES / NO
- **Verification:** [How to know this step is done]
- **Status:** [ ] pending / [x] done / [!] blocked

### Step 2: ...

## Acceptance Criteria
[Copied from docs/superomni/specs/spec-*.md or restated here]

## Risk Flags
- [Risk 1]: [Mitigation]
```

**Consumed by:** `executing-plans` reads `docs/superomni/plans/plan-*.md` step by step

---

### `plan-review` → `executing-plans`

**Produces:** `docs/superomni/reviews/review-[branch]-[session]-[date].md`

Required sections:
```markdown
# Plan Review: [branch]

## Strategy Review
[premises, scope, alternatives, risk]

## Engineering Review
[architecture, test plan, performance, security]

## Decision Audit Trail
| # | Phase | Decision | Type | Principle | Rationale |

## Verdict
**Status:** DONE | NEEDS_CONTEXT
```

**Consumed by:** `executing-plans` uses the review findings to execute the approved/revised plan

---

### `executing-plans` → `verification`

**Produces:** `docs/superomni/executions/execution-[branch]-[session]-[date].md`

Required sections:
```markdown
# Execution Results: [branch]

**Date:** [date]
**Branch:** [branch]
**Steps completed:** N/N

## Steps Log
✓ Step 1 COMPLETE — [evidence]
✓ Step 2 COMPLETE — [evidence]

## PLAN EXECUTION COMPLETE
Steps completed: N/N
Files changed: [list]
Tests passing: [output]
Status: DONE | DONE_WITH_CONCERNS
```

**Consumed by:** `verification` reads the execution log to check against acceptance criteria

---

### `verification` → `self-improvement`

**Produces:** `docs/superomni/evaluations/evaluation-[branch]-[session]-[date].md`

Required sections:
```markdown
# Verification Evaluation: [branch]

**Date:** [date]
**Branch:** [branch]
**Task:** [what was verified]

## Checklist Results

| Check | Result | Notes |
|-------|--------|-------|
| Functional verification | ✓/✗ | |
| Test verification | ✓/✗ | |
| Regression verification | ✓/✗ | |
| Completeness | ✓/✗ | |
| No regressions | ✓/✗ | |
| Blast radius | ✓/✗ | |

## Goal Alignment

Spec/plan used: [docs/superomni/specs/spec-*.md | docs/superomni/plans/plan-*.md | user request]

| Criterion | Met? | Evidence |
|-----------|------|----------|
| [criterion] | ✓/✗ | [proof] |

## Verdict

**Status:** DONE | DONE_WITH_CONCERNS | BLOCKED
```

**Consumed by:** `self-improvement` reads the latest evaluation report in Phase 1 as session evidence

---

### `code-review` (giving) → `code-review` (receiving)

**Produces:** `docs/superomni/reviews/review-[branch]-[session]-[date].md`

Required sections:
```markdown
# Code Review: [branch]

## P0 — Must Fix
- [file:line] [issue description]

## P1 — Should Fix
- [file:line] [issue description]

## P2 — Consider
- [file:line] [suggestion]

## Verdict: APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION
```

**Consumed by:** `code-review` in `receiving` mode reads review file to triage and address comments

---

### `production-readiness` → `ship`

**Produces:** `docs/superomni/production-readiness/production-readiness-[branch]-[session]-[date].md`

Required sections:
```markdown
# Production Readiness: [branch]

## Observability
- [ ] Logging: [PASS/FAIL/N/A]
- [ ] Metrics: [PASS/FAIL/N/A]

## Reliability
- [ ] Health check: [PASS/FAIL/N/A]
- [ ] Timeouts: [PASS/FAIL/N/A]

## Operability
- [ ] Rollback plan: [PASS/FAIL/N/A]

## Verdict: READY | READY_WITH_CONCERNS | NOT_READY
```

**Consumed by:** `ship` reads the readiness report before proceeding

---

### `self-improvement` (`retro` scope) → `self-improvement` (process scope)

**Produces:** `docs/superomni/retros/retro-[branch]-[session]-[date].md` (commit metrics, streak, ship of week)

**Consumed by:** `self-improvement` process evaluation reads retro data as evidence

---

### `loop` → `loop` (next iteration) and `workflow`

**Produces:**

- `docs/superomni/loops/loop-state-[branch]-[session]-iter-[n]-[date].md`
- `docs/superomni/loops/loop-summary-[branch]-[session]-[date].md`

Required sections for each loop state file:
```markdown
# Loop State: Iteration [n]

**Goal:** [goal statement]
**Iteration:** [n]/[max]
**Input artifact:** [prior loop-state path or baseline artifact]

## Previous Findings
[what was learned from previous iteration]

## Actions This Iteration
- [action]

## Outcomes
- [result]

## Convergence Check
- Goal reached? YES/NO
- Continue? YES/NO
```

Required sections for loop summary:
```markdown
# Loop Summary: [session]

**Goal:** [goal statement]
**Iterations completed:** [n]/[max]
**Stop reason:** CONVERGED | MAX_ITER_REACHED | USER_STOP | NO_MEANINGFUL_GAIN

## Iteration Log
| Iteration | Input Artifact | Key Actions | Result |
|-----------|----------------|-------------|--------|

## Final Assessment
- Goal status: [met / partial / unmet]
- Remaining gaps: [if any]
- Recommended next steps: [if any]
```

**Consumed by:**
- Next loop iteration reads the latest `loop-state-*.md` before planning
- Workflow and users read `loop-summary-*.md` as final iterative result

---

### `self-improvement` → next sprint's `workflow`

**Produces:** `docs/superomni/improvements/improvement-[branch]-[session]-[date].md`

Required sections:
```markdown
# Improvement Report: [branch]

**Date:** [date]
**Branch:** [branch]
**Task description:** [what was worked on]

## Session Evidence (Phase 1)
- Skills invoked: [list]
- Artifacts produced: [list]
- Tests outcome: [pass/fail counts]
- Evaluation report referenced: [path or "none"]

## Process Adherence (Phase 2)

| Question | Answer | Evidence |
|----------|--------|----------|
| THINK→PLAN→REVIEW→BUILD→VERIFY→SHIP→REFLECT followed | YES/PARTIAL/NO | |
| Spec/plan created before implementation | YES/PARTIAL/NO | |
| Skills used for intended triggers | YES/PARTIAL/NO | |
| Session ended with status report | YES/PARTIAL/NO | |

**Iron Law compliance:** N/5 laws followed

## Agent Evaluation (Phase 3)

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Scope management | [N]/5 | |
| Instruction following | [N]/5 | |
| Escalation behavior | [N]/5 | |

**Agent total: [N]/15**

## Skill Effectiveness (Phase 4)

| Skill | Right skill? | Phases done | Output quality | Score |
|-------|-------------|-------------|---------------|-------|
| [skill-1] | YES/NO | 100%/80%/<50% | clear/partial/missing | [N]/5 |

**Skills avg: [N]/5**

## Gap Analysis (Phase 5)

| Deviation | Root cause | Principle violated |
|-----------|-----------|-------------------|
| [deviation] | [root cause] | [principle] |

## Action Items (Phase 6)

### ACTION 1: [TITLE]
Problem: ...
Root cause: ...
Fix: ...
Verify: ...

### ACTION 2: [TITLE]
Problem: ...
Root cause: ...
Fix: ...
Verify: ...

### ACTION 3: [TITLE]
Problem: ...
Root cause: ...
Fix: ...
Verify: ...
```

**Consumed by:** At the start of the next sprint, `workflow` skill reads the latest improvement
report to apply the action items.

## Reading the Latest Artifact

Skills that consume upstream output should use this pattern:

```bash
# Read latest improvement report (if exists)
LATEST_IMPROVE=$(find docs/superomni/improvements -name "*.md" -type f 2>/dev/null | sort | tail -1)
if [ -n "$LATEST_IMPROVE" ]; then
  echo "Prior improvement actions:"
  grep "^### ACTION" "$LATEST_IMPROVE" -A 3 | head -30
fi

# Read latest evaluation report (if exists)
LATEST_EVAL=$(find docs/superomni/evaluations -name "*.md" -type f 2>/dev/null | sort | tail -1)
if [ -n "$LATEST_EVAL" ]; then
  echo "Latest task evaluation:"
  cat "$LATEST_EVAL" | head -30
fi

# Read spec for acceptance criteria
_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
cat "$_SPEC" 2>/dev/null | grep -A 20 "Acceptance Criteria" | head -25 || true

# Read latest review for open comments
LATEST_REVIEW=$(find docs/superomni/reviews -name "*.md" -type f 2>/dev/null | sort | tail -1)
if [ -n "$LATEST_REVIEW" ]; then
  grep "^- \[" "$LATEST_REVIEW" | head -20
fi
```

## Adding a New Data Contract

When adding a new skill that produces artifacts consumed by another skill:

1. Define the output format in this document (new section following the template above)
2. Add the artifact path to the directory map at the top
3. Add reading logic to the consuming skill's Phase 1
4. Add writing logic to the producing skill's final phase
5. Update `workflow/SKILL.md.tmpl` to document the new data flow
