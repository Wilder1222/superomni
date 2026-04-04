---
name: brainstorm
description: |
  Use when starting a new feature, project, or design decision.
  Guides from fuzzy idea to concrete spec through structured dialogue.
  Triggers: "brainstorm", "design", "spec this out", "let's think through".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob, WebSearch]
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

Pipeline stage order: THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT

### Session Continuity

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

# Brainstorming & Specification

**Goal:** Transform a fuzzy idea into a concrete, reviewable spec document.

## Iron Law: Search Before Building

Before designing anything:
1. **Layer 1 — Tried and true:** Does a well-established solution already exist?
2. **Layer 2 — New and popular:** Is there a recently popular approach? Evaluate carefully.
3. **Layer 3 — First principles:** Only design from scratch if nothing fits.

Run: `grep -r "similar functionality" . --include="*.md" -l` to check existing docs.

## Phase 1: Problem Crystallization

Ask ONE clarifying question at a time. Do not ask multiple questions at once.

Required understanding before proceeding:
- [ ] What is the problem being solved? (not the solution)
- [ ] Who experiences this problem?
- [ ] What does success look like? (measurable outcome)
- [ ] What constraints exist? (time, technology, team size)
- [ ] What already exists that's related?

Rule: **Ask one question. Wait for answer. Then ask the next.**
Confirmation rule: each answer (text input or single-choice) is an immediate confirmation — do NOT re-ask or add a "confirm?" prompt after the user replies.

## Phase 2: Solution Space Exploration

Generate 3 candidate approaches, then always offer an "Other" option for the user's own idea:

```
Option A: [name] — [1-sentence description]
  Pro: ...
  Con: ...
  Effort: [S/M/L]

Option B: [name] — [1-sentence description]
  Pro: ...
  Con: ...
  Effort: [S/M/L]

Option C: [name] — [1-sentence description]
  Pro: ...
  Con: ...
  Effort: [S/M/L]

Option D (Other): describe your own approach — ___________
```

Apply the 6 Decision Principles when evaluating:
- Prefer completeness (covers more cases)
- Prefer DRY (reuses existing)
- Prefer explicit over clever

Surface only TASTE decisions to the user. Decide MECHANICAL ones silently.

## Phase 3: Visual Companion (if applicable)

For UI or architecture work, produce a text diagram or ASCII wireframe.
See `visual-companion.md` for diagram formats.

**Frontend Design Integration:**
If the spec involves UI components, pages, or visual design:
- Note in the spec: *"This involves UI work — recommend running the `frontend-design` skill during BUILD to ensure design quality."*
- When generating acceptance criteria, include: "Passes designer agent review at 7+/10 on all dimensions"

## Phase 4: Spec Document Output

```bash
mkdir -p docs/superomni/specs
```

Produce `docs/superomni/specs/spec.md` with this structure:

```markdown
# [Feature Name] — Spec

## Problem
[1 paragraph: what is broken or missing and for whom]

## Goals
- [Measurable outcome 1]
- [Measurable outcome 2]

## Non-Goals (YAGNI)
- [What we are explicitly NOT building]

## Proposed Solution
[Selected approach + rationale]

## Key Design Decisions
| Decision | Choice | Rationale | Principle Applied |

## Acceptance Criteria
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]

## Open Questions
- [Any unresolved taste decisions requiring user input]
```

## Phase 5: Spec Review

Pass the spec to `spec-document-reviewer-prompt.md` for structured review.

Report status: **DONE** — spec written and reviewed. Path: [spec file path]
