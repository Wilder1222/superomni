---
name: brainstorming
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

## Phase 2: Solution Space Exploration

Generate 3 candidate approaches:

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
```

Apply the 6 Decision Principles when evaluating:
- Prefer completeness (covers more cases)
- Prefer DRY (reuses existing)
- Prefer explicit over clever

Surface only TASTE decisions to the user. Decide MECHANICAL ones silently.

## Phase 3: Visual Companion (if applicable)

For UI or architecture work, produce a text diagram or ASCII wireframe.
See `visual-companion.md` for diagram formats.

## Phase 4: Spec Document Output

Produce `spec.md` in the project root (or specified path) with this structure:

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
