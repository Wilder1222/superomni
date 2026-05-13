---
name: writing-plans
description: |
  Use when turning a spec or idea into a concrete, executable implementation plan.
  Triggers: "write a plan", "plan this out", "create implementation plan", "how should we implement".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use after a spec is approved to turn it into an executable plan. Consumes the spec, produces the plan that plan-review and executing-plans will consume.
produces: "docs/superomni/plans/plan-[branch]-[session]-[date].md"
consumes:
  - "docs/superomni/specs/spec-[branch]-[session]-[date].md"
---


<!-- Inlined into every SKILL.md via {{PREAMBLE_CORE}}. Keep ≤30 lines. -->

## Preamble (Core)

**Status protocol** — end every session with one of: `DONE` (evidence provided) · `DONE_WITH_CONCERNS` (list each) · `BLOCKED` (state what blocks you) · `NEEDS_CONTEXT` (state what you need).

**Auto-advance** — pipeline: `THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE`. Only human gate is spec approval at THINK. On `DONE` at other stages, print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and invoke the next skill. On any non-DONE status at any stage, STOP.

**Output directory** — all artifacts go in `docs/superomni/<kind>/<kind>-[branch]-[session]-[date].md`. See `CLAUDE.md` for the full directory map.

**TACIT-DENSE** — before high-tacit decisions, classify D1 (domain expertise) · D2 (user-facing UX) · D3 (team culture) · D4 (novel pattern). On hit, output `TACIT-DENSE [D#]: [question] — My default: [recommendation]`. See reference for actions.

**Anti-sycophancy** — take a position on every significant question. Name flaws directly. No filler ("that's interesting", "you might consider", "that could work").

**Telemetry (local only)** — at session end, log `bin/analytics-log`. Nothing leaves the machine.

_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._

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
- [ ] Acceptance criterion: "passes frontend-designer agent review at 7+/10 on all dimensions"

## Phase 3: Generate Plan — Dispatch `planner-reviewer` Agent (Planning Mode)

**Dispatch the `planner-reviewer` agent** in **planning mode** with the following inputs:
- The spec document (if available): `docs/superomni/specs/spec-*.md`
- The scope summary and constraints from Phase 1
- The completeness checklist from Phase 2

The agent applies the 4-phase process (Understand → Decompose → Risk Assessment → Write Plan), outputs a `PLAN COMPLETE` block, and writes the plan file to `docs/superomni/plans/plan-[branch]-[session]-[date].md`. (Plan authoring was consolidated from the retired `planner` agent into `planner-reviewer` planning mode.)

```bash
mkdir -p docs/superomni/plans
_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_SESSION="<auto-generate-kebab-case-from-context>"  # e.g., auth-refactor, vibe-skill
_DATE=$(date +%Y%m%d)
_PLAN_FILE="docs/superomni/plans/plan-${_BRANCH}-${_SESSION}-${_DATE}.md"
```

After the agent returns its `PLAN COMPLETE` output, confirm:
- [ ] Plan file written to `docs/superomni/plans/`
- [ ] ≤ 7 milestones (planning-mode Iron Law)
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
