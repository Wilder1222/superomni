# Execution: CI Completeness + Doc Version Drift (v0.6.6)

**Plan:** `docs/superomni/plans/plan-main-ci-completeness-20260515.md`
**Review:** `docs/superomni/reviews/plan-review-main-ci-completeness-20260515.md`
**Branch:** `feat/ci-completeness` (off feat/plugin-sync-gate at d9461c5 = v0.6.5 local)  **Date:** 20260515

## Summary

7 G items implemented in single bug-batch patch. Single CI cycle covers all touch surfaces (no overlap).

## Execution log

| Step | G | Action | Result |
|---|---|---|---|
| 1 | — | Baseline check | ✓ all 7 CI gates green |
| 2 | G7 | brainstorm: removed `touch .approved-*` block, rewrote prose to "user reply IS approval" | ✓ |
| 3 | G7 | vibe SKILL.md.tmpl: collapsed stage-detection rows 1-2; removed 6 marker references (matrix, contract, dispatch description, status display) | ✓ |
| 4 | G7 | vibe reference/stage-detection.md: removed `_HAS_SPEC_APPROVAL` variable + helper case | ✓ |
| 5 | G2 | docs/COMPARISON.md header v0.3.0 → v0.6.6 (line 5 + line 563 footer) | ✓ |
| 6 | G3 | docs/DESIGN.md status v0.5.7 → v0.6.6 (lines 5-6) | ✓ |
| 7 | G4 | package.json `files` array + `CHANGELOG.md` in alphabetical position | ✓ |
| 8 | G5 | lib/validate-skills.sh comment block: `{{PREAMBLE}}` → `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}` (with deprecation note) | ✓ |
| 9 | G6 | lib/check-plugin-sync.js invariant 4: refactored from single regex to multi-file `VERSION_DOCS` array (README + COMPARISON.md + DESIGN.md). Permissive on missing files; strict on regex-no-match. | ✓ |
| 10 | G6 | check-plugin-sync re-run after refactor | mid-sprint failure caught (correctly): COMPARISON + DESIGN at 0.6.6, package.json still at 0.6.5 — the refactored checker correctly diagnosed both |
| 11 | G7 | grep verification: 0 marker references in `.tmpl` files; 0 marker files in specs/ | ✓ |
| 12 | G6 | Inject `v9.9.9` in DESIGN.md → multi-file checker fired with specific diagnostic; restored | ✓ |
| 13 | G1 | .github/workflows/validate.yml: added 3 ubuntu steps (verify:fixture-parity, test:generators, check:plugin-sync); added 2 windows steps (test:generators, check:plugin-sync) | ✓ — file rewritten via Write to handle Edit tool's duplicate-block confusion |
| 14 | — | Version bump 0.6.5 → 0.6.6 across 5 manifest files + README | ✓ |
| 15 | — | CHANGELOG `[0.6.6]` entry above 0.6.5 with all 7 G items + rationale | ✓ |
| 16 | — | Final regression: all 7 CI gates green; all invariants preserved | ✓ |

## Step 16 — Regression Gate

| Invariant | Pre-sprint (v0.6.5) | Post-sprint | Status |
|---|---|---|---|
| Skills count | 28 | 28 | ✓ |
| Agents count | 5 | 5 | ✓ |
| EnterPlanMode mentions in CLAUDE.md | 5 | 5 | ✓ |
| Flat reference.md files | 0 | 0 | ✓ |
| `${CLAUDE_SKILL_DIR}` literal token refs | 15 | 15 | ✓ |
| `frontend-design/reference/design-md-library/` entries | 9 | 9 | ✓ |
| Total `wc -l skills/*/SKILL.md` | 6,249 | **6,243** | ✓ (-6, sprint shrinks code) |
| `.approved-spec-*` marker files | 7 | **0** | ✓ G7 |
| `verify:skill-docs` (umbrella: gen + check + fixture-parity + test:generators + check:plugin-sync) | green | green | ✓ |
| `check:workflow-contract` | exit 0 | exit 0 | ✓ |
| `validate-skills.sh` | 1 warning (workflow stub) | 1 warning (workflow stub) | ✓ |
| Version 0.6.6 across 5 manifests + README + 2 docs | n/a | confirmed | ✓ |

## Mid-build observations

1. **Edit tool duplicate-block conflict**: The CI workflow file had two structurally identical blocks (ubuntu and windows jobs share the same step sequence). Edit's first-occurrence-only semantics made it impossible to update both via Edit calls. Resolved via Write to rewrite the entire file. Lesson: when a YAML file has near-duplicate sections, prefer Write over multi-Edit.
2. **G7 reveal about cross-session resume**: pre-G7 marker mechanism had a subtle within-session-only design (the `find -newer` check tied markers to session-start timestamp). Cross-session resume already used `last-session-artifacts.txt` to detect spec+plan co-existence as PLAN-stage. So the marker mechanism only ever helped within a single session—exactly when the user was about to reply anyway. Net value: zero. Removing it is strictly subtraction without functional loss.
3. **G6 multi-file checker UX**: The refactored checker output 2 diagnostics simultaneously (COMPARISON + DESIGN both drifting from package.json), each with its own actionable message. Better than single-line "version drift" because each doc has its own update path.

**Overall execution status: DONE.** All 16 plan steps completed; all 7 G items shipped; net -6 lines of skill body code despite 7 functional improvements.
