# Spec: superomni Harness & Pipeline Design Improvements

**Session:** harness-pipeline-review
**Date:** 2026-04-02
**Status:** DRAFT

---

## Problem Statement

### A. Output Path Gaps

superomni skills write session artifacts to `docs/superomni/` using hardcoded relative paths. Several design gaps exist:

1. **Generated CLAUDE.md omits the Document Output Convention** — when a user installs superomni locally (`npx`), the generated `CLAUDE.md` (via `lib/templates/claude-instructions.js`) does not include the output directory table.

2. **No `.gitignore` guidance** — session artifacts accumulate in `docs/superomni/` with no `.gitignore` template.

3. **Self-referential pollution** — when developing superomni itself, artifacts land in `superomni/docs/superomni/`, mixing with the project's actual documentation.

4. **Inconsistent mkdir patterns** — brainstorm and writing-plans don't `mkdir -p` before writing; other skills do.

5. **No output convention in preamble** — `lib/preamble.md` doesn't establish the output convention.

### B. Verification Should Auto-Advance

Currently after each pipeline stage completes (e.g., verification passes with DONE), the agent reports status and **waits for user input** before proceeding to the next stage. This creates unnecessary friction when everything passes cleanly.

**Desired behavior:** When a stage completes with **DONE** (no concerns, no blockers), the harness should **automatically advance to the next pipeline stage** without requiring user confirmation. Only stop and ask when the result is DONE_WITH_CONCERNS, BLOCKED, or NEEDS_CONTEXT.

Affected locations:
- `lib/preamble.md` — Completion Status Protocol (lines 17-23) needs auto-advance rule
- `skills/vibe/SKILL.md` — Stage detection and routing (Phase 1) should support auto-transition
- `skills/workflow/SKILL.md` — "What's next" checks at each stage boundary should auto-proceed on clean DONE
- Every skill's "What's next" hint should become an auto-invocation when status is DONE

### C. Remove Unnecessary Banners

Multiple banner outputs consume context window space and provide little value after the first session start:

1. **`hooks/session-start` lines 37-45** — Full ASCII banner with `━━━` separators, printed every session start. Redundant with vibe banner.
2. **`skills/vibe/SKILL.md` lines 183-191** — Welcome banner with pipeline visualization. Redundant when auto-advancing.
3. **`skills/vibe/SKILL.md` lines 234-250** — Status banner for `/vibe status`. Keep but simplify.
4. **`skills/workflow/SKILL.md` lines 409-423** — Workflow status report with `════` separators.

**Desired behavior:** Replace decorative banners with minimal, single-line status indicators. Keep only the session-start hook banner (simplified) and `/vibe status` output (simplified).

### D. Update Pipeline Steps

The current pipeline has 9 stages with a sub-numbered stage (5.5: PROD-CHECK):

```
THINK → PLAN → BUILD → REVIEW → TEST → PROD-CHECK → SHIP → EVALUATE → REFLECT
```

Issues:
- **EVALUATE and REFLECT** are separate stages but practically run together (`self-improvement` + `retro`). Merge into one **REFLECT** stage.
- **Stage 5.5 (PROD-CHECK)** uses non-standard numbering. Renumber as a proper stage.
- The vibe stage detection matrix (9 priorities) should match the updated pipeline.

**Proposed pipeline (8 stages):**

```
THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT
```

Where:
- **VERIFY** = merges TEST + PROD-CHECK (qa → security-audit → verification → production-readiness)
- **IMPROVE** = post-ship self-evaluation (self-improvement) — evaluates process, generates improvement actions
- **REFLECT** = engineering retrospective (retro) — analyzes what shipped, streak tracking, team patterns

---

## Scope

**In scope:**
- A: Output path fixes (generated CLAUDE.md, .gitignore, mkdir standardization, preamble)
- B: Auto-advance on clean DONE (preamble protocol, vibe routing, workflow transitions)
- C: Banner simplification (session-start hook, vibe banners, workflow banners)
- D: Pipeline consolidation (9 stages → 8 stages, renumber, update all references)

**Out of scope:**
- Changing the `docs/superomni/` path itself
- Changing skill artifact formats or naming conventions
- Individual skill logic changes beyond routing/transition behavior

