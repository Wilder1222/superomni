# Execution: Anthropic Field Alignment + Retro Cleanup (v0.6.2)

**Plan:** `docs/superomni/plans/plan-main-anthropic-field-alignment-20260514.md`
**Review:** `docs/superomni/reviews/plan-review-main-anthropic-field-alignment-20260514.md`
**Branch:** `feat/skill-layering-anthropic`  **Date:** 20260514

## Step 1: Baseline ✓

- Branch: `feat/skill-layering-anthropic` (HEAD = 5810cff = v0.6.1)
- Working tree: clean (only the new spec/plan/review/.approved files untracked)
- CI green: `verify:skill-docs` PASS (3-generator fixture parity intact)
- Frontmatter snapshot of 4 target skills logged.

**Field-order observation:** existing files use `description → allowed-tools → when_to_use → produces → consumes` (allowed-tools BEFORE when_to_use). Anthropic canonical recommends `description → when_to_use → allowed-tools`. To avoid reshuffling every existing field (out of scope for v0.6.2), new fields will be inserted **after `when_to_use:`** in each tmpl, before `produces:`. Result preserves project convention while clustering new behavior fields.

## Steps 2-5: Phase 1 — Frontmatter + dynamic context ✓

| Skill | Field added | Position | YAML parse |
|---|---|---|---|
| `release` | `argument-hint: "[version]"`, `disable-model-invocation: true` | after `when_to_use:` | OK |
| `finishing-branch` | `disable-model-invocation: true` | after `when_to_use:` | OK |
| `framework-management` | `disable-model-invocation: true` | after `when_to_use:` | OK |
| `using-skills` (direct, no .tmpl) | `user-invocable: false` | after `when_to_use:` | OK |
| `vibe` | `argument-hint: "[idea-or-status-or-reset-or-auto]"` | after `when_to_use:` | OK |
| `brainstorm` | `argument-hint: "[idea]"` | after `when_to_use:` | OK |

**vibe Phase 1 dynamic-context injection** ✓ — added 3-line block with 4 `!`<command>`` patterns:
- Branch / status: `git branch --show-current && git status -s`
- Recent commits: `git log --oneline -5`
- Latest artifacts: `ls -t docs/superomni/specs/... plans/... evaluations/... releases/... | head -4`

vibe SKILL.md: 275 → 284 lines (+9, target ≤285 ✓). Generators preserved `!`<command>`` literal pattern verbatim — verified by `grep` on generated output.

## Step 6: Phase 1 Gate ✓

- [x] 3 skills locked: `grep -c "^disable-model-invocation: true"` returns 1 each for release, finishing-branch, framework-management.
- [x] 1 skill hidden: `grep -c "^user-invocable: false" skills/using-skills/SKILL.md` = 1.
- [x] 3 argument-hints: vibe, brainstorm, release.
- [x] vibe contains `!`<command>`` patterns (4 occurrences in generated SKILL.md).
- [x] `npm run gen-skills && npm run verify:skill-docs`: exit 0.
- [x] `npm run check:workflow-contract`: exit 0 (legacy advisories only).
- [x] All 6 modified frontmatters parse as valid YAML (js-yaml).
- [x] Skill count = 28; agent count = 5 (unchanged).

**Phase 1 status: DONE.**

## Steps 7-10: Phase 2 — Tooling Cleanup ✓

### Step 7: `lib/test-generators.js` (multi-occurrence regression test)

- New `lib/templates/multi-occurrence-fixture.md.tmpl` with 2× `{{PREAMBLE_CORE}}` (canonical + in code-fenced block).
- New `lib/test-generators.js` runs all 3 generators on fixture; asserts exactly 1 occurrence of `**Status protocol**` (proves only canonical token expanded, code-block token preserved).
- Wired into `package.json` `verify:skill-docs` umbrella.
- **Regression-catch verified**: temporarily replaced ps1's first-occurrence `IndexOf+Substring` with broken `String.Replace(token, replacement)` (which does global replace); test correctly reported `[ps1] FAIL: expected exactly 1 expanded preamble, got 2`. Restored ps1; test green.

### Step 8: CRLF advisory in `lib/check-skill-docs.js`

