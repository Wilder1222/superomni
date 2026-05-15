# Execution: Plan-Content Auto-Linter (v0.6.7)

**Plan:** `docs/superomni/plans/plan-main-plan-content-linter-20260515.md`
**Review:** `docs/superomni/reviews/plan-review-main-plan-content-linter-20260515.md` (2 amendments captured)
**Branch:** `feat/plan-content-linter` (off feat/ci-completeness at eb363d0 = v0.6.6 local)  **Date:** 20260515

## Summary

Architectural-level CI hard-gate shipped as patch. Closes v0.6.3-deferred plan-content-linter substantial feature.

## Execution log

| Step | Action | Result |
|---|---|---|
| 1 | Baseline CI green | ✓ |
| 2-6 | Author `lib/check-plan-content.js` (~210 LOC; mirrors check-plugin-sync.js shape; reuses fence-tracking from check-skill-docs.js v0.6.4 pattern) | ✓ |
| 7 | npm script `check:plan-content` standalone + extended `verify:skill-docs` umbrella (now 7 sub-checks) | ✓ |
| 8 | CI workflow: 1 new step in each of ubuntu + windows jobs | ✓ via Write rebuild (Edit duplicate-block conflict, same pattern as v0.6.6) |
| 9 | First run on current main: 7 in-scope plans, 0 destructive steps, all pass | ✓ — false-positive avoidance natural (prose mentions in fenced blocks/backticks) |
| **9.5** | **Mid-build design correction** | **Initial run with v0.6.4-style inline-backtick stripping caused test fixture (`Run \`git rm -rf src/old/\``) to NOT fire — opposite-semantic discovery: in plan How, backticks indicate "command to run", not "literal token reference". Fixed by removing inline-backtick stripping; kept fence-stripping (multi-line ``` blocks usually documentation).** |
| 10 | Negative demo: synthetic 2-step fixture with `git rm` in Step 2 / no careful in Step 1 → linter exits 1 with full diagnostic; restore by adding careful to Step 1 → exit 0; remove fixture | ✓ |
| 11 | False-positive avoidance verified: v0.6.3 plan's Step 9 has `git rm` mentions in worked-example fenced block + inline backticks within prose — linter does not fire | ✓ |
| 12 | `writing-plans/SKILL.md.tmpl` Pre-Destructive Gate section: added 1-line CI-enforcement note linking to `lib/check-plan-content.js` | ✓ |
| 13 | Version bump 0.6.6 → 0.6.7 across 7 surfaces (5 manifest + README + 2 docs) | ✓ |
| 14 | CHANGELOG `[0.6.7]` entry above 0.6.6 with full design rationale + verification results | ✓ |
| 15 | Final regression gate | ✓ all 8 CI gates green |

## Plan amendments (from REVIEW)

Both amendments correctly applied during BUILD:
- **Amendment A (E1)**: Lookback by document order, not by step-number ordering. Implemented in `hasCarefulInPrecedingStep(steps, idx)` — `steps[idx - 1]` is the array-previous (document-order previous), not the numerically lower step.
- **Amendment B (E5)**: `CUTOFF_DATE = 20260514`. v0.6.0 plan dated 20260513 exempted as historical-immutable.

## Mid-build observations (recorded for retro)

1. **Opposite-semantic discovery (Step 9.5)**: I initially assumed v0.6.4 token-literal advisory's fence + inline-backtick stripping logic would apply 1:1 here. It doesn't. In `SKILL.md.tmpl` prose, backticks render as inline code = "literal token reference" (don't expand). In plan `**How:**` sections, backticks are typically command syntax = "run this". Same markdown construct, opposite intent. Lesson: when reusing v0.6.x fence-awareness logic in a new linter, audit the semantic at the destination, not just the syntax.
2. **Edit tool duplicate-block conflict (Step 8)**: Same problem as v0.6.6 with the windows/ubuntu jobs sharing identical step sequences. Resolved via Write to rewrite the entire workflow file. Worth considering as a v0.7.0+ Edit-tool enhancement: support "match Nth occurrence" or "match last occurrence".
3. **CUTOFF_DATE choice was non-trivial (Amendment B)**: REVIEW caught this; the cutoff isn't just "skip historical" but "respect historical immutability of plans whose process didn't have today's gate". Future linters that target plan-content should think about this same boundary.

## Step 15 — Regression Gate

| Invariant | Pre-sprint (v0.6.6) | Post-sprint | Status |
|---|---|---|---|
| Skills count | 28 | 28 | ✓ |
| Agents count | 5 | 5 | ✓ |
| EnterPlanMode mentions in CLAUDE.md | 5 | 5 | ✓ |
| Flat reference.md files | 0 | 0 | ✓ |
| `${CLAUDE_SKILL_DIR}` literal token refs | 15 | 15 | ✓ |
| `frontend-design/reference/design-md-library/` entries | 9 | 9 | ✓ |
| `.approved-spec-*` markers | 0 | **0** | ✓ (G7 invariant from v0.6.6 preserved) |
| Total `wc -l skills/*/SKILL.md` | 6,243 | **6,245** | ✓ (+2 lines from writing-plans note; ≤+5 spec budget) |
| `verify:skill-docs` (umbrella: gen + check-skill-docs + verify:fixture-parity + test:generators + check:plugin-sync + check:plan-content) | green (6 sub-checks) | green (7 sub-checks) | ✓ |
| `check:workflow-contract` | exit 0 | exit 0 | ✓ |
| `validate-skills.sh` | 1 warning (workflow stub) | 1 warning (workflow stub) | ✓ |
| Version 0.6.7 across 5 manifests + README + 2 docs | n/a | confirmed | ✓ |

**Overall execution status: DONE.** Architectural-level CI gate shipped at patch size. All hard ACs met. 2 plan amendments correctly applied. 1 mid-build design correction (Step 9.5) recorded for retro.
