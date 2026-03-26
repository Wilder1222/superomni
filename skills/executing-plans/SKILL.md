---
name: executing-plans
description: |
  Use when executing an implementation plan step by step.
  Triggers: "execute plan", "implement this plan", "start executing", "run the plan".
  Requires: a plan.md or similar plan document to exist.
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
   ls spec.md plan.md .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# Executing Plans

**Goal:** Execute a written implementation plan precisely, step by step, with verification at each stage.

## Iron Law: One Step at a Time

Never execute multiple steps simultaneously unless they are explicitly marked as parallelizable.
Verify each step before moving to the next.

## Phase 1: Load the Plan

```bash
# Find the plan document
find . -name "plan.md" -o -name "*.plan.md" 2>/dev/null | head -5
```

Read the plan. Confirm:
- [ ] Plan document exists and is readable
- [ ] Prerequisites are met
- [ ] You understand what "done" looks like for each step

## Phase 2: Execute Step by Step

For each step in the plan:

### Step Execution Protocol

```
EXECUTING: Step N — [Step Name]
─────────────────────────────────
What: [Description from plan]
Files: [Files to touch]
```

1. **Read** — understand what the step requires
2. **Do** — make the minimum change needed for this step only
3. **Verify** — run the step's verification criterion
4. **Report** — confirm step complete or blocked

### Step Completion Format

```
✓ Step N COMPLETE
  Changed: [files modified]
  Evidence: [test output or verification proof]
```

### Step Blocked Format

```
✗ Step N BLOCKED
  Blocker: [what prevents completion]
  Tried: [what was attempted]
  Options:
    A) [approach 1]
    B) [approach 2]
    C) Skip this step (explain consequences)
```

## Phase 3: Mid-Plan Check-ins

After every 3 steps, or when scope is expanding:

1. Report progress: "Completed N/M steps"
2. Flag if actual work diverges from plan
3. Surface any blast radius discovered mid-execution
4. Ask before proceeding if scope has changed

## Phase 4: Handling Plan Deviations

If you discover the plan is wrong or incomplete:

1. **Stop** — do not improvise silently
2. **Assess** — is this a small mechanical fix or a fundamental issue?
3. **Small fix** (mechanical, <5 min): note it, fix it, continue
4. **Large issue** (taste or architectural): surface to user, wait for input

```
PLAN DEVIATION DETECTED
Step N: [Original plan says X, but actually Y]
Impact: [Low/Medium/High]
Recommendation: [Proposed resolution]
Awaiting: [Your decision before continuing]
```

## Phase 5: Completion

When all steps are done:

```
PLAN EXECUTION COMPLETE
════════════════════════════════════════
Steps completed:    N/N
Deviations noted:   N
Files changed:      [list]
Tests passing:      [output]
Status:             DONE | DONE_WITH_CONCERNS
Concerns (if any):
  - [concern 1]
════════════════════════════════════════
```

## Save Execution Results Document

After completing execution, save the results as a Markdown document:

```bash
_EXEC_DATE=$(date +%Y%m%d-%H%M%S)
_EXEC_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_EXEC_FILE="execution-${_EXEC_BRANCH}-${_EXEC_DATE}.md"
mkdir -p .superomni/executions
cat > ".superomni/executions/${_EXEC_FILE}" << EOF
# Execution Results: ${_EXEC_BRANCH}

**Date:** ${_EXEC_DATE}
**Branch:** ${_EXEC_BRANCH}

[Paste the full PLAN EXECUTION COMPLETE block here]

## Steps Log

[Paste all step completion/blocked entries here]
EOF
echo "Execution results saved to .superomni/executions/${_EXEC_FILE}"
```

Write the full execution log (all step outcomes + the final PLAN EXECUTION COMPLETE block, formatted as Markdown) to `.superomni/executions/execution-[branch]-[date].md`. This file serves as the permanent record of the execution run for the user to revisit.

Then trigger the `verification` skill.
