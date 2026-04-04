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

### Auto-Advance Rule

Pipeline stage order: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT

**REVIEW is the only human gate.** All other stages auto-advance on DONE.

| Status | At REVIEW stage | At all other stages |
|--------|----------------|-------------------|
| **DONE** | STOP — present review summary, wait for user input (Y / N / revision notes) | Auto-advance — print `[STAGE] DONE → advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP — present concerns, wait for user decision | STOP — present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP — present blocker, wait for user | STOP — present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

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

### UI Change Detection

If the diff includes files matching `*.html`, `*.jsx`, `*.tsx`, `*.vue`, `*.svelte`, `*.css`, `*.scss`, or `*.less`:
- Invoke the **designer agent** for a full design review
- Include all 10 dimension scores in the review output
- Flag any dimension scoring < 7 as a P1 issue
- Apply the AI Slop detection checklist

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
mkdir -p docs/superomni/reviews
cat > "docs/superomni/reviews/${_REVIEW_FILE}" << EOF
# Code Review: ${_REVIEW_BRANCH}

**Date:** ${_REVIEW_DATE}
**Reviewer:** superomni
**Branch:** ${_REVIEW_BRANCH}

[Paste the full review output here]
EOF
echo "Review saved to docs/superomni/reviews/${_REVIEW_FILE}"
```

Write the full CODE REVIEW block (formatted as Markdown) to `docs/superomni/reviews/review-[branch]-[session]-[date].md`. This file serves as the permanent record of the review for the user to revisit.