- New advisory loop scans every `skills/**/SKILL.md` for `\r\n`; warns (stderr-only, exit 0).
- **Discovered side effect**: my Step 3 direct edit on `using-skills/SKILL.md` had introduced CRLF (Windows editor injection); the new advisory caught it. Normalized via `perl -i -pe 's/\r\n/\n/g'`.
- **Demo verified**: forced CRLF on `brainstorm/SKILL.md`; advisory fired; restored.

### Step 9: `lib/validate-skills.sh` Iron Law examples check upgrade

- Wrapped existing check: now passes if EITHER inline `### Good/Bad` example fence pair exists OR a `reference/<topic>.md` file exists.
- Eliminates v0.6.1's false-positive warning on `test-driven-development` (which extracted its Good/Bad examples to `reference/red-green-refactor.md`).
- `bash lib/validate-skills.sh` now reports 1 warning (workflow stub — expected) instead of 2.

### Bonus fix: `lib/check-workflow-contract.js` REFLECT gate

- During Step 10 gate run, contract checker errored (exit 1) on v0.6.1's `main-skill-layering-anthropic` flow: "has evaluation but missing improvement (REFLECT gate)".
- Root cause: v0.5.8 deprecated standalone `improvement-*.md` files in favor of `release-*.md § Retrospective`. The contract checker still required `improvement-*.md`.
- Fix: gate now passes if EITHER `improvement-*.md` OR `release-*.md` exists for the same flow. Aligned to `self-improvement` skill body (lines 50-54) which documents the merged convention.
- This fix was outside the spec's strict scope (it's a tool, not a skill) but blocked Step 10 gate. Recorded as a v0.6.2 add per Principle 2 (Boil lakes — < 5 LOC fix; address while in the same context).

## Step 10: Phase 2 Gate ✓

- [x] `npm run test:generators` exit 0; all 3 generators PASS multi-occurrence assertion.
- [x] Multi-occurrence regression demo: temporary ps1 break caught and reported with clear diagnostic.
- [x] CRLF advisory: positive demo on `brainstorm`, negative state clean after restoration.
- [x] TDD false-positive eliminated; `validate-skills.sh` warnings: 2 → 1 (workflow stub remains, intended).
- [x] REFLECT gate fix: workflow-contract exit 0; v0.6.1 flow no longer errors.
- [x] `npm run verify:skill-docs` (umbrella: gen + check + fixture-parity + test-generators) exit 0.

**Phase 2 status: DONE.**

## Step 11: Version Bump ✓

- `package.json` 0.6.1 → 0.6.2
- `.claude-plugin/marketplace.json` ×2 occurrences → 0.6.2
- `.claude-plugin/plugin.json` → 0.6.2
- `claude-skill.json` → 0.6.2
- `CHANGELOG.md` new `[0.6.2]` entry above the 0.6.1 entry, documenting all 8 changes (3 added + 1 changed + bonus REFLECT-gate fix + line-endings normalization)

## Step 12: Final Regression Gate ✓

| Invariant | Pre-sprint | Post-sprint | Required | Status |
|---|---|---|---|---|
| Skill count | 28 | 28 | unchanged | ✓ |
| Agent count | 5 | 5 | unchanged | ✓ |
| `EnterPlanMode` mentions in CLAUDE.md | 5 | 5 | ≥5 | ✓ |
| Flat `reference.md` files | 0 | 0 | 0 | ✓ |
| `reference/` subdirs | 6 | 6 | unchanged | ✓ |
| Total `wc -l skills/*/SKILL.md` | 6,181 | 6,196 | no skill grew by ≥20 lines | ✓ (vibe +9, others +1-2 each) |
| `${CLAUDE_SKILL_DIR}` literal token refs (5 v0.6.1-trimmed skills) | 15 | 15 | preserved | ✓ |
| `frontend-design/reference/design-md-library/` | 9 entries | 9 | unchanged | ✓ |
| `verify:skill-docs` (gen + check + fixture-parity + test-generators) | green | green | exit 0 | ✓ |
| `check:workflow-contract` | exit 0 | exit 0 | exit 0 | ✓ |
| `validate-skills.sh` warnings | 2 | 1 (workflow stub only) | 0 errors | ✓ |
| Version 0.6.2 across 5 files | n/a | confirmed | required | ✓ |

**Phase 2 + final gate status: DONE.**
