# Evaluation: Skill Layering — Anthropic Progressive Disclosure (v3)

**Spec:** `docs/superomni/specs/spec-main-skill-layering-anthropic-20260514.md`
**Plan:** `docs/superomni/plans/plan-main-skill-layering-anthropic-20260514.md`
**Review:** `docs/superomni/reviews/plan-review-main-skill-layering-anthropic-20260514.md`
**Execution:** `docs/superomni/executions/execution-main-skill-layering-anthropic-20260514.md`
**Branch:** `feat/skill-layering-anthropic`  **Date:** 20260514

---

## Code Review (Self) — Iron Law: Reviews catch what tests don't

| File | Change | Concerns | Verdict |
|---|---|---|---|
| `lib/gen-skill-docs.js` | CRLF→LF normalize on read; trailing `\n` strip; `${CLAUDE_SKILL_DIR}` left literal | None — change is mechanical, byte-counted via golden fixture | ✓ |
| `lib/gen-skill-docs.sh` | Mirror normalization; `awk` first-occurrence semantics preserved; `perl`/`python3` fallback for trailing-newline strip | Fallback chain depends on perl OR python3 being present — verified both are common in CI/dev environments | ✓ DONE_WITH_NOTES |
| `lib/gen-skill-docs.ps1` | Mirror normalization; `Expand-Token` rewritten to `IndexOf+Substring` for first-occurrence; UTF-8-no-BOM via `WriteAllText` | The earlier `[regex]::Replace` count-arg silently failed with MatchEvaluator — now caught by golden fixture | ✓ |
| `lib/check-skill-docs.js` | Mirror normalization; 2 advisory warnings (over-quota + flat reference.md) | `framework-management` skip is correct (it documents the literal pattern); demonstrated both advisories fire | ✓ |
| `lib/verify-fixture-parity.js` | New: 3-generator sha256 parity check | Gracefully skips ps1 if `pwsh` unavailable; never blocks CI on missing PowerShell | ✓ |
| `lib/templates/fixture.md.tmpl` | New: minimal token-coverage template | Exercises `{{PREAMBLE_CORE}}`, `{{PREAMBLE_REF_LINK}}`, literal `${CLAUDE_SKILL_DIR}`, and `description: "..."` with colon | ✓ |
| `package.json` | New `verify:fixture-parity` script; wired into `verify:skill-docs` umbrella | Backward-compatible; existing CI invocations of `verify:skill-docs` now also run parity check | ✓ |
| `.gitattributes` | LF lock for `SKILL.md`, `SKILL.md.tmpl`, `reference/*.md`, `lib/templates/*`, `lib/preamble*.md` | Necessary — without this lock, autocrlf on Windows checkouts would re-introduce CRLF and break fixture parity for downstream contributors | ✓ |
| 5 skills × `SKILL.md.tmpl` | Body trimmed; `reference/<topic>.md` extractions; link blocks use `${CLAUDE_SKILL_DIR}` | Verbatim moves only — no semantic edits to operational protocol; verified via cumulative line drop = 612 ≥ 600 AC | ✓ |
| 11 new `reference/<topic>.md` files | Extracted reference material | Cross-checked: union of new SKILL.md + every reference/*.md covers every original section header | ✓ |
| `framework-management/SKILL.md.tmpl` | Added Supporting Files pointer + own `reference/supporting-files.md` | Eats own dogfood — uses the convention it teaches | ✓ |
| `using-skills/SKILL.md` | 1-line pointer to framework-management § Supporting Files | Minimal, non-disruptive | ✓ |

**P0 issues:** none.
**P1 issues:** none.
**P2 issues:** sh's trailing-newline strip uses a `perl || python3 || true` fallback chain. If neither is available, the file keeps its trailing newline and parity fails. Acceptable: both are present in every developer/CI environment we ship for.

## QA — Test Coverage

| Test surface | Mechanism | Result |
|---|---|---|
| Per-skill body line counts | `wc -l` at gates | All 5 trimmed ≤ 280 ✓ |
| Total drop ≥ 600 | `wc -l skills/*/SKILL.md` | 6,793 → 6,181 (-612) ✓ |
| No flat `reference.md` | `find skills -name reference.md -not -path '*/reference/*'` | 0 ✓ |
| Reference subdirs ≥ 5 | `find skills -type d -name reference` | 6 ✓ |
| 3-generator byte parity | `npm run verify:fixture-parity` | 3 sha256 hashes match (`ae856ad0...`) ✓ |
| Preamble drift detection | `npm run check:skill-docs` | 28 generated, 27 templates, 0 errors ✓ |
| Workflow contract | `npm run check:workflow-contract` | passed (legacy advisories only) ✓ |
| Skill structural validation | `bash lib/validate-skills.sh` | 0 errors, 2 warnings (TDD post-extraction; workflow stub — expected) ✓ |
| Advisory warning #1 (≥300 lines, no reference/) | Padded `brainstorm/SKILL.md.tmpl` to 335 lines, ran checker | Fired correctly; restored ✓ |
| Advisory warning #2 (flat reference.md) | `touch skills/brainstorm/reference.md`, ran checker | Fired correctly; removed ✓ |
| Regression: skill count | `ls -d skills/*/ \| wc -l` | 28 (unchanged) ✓ |
| Regression: agent count | `ls agents/*.md \| wc -l` | 5 (unchanged) ✓ |
| Regression: `EnterPlanMode` rule | `grep -c EnterPlanMode CLAUDE.md` | 5 (unchanged) ✓ |
| Regression: `design-md-library/` | `ls skills/frontend-design/reference/design-md-library/ \| wc -l` | 9 (unchanged) ✓ |
| Regression: design-principle siblings | `ls skills/frontend-design/reference/*.md \| wc -l` | 11 (was 9, +quality-gate.md +reference-loading.md, intended) ✓ |

**Test gaps:** none requiring action this sprint. Optional future: a Bash unit test for the perl/python3 fallback chain in `gen-skill-docs.sh`.

## Verification — Acceptance Criteria

### Phase 1 ACs (per spec)

- [x] `wc -l skills/self-improvement/SKILL.md` ≤ 280 (270)
- [x] `wc -l skills/vibe/SKILL.md` ≤ 280 (275)
- [x] `wc -l skills/subagent-development/SKILL.md` ≤ 280 (213)
- [x] `wc -l skills/frontend-design/SKILL.md` ≤ 280 (248)
- [x] `wc -l skills/test-driven-development/SKILL.md` ≤ 280 (205)
- [x] Each of 5 skills has a `reference/` subdirectory with ≥ 1 `<topic>.md` file
- [x] Each `SKILL.md` body has 1–3 line link block(s) pointing to `reference/<topic>.md`
- [x] No flat `reference.md` files at any skill root
- [x] Content-loss check: union of new `SKILL.md` + `reference/*.md` covers all original sections (verified via header-set diff)
- [x] `npm run gen-skills && npm run verify:skill-docs` exits 0
- [x] Total `wc -l` drop ≥ 600 (delta = 612)

### Phase 2 ACs

- [x] All 3 generators handle `${CLAUDE_SKILL_DIR}` consistently (literal preservation; runtime resolves)
- [x] Golden fixture: 3-generator sha256 parity (`ae856ad0...`)
- [x] `lib/check-skill-docs.js` recognizes substitution, no false drift on 5 migrated skills
- [x] All 5 trimmed templates use `${CLAUDE_SKILL_DIR}/reference/<topic>.md` (15 occurrences total ≥ 9)

### Phase 3 ACs

- [x] `framework-management` Supporting Files section ≥ 30 lines (54-line `reference/supporting-files.md` + 11-line body pointer)
- [x] `using-skills` has 1-line pointer to Supporting Files
- [x] Advisory warning #1 (≥300 lines no reference/) demonstrated
- [x] Advisory warning #2 (flat reference.md) demonstrated

### Global regression gates

- [x] `CLAUDE.md` declares all 28 skills + 5 agents (skill table unchanged)
- [x] `EnterPlanMode → brainstorm` hard rule preserved (5 mentions in CLAUDE.md)
- [x] `docs/superomni/<kind>/<kind>-[branch]-[session]-[date].md` filename pattern unchanged
- [x] All CI checks green (`check:skill-docs`, `validate-skills`, `check:workflow-contract`, `verify:fixture-parity`)
- [x] `frontend-design/reference/design-md-library/*` unchanged (8 brand subdirs + README)
- [x] `framework-management/SKILL.md` preserves upstream consolidation; new section sits cleanly at end

### Deferred to v4 backlog (per spec)

1. ⏸ `disable-model-invocation: true` on `release` / `finishing-branch` / `framework-management` (user pre-authorized)
2. ⏸ `user-invocable: false` on `using-skills`
3. ⏸ `context: fork` + `agent:` migration for the 7 dispatch-agent skills
4. ⏸ `!`<command>`` dynamic context injection in `vibe` / `verification` / `release`
5. ⏸ `argument-hint` / `$ARGUMENTS`
6. ⏸ `paths` glob auto-trigger review

---

## Status: DONE

**Status:** DONE

All acceptance criteria met. Two design refinements during BUILD (recorded as taste decisions in execution doc):
1. `${CLAUDE_SKILL_DIR}` kept literal at build time per Anthropic runtime contract (originally planned as build-time substitution; refined when parity testing exposed per-OS path divergence).
2. `framework-management` Supporting Files extracted to its own `reference/supporting-files.md` (originally inlined; refined when body grew to 336 lines and demonstrating the convention-it-teaches felt cleaner).

Both refinements stayed within spec scope and improved on the original plan. v0.6.0 ACTION 1 (golden fixture) closed as part of this sprint per Principle 2 (Boil Lakes).

**Next stage:** auto-advance to RELEASE via `release` skill.