---

## Proposed Changes

### A. Output Path Fixes

#### A1. Update `lib/templates/claude-instructions.js`

Add the Document Output Convention table after the Skills Reference table in the generated CLAUDE.md.

#### A2. Add `.gitignore` template generation

When `setup.js` runs a project-level install, generate `.gitignore` rules:

```gitignore
# superomni session artifacts (transient)
docs/superomni/executions/
docs/superomni/reviews/
docs/superomni/subagents/
docs/superomni/production-readiness/
docs/superomni/improvements/
docs/superomni/evaluations/
docs/superomni/harness-audits/
# Keep specs and plans (project deliverables)
!docs/superomni/specs/
!docs/superomni/plans/
```

Also create `.gitignore` for superomni's own repo.

#### A3. Standardize mkdir in brainstorm and writing-plans

Add `mkdir -p docs/superomni/specs` and `mkdir -p docs/superomni/plans` respectively.

#### A4. Add output convention to `lib/preamble.md`

Brief reference after Context Window Management section.

---

### B. Auto-Advance on Clean DONE

#### B1. Update Completion Status Protocol in `lib/preamble.md`

Add auto-advance rule after the status definitions:

```markdown
### Auto-Advance Rule

When a skill reports **DONE** (no concerns, no blockers):
1. Write the session artifact to `docs/superomni/`
2. Immediately invoke the next pipeline skill without waiting for user input
3. Print a single-line transition: `[stage] DONE → advancing to [next-stage]`

When a skill reports **DONE_WITH_CONCERNS**, **BLOCKED**, or **NEEDS_CONTEXT**:
1. Write the session artifact
2. STOP and present the status to the user
3. Wait for user decision before proceeding
```

#### B2. Update `skills/vibe/SKILL.md` Phase 1

After stage detection, if the current stage has a completed artifact with DONE status, auto-route to the next skill instead of showing the menu.

#### B3. Update `skills/workflow/SKILL.md` stage transitions

Each stage's "What's next" check becomes an auto-invocation rule:
- Current: `"What's next" check: Does spec.md exist? → Move to PLAN.`
- New: `Auto-advance: If spec.md exists with acceptance criteria → invoke writing-plans immediately.`

#### B4. Update every skill's "What's next" hint

Change from passive suggestion:
```
What's next → writing-plans: spec is ready for planning
```

To active auto-transition (when DONE):
```
[THINK] DONE → advancing to PLAN (writing-plans)
```

---

### C. Banner Simplification

#### C1. Simplify `hooks/session-start` (lines 37-45)

