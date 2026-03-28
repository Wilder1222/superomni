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

All inter-skill artifacts are stored in `.superomni/` with predictable paths:

```
.superomni/
├── reviews/           ← code-review output
├── executions/        ← executing-plans output
├── subagents/         ← subagent-development session records
├── production-readiness/  ← production-readiness output
├── improvements/      ← self-improvement output
spec.md                ← brainstorming output (project root)
plan.md                ← writing-plans output (project root)
```

## Per-Skill Contracts

### `brainstorming` → `writing-plans`

**Produces:** `spec.md`

Required sections in `spec.md`:
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

**Consumed by:** `writing-plans` reads `spec.md` to build `plan.md`

---

### `writing-plans` → `executing-plans`

**Produces:** `plan.md`

Required structure in `plan.md`:
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
[Copied from spec.md or restated here]

## Risk Flags
- [Risk 1]: [Mitigation]
```

**Consumed by:** `executing-plans` reads `plan.md` step by step

---

### `executing-plans` → `verification`

**Produces:** `.superomni/executions/execution-[branch]-[date].md`

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

### `code-review` → `receiving-code-review`

**Produces:** `.superomni/reviews/review-[branch]-[date].md`

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

**Consumed by:** `receiving-code-review` reads review file to triage and address comments

---

### `production-readiness` → `ship`

**Produces:** `.superomni/production-readiness/production-readiness-[branch]-[date].md`

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

### `retro` → `self-improvement`

**Produces:** `.context/retros/[date].md` (commit metrics, streak, ship of week)

**Consumed by:** `self-improvement` reads retro data as evidence for the process evaluation

---

### `self-improvement` → next sprint's `workflow`

**Produces:** `.superomni/improvements/improvement-[branch]-[date].md`

Required sections:
```markdown
# Improvement Report: [branch]

## Session Summary
**Process adherence:** N/N
**Agent score:** N/15

## Action Items
### ACTION 1: [TITLE]
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
LATEST_IMPROVE=$(find .superomni/improvements -name "*.md" -type f 2>/dev/null | sort | tail -1)
if [ -n "$LATEST_IMPROVE" ]; then
  echo "Prior improvement actions:"
  grep "^### ACTION" "$LATEST_IMPROVE" -A 3 | head -30
fi

# Read spec for acceptance criteria
cat spec.md 2>/dev/null | grep -A 20 "Acceptance Criteria" | head -25 || true

# Read latest review for open comments
LATEST_REVIEW=$(find .superomni/reviews -name "*.md" -type f 2>/dev/null | sort | tail -1)
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
