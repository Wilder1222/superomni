# Evaluation: Plan-Content Auto-Linter (v0.6.7)

**Branch:** `feat/plan-content-linter`  **Date:** 20260515

## Code Review (Self)

| File | Change | Verdict |
|---|---|---|
| `lib/check-plan-content.js` | New ~210-LOC checker; document-order lookback; CUTOFF=20260514; no inline-backtick stripping (opposite-semantic from v0.6.4) | ✓ |
| `package.json` | + `check:plan-content` script; extended `verify:skill-docs` umbrella; bumped to 0.6.7 | ✓ |
| `.github/workflows/validate.yml` | + 1 step in each of ubuntu + windows jobs (after `Check plugin sync`) | ✓ via Write rebuild |
| `skills/writing-plans/SKILL.md.tmpl` | + 1-line CI-enforcement note in Pre-Destructive Gate section | ✓ |
| `README.md` | Current stable version 0.6.6 → 0.6.7 | ✓ |
| `docs/COMPARISON.md` | header (line 5) + footer (line 563) v0.6.6 → v0.6.7 (historical 0.3.0 references unchanged) | ✓ |
| `docs/DESIGN.md` | Version + Status v0.6.6 → v0.6.7 | ✓ |
| `CHANGELOG.md` | + [0.6.7] entry with rationale + verified demos | ✓ |
| `.claude-plugin/marketplace.json` (×2), `plugin.json`, `claude-skill.json` | bumped to 0.6.7 | ✓ |

**P0/P1/P2 issues:** none.

## QA — Test Coverage

| Test surface | Mechanism | Result |
|---|---|---|
| Linter exit 0 on current main | `npm run check:plan-content` | exit 0; "scanned 7 plans, 0 destructive steps, all preceded by 'careful' step. (4 historical plans exempt)" |
| Negative demo (real fixture file) | synthetic 2-step plan with `git rm` in Step 2, no careful in Step 1 → linter exits 1 with full diagnostic | ✓ "Step 2 contains destructive pattern(s) [git rm] in **How:** but preceding Step 1 does not invoke 'careful'" |
| Positive demo restoration | edit fixture Step 1 to include "careful" in title + body → re-run → exit 0; "1 destructive step, all preceded by careful" | ✓ |
| False-positive avoidance | v0.6.3 plan's Step 9 has `git rm` mentions in fenced worked-example + inline backticks; linter does not fire | ✓ (fence-stripping suppresses; the only post-cutoff plan with destructive prose mentions) |
| Document-order lookback (Amendment A) | logic verified by examining `hasCarefulInPrecedingStep(steps, idx)` — uses `steps[idx - 1]`, not numerical sort | ✓ |
| CUTOFF_DATE exemption (Amendment B) | `extractDate` parses date suffix; v0.6.0 plan (20260513) reported in "exempt by cutoff" count (4 total exempt) | ✓ |
| All 8 CI gates green | `verify:skill-docs` umbrella + `check:workflow-contract` + `validate-skills` | ✓ |
| Skill / agent counts | `ls -d skills/*/`; `ls agents/*.md` | 28 / 5 unchanged |

## Acceptance Criteria

### Phase 1 ACs (per spec)

- [x] `lib/check-plan-content.js` ~150-200 LOC (~210 actual; ≤+10 acceptable)
- [x] `npm run check:plan-content` exit 0 on current main
- [x] Markdown-aware: fence stripping reused from check-skill-docs.js
- [x] DESTRUCTIVE_PATTERNS array (12 entries) at top of file
- [x] Pre-cutoff exemption (CUTOFF_DATE = 20260514 per Amendment B)
- [x] Standalone npm script + `verify:skill-docs` umbrella inclusion
- [x] CI workflow: step in both ubuntu + windows jobs

### Phase 2 demos (modified per Amendment A+B)

- [x] Synthetic positive demo: 2-step plan with careful → pass
- [x] Synthetic negative demo: same plan without careful → fail with diagnostic; restore → pass
- [x] False-positive avoidance: v0.6.3 plan with prose `git rm` in fence → no fire
- [x] writing-plans CI-enforcement note added (1 line + ${CLAUDE_SKILL_DIR} link)

### Global regression gates

- [x] All 8 CI commands locally green (verify:skill-docs umbrella, check:workflow-contract, validate-skills, check:plan-content standalone)
- [x] `${CLAUDE_SKILL_DIR}` 15 / `EnterPlanMode` 5 / design-md-library 9 / flat reference.md 0 / skills 28 / agents 5
- [x] `.approved-spec-*` markers: 0 (v0.6.6 G7 invariant preserved)
- [x] Total `wc -l skills/*/SKILL.md`: 6,243 → 6,245 (+2 lines from writing-plans note; spec budget allowed ≤+5)

### Version

- [x] All 5 manifest files + README + 2 docs at 0.6.7
- [x] CHANGELOG `[0.6.7] — 2026-05-15` with full rationale

## Plan Amendments correctly applied

- [x] Amendment A (E1): document-order lookback in `hasCarefulInPrecedingStep`
- [x] Amendment B (E5): CUTOFF_DATE = 20260514; v0.6.0 plan (20260513) exempt

## Mid-build design correction (Step 9.5)

Recorded in execution doc + retro. The opposite-semantic of inline-backticks between SKILL.md.tmpl (literal token reference) and plan How sections (command to run) was caught by the negative demo failing initially. Fixed by removing inline-backtick stripping while keeping fence-stripping. This is a class of subtle bug worth carrying into future linter work: **always audit semantic intent at destination, not just syntactic shape at source**.

## Status: DONE

**Status:** DONE

All hard ACs met. v0.6.3-deferred plan-content auto-linter shipped at patch size. CI hard-gate operational. v0.6.0 plan respected as historical-immutable via cutoff date.

**Architectural-level via patch cadence demonstrated**: 1 new lib file + 1 npm script + 1 CI step + 1 line in skill template + version bump = single-purpose patch. The next architectural item (`context: fork` migration) can follow this same pattern when ready.

**Next stage:** RELEASE.
