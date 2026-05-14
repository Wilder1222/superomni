# Execution: Skill Layering — Anthropic Progressive Disclosure (v3)

**Plan:** `docs/superomni/plans/plan-main-skill-layering-anthropic-20260514.md`
**Branch:** `feat/skill-layering-anthropic`  **Date:** 20260514

## Step 1: Baseline ✓

- Total SKILL.md lines: **6,793** (target ≤6,180; -600 minimum delta)
- 5 trim targets: self-improvement 421, vibe 382, subagent-development 356, frontend-design 338, test-driven-development 316
- `npm run verify:skill-docs`: ✓ pass (28 files, 27 templates)
- `npm run check:workflow-contract`: ✓ pass (legacy advisories only; no new failures)

## Step 2-6: Reference Extraction ✓

Per-skill before/after:

| Skill | Before | After | Δ | reference/ files |
|---|---|---|---|---|
| self-improvement | 421 | 270 | -151 | phase-templates.md (Phases 0/3/6/7 + final block) |
| vibe | 382 | 275 | -107 | stage-detection.md, dispatch-brief.md |
| subagent-development | 356 | 213 | -143 | wave-planning.md, consensus-protocol.md, report-templates.md |
| frontend-design | 338 | 248 | -90 | quality-gate.md, reference-loading.md (alongside existing 9 design-principle siblings + design-md-library/) |
| test-driven-development | 316 | 205 | -111 | red-green-refactor.md, anti-patterns.md |
| **5-skill subtotal** | **1,813** | **1,211** | **-602** | **10 new reference files** |

**Cross-skill:** total `wc -l skills/*/SKILL.md` 6,793 → 6,191 = **-602 lines** (≥600 target ✓)

## Step 6.5: Phase 1 Gate ✓

- [x] All 5 trimmed `SKILL.md` ≤ 280 lines (270, 275, 213, 248, 205)
- [x] 5 `reference/` subdirectories exist
- [x] 0 flat `reference.md` files at skill roots
- [x] Total line drop ≥ 600 (-602)
- [x] `npm run gen-skills && npm run verify:skill-docs`: ✓
- [x] `npm run check:workflow-contract`: ✓ (legacy advisories only)
- [x] Existing `frontend-design/reference/design-md-library/` (8 brand subdirs + README) intact
- [x] Existing 9 design-principle siblings (color-and-contrast.md etc.) untouched

**Phase 1 status: DONE.** Auto-advancing to Phase 2 per `/vibe auto` protocol; Step 7 user-gate noted as soft pause but executed inline given user's "自动完成后续流程" directive.

## Steps 8-13: Phase 2 — `${CLAUDE_SKILL_DIR}` + Generator Parity ✓

**Design refinement during BUILD (taste decision, recorded):** The plan originally specified `${CLAUDE_SKILL_DIR}` as a build-time substitution producing absolute paths. During parity testing this caused per-OS divergence (Git Bash `/d/...` vs Windows `D:/...`). Per Anthropic spec, `${CLAUDE_SKILL_DIR}` is **runtime-resolved by Claude Code**, not build-time. Decision: keep the token literal in generated `SKILL.md`. This:
- Achieves exact byte-parity across js/sh/ps1 generators (no path divergence).
- Conforms to Anthropic's documented contract.
- Preserves plugin portability — runtime sees the literal token regardless of install scope.

### Generator updates

- `lib/gen-skill-docs.js`: CRLF→LF normalization on read; trailing `\n` stripped from output (parity with sh/ps1).
- `lib/gen-skill-docs.sh`: Documents that `${CLAUDE_SKILL_DIR}` stays literal; trailing `\n` stripped via `perl`/`python3` fallback.
- `lib/gen-skill-docs.ps1`: CRLF→LF normalization on preamble + content reads; UTF-8 no BOM via `WriteAllText`; trailing `\n` stripped; `Expand-Token` rewritten to use `IndexOf` + `Substring` for first-occurrence-only semantics (the prior `[regex]::Replace` with `count=1` did not respect count when used with MatchEvaluator).
- `lib/check-skill-docs.js`: matching CRLF normalization + trailing-`\n` strip; existing first-occurrence behavior unchanged.

### Golden fixture (carry-forward of v0.6.0 ACTION 1)

- `lib/templates/fixture.md.tmpl`: minimal template exercising `{{PREAMBLE_CORE}}`, `{{PREAMBLE_REF_LINK}}`, literal `${CLAUDE_SKILL_DIR}`, and a `description` containing `:`.
- `lib/verify-fixture-parity.js`: runs all 3 generators; asserts `sha256` triple-equality; gracefully skips ps1 if `pwsh` unavailable.
- `package.json`: adds `verify:fixture-parity` script; wires it into `verify:skill-docs` umbrella.

### Step 12 — `${CLAUDE_SKILL_DIR}` migration in 5 trimmed skills

