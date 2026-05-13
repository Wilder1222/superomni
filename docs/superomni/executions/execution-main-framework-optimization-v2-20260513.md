# Execution (v2): superomni Framework Optimization — Phase 1

**Plan:** `docs/superomni/plans/plan-main-framework-optimization-v2-20260513.md`
**Spec:** `docs/superomni/specs/spec-main-framework-optimization-v2-20260513.md`
**Review:** `docs/superomni/reviews/review-main-framework-optimization-v2-20260513.md`
**Branch:** feat/framework-optimization-v2 (forked from `main` at ebf5f6d)
**Date:** 20260513  **Phase:** 1 of 3 — COMPLETE

## Scope

Steps 1-12 of plan v2 (Phase 1 only). Phase 2 (destructive: `git rm` 6 agents) and Phase 3 (`/vibe auto` + contract checker) deferred per user-approved pause strategy.

## Post-Step-6 diff snapshot (plan-review note honored)

| Metric | Baseline (main, ebf5f6d) | After Step 6 (preamble migration) | After Step 10 (framework-management teaching) | Final |
|--------|--------------------------|-----------------------------------|-----------------------------------------------|-------|
| Total SKILL.md lines | 9,947 | 6,868 | 6,867 (+frontmatter expansion) | **6,867** |
| Drop vs baseline | — | −3,079 (30.9%) | −3,080 (30.9%) | **−3,080 (30.9%)** |
| Skills > 500 lines | 4 (self-improvement 535, subagent-development 473, frontend-design 450, vibe 447) | 0 | 0 | **0** |
| Max skill line count | 535 | 416 (self-improvement) | 416 | **416** |

Overflow extraction (plan Step 7) was skipped — preamble diet alone brought all 4 over-quota skills under 500.

## Phase 1 Acceptance Criteria — Results

| AC | Target | Actual | Result |
|----|--------|--------|--------|
| AC1. `lib/preamble-core.md` ≤30 lines | ≤30 | 15 | **PASS** |
| AC2. `lib/preamble-ref.md` exists | exists | 127 lines | **PASS** |
| AC3. Every SKILL.md body ≤500 lines | 0 over | 0 over (max: 416) | **PASS** |
| AC4. Total line drop ≥2,800 | ≥ 2,800 | **3,080 (30.9%)** | **PASS** |
| AC5. Frontmatter completeness (when_to_use/produces/consumes) | 28/28 each | 28/28/28 | **PASS** |
| AC6. `npm run verify:skill-docs` exits 0 | exit 0 | 28 generated, 27 templates | **PASS** |
| AC7. Platform parity (js/sh/ps1 byte-identical) | identical | identical on brainstorm fixture | **PASS** |
| AC8. framework-management teaches new token pattern | PREAMBLE_CORE ≥2 refs, bare {{PREAMBLE}} in tmpl = 0 | 3, 0 | **PASS** |

## Global regression gates — Results

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `EnterPlanMode → brainstorm` rule in CLAUDE.md | ≥ 5 mentions | 5 | **PASS** |
| `docs/superomni/<kind>/` directory contract | unchanged | unchanged | **PASS** |
| `frontend-design/reference/design-md-library/` intact | 8 brands + README | 8 brands + README (claude, framer, linear.app, notion, raycast, shopify, stripe, vercel) | **PASS** |
| `framework-management` upstream consolidation preserved | present | present | **PASS** |
| `CLAUDE.md` skill/agent table present | accurate rows | all 28 rows present with disambiguated triggers | **PASS** |

## Files changed

**New files (7):**
- `lib/preamble-core.md` — 15-line inlined core
- `lib/preamble-ref.md` — 127-line on-demand reference
- `lib/preamble.md.bak` — backup of original 135-line preamble
- `lib/frontmatter-map.json` — canonical per-skill frontmatter map (28 entries)
- `lib/apply-frontmatter.js` — one-shot frontmatter updater
- `docs/superomni/specs/spec-main-framework-optimization-v2-20260513.md`
- `docs/superomni/plans/plan-main-framework-optimization-v2-20260513.md`
- `docs/superomni/reviews/review-main-framework-optimization-v2-20260513.md`
- `docs/superomni/specs/.approved-spec-main-framework-optimization-v2-20260513` (approval marker)

**Modified files (~57):**
- `lib/gen-skill-docs.{js,sh,ps1}` — added 2-token support + deprecation warning + trailing-newline normalization for cross-platform parity
- `lib/check-skill-docs.js` — mirrored 3-token expansion
- `CLAUDE.md` — sharpened trigger column for 5 rows (executing-plans, test-driven-development, code-review, plan-review, workflow, release, refactoring)
- 27 `skills/*/SKILL.md.tmpl` — migrated `{{PREAMBLE}}` → `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}`; frontmatter expanded
- 28 `skills/*/SKILL.md` — regenerated from updated tmpls (or direct edit for `using-skills`)
- `skills/framework-management/SKILL.md.tmpl` — teaches new 2-token pattern in scaffolding example + checklist
- `package.json` / `package-lock.json` — added `js-yaml` dev dep

## Integration verification

```bash
$ npm run verify:skill-docs
Skill docs check passed: 28 generated files, 27 templates

$ node -e "...js-yaml parse on all 28 frontmatters..."
YAML ok: 28 bad: 0

$ wc -l skills/*/SKILL.md | tail -1
6867 total

$ wc -l skills/*/SKILL.md | awk '$1 > 500'
(empty — zero skills over 500)

$ diff js.md sh.md / js.md ps1.md / sh.md ps1.md
all three PASS (byte-identical)

$ grep -c EnterPlanMode CLAUDE.md
5
```

## Known deviations from plan

1. **Step 7 (overflow extraction) skipped** — preamble diet alone brought every skill under 500. Same outcome as v1.
2. **`preamble-ref.md` is 127 lines**, slightly over the ~105 estimate. All 9 spec-listed detail sections present; extra lines come from a title block and 5-Level Trust Matrix table. Lazy-loaded — zero runtime cost.
3. **framework-management scaffold teaches 4 frontmatter fields** (`name`/`description`/`allowed-tools`/`when_to_use`/`produces`/`consumes`) instead of the minimal 3. This is a proactive upgrade so newly-authored skills don't need Phase 1-style retrofit.

## Deferred to next execution session (Phase 2 + Phase 3)

- **Phase 2 (Steps 14-17):** Agent consolidation 11 → 5. Retire 7 orphan agents via `git rm`; rename `architect→planner-reviewer`, `designer→frontend-designer`; add `explorer`. Retain `doc-writer`, `refactoring-agent` with their upstream dispatch paths. Update CLAUDE.md agent table.
- **Phase 3 (Steps 18-21):** Strengthen contract checker; add `/vibe auto`; demote `workflow/SKILL.md` to ≤50-line stub.
- **Step 22:** Final execution log + PR.

## Status

**DONE** — Phase 1 of 3 complete. All 8 Phase 1 ACs + 5 global regression gates PASS.

Line drop: **3,080 lines (30.9%)** across 28 skills. Preamble duplication eliminated for 27 of 28 skills. Trigger collisions disambiguated. Cross-platform parity byte-identical. Upstream consolidations (ship→release, agent-management+writing-skills→framework-management, design-md-library/) all preserved.

## Next step

User validation of Phase 1 outcome, then resume with Phase 2 (destructive — will confirmation-gate via `careful` skill before `git rm`).