Replace the full ASCII banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  superomni v0.2.0 — Plan Lean, Execute Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project:   ${_PROJECT}
  Branch:    ${_BRANCH}
  Platform:  ${_PLATFORM}
  Skills:    ${_SKILLS_COUNT} available
  PROACTIVE: ${_PROACTIVE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

With a compact one-liner:
```
superomni v0.2.0 | ${_PROJECT}@${_BRANCH} | ${_SKILLS_COUNT} skills | PROACTIVE=${_PROACTIVE}
```

#### C2. Remove vibe welcome banner (lines 183-191)

The Phase 2 welcome banner duplicates session-start output. Remove entirely. When `/vibe` is invoked, go straight to stage detection + routing.

#### C3. Simplify `/vibe status` output (lines 234-250)

Replace the `━━━` decorated status block with a compact table:

```markdown
**Pipeline:** THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT
**Stage:** [current] | **Branch:** [branch]
**Artifacts:** spec.md [Y/N] | plan.md [Y/N] | executions [N] | reviews [N]
**Next →** [skill-name]: [reason]
```

#### C4. Remove workflow status banner (lines 409-423)

Replace `════` decorated output with inline status.

---

### D. Pipeline Consolidation (9 → 8 stages)

#### Current pipeline:
```
THINK → PLAN → BUILD → REVIEW → TEST → PROD-CHECK(5.5) → SHIP → EVALUATE → REFLECT
```

#### New pipeline:
```
THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT
```

#### Stage mapping:

| Old Stage(s) | New Stage | Skills |
|---|---|---|
| THINK | **THINK** | brainstorm, investigate |
| PLAN | **PLAN** | writing-plans, plan-review |
| BUILD | **BUILD** | executing-plans, test-driven-development, careful, subagent-development |
| REVIEW | **REVIEW** | code-review, receiving-code-review |
| TEST + PROD-CHECK | **VERIFY** | qa, security-audit, verification, production-readiness |
| SHIP | **SHIP** | ship, finishing-branch, careful |
| EVALUATE | **IMPROVE** | self-improvement |
| REFLECT | **REFLECT** | retro |

#### D1. Update `skills/workflow/SKILL.md`

Rewrite pipeline definition: merge Stage 5 + 5.5 into VERIFY, merge Stage 7 (REFLECT) to include self-improvement.

#### D2. Update `skills/vibe/SKILL.md` Stage Detection Matrix

New matrix (8 priorities instead of 9):

| Priority | Condition | Stage | Skill |
|---|---|---|---|
| 1 | No artifacts | THINK | brainstorm |
| 2 | spec.md exists, no plan.md | PLAN | writing-plans |
| 3 | plan.md has open items | BUILD | executing-plans |
| 4 | plan.md all checked, no review docs | REVIEW | code-review |
| 5 | Review docs exist, no verification/prod-readiness | VERIFY | qa → verification → production-readiness |
| 6 | Verified + production-ready | SHIP | ship |
| 7 | Shipped, no improvement report | IMPROVE | self-improvement |
| 8 | Improvement report exists | REFLECT | retro |

#### D3. Update `CLAUDE.md` pipeline references

Update the pipeline string and any stage references.

#### D4. Update `skills/vibe/SKILL.md` pipeline string

All instances of `THINK → PLAN → BUILD → REVIEW → TEST → PROD-CHECK → SHIP → EVALUATE → REFLECT` become `THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT`.

---

## Affected Files

| File | Changes |
|------|---------|
| `lib/preamble.md` | Add auto-advance rule, output directory reference |
| `lib/templates/claude-instructions.js` | Add Document Output Convention table |
| `lib/setup.js` | Add `.gitignore` generation |
| `hooks/session-start` | Simplify banner to one-liner |
| `skills/vibe/SKILL.md` | Remove welcome banner, update stage matrix (9→8), update pipeline string, add auto-advance routing |
| `skills/workflow/SKILL.md` | Rewrite pipeline (9→8 stages), remove decorated banners, add auto-advance at stage boundaries |
| `skills/workflow/SKILL.md.tmpl` | Same as above |
| `skills/brainstorm/SKILL.md` + `.tmpl` | Add `mkdir -p docs/superomni/specs` |
| `skills/writing-plans/SKILL.md` + `.tmpl` | Add `mkdir -p docs/superomni/plans` |
| `CLAUDE.md` | Update pipeline string, stage references |
| `.gitignore` (new) | Exclude transient session artifacts |

---

## Acceptance Criteria

### A. Output Paths
- [ ] `claude-instructions.js` generates CLAUDE.md with the output convention table
- [ ] Project-level install creates/appends `.gitignore` rules
- [ ] All 9 writing skills have `mkdir -p` before output write
- [ ] `lib/preamble.md` references the output directory convention
- [ ] superomni's own `.gitignore` excludes transient artifacts

### B. Auto-Advance
- [ ] Skills reporting DONE auto-invoke the next pipeline skill
- [ ] Skills reporting DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT stop and wait
- [ ] Transition prints a single-line `[stage] DONE → advancing to [next-stage]`
- [ ] `/vibe` auto-routes to next skill when current stage artifact exists with DONE

### C. Banners
- [ ] Session-start banner is a single line (no `━━━` decorations)
- [ ] `/vibe` no longer prints a welcome banner (goes straight to routing)
- [ ] `/vibe status` uses compact format (no `━━━` block)
- [ ] Workflow skill uses inline status (no `════` decorations)

### D. Pipeline
- [ ] Pipeline is 8 stages: THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT
- [ ] VERIFY stage includes qa + security-audit + verification + production-readiness
- [ ] IMPROVE stage runs self-improvement after ship
- [ ] REFLECT stage runs retro after improve
- [ ] Vibe stage detection matrix has 8 priorities
- [ ] All pipeline string references updated across all files