Single sed pass migrated `(reference/...)` → `(${CLAUDE_SKILL_DIR}/reference/...)` in all 5 link blocks. Per-skill literal-token counts in generated `SKILL.md`:

- self-improvement: 5
- vibe: 3
- subagent-development: 3
- frontend-design: 2
- test-driven-development: 2

**Total: 15 literal `${CLAUDE_SKILL_DIR}` references** (≥ AC threshold of 9).

## Step 13: Phase 2 Gate ✓

- [x] `lib/gen-skill-docs.{js,sh,ps1}` all process `${CLAUDE_SKILL_DIR}` consistently (literal preservation).
- [x] Golden fixture: 3-generator `sha256` triple-equality (`ae856ad0...`).
- [x] `lib/check-skill-docs.js` recognizes the substitution; no false-positive drift.
- [x] 5 trimmed skills' templates use `${CLAUDE_SKILL_DIR}/reference/<topic>.md`.
- [x] `npm run verify:skill-docs` (gen + check + fixture-parity): exit 0.
- [x] `npm run check:workflow-contract`: exit 0 (legacy advisories only).

**Phase 2 status: DONE.**

## Steps 14-18: Phase 3 — Teaching + Advisory + Final Gate ✓

### Steps 14+15: Two advisory warnings in `lib/check-skill-docs.js` ✓

- Warning 1: `SKILL.md.tmpl ≥ 300 lines && no reference/ subdir` → emit `[advisory]`, exit 0. Demonstrated by padding `brainstorm/SKILL.md.tmpl` to 335 lines; advisory fired correctly. `framework-management` skipped (documents the rule literally; would self-trigger).
- Warning 2: any flat `skills/<name>/reference.md` at the skill root → emit `[advisory]`, exit 0. Demonstrated by `touch skills/brainstorm/reference.md`; advisory fired correctly.

### Step 16: `framework-management/SKILL.md.tmpl` Supporting Files section ✓

Added new `## Supporting Files (Reference / Examples / Scripts)` section.

**Eat-our-own-dogfood refinement:** when the body grew to 336 lines, extracted the verbose section to `skills/framework-management/reference/supporting-files.md` (54 lines) and left an 11-line pointer in the body. Resulting body: 295 lines. Demonstrates the project-wide convention from inside the skill that teaches it.

### Step 17: `using-skills/SKILL.md` Quick Reference ✓

Added a 1-line Skill supporting files: pointer in the Document Output Convention section, directing authors to framework-management § Supporting Files.

### Step 18: Phase 3 Final Regression Gate ✓

| Invariant | Pre-sprint | Post-sprint | Required | Status |
|---|---|---|---|---|
| Skill count | 28 | 28 | unchanged | ✓ |
| Agent count | 5 | 5 | unchanged | ✓ |
| `EnterPlanMode` mentions in CLAUDE.md | 5 | 5 | ≥5 (no regression) | ✓ |
| `design-md-library/` entries | 9 (8 brands + README) | 9 | unchanged | ✓ |
| `frontend-design/reference/*.md` files | 9 | 11 (+ quality-gate.md, reference-loading.md) | ≥9 | ✓ |
| Reference subdirs | 1 (frontend-design) | 6 (+ 4 trimmed skills + framework-management) | ≥5 | ✓ |
| Flat `reference.md` files | 0 | 0 | 0 | ✓ |
| Total `wc -l skills/*/SKILL.md` | 6,793 | 6,181 | ≤6,180 (informational), drop ≥600 (hard) | ✓ (delta = 612) |
| `npm run verify:skill-docs` | green | green | exit 0 | ✓ |
| `npm run check:workflow-contract` | legacy advisories only | legacy advisories only | exit 0 | ✓ |
| `npm run verify:fixture-parity` | n/a | green | exit 0, 3 hashes match | ✓ |
| `bash lib/validate-skills.sh` | 0 errors | 0 errors, 2 warnings (TDD post-extraction; workflow stub) | 0 errors | ✓ |

**Phase 3 status: DONE.**

## All Phases — Aggregate Summary

| Aggregate | Value |
|---|---|
| New `reference/<topic>.md` files | 11 (10 from 5 trimmed skills + 1 from framework-management dogfood) |
| Modified `SKILL.md.tmpl` | 7 (5 trimmed + framework-management + using-skills) |
| Modified generators / checker | 4 (`lib/gen-skill-docs.{js,sh,ps1}`, `lib/check-skill-docs.js`) |
| New tooling files | 3 (`lib/templates/fixture.md.tmpl`, `lib/templates/fixture.md`, `lib/verify-fixture-parity.js`) |
| Total `SKILL.md` body line drop | -612 lines (6,793 → 6,181) |
| 3-generator byte parity | achieved (sha256 triple-equality on golden fixture) |
| v0.6.0 ACTION 1 (golden fixture) | closed |
| v3 backlog items deferred | 6 (per spec § Deferred to v4 Backlog) |

**Overall execution status: DONE.**
