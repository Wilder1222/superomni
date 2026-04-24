---
name: writing-plans
description: |
  Use when turning a spec or idea into a concrete, executable implementation plan.
  Triggers: "write a plan", "plan this out", "create implementation plan", "how should we implement".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection

On session start, read: branch from `git branch --show-current`, session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Auto-Advance Rule

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE) auto-advance on DONE.

| Status | At THINK stage (after spec generation) | At all other stages |
|--------|----------------------------------------|-------------------|
| **DONE** | STOP - present spec document for user review. Wait for user approval before advancing to PLAN. | Auto-advance - print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP - present concerns, wait for user decision | STOP - present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP - present blocker, wait for user | STOP - present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE -> advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

**Note:** The REVIEW stage (plan-review) runs fully automatically — all decisions (mechanical and taste) are auto-resolved using the 6 Decision Principles. No user input is requested during REVIEW.

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Read `~/.omni-skills/sessions/current-session-ts` to get session start timestamp. Find artifacts in `docs/superomni/specs/`, `docs/superomni/plans/` newer than that timestamp using `find -newer`. Check `git log --oneline -3`.
2. If current-session context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no current-session context → treat as a fresh session and offer the relevant skill from the
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

**Custom Input Option Rule:** Always append `Other — describe your own idea: ___` to predefined choice lists. Treat custom text as the chosen option; ask one clarifying question only if ambiguous.

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
Before reporting final status, answer: (1) **Process** — all phases followed? (2) **Evidence** — every claim backed by output or file reference? (3) **Scope** — stayed within task boundary? If any NO, address it or report DONE_WITH_CONCERNS. For full sprint evaluation, use `self-improvement`.

### Anti-Sycophancy Rules

Never say these — they are sycophantic filler that delays real analysis:
- "That's an interesting approach" → Take a position instead
- "There are many ways to think about this" → Pick one, state what evidence would change your mind
- "You might want to consider..." → Say "This is wrong because..." or "This works because..."
- "That could work" → Say whether it WILL work based on evidence
- "I can see why you'd think that" → If they're wrong, say so and why

Always do:
- Take a position on every significant question. State the position AND what evidence would change it.
- If the user's approach has a flaw, name the flaw directly before suggesting alternatives.
- Calibrated acknowledgment only: if an answer is specific and evidence-based, name what was good and pivot to the next hard question.

### TACIT-DENSE Detection (Tacit Knowledge Density Check)

Before executing substantive decisions, check if any falls into these high-tacit-density categories.
These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
has enough tacit knowledge to judge correctly.

| Category | Trigger | Action |
|----------|---------|--------|
| **D1** Domain Expertise | Security, compliance, legal, financial judgment | State `TACIT-DENSE [D1]`, present trade-offs, wait for user |
| **D2** User-Facing UX | UI copy, interaction flow, error messaging | Draft with explicit review markers |
| **D3** Team Culture | Workflow, naming conventions, file organization | Check `style-profiles/` first; ask if none |
| **D4** Novel Pattern | Fewer than 3 precedents in project history | Reduce autonomy, add checkpoints before executing |

When TACIT-DENSE detected, output: `TACIT-DENSE [D#]: [category] — [question] — My default: [recommendation]`

**Relationship with careful skill:** careful = "can we undo this?" (operational). TACIT-DENSE = "can we judge this correctly?" (knowledge). Complementary.

### Telemetry (Local Only)

At session end, log skill name, duration, and outcome to `~/.omni-skills/analytics/` via `bin/analytics-log`. Nothing is sent to external servers.

### Plan Mode Fallback

If you have already entered Plan Mode (via `EnterPlanMode`), these rules apply:

1. **Skills take precedence over plan mode.** Treat loaded skill instructions as executable steps, not reference material. Follow them exactly — do not summarize, skip, or reorder.
2. **STOP points in skills must be respected.** Do NOT call `ExitPlanMode` prematurely to bypass a skill's STOP/gate.
3. **Safe operations in plan mode** — these are always allowed because they inform the plan, not produce code:
   - Reading files, searching code, running `git log`/`git status`
   - Writing to `docs/superomni/` (specs, plans, reviews)
   - Writing to `~/.omni-skills/` (sessions, analytics)
4. **Route planning through vibe workflow.** Even inside plan mode, follow the pipeline: brainstorm → writing-plans → plan-review → executing-plans. Write the plan to `docs/superomni/plans/`, not to Claude's built-in plan file.
5. **ExitPlanMode timing:** Only call `ExitPlanMode` after the current skill workflow is complete and has reported a status (DONE/BLOCKED/etc).

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

Run: `ls -la docs/superomni/ && ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1`

## Phase 2: Completeness Check

Apply the **Completeness is Cheap** principle. Before writing the plan, list:

**What must be built (YAGNI filtered):**
- [ ] Core functionality
- [ ] Error handling
- [ ] Tests (unit + integration)
- [ ] Documentation (inline, not prose)

**What is explicitly out of scope:**
- [List YAGNI items here]

**For UI work, also include:**
- [ ] Design direction defined (aesthetic, key visual elements, target references)
- [ ] Acceptance criterion: "passes designer agent review at 7+/10 on all dimensions"

## Phase 3: Generate Plan — Dispatch `planner` Agent

**Dispatch the `planner` agent** with the following inputs:
- The spec document (if available): `docs/superomni/specs/spec-*.md`
- The scope summary and constraints from Phase 1
- The completeness checklist from Phase 2

The `planner` agent applies its 4-phase process (Understand → Decompose → Risk Assessment → Write Plan), outputs a `PLAN COMPLETE` block, and writes the plan file to `docs/superomni/plans/plan-[branch]-[session]-[date].md`.

```bash
mkdir -p docs/superomni/plans
_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_SESSION="<auto-generate-kebab-case-from-context>"  # e.g., auth-refactor, vibe-skill
_DATE=$(date +%Y%m%d)
_PLAN_FILE="docs/superomni/plans/plan-${_BRANCH}-${_SESSION}-${_DATE}.md"
```

After the `planner` agent returns its `PLAN COMPLETE` output, confirm:
- [ ] Plan file written to `docs/superomni/plans/`
- [ ] ≤ 7 milestones (planner Iron Law)
- [ ] P0 risks listed or explicitly stated as "none"
- [ ] Each milestone has measurable acceptance criteria

If the agent reports BLOCKED or DONE_WITH_CONCERNS, surface the concern to the user before proceeding to Phase 4.

The plan must follow this structure:

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

## Design Direction (if UI work)
**Aesthetic:** [minimalist | maximalist | retro-futuristic | organic | other]
**Key visual elements:** [distinctive fonts, color palette, spatial rhythm]
**Reference files to load:** [subset of: typography, color, spatial, motion, interaction, responsive, ux-writing]

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

## Phase 5: Plan Self-Review (Inline)

Run this inline check before reporting DONE (no sub-agent needed):

**Spec coverage** — does every Acceptance Criterion from the spec map to at least one step?
  → Unmapped criteria → add steps or note as out-of-scope

**Placeholder scan** — any TBD, "similar to Step N", undefined file references, vague descriptions?
  → Replace with specifics before proceeding

**Executability spot-check** — pick the 3 most complex steps. Can they be executed without further clarification?
  → "Implement authentication" (bad) vs "Add JWT middleware to src/middleware/auth.js" (good)

**Type consistency** — are effort estimates (S/M/L) consistent? No single step that's L when it should be split into 2×M?

If all 4 checks pass → report DONE and path to plan file.
If any fail → fix in plan and re-check.

Report status: **DONE** — plan written and reviewed. Path: [plan file path]
