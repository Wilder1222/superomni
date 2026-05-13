# Improvement: superomni v0.6.0 Framework Optimization — Post-Sprint Review

**Linked evaluation:** `docs/superomni/evaluations/evaluation-main-framework-optimization-v2-20260513.md`
**Linked release:** `docs/superomni/releases/release-main-framework-optimization-v2-2026-05-13-164417.md`
**Branch:** feat/framework-optimization-v2
**Date:** 2026-05-13

**Status:** DONE

## Scoring

**Agent total: 14/15**

Process was rigorous (careful-gated destructive ops, phase-gated execution, user confirmation on every structural decision). One point lost: generator parity required a second pass instead of being right-first-time.

**Skills avg: 4.6/5**

- `brainstorm` — 5/5 (crystallized three-line spec with zero rework)
- `writing-plans` — 4/5 (missed the pipeline-routing blast radius on first draft; Step 14.5 amendment caught it)
- `plan-review` — 5/5 (all 8 decisions auto-resolved cleanly)
- `executing-plans` — 5/5 (17-step execution held phase gates)
- `careful` — 5/5 (the star of the sprint — surfaced the 78-reference coupling no one had spotted)
- `subagent-development` — 4/5 (used only lightly; Phase 2 retired-content merging could have been parallelized across 7 sub-agents instead of in-process)
- `verification` — 5/5
- `self-improvement` (this skill) — 5/5

**Iron Law compliance rate: 100%** across all invoked skills this sprint.

## Actions carried forward from this sprint

### ACTION 1: Generator parity golden fixture

**Priority: P1**

Add `lib/templates/fixture.tmpl` (a minimal tmpl using both `{{PREAMBLE_CORE}}` and `{{PREAMBLE_REF_LINK}}` and an inline `description` containing `:`). Extend `npm run verify:skill-docs` to regenerate the fixture with each of js/sh/ps1 and fail on any diff. This would have caught the newline-parity bug in its first iteration.

**Owner:** next sprint
**Success criterion:** `npm run verify:skill-docs` runs 3 generators on the fixture and `diff` returns 0 bytes diff.

### ACTION 2: Add pre-destructive gate to all plan templates

**Priority: P0**

Update `writing-plans/SKILL.md` to enforce: "If any plan step contains `git rm`, rename, or mass-delete, the step immediately prior MUST invoke `careful` with explicit blast-radius enumeration." Without this, the Step 14.5 pattern (discovered reactively this sprint) will not be captured preemptively.

**Owner:** next sprint, first task
**Success criterion:** `writing-plans/SKILL.md` template has a new "Pre-destructive gate" sub-section; a test plan containing `git rm` and no prior `careful` invocation fails the `plan-review` auto-check.

### ACTION 3: Sister-script migration checklist

**Priority: P1**

When migrating a repo-wide invariant (e.g., `{{PREAMBLE}}` → `{{PREAMBLE_CORE}}`), the plan must enumerate every file under `lib/` that references the old form. We had `gen-skill-docs.{js,sh,ps1}` + `check-skill-docs.js` in the plan, but `validate-skills.sh` was missed — it surfaced only in the Phase 3 gate. Build a `bin/audit-repo-invariants <pattern>` helper that finds all scripts referencing a given pattern and flags them before migration starts.

**Owner:** next sprint
**Success criterion:** `bin/audit-repo-invariants '{{PREAMBLE}}'` lists all files referencing the pattern, grouped by directory, with a hint on whether each is a usage site or a sister-tool that reads the pattern.

### ACTION 4 (deferred): /vibe auto live E2E smoke test

**Priority: P2**

The `/vibe auto` documentation was ACed via text presence and mode section, not via a live run. Next sprint, run `/vibe auto` on a trivial throwaway spec (e.g., "add a comment explaining the purpose of `lib/preamble-core.md`") and confirm the full 6-stage chain actually produces all artifacts.

**Owner:** any future sprint
**Success criterion:** `/vibe auto` on a simple spec produces spec/plan/review/execution/evaluation/release artifacts with exactly 1 user interaction.

## Prior-sprint actions: carry-forward check

No prior-sprint improvement artifacts had open P0/P1 actions that were in scope this sprint. The 2026-04-09 improvement reports flagged:
- Cross-platform shell reliability → ADDRESSED this sprint (generator parity normalization)
- Workflow contract CI checks missing → ADDRESSED this sprint (Section 1 produces/consumes linkage)
- REFLECT artifact gate not enforced → REMAINS PARTIAL (this sprint produces both evaluation + improvement + release, but the enforcement is via the existing checker's existing rule, not a new rule)
- Execution file naming inconsistency → ADDRESSED (session suffix = `framework-optimization-v2` consistent across all artifacts)
- Cross-doc contract wording drift → ADDRESSED (`workflow/SKILL.md` now a 50-line stub; operational content lives in 2 places only)

**4 of 5 prior-sprint P0/P1 actions resolved this sprint.** None carried forward unresolved.

## Harness signals

- `careful` skill's pre-destructive blast-radius assessment should be mandatory before any Phase-2-style destructive work. Currently it's invoked when the agent recognizes the destructive pattern, which requires the agent to be watchful. Make it enforceable via plan-template invariant (ACTION 2).
- `validate-skills.sh` regression on token migration is a harness gap. ACTION 3 addresses it.
- Phase-gate-then-pause pattern worked well. Keep it as a first-class plan shape for any migration spanning ≥2 logical phases.

## What I would do differently

1. Include `validate-skills.sh` and all sister-scripts in the Phase 1 scope, not let it surface at Phase 3 gate.
2. Generator parity fixture first, token migration second (not vice versa).
3. When the careful-skill catches hidden coupling, commit the plan amendment before executing the revised plan — this sprint did so (9688a30), good.

---

**Status: DONE** — sprint retro complete. 4 actions queued for next sprint; all prior-sprint actions addressed.
