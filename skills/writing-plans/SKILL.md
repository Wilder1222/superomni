---
name: writing-plans
description: |
  Use when turning a spec or idea into a concrete, executable implementation plan.
  Triggers: "write a plan", "plan this out", "create implementation plan", "how should we implement".
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
| Planning | `spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `plan.md`, relevant source files | Unrelated modules, docs |
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


# Writing Implementation Plans

**Goal:** Transform a spec or goal into a step-by-step, executable plan that an AI agent can follow.

## Iron Law: Plans Must Be Executable

A plan is only good if it can be executed without further clarification.
Each step must specify: **What** to do, **Where** to do it, **How** to verify it.

## Phase 1: Understand the Scope

Before writing, confirm:
- [ ] Is there a spec document? If yes, read it.
- [ ] What is the desired end state?
- [ ] What already exists that can be reused? (DRY principle)
- [ ] What are the hard constraints? (timeline, tech stack, team)

Run: `ls -la && find . -name "spec.md" -o -name "*.spec.md" 2>/dev/null | head -5`

## Phase 2: Completeness Check

Apply the **Completeness is Cheap** principle. Before writing the plan, list:

**What must be built (YAGNI filtered):**
- [ ] Core functionality
- [ ] Error handling
- [ ] Tests (unit + integration)
- [ ] Documentation (inline, not prose)

**What is explicitly out of scope:**
- [List YAGNI items here]

## Phase 3: Plan Structure

Write `plan.md` (or specified path) with this structure:

```markdown
# Implementation Plan: [Feature Name]

## Overview
[2-3 sentences: what we're building and why]

## Prerequisites
- [ ] [Thing that must exist/be done first]

## Steps

### Step 1: [Name]
**What:** [Precise description]
**Files:** [Exact files to create/modify]
**How:**
  1. [Sub-step]
  2. [Sub-step]
**Verification:** [How to confirm this step is done]
**Estimated effort:** [S=<30min, M=<2h, L=<1day]

### Step 2: [Name]
...

## Testing Strategy
- **Unit tests:** [What to test at unit level]
- **Integration tests:** [What to test at integration level]
- **Manual verification:** [What to manually check]

## Rollback Plan
[How to undo this if something goes wrong]

## Dependencies
[External services, APIs, or features this depends on]

## Success Criteria
- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]
```

## Phase 4: Apply the 6 Decision Principles

Review the plan against each principle:

1. **Completeness** — does the plan handle error paths, edge cases?
2. **Boil lakes** — are there adjacent issues in blast radius worth fixing now?
3. **Pragmatic** — is there a simpler way to achieve the same goal?
4. **DRY** — does the plan duplicate anything that already exists?
5. **Explicit** — is every step clear to a new engineer?
6. **Bias toward action** — are there unnecessary review gates slowing things down?

## Phase 5: Plan Review

Pass the completed plan to `plan-document-reviewer-prompt.md` for structured review.

Surface TASTE decisions to the user. Decide MECHANICAL ones silently.

Report status: **DONE** — plan written and reviewed. Path: [plan file path]
