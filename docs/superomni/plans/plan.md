# Implementation Plan: Harness & Pipeline Design Improvements

## Overview

Four coordinated changes to the superomni harness: (A) fix output path gaps, (B) auto-advance on clean DONE, (C) simplify banners, (D) consolidate pipeline from 9 to 8 stages. Changes are ordered so D (pipeline rename) goes first since it touches every file that B and C also touch.

## Prerequisites

- [x] Spec reviewed and approved (`docs/superomni/specs/spec.md`)
- [x] All affected files identified and read

## Steps

### Step 1: Update pipeline string across all files (D4)
**What:** Replace all instances of the old 9-stage pipeline with the new 8-stage pipeline.
**Files:**
- `skills/vibe/SKILL.md`
- `skills/workflow/SKILL.md`
- `skills/workflow/SKILL.md.tmpl`
- `skills/using-skills/SKILL.md`
- `CLAUDE.md`
**How:**
  1. Find-replace: `THINK → PLAN → BUILD → REVIEW → TEST → PROD-CHECK → SHIP → EVALUATE → REFLECT` → `THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT`
  2. Find-replace the 8-stage variant: `THINK → PLAN → BUILD → REVIEW → TEST → PROD-CHECK → SHIP → REFLECT` → `THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT`
  3. Replace any standalone references to `TEST / PROD-CHECK` stage names with `VERIFY`
  4. Replace standalone `EVALUATE` stage references with `IMPROVE`
**Verification:** `grep -r "PROD-CHECK\|EVALUATE" skills/ CLAUDE.md` returns no hits
**Estimated effort:** S

### Step 2: Rewrite `skills/workflow/SKILL.md` pipeline stages (D1)
**What:** Merge Stage 5 (TEST) + Stage 5.5 (PROD-CHECK) into VERIFY. Rename EVALUATE to IMPROVE. Keep REFLECT as retro.
**Files:** `skills/workflow/SKILL.md`, `skills/workflow/SKILL.md.tmpl`
**How:**
  1. Renumber stages: 1-THINK, 2-PLAN, 3-BUILD, 4-REVIEW, 5-VERIFY, 6-SHIP, 7-IMPROVE, 8-REFLECT
  2. Stage 5 VERIFY: combine skills (qa, security-audit, verification, production-readiness) and artifacts from old TEST + PROD-CHECK
  3. Stage 7 IMPROVE: self-improvement skill — evaluate process, generate improvement actions
  4. Stage 8 REFLECT: retro skill — analyze what shipped, streak tracking
  5. Update the ASCII pipeline diagram at the top
  6. Update "Picking Up Mid-Sprint" section — remove PROD-CHECK and EVALUATE references, add IMPROVE
  7. Update the Report section — remove `════` decorations, use compact format (spec C4)
**Verification:** File has exactly 8 stages, no references to TEST/PROD-CHECK/EVALUATE as separate stages
**Estimated effort:** M

### Step 3: Update `skills/vibe/SKILL.md` stage detection matrix (D2)
**What:** Replace 9-priority detection matrix with 8-priority matrix. Remove welcome banner. Add auto-advance routing.
**Files:** `skills/vibe/SKILL.md`
**How:**
  1. Update Stage Detection Matrix (lines 161-176) to 8 priorities:
     - P1: No artifacts → THINK → brainstorm
     - P2: spec.md exists, no plan.md → PLAN → writing-plans
     - P3: plan.md has open items → BUILD → executing-plans
     - P4: plan.md all checked, no review docs → REVIEW → code-review
     - P5: Review docs exist, no verification/prod-readiness → VERIFY → qa → verification → production-readiness
     - P6: Verified + production-ready → SHIP → ship
     - P7: Shipped, no improvement report → IMPROVE → self-improvement
     - P8: Improvement report exists → REFLECT → retro
  2. Remove Phase 2: Display Welcome Banner (lines 179-199) entirely (spec C2)
  3. Simplify `/vibe status` output (lines 230-250) — replace `━━━` block with compact format per spec C3
  4. Update `/vibe reset` artifact list
  5. Add auto-advance logic after stage detection: if current stage artifact exists with clean DONE, auto-invoke next skill (spec B2)
**Verification:** Matrix has 8 rows, no banner block, `/vibe status` uses compact format
**Estimated effort:** M

### Step 4: Update `skills/using-skills/SKILL.md` stage table
**What:** Update the stage-to-skill mapping table to match new 8-stage pipeline.
**Files:** `skills/using-skills/SKILL.md`
**How:**
  1. Replace the stage mapping table (lines 48-55):
     - Merge `TEST / PROD-CHECK` row → `VERIFY` with skills: `qa` → `verification` → `production-readiness`
     - Rename `EVALUATE` row → `IMPROVE` with skill: `self-improvement`
     - Keep `REFLECT` row with skill: `retro`
