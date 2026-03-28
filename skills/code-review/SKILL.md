---
name: code-review
description: |
  Use when reviewing code changes, PRs, or preparing code for review.
  Triggers: "review this", "code review", "ready for PR", "check this code".
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

# Code Review

**Goal:** Provide structured, actionable code review feedback that improves quality without blocking momentum.

## Review Principles

Grounded in the 6 Decision Principles:
1. **Completeness** — are edge cases covered?
2. **Blast radius** — does this change break more than it fixes?
3. **Pragmatic** — is there a simpler approach that achieves the same goal?
4. **DRY** — does this duplicate existing functionality?
5. **Explicit** — is the code readable without comments explaining "what"?
6. **Bias toward action** — flag concerns but don't block needlessly

## Before Reviewing: Understand Context

```bash
# See what changed
git diff main...HEAD --stat
git diff main...HEAD

# Understand the scope
git log main...HEAD --oneline
```

Questions to answer before reviewing:
- What was the intent of this change?
- What spec/ticket does this implement?
- What is the blast radius of this change?

## Review Layers (in priority order)

### Layer 1: Correctness (P0 — blocks merge)

- [ ] Does it do what the spec says?
- [ ] Are all acceptance criteria met?
- [ ] Are error paths handled?
- [ ] Are there any obvious bugs?
- [ ] Are edge cases handled?

### Layer 2: Security (P0 — blocks merge)

- [ ] No hardcoded secrets or credentials?
- [ ] Input validation on external data?
- [ ] SQL/command injection prevented?
- [ ] Authentication/authorization enforced?
- [ ] No sensitive data in logs?

See `requesting-review.md` for security-specific review checklist.

### Layer 3: Tests (P0 — blocks merge if missing)

- [ ] Tests are present
- [ ] Tests verify behavior, not implementation
- [ ] Tests are independent
- [ ] New edge cases have tests
- [ ] No anti-patterns (see `testing-anti-patterns.md`)

### Layer 4: Code Quality (P1 — should fix)

- [ ] Code is readable without comments explaining "what"
- [ ] Names are descriptive and accurate
- [ ] No unnecessary complexity
- [ ] DRY — no unneeded duplication
- [ ] Follows existing codebase patterns

### Layer 5: Blast Radius (P1 — flag if high)

- [ ] How many files are changed?
- [ ] Does any change affect shared utilities or core modules?
- [ ] Are any behavior changes unintended?
- [ ] Would this break any callers not in the diff?

```bash
# Check blast radius
git diff main...HEAD --stat | tail -1
# Find all files that import a changed module
grep -r "from './changedModule'" . --include="*.ts" --include="*.js" -l
```

### Layer 6: Architecture (P2 — consider)

- [ ] Is this in the right layer/module?
- [ ] Are dependencies appropriate?
- [ ] Does this introduce tech debt?

## Review Output Format

```
CODE REVIEW
════════════════════════════════════════
PR/Branch: [name]
Files changed: [N]
Blast radius: [LOW/MEDIUM/HIGH]

P0 ISSUES (must fix before merge):
  [file:line] — [Issue description]

P1 ISSUES (should fix):
  [file:line] — [Recommendation]

P2 SUGGESTIONS (optional improvement):
  [file:line] — [Suggestion]

SECURITY: CLEAN | REVIEW_NEEDED
  [Any security notes]

TESTS: ADEQUATE | NEEDS_COVERAGE
  [Test coverage assessment]

DECISION QUESTIONS:
  - [Taste decision requiring owner input]

VERDICT: APPROVED | APPROVED_WITH_NOTES | CHANGES_REQUESTED
[1-sentence summary]
════════════════════════════════════════
```

## Preparing Code for Review

Before requesting a review, self-check:

```bash
# Clean up before submitting
git diff HEAD | grep -E "console\.log|debugger|TODO|FIXME|print\(" | head -10

# Verify tests pass
npm test 2>&1 | tail -5

# Check diff is clean
git diff main...HEAD --stat
```

See `requesting-review.md` for how to request and respond to reviews.

## Save Review Document

After completing the review, save the full review output as a Markdown document:

```bash
_REVIEW_DATE=$(date +%Y%m%d-%H%M%S)
_REVIEW_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_REVIEW_FILE="review-${_REVIEW_BRANCH}-${_REVIEW_DATE}.md"
mkdir -p .superomni/reviews
cat > ".superomni/reviews/${_REVIEW_FILE}" << EOF
# Code Review: ${_REVIEW_BRANCH}

**Date:** ${_REVIEW_DATE}
**Reviewer:** superomni
**Branch:** ${_REVIEW_BRANCH}

[Paste the full review output here]
EOF
echo "Review saved to .superomni/reviews/${_REVIEW_FILE}"
```

Write the full CODE REVIEW block (formatted as Markdown) to `.superomni/reviews/review-[branch]-[date].md`. This file serves as the permanent record of the review for the user to revisit.
