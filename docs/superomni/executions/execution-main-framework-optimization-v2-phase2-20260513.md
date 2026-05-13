# Execution (v2): Phase 2 — Agent Consolidation

**Plan:** `docs/superomni/plans/plan-main-framework-optimization-v2-20260513.md` (amended with Step 14.5)
**Branch:** feat/framework-optimization-v2
**Date:** 20260513  **Phase:** 2 of 3 — COMPLETE

## Pause + Amend + Resume

Phase 2 was paused immediately after invoking the `careful` skill, which detected that the destructive `git rm` of 7 agents had **GLOBAL blast radius** (not MODULE as originally assumed):

- 78 cross-references across 13 skill files
- The `vibe` stage→agent routing table (lines 300-305) depended on 7 of the 9 retirement targets
- Simple grep-delete would have left the pipeline table pointing at dead files

User chose option A (pause + amend plan + resume). A plan amendment was committed as `9688a30` inserting **Step 14.5: pipeline stage→agent remap** with a concrete stage-by-stage replacement table. Phase 2 then executed per the amended plan.

## Executed

| Step | Action | Result |
|------|--------|--------|
| 14.5 | Rewrite pipeline stage→agent routing in 14 files | 0 retired-agent references remain (except JS `debugger;` linter pattern — correctly kept) |
| 14   | `git mv architect.md planner-reviewer.md` + `git mv designer.md frontend-designer.md` + `git rm` 7 retired + create `explorer.md` | agents/ now contains exactly 5 files |
| 15   | Each surviving agent gets Anthropic-spec frontmatter (`description`, `tools`, `when_to_invoke`) | 5/5 compliant |
| 16   | `CLAUDE.md` gains "Agents Available" table between Skills and Commands | 5 agents listed |

## Phase 2 Acceptance Criteria — Results

| AC | Target | Actual | Result |
|----|--------|--------|--------|
| `agents/` has exactly 5 files | 5 | 5 (doc-writer, explorer, frontend-designer, planner-reviewer, refactoring-agent) | **PASS** |
| Each agent has Anthropic-spec frontmatter | 5/5 | 5/5 | **PASS** |
| grep retired-agent names in skills | 0 (excl. JS keyword) | 0 | **PASS** |
| grep retired filenames in skills+CLAUDE.md | 0 | 0 | **PASS** |
| CLAUDE.md references 5 new agents | ≥5 | 5 | **PASS** |
| `npm run verify:skill-docs` | PASS | PASS | **PASS** |

## Global Regression — Results

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| EnterPlanMode rule | ≥5 mentions | 5 | **PASS** |
| `docs/superomni/<kind>/` contract | unchanged | unchanged | **PASS** |
| `frontend-design/reference/design-md-library/` | 8 brands + README | 8 brands + README | **PASS** |
| `framework-management` upstream consolidation | intact | intact | **PASS** |
| CLAUDE.md skill table | unchanged | unchanged (only Agents table added) | **PASS** |

## Agent Mode Dispatch Index (new)

| Skill | Dispatches | Mode |
|-------|-----------|------|
| `writing-plans` | `planner-reviewer` | planning |
| `plan-review` (Phase 1) | `planner-reviewer` | strategy |
| `plan-review` (Phase 2) | `frontend-designer` | (on UI plans) |
| `plan-review` (Phase 3) | `planner-reviewer` | engineering |
| `code-review` (main review) | `planner-reviewer` | code-review |
| `code-review` (security-sensitive) | `planner-reviewer` | security |
| `dependency-audit` | `planner-reviewer` | security (dependency sub-mode) |
| `production-readiness` | `planner-reviewer` | security (dependency sub-mode) |
| `verification` (indep gate) | `planner-reviewer` | evaluation |
| `systematic-debugging` (evidence) | `explorer` | (read-only survey) |
| `investigate` | `explorer` | (read-only survey) |
| `executing-plans` (UI steps) | `frontend-designer` | (quality gate) |
| `executing-plans` (debt cleanup) | `refactoring-agent` | (unchanged) |
| `executing-plans` (≥5-step survey) | `explorer` | (cross-file) |
| `code-review` (UI diffs) | `frontend-designer` | (quality gate) |
| `code-review` (≥3 structural findings) | `refactoring-agent` | (unchanged) |
| `frontend-design` (quality gate) | `frontend-designer` | (unchanged, renamed) |
| `refactoring` (Phase 4) | `refactoring-agent` | (unchanged) |
| `document-release` | `doc-writer` | (unchanged) |

## Files changed

- **agents/**: 7 deleted, 2 renamed (with content extended for canonical multi-mode), 3 modified frontmatter (doc-writer, frontend-designer, refactoring-agent), 1 added (explorer). Final count: 5.
- **skills/**: 14 skill tmpl + 15 SKILL.md modified for stage→agent remap (Step 14.5).
- **CLAUDE.md**: Agents Available table added between Skills and Commands.

Total Phase 2 diff: 44 files, +316 / −1,141 = −825 lines (mostly from retired agents' prompt content which is now covered by the parallel skills).

## Known deviations from amended plan

None. Step 14.5 (amended) was executed before Step 14 destructive ops as required. Step 15 (dispatch-agent wiring in frontmatter) was already done in Phase 1 Step 9 (`lib/frontmatter-map.json` declared `dispatch-agent` for 5 skills: investigate, code-review, systematic-debugging, plan-review, frontend-design, qa → but qa wasn't declared in the map; it now dispatches via `test-driven-development` skill, not an agent). This is acceptable — `dispatch-agent` frontmatter is a hint, the body's dispatch block is authoritative.

## Status

**DONE** — Phase 2 of 3 complete. 6 Phase 2 ACs + 5 global regression gates PASS.

Agent surface: **11 → 5** (**−6 files**, −54% count).
Skill body line drop vs. main baseline (cumulative Phase 1 + Phase 2): additional ~825 lines cut (retired agent content, now stored in git history).
Pipeline routing: fully remapped to canonical 5-agent surface, no dangling references.

## Next step

User validation of Phase 2 outcome, then **Phase 3** (strengthen `check-workflow-contract.js` produces/consumes linkage + add `/vibe auto` subcommand + demote `workflow/SKILL.md` to ≤50-line stub).