**Verification:** Table has 8 rows matching 8 pipeline stages
**Estimated effort:** S

### Step 5: Update `CLAUDE.md` pipeline and stage references (D3)
**What:** Update pipeline diagram and any stage references in the project config.
**Files:** `CLAUDE.md`
**How:**
  1. Update pipeline strings to 8-stage version
  2. Update any skill trigger descriptions that reference old stage names
**Verification:** No old stage names in CLAUDE.md
**Estimated effort:** S

### Step 6: Add auto-advance rule to `lib/preamble.md` (B1)
**What:** Add Auto-Advance Rule after Completion Status Protocol. Add Output Directory reference.
**Files:** `lib/preamble.md`
**How:**
  1. After line 23 (NEEDS_CONTEXT definition), add the Auto-Advance Rule section:
     - DONE → write artifact, print `[stage] DONE → advancing to [next-stage]`, auto-invoke next skill
     - DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT → stop and wait
  2. Update Session Continuity section — change "What's next?" hint to auto-advance format
  3. After Context Window Management section, add Output Directory reference
**Verification:** Preamble contains "Auto-Advance Rule" section, contains "Output Directory" section
**Estimated effort:** S

### Step 7: Simplify `hooks/session-start` banner (C1)
**What:** Replace multi-line ASCII banner with compact one-liner.
**Files:** `hooks/session-start`
**How:**
  1. Replace lines 37-45 (the `━━━` banner block) with single line:
     `echo "superomni v0.2.0 | ${_PROJECT}@${_BRANCH} | ${_SKILLS_COUNT} skills | PROACTIVE=${_PROACTIVE}"`
**Verification:** File has no `━━━` characters, banner is one line
**Estimated effort:** S

### Step 8: Add output convention to `lib/templates/claude-instructions.js` (A1)
**What:** Add Document Output Convention table to the generated CLAUDE.md template.
**Files:** `lib/templates/claude-instructions.js`
**How:**
  1. After the Skills Reference table (line 44), add the output convention table
  2. Also add the new 8-stage pipeline string
**Verification:** Generated output contains "Document Output Convention" section
**Estimated effort:** S

### Step 9: Add `.gitignore` (A2 + A5)
**What:** Create `.gitignore` for superomni repo. Add `.gitignore` generation to `setup.js` for project installs.
**Files:** `.gitignore` (new), `lib/setup.js`
**How:**
  1. Create `.gitignore` with transient artifact exclusions per spec
  2. In `setup.js` `installClaude()` function (around line 303-307), after writing CLAUDE.md, add logic to append `.gitignore` rules to the target project's `.gitignore`
**Verification:** `.gitignore` exists, `setup.js` has gitignore generation logic
**Estimated effort:** S

### Step 10: Standardize mkdir in brainstorm and writing-plans (A3)
**What:** Add `mkdir -p` before output writes in skills that are missing it.
**Files:**
- `skills/brainstorm/SKILL.md` + `skills/brainstorm/SKILL.md.tmpl`
- `skills/writing-plans/SKILL.md` + `skills/writing-plans/SKILL.md.tmpl`
**How:**
  1. In brainstorm, before the spec output write, add: `mkdir -p docs/superomni/specs`
  2. In writing-plans, before the plan output write, add: `mkdir -p docs/superomni/plans`
**Verification:** `grep "mkdir -p docs/superomni" skills/brainstorm/SKILL.md skills/writing-plans/SKILL.md` returns hits
**Estimated effort:** S

## Testing Strategy

- **Search verification:** After all changes, run `grep -r "PROD-CHECK\|EVALUATE\|━━━\|════" skills/ hooks/ lib/preamble.md CLAUDE.md` — should return no hits
- **Pipeline consistency:** Run `grep -r "THINK.*PLAN.*BUILD" skills/ CLAUDE.md` — all should show the 8-stage version
- **Manual verification:** Invoke `/vibe` and confirm:
  - No welcome banner displayed
  - Stage detection works with 8-stage matrix
  - Auto-advance language appears in preamble
  - Session-start banner is one line

## Rollback Plan

All changes are to markdown/JS files tracked in git. Rollback via `git checkout -- <files>`.

## Dependencies

None — all changes are within the superomni project.

## Success Criteria

- [x] Pipeline is 8 stages everywhere: THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT
- [x] No references to PROD-CHECK, EVALUATE, or TEST as separate pipeline stages
- [x] IMPROVE stage (self-improvement) is distinct from REFLECT stage (retro)
- [x] Auto-advance rule documented in preamble
- [x] Session-start banner is a single line
- [x] Vibe has no welcome banner, uses compact status format
- [x] Workflow report has no `════` decorations
- [x] Generated CLAUDE.md includes output convention table
- [x] `.gitignore` exists with transient artifact exclusions
- [x] brainstorm and writing-plans have `mkdir -p` before writes
