# Implementation Plan: Skill Layering — Anthropic Progressive Disclosure (v3)

**Spec:** `docs/superomni/specs/spec-main-skill-layering-anthropic-20260514.md`
**Branch:** `feat/skill-layering-anthropic`  **Session:** `skill-layering-anthropic`  **Date:** 20260514
**Approval marker:** `docs/superomni/specs/.approved-spec-main-skill-layering-anthropic-20260514`

## Overview

Execute the 3-phase skill-layering optimization confirmed in the v3 spec. Phase 1 (extract reference material from 5 long skills into `reference/<topic>.md` subdirectories) ships first. Phase 2 (`${CLAUDE_SKILL_DIR}` substitution support + golden fixture) is gated by Phase 1. Phase 3 (`framework-management` teaching update + advisory linting) is gated by Phase 2.

Single project-wide convention: `skills/<name>/reference/<topic>.md`. No flat `reference.md`. No two-pattern coexistence.

## Prerequisites

- [x] Spec v3 approved (marker present)
- [x] Working branch `feat/skill-layering-anthropic` created
- [x] Main pulled to latest (HEAD = 8b0cf3b Merge PR #48)
- [ ] Baseline snapshot captured (Step 1)

## Scope Completeness Checklist

**What must be built:**
- [ ] `skills/<5-skills>/reference/<topic>.md` files — 9 new reference files in total
- [ ] 5 trimmed `SKILL.md.tmpl` files with link blocks pointing to `reference/<topic>.md`
- [ ] `${CLAUDE_SKILL_DIR}` substitution in `lib/gen-skill-docs.{js,sh,ps1}` + `lib/check-skill-docs.js`
- [ ] Golden fixture `lib/templates/fixture.tmpl` for 3-generator parity
- [ ] `framework-management/SKILL.md.tmpl` "Supporting Files" section
- [ ] `using-skills/SKILL.md` Quick Reference one-line pointer
- [ ] 2 advisory warnings in `lib/check-skill-docs.js`

**What is explicitly out of scope (YAGNI, per spec):**
- 23 skills with body ≤300 lines (untouched)
- `disable-model-invocation` / `user-invocable` / `argument-hint` / `paths` / `model` / `effort` fields
- `context: fork` + `agent:` migration
- `!`<command>`` dynamic context injection
- `frontend-design/reference/design-md-library/*` (already cohesive)
- `frontend-design`'s 9 sibling design-principle markdown files (already follow the pattern)

## Steps

### Step 1: Baseline snapshot

**What:** Capture current `wc -l` of all 28 SKILL.md files for delta computation. Confirm green CI.
**Files:** `/tmp/skill-layering-baseline.txt`
**How:**
  1. `wc -l skills/*/SKILL.md | tee /tmp/skill-layering-baseline.txt` — confirm total 6,793.
  2. `npm run verify:skill-docs` — confirm 0.
  3. `npm run check:workflow-contract` — confirm 0.
  4. Record baseline in `docs/superomni/executions/execution-main-skill-layering-anthropic-20260514.md`.
**Verification:** Baseline file exists with 28 rows totaling 6,793. CI green.
**Effort:** S

### Step 2: Extract `self-improvement` reference material

**What:** Move Phases 1–7 reporting templates into `reference/phase-templates.md`. Body should drop to ≤280 lines.
**Files:** `skills/self-improvement/reference/phase-templates.md` (new), `skills/self-improvement/SKILL.md.tmpl`
**How:**
  1. `mkdir skills/self-improvement/reference`
  2. Locate the lines spanning the Phase 1-7 reporting templates (Markdown headers `## Tacit Gaps (Phase 0)`, `## Session Evidence (Phase 1)`, etc. — see SKILL.md inspection in audit).
  3. Move that contiguous block verbatim into `skills/self-improvement/reference/phase-templates.md`. Add a top-of-file `<!-- ... -->` comment naming the source skill.
  4. Replace the moved block in `SKILL.md.tmpl` with:
     ```
     **Reference:** see [reference/phase-templates.md](reference/phase-templates.md) for full Phase 0–7 reporting templates.
     ```
  5. `npm run gen-skills && npm run verify:skill-docs`.
**Verification:** `wc -l skills/self-improvement/SKILL.md` ≤ 280. `ls skills/self-improvement/reference/phase-templates.md` exists. CI green.
**Effort:** M

### Step 3: Extract `vibe` reference material

**What:** Move Phase 1 stage-detection bash + stage dispatch brief table into `reference/stage-detection.md` and `reference/dispatch-brief.md`.
**Files:** `skills/vibe/reference/stage-detection.md` (new), `skills/vibe/reference/dispatch-brief.md` (new), `skills/vibe/SKILL.md.tmpl`
**How:**
  1. `mkdir skills/vibe/reference`
  2. Move the Phase 1 bash block (lines starting with `_SESSION_TS=...` through stage-detection helpers) into `reference/stage-detection.md`.
  3. Move the stage-dispatch brief table (the `| Stage | Skill | Agents | Output artifact |` table) into `reference/dispatch-brief.md`.
  4. Replace each moved block with a 1-line link block pointing to its `reference/<topic>.md`.
  5. `npm run gen-skills && npm run verify:skill-docs`.
**Verification:** `wc -l skills/vibe/SKILL.md` ≤ 280. Both reference files exist and contain the moved content verbatim. CI green.
**Effort:** M

### Step 4: Extract `subagent-development` reference material

**What:** Move Wave Planning + Consensus Protocol + Report Templates sections into 3 reference files.
**Files:** `skills/subagent-development/reference/wave-planning.md` (new), `skills/subagent-development/reference/consensus-protocol.md` (new), `skills/subagent-development/reference/report-templates.md` (new), `skills/subagent-development/SKILL.md.tmpl`
**How:**
  1. `mkdir skills/subagent-development/reference`
  2. Move each named section (per its existing `## Wave Planning for Large Task Sets`, `## Consensus Protocol (Optional)`, and the report-template blocks `## Save Sub-Agent Session Document` + `## Agents Dispatched` + `## Wave Summary` + `## Integration Summary`) into the corresponding reference file.
  3. Replace each moved block with a 1-line link block.
  4. `npm run gen-skills && npm run verify:skill-docs`.
**Verification:** `wc -l skills/subagent-development/SKILL.md` ≤ 280. All 3 reference files exist. CI green.
**Effort:** M

### Step 5: Extract `frontend-design` reference material

**What:** Move Phase 5 Quality Gate scoring rubric and Phase 3 reference-loading checklist into 2 reference files. **Do not touch** the existing 9 design-principle siblings or `design-md-library/`.
**Files:** `skills/frontend-design/reference/quality-gate.md` (new), `skills/frontend-design/reference/reference-loading.md` (new), `skills/frontend-design/SKILL.md.tmpl`
**How:**
  1. `reference/` directory already exists. New files coexist alongside `color-and-contrast.md` etc.
  2. Move the Phase 5 (Quality Gate) section verbatim into `reference/quality-gate.md`.
  3. Move the Phase 3 (Reference Loading) checklist into `reference/reference-loading.md`.
  4. Replace moved blocks with 1-line link blocks.
  5. `npm run gen-skills && npm run verify:skill-docs`.
**Verification:** `wc -l skills/frontend-design/SKILL.md` ≤ 280. Both new files present. **Existing** 9 design-principle siblings + `design-md-library/` unchanged (`git status -s skills/frontend-design/reference/` shows only the 2 new files). CI green.
**Effort:** M

### Step 6: Extract `test-driven-development` reference material

**What:** Move Red/Green/Refactor templates and Anti-Patterns table into 2 reference files.
**Files:** `skills/test-driven-development/reference/red-green-refactor.md` (new), `skills/test-driven-development/reference/anti-patterns.md` (new), `skills/test-driven-development/SKILL.md.tmpl`
**How:**
  1. `mkdir skills/test-driven-development/reference`
  2. Move Phases 1–3 (Red, Green, Refactor) full templates into `red-green-refactor.md`.
  3. Move the `## Anti-Patterns to Avoid` section into `anti-patterns.md`.
  4. Replace with 1-line link blocks.
  5. `npm run gen-skills && npm run verify:skill-docs`.
**Verification:** `wc -l skills/test-driven-development/SKILL.md` ≤ 280. Both reference files exist. CI green.
**Effort:** M

### Step 6.5: Phase 1 gate

**What:** Verify all Phase 1 acceptance criteria pass; STOP if any fail.
**Files:** `docs/superomni/executions/execution-main-skill-layering-anthropic-20260514.md` (append)
**How:**
  1. `wc -l skills/*/SKILL.md` — all 5 trimmed ≤ 280.
  2. Total line drop: baseline 6,793 minus current ≥ 600 → current ≤ 6,180.
  3. `find skills/*/reference -type d` — at least 5 (4 new + 1 existing).
  4. `find skills -name reference.md` — empty (no flat files).
  5. Content-loss check (per AC): for each of 5 skills, `cat SKILL.md reference/*.md > /tmp/<skill>-merged.md` and confirm union covers all original headers from baseline (header-count diff ≤ 0).
  6. `npm run gen-skills && npm run verify:skill-docs && npm run check:workflow-contract` all exit 0.
  7. Record results in execution doc.
**Verification:** All Phase 1 ACs PASS; record green checkmarks.
**Effort:** S

### Step 7: User gate — pause for Phase 1 review

**What:** STOP. User-validated checkpoint before Phase 2 (per v0.6.0 retro action: phase-gate-then-pause worked well; keep as first-class shape).
**Files:** None.
**How:** Print Phase 1 summary (per-skill line counts before/after, total drop, files added). Wait for user "Phase 2 go".
**Verification:** User acknowledges.
**Effort:** S

### Step 8: Add `${CLAUDE_SKILL_DIR}` to `lib/gen-skill-docs.js`

**What:** Recognize and expand `${CLAUDE_SKILL_DIR}` to the absolute path of the skill directory containing the current `SKILL.md.tmpl`.
**Files:** `lib/gen-skill-docs.js`
**How:**
  1. In the per-template loop, compute `skillDir = path.resolve(path.dirname(tmplPath))`.
  2. Replace `${CLAUDE_SKILL_DIR}` with `skillDir` in the template body before token expansion.
  3. Maintain Windows/POSIX path normalization (forward-slashes for output portability — match what the existing generator uses).
**Verification:** Run on `vibe/SKILL.md.tmpl` (which references `${CLAUDE_SKILL_DIR}/reference/stage-detection.md` after Step 3 if Step 8.5 has happened — otherwise we add a synthetic test); output contains absolute path.
**Effort:** S

### Step 9: Add `${CLAUDE_SKILL_DIR}` to `lib/gen-skill-docs.sh` and `.ps1`

**What:** Mirror Step 8 in the bash and PowerShell generators. Critical: byte-identical output across all three.
**Files:** `lib/gen-skill-docs.sh`, `lib/gen-skill-docs.ps1`
**How:**
  1. In `gen-skill-docs.sh`, compute `skill_dir=$(cd "$(dirname "$tmpl")" && pwd)` and `sed`/`awk` replace `${CLAUDE_SKILL_DIR}` with the absolute path.
  2. In `gen-skill-docs.ps1`, use `$skillDir = (Resolve-Path (Split-Path $tmpl)).Path` and `-replace` for substitution.
  3. Normalize separators: PowerShell defaults to backslashes on Windows — convert to forward-slashes to match js/sh.
**Verification:** Step 11 (golden fixture) confirms parity.
**Effort:** M

### Step 10: Add `${CLAUDE_SKILL_DIR}` to `lib/check-skill-docs.js`

**What:** Drift-checker must perform the same substitution; otherwise it reports false drift on every migrated tmpl.
**Files:** `lib/check-skill-docs.js`
**How:** Mirror Step 8's `skillDir` computation and substitution in the expected-output assembly path.
**Verification:** After Steps 12–13 migrate the 5 skills' tmpls to use `${CLAUDE_SKILL_DIR}`, `npm run check:skill-docs` exits 0.
**Effort:** S

### Step 11: Add 3-generator golden fixture (carry-forward of v0.6.0 ACTION 1)

**What:** A minimal `.tmpl` exercising both `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}` + `${CLAUDE_SKILL_DIR}` and an inline frontmatter `description` containing `:`. All 3 generators must produce byte-identical output.
**Files:** `lib/templates/fixture.tmpl` (new), `lib/templates/fixture.expected.md` (new), `package.json` (extend `verify:skill-docs` script)
**How:**
  1. Author `lib/templates/fixture.tmpl` containing all 3 tokens + a `description: "demo: text with colon"` frontmatter line.
  2. Run js generator on it once; commit output as `fixture.expected.md`.
  3. Add npm script `verify:fixture-parity` that runs all 3 generators against `fixture.tmpl` (to a tmpdir), `sha256sum`s outputs, and fails on any diff vs `fixture.expected.md`.
  4. Wire `verify:fixture-parity` into `verify:skill-docs`.
**Verification:** `npm run verify:fixture-parity` exits 0 with all 3 hashes matching.
**Effort:** M

### Step 12: Migrate 5 trimmed skills' link blocks to `${CLAUDE_SKILL_DIR}` form

**What:** Update the link blocks added in Steps 2–6 to use `${CLAUDE_SKILL_DIR}/reference/<topic>.md` (still absolute when generated; relative when authored is also valid since markdown links work both ways).
**Files:** `skills/{self-improvement,vibe,subagent-development,frontend-design,test-driven-development}/SKILL.md.tmpl`
**How:** For each, replace `[reference/<topic>.md](reference/<topic>.md)` with `[reference/<topic>.md](${CLAUDE_SKILL_DIR}/reference/<topic>.md)`. Markdown rendering still resolves; the `${CLAUDE_SKILL_DIR}` form lets future plugin distribution work.

**Note:** if `${CLAUDE_SKILL_DIR}` substitution makes the visible link in markdown ugly (rendered as an absolute filesystem path), revert the visible link text to relative and only use the substitution in the *URL*. Final form:
```
**Reference:** see [reference/<topic>.md](${CLAUDE_SKILL_DIR}/reference/<topic>.md) for [topic].
```

**Verification:** `grep -c '${CLAUDE_SKILL_DIR}' skills/*/SKILL.md.tmpl` ≥ 9 across the 5 modified files. After `npm run gen-skills`, the generated `SKILL.md` files contain absolute paths.
**Effort:** S

### Step 13: Phase 2 gate

**What:** Verify Phase 2 ACs.
**Files:** Execution doc (append).
**How:**
  1. `npm run verify:fixture-parity` — exit 0.
  2. `npm run check:skill-docs` — exit 0 with no drift on the 5 migrated skills.
  3. `grep -l '${CLAUDE_SKILL_DIR}' skills/*/SKILL.md | wc -l` ≥ 5.
  4. `npm run gen-skills && npm run verify:skill-docs && npm run check:workflow-contract` — all 0.
**Verification:** All Phase 2 ACs PASS.
**Effort:** S

### Step 14: Add advisory warning #1 — overflow without `reference/`

**What:** `lib/check-skill-docs.js` warns (stderr; exit 0) when a `SKILL.md.tmpl` ≥ 300 lines and the skill directory has no `reference/` subdirectory.
**Files:** `lib/check-skill-docs.js`
**How:**
  1. After existing checks pass, scan each `SKILL.md.tmpl` line count.
  2. If ≥ 300 and `fs.existsSync(path.join(dir, 'reference'))` is false, emit:
     ```
     [advisory] skills/<name>/SKILL.md.tmpl is <N> lines without a reference/ subdir. Consider extracting per https://docs/anthropic… progressive disclosure.
     ```
  3. Do NOT fail. Exit 0 unless an existing hard check fails.
**Verification:** Add a temporary `tests/fixtures/oversize-without-ref.tmpl` of 350 lines in a fixture skill dir; run check; observe warning on stderr. Remove fixture.
**Effort:** S

### Step 15: Add advisory warning #2 — flat `reference.md`

**What:** Warn (stderr; exit 0) when any `skills/<name>/reference.md` file exists at the skill root.
**Files:** `lib/check-skill-docs.js`
**How:**
  1. `glob` for `skills/*/reference.md` (NOT inside `reference/`).
  2. For each match, emit:
     ```
     [advisory] skills/<name>/reference.md is flat. Project convention is reference/<topic>.md. See framework-management.
     ```
  3. Do NOT fail.
**Verification:** Touch a temporary `skills/<test>/reference.md`; run check; observe warning. Remove file.
**Effort:** S

### Step 16: Update `framework-management/SKILL.md.tmpl` Supporting Files section

**What:** Add a ≥30-line "Supporting Files" section teaching the `skills/<name>/reference/<topic>.md` convention as the **single project-wide rule**.
**Files:** `skills/framework-management/SKILL.md.tmpl`
**How:**
  1. Insert a new `## Supporting Files (Reference / Examples / Scripts)` section after the existing scaffold-teaching section.
  2. Document:
     - Single rule: `skills/<name>/reference/<topic>.md` (subdirectory always; flat `reference.md` is non-conforming).
     - When to use `examples/`: code/markdown samples Claude reads for shape.
     - When to use `scripts/`: executable code Claude runs (not loaded as text).
     - When to use `${CLAUDE_SKILL_DIR}`: in-skill cross-file links for plugin-portability.
     - Cite the 5 Phase-1 skills with their actual reference file lists as canonical examples.
  3. Add a snippet showing the link-block form authors should use.
  4. Confirm the resulting `framework-management/SKILL.md` is still ≤500 lines (pre-Step total was 282; +30 = 312, safe).
**Verification:** `grep -c "Supporting Files" skills/framework-management/SKILL.md` ≥ 1. Section length ≥ 30 lines. `wc -l` ≤ 500.
**Effort:** M

### Step 17: Update `using-skills/SKILL.md` Quick Reference

**What:** One-line pointer to the new framework-management Supporting Files section.
**Files:** `skills/using-skills/SKILL.md` (this file is direct, not generated from `.tmpl` — confirmed in the v0.6.0 plan)
**How:**
  1. In the Quick Reference table, add a row:
     ```
     | Authoring reference material for a skill | `framework-management` (see Supporting Files) |
     ```
  2. Or add a one-line callout in the existing "Document Output Convention" section pointing to the framework-management Supporting Files.
**Verification:** `grep -c "Supporting Files" skills/using-skills/SKILL.md` ≥ 1.
**Effort:** S

### Step 18: Phase 3 gate + global regression gate

**What:** Final verification before commit and PR.
**Files:** Execution doc (final checklist).
**How:**
  1. `npm run check:skill-docs && npm run validate-skills && npm run check:workflow-contract && npm run verify:fixture-parity` — all exit 0.
  2. `find skills -name reference.md -not -path '*/reference/*'` — empty.
  3. `find skills/*/reference -type d` — at least 5.
  4. `wc -l skills/*/SKILL.md | tail -1` — total ≤ 6,180.
  5. `grep -c "EnterPlanMode" CLAUDE.md` — must still be ≥ 5 (regression).
  6. `ls skills/frontend-design/reference/design-md-library/ | wc -l` — must still be 8 (regression).
  7. `ls skills/frontend-design/reference/*.md | wc -l` — was 9 before; now ≥ 11 (9 + quality-gate + reference-loading).
  8. Skill count: `ls -d skills/*/ | wc -l` = 28 unchanged.
  9. Agent count: `ls agents/*.md | wc -l` = 5 unchanged.
  10. Frontmatter completeness regression: every `SKILL.md` still has `name`, `description`, `when_to_use`, `produces`, `consumes` (where applicable).
**Verification:** All gates PASS.
**Effort:** S

### Step 19: Commit, write execution doc, open PR

**What:** Close the sprint.
**Files:** `docs/superomni/executions/execution-main-skill-layering-anthropic-20260514.md` (final state), git commit + push, PR.
**How:**
  1. Stage all changes; commit with message `feat: skill layering — extract reference/<topic>.md from 5 long skills + ${CLAUDE_SKILL_DIR} substitution + framework-management teaching`.
  2. Push branch; open PR against `main`.
  3. Update execution doc with final commit SHA + PR URL.
**Verification:** PR exists; CI green.
**Effort:** S

## Testing Strategy

- **Per-skill content union check** (Step 6.5): for each of 5 skills, concatenate new `SKILL.md` + every `reference/*.md` and confirm header coverage matches the baseline `SKILL.md` header set.
- **Generator parity** (Step 11): 3-generator golden fixture with `sha256sum` triple-equality.
- **CI integration** (Steps 6.5, 13, 18): `gen-skills` + `verify:skill-docs` + `validate-skills` + `check:workflow-contract` + `verify:fixture-parity` all green at every gate.
- **Advisory warnings demonstrable** (Steps 14, 15): adding a temporary fixture must trigger the new warning.
- **Regression** (Step 18): 11 explicit invariants (skill count, agent count, EnterPlanMode rule, design-md-library count, design-principle siblings count, etc.).

## Rollback Plan

- Each phase is a tight commit set:
  - **Phase 1** (Steps 2–6): `git revert <commits>`; reference dirs disappear; SKILL.md bodies restored to baseline.
  - **Phase 2** (Steps 8–12): revert generator + checker changes; `${CLAUDE_SKILL_DIR}` form falls back to literal text in generated output (broken links — but fixable in 1 commit).
  - **Phase 3** (Steps 14–17): revert advisory warnings + framework-management section.
- Hard escape: `git reset --hard main` on `feat/skill-layering-anthropic`.

## Dependencies

- No new external libraries.
- `js-yaml` already a devDependency (added in v0.6.0).
- No services, no network, no runtime hot path.

## Design Direction (if UI work)

N/A — no UI work.

## Success Criteria

- [ ] **Phase 1 AC** (per spec § Phase 1): 5 SKILL.md ≤ 280 lines, ≥ 9 reference files added, total drop ≥ 600 lines, no flat `reference.md` files, no content lost.
- [ ] **Phase 2 AC** (per spec § Phase 2): `${CLAUDE_SKILL_DIR}` recognized in all 3 generators + checker; golden fixture `sha256sum` parity; no false drift on 5 migrated skills.
- [ ] **Phase 3 AC** (per spec § Phase 3): `framework-management` Supporting Files section ≥ 30 lines; `using-skills` pointer added; 2 advisory warnings working.
- [ ] **Global regression** (per spec § Global): 28 skills + 5 agents intact; EnterPlanMode rule preserved; design-md-library + design-principle siblings unchanged; all CI green; PR opened.

## Deferred to v4 Backlog

(All carried forward from spec):
1. `disable-model-invocation: true` on `release` / `finishing-branch` / `framework-management` (user pre-authorized)
2. `user-invocable: false` on `using-skills`
3. `context: fork` + `agent:` migration for the 7 dispatch-agent skills
4. `!`<command>`` dynamic context injection in `vibe` / `verification` / `release`
5. `argument-hint` / `$ARGUMENTS`
6. `paths` glob auto-trigger review

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Content lost during extraction (a paragraph dropped between SKILL.md and reference file) | M | H | Step 6.5 union-coverage check; verbatim move only |
| Generator parity break (sh/ps1 diverge from js on `${CLAUDE_SKILL_DIR}` substitution) | M | M | Step 11 golden fixture with `sha256sum` |
| Advisory warnings false-positive on the 5 trimmed skills (logic bug) | L | L | Step 14/15 fixtures verify only intended cases trigger |
| `framework-management` body grows past 500 | L | L | Step 16 explicit `wc -l` check (pre = 282, +30 = 312) |
| User confused by spec convention later (single-topic skill still requires subdirectory) | M | L | Spec § Non-Goals + framework-management § Supporting Files document the rule explicitly |
| `frontend-design` accidental damage to existing `reference/` siblings | L | H | Step 5 `git status -s` regression check; Step 18 explicit `ls` count |

## Milestones (≤ 7, per writing-plans Iron Law)

1. **M1 — Baseline + scope locked** (Step 1)
2. **M2 — Phase 1 complete: 5 skills trimmed, 9 reference files added** (Steps 2–6.5)
3. **M3 — Phase 1 user gate** (Step 7)
4. **M4 — Phase 2 complete: ${CLAUDE_SKILL_DIR} live + golden fixture** (Steps 8–13)
5. **M5 — Phase 3 complete: framework-management teaching + 2 advisory warnings** (Steps 14–17)
6. **M6 — Final regression gate green** (Step 18)
7. **M7 — Sprint shipped: commit + PR + execution doc** (Step 19)

P0 risks: **none**. Highest-impact risk (content loss) is L×H mitigated to negligible by verbatim-move + union-coverage check at Step 6.5.

## Next Stage

On approval → auto-advance to **REVIEW** via `plan-review`, producing `review-main-skill-layering-anthropic-20260514.md` with all decisions auto-resolved.
