# Implementation Plan — code-drift-fix + Process Improvements

- **Branch:** `main`
- **Session:** `code-drift-fix`
- **Date:** `20260629`
- **Spec:** `docs/superomni/specs/spec-main-code-drift-fix-20260629.md`
- **Origin:** Completes leftover Next-Sprint items from feishu-doc-align (20260629) vibe flow + lands 3 retrospective Process Improvements.
- **Plan author:** planner-reviewer (planning mode)

## Overview

Three small, atomic, self-contained changes that close the code-drift loop opened by the feishu-doc-align release:

1. **Drift removal (destructive)** — delete the retired `docs/superomni/retros/.gitkeep` + empty dir so disk matches the v0.5.8 code declaration (retrospective lives inside `releases/release-*.md`).
2. **Mirror-disambiguation + authoritative Convention** — one blockquote in `docs/AGENTS.md` to stop the recurring "AGENTS.md is a CLAUDE.md mirror" misjudgement; one new Convention section in `docs/SKILL-DATA-FLOW.md` centralizing the 3 Process Improvements (declaration-precedence, quantitative-claims-pin-scope, forbidden-token-as-drifted-expression) as the single source of truth, with one-line pointers from `brainstorm` + `plan-review` SKILL.md (DRY — pointers reference, never duplicate).
3. **Executable guard** — new Section 3 in `lib/check-workflow-contract.js`: every top-level subdir of `docs/superomni/` must be covered by at least one skill `produces:` declaration, else error (explicit `DECLARATION_ALLOWLIST` exemption for retired-but-kept dirs; initially empty). Promotes "declaration precedence" from doc convention to CI-enforced structural invariant.

Net effect: for top-level subdirs under `docs/superomni/`, the drift class that bit feishu-doc-align becomes mechanically impossible to re-introduce without either a `produces:` declaration or an explicit, commented allowlist entry. (Doc-drift in files OUTSIDE `docs/superomni/` — e.g. `docs/DESIGN.md` — is handled case-by-case in M2.2, not by the guard, which scans `docs/superomni/` only.)

**Scope discipline (YAGNI):** Do NOT touch `bin/audit-repo-invariants` (grep tool, wrong职责; its `--exclude-dir=retros` at line 56 is legitimate and stays), do NOT rewrite `retrospective` wording in other SKILL.md files (correct word, no drift), do NOT touch the `'retro'` back-compat parse at `lib/check-workflow-contract.js:48-49` (intentional, commented).

## Prerequisites

Run **before** Milestone 1. All verifiable in one pass.

> **Environment constraint (verified 20260629):** The C: drive is at 0 bytes free (D: has 649 GB). `npm run <script>` ENOSPC-fails because npm writes to the C: npm-cache. **All node-based commands in this plan MUST be invoked as direct `node lib/<script>.js` entrypoints**, NOT via `npm run`. The generators and checkers all work fine when called directly (verified: `node lib/check-workflow-contract.js`, `node lib/check-plan-content.js`, `node lib/check-skill-docs.js` all exit 0). Wherever this plan says `npm run gen-skills` / `npm run check:*`, the executor substitutes `node lib/gen-skill-docs.js` / `node lib/check-*.js`.

| # | Check | Command | Expected |
|---|-------|---------|----------|
| P1 | Clean working tree (only the untracked spec/plan/review docs from this vibe flow are allowed as pre-existing) | `git status --short` | No staged changes; untracked `spec-main-code-drift-fix-20260629.md` present |
| P2 | `retros/.gitkeep` is the only tracked file under `retros/` | `git ls-files docs/superomni/retros/` | Exactly one line: `docs/superomni/retros/.gitkeep` |
| P3 | `.tmpl` source files exist for BOTH skills — pointers land in `.tmpl` (source of truth), `.md` is regenerated | `ls skills/brainstorm/SKILL.md.tmpl skills/plan-review/SKILL.md.tmpl` | Both exist (VERIFIED: brainstorm tmpl line 22, plan-review tmpl line 111 hold the target headings) |
| P4 | Generator script exists — `.md` is a GENERATED artifact, never hand-edited | `grep -n "gen-skills" package.json` | `"gen-skills": "node lib/gen-skill-docs.js"` (VERIFIED line 24). `lib/gen-skill-docs.js:77` does `fs.writeFileSync(targetFile, output)` — overwrites SKILL.md from .tmpl. `lib/check-skill-docs.js:126` FAILS CI if .md drifts from .tmpl. **Discipline: edit .tmpl only, run `node lib/gen-skill-docs.js <tmpl-path>` to regenerate .md.** |
| P5 | Contract script entrypoint + helpers exist as assumed | `grep -n "docsRoot\|function rel\|skillFrontmatters\|allProducePatterns\|totalErrors" lib/check-workflow-contract.js` | All present (VERIFIED: docsRoot line 9, rel line 39, skillFrontmatters line 117, allProducePatterns line 118, totalErrors line 274) |
| P6 | `node lib/check-workflow-contract.js` currently passes (baseline green) | `node lib/check-workflow-contract.js` | Exit 0, "passed" (VERIFIED 20260629) |
| P7 | Pre-Destructive Gate linter available and passing on this plan | `node lib/check-plan-content.js` | Exit 0, "1 destructive step(s), all preceded by 'careful' step" (VERIFIED 20260629 after step-header colon + How-on-own-line reformat) |

**P0 risk register (explicit):**

- **P0-A — .tmpl / SKILL.md drift.** `skills/brainstorm/SKILL.md.tmpl` and `skills/plan-review/SKILL.md.tmpl` both exist (Prerequisite P3) and `lib/gen-skill-docs.js` GENERATES `SKILL.md` from `.tmpl` (Prerequisite P4 — `fs.writeFileSync` overwrites the `.md`; `lib/check-skill-docs.js:126` fails CI on any `.md`↔`.tmpl` drift). **The `.tmpl` is the single source of truth; the `.md` is a generated artifact that must NEVER be hand-edited.** Hand-editing the `.md` independently of `.tmpl` breaks `check:skill-docs` and risks CRLF advisories (line 174). Mitigation: Milestone 3 edits ONLY the `.tmpl` for each skill, then runs `node lib/gen-skill-docs.js <tmpl-path>` to regenerate the `.md`. M5 verifies the pointer appears in BOTH the `.tmpl` (source) and the regenerated `.md` (proof the generator propagated it) AND that `node lib/check-skill-docs.js` passes. This is non-negotiable.
- **P0-B — Destructive `git rm` without blast-radius gate fails CI.** The Pre-Destructive Gate (CI-enforced via `check:plan-content`) requires the step *immediately before* any `git rm` step to invoke `careful` with explicit blast-radius enumeration. The plan therefore puts a dedicated `careful` pre-assessment step (M1.1) immediately before the delete step (M1.2). The `**How:**` of M1.1 literally contains the keyword `careful`.
- **P0-C — Negative-test cleanup leak.** The M4 negative test creates an un-declared subdir to prove Section 3 fires. If it is not removed, it becomes a permanent CI failure. Mitigation: M4 wraps the test in try/finally and verifies removal with a follow-up `git status`.
- **P0-D — C: drive near-full (ENOSPC) can break node entrypoints mid-run.** C: has <100 MB free (npm wrappers already ENOSPC). Direct `node lib/<script>.js` entrypoints work (verified) but node still writes to `%TEMP%` on C:. Risk: `gen-skill-docs.js` `fs.writeFileSync` (line 77) could ENOSPC mid-write and leave a truncated `.md`, breaking `check-skill-docs` on the next run. Mitigation: before M3, free C: space (`npm cache clean --force` if it ever runs, or delete `C:\Users\ww\AppData\Local\Temp\*` stale files) OR set `npm_config_cache` / `TEMP` / `TMP` to a D: path for this session. If a node command ENOSPCs, STOP — do not retry blindly; free space first. The executor should treat any unexpected node write failure as a P0-D hit, not a code bug.

## Decision Principles Applied

1. **Explicit over implicit** — `DECLARATION_ALLOWLIST` is a visible, commented array, not a hidden convention. AGENTS.md gets a one-line note instead of relying on tribal knowledge.
2. **DRY** — 3 Process Improvements live once in `docs/SKILL-DATA-FLOW.md`; skills get pointers, not copies.
3. **YAGNI** — No new skill/agent, no rewrite of `audit-repo-invariants`, no touching back-compat `'retro'` parse.
4. **Single source of truth** — `produces:` frontmatter is authoritative for "what code declares"; disk is suspect.
5. **Layered thinking** — doc convention (M2/M3) + executable guard (M5) = defense in depth.
6. **Taste decisions surfaced** — none remain; spec records user拍板 on scope, location, strictness. All remaining steps are mechanical.

---

## Milestones (5)

## Milestone 1 — Pre-destructive `careful` assessment + retired-dir deletion

**Goal:** Remove `docs/superomni/retros/.gitkeep` and the empty `retros/` dir, gated by an explicit blast-radius check.

### Step 1.1: `careful` pre-assessment (blast-radius enumeration)

**What:** Run the `careful` skill protocol to enumerate and verify the blast radius of the impending delete *before* executing it.

**Files:** Read-only verification — no edits.

**How:** Invoke the `careful` skill and enumerate the blast radius explicitly:
  - Target file: `docs/superomni/retros/.gitkeep` (the only file in `docs/superomni/retros/`; confirmed by Prerequisite P2: `git ls-files docs/superomni/retros/` returns exactly this one line).
  - Confirm no living code references `retros/` as a produce path: `git grep -n "retros/"`. Expect only (a) audit-trail historical docs under `docs/superomni/` (release/evaluation/etc., legitimate history) and (b) `bin/audit-repo-invariants` line 56 `--exclude-dir=retros` — which is a legitimate exclude-list entry for a grep tool and **MUST NOT be removed**.
  - Confirm the living produce path for retrospective content is `docs/superomni/releases/release-*.md` (per `docs/SKILL-DATA-FLOW.md:33-34` and spec).
  - Confirm `lib/check-workflow-contract.js:48-49` `'retro'` back-compat parse is intentionally retained (parses historical release/retro artifact names) and is out of scope.
  - Record verdict: safe to delete; no living produce path depends on `retros/`.

**Verification:** Blast-radius list written into this step's execution log; `git grep -n "retros/"` output captured. No file changed yet.

**Effort:** 5 min.

### Step 1.2: Delete retired `.gitkeep` + empty dir

**What:** Remove the retired artifact so disk matches the v0.5.8 code declaration.

**Files:** `docs/superomni/retros/.gitkeep` (deleted); `docs/superomni/retros/` (empty dir removed by the `git rm` of its sole tracked occupant).

**How:** Remove the retired file so disk matches the v0.5.8 code declaration.

Run git rm docs/superomni/retros/.gitkeep to stage the deletion of the sole tracked occupant of the retired retros/ dir. On Windows the now-empty `retros/` dir is dropped automatically once its only tracked file is removed; if the empty dir lingers on disk untracked, `rmdir docs/superomni/retros` — but do NOT touch any other path.

**Verification:**
  - `git ls-files docs/superomni/retros/` → empty output.
  - `git status --short` → shows `D docs/superomni/retros/.gitkeep` and nothing else new.

**Effort:** 2 min.

---

## Milestone 2 — `docs/AGENTS.md` mirror-disambiguation blockquote

**Goal:** One blockquote prevents the recurring "AGENTS.md is a CLAUDE.md mirror" misjudgement that bit feishu-doc-align spec phase.

### Step 2.1: Insert blockquote between existing blockquote and `**Last updated:**`

**What:** Add the mirror-disambiguation note at the documented anchor.

**Files:** `docs/AGENTS.md`.

**How:** Between the existing blockquote (line 3) and `**Last updated:** v0.6.11` (line 5), insert exactly:

```
> **Note:** This file is the agent library reference, **not** a mirror of `CLAUDE.md`. `CLAUDE.md` is the sole project configuration; this document describes the available sub-agents.
```

(Blank line before and after, preserving the existing `**Last updated:**` line.)

**Verification:** `grep -n "not.*a mirror of" docs/AGENTS.md` → one match above the `**Last updated:**` line. `**Last updated:** v0.6.11` still present and unchanged.

**Effort:** 2 min.

### Step 2.2: Correct the `docs/DESIGN.md` retros/ drift (same drift class, outside the guard's scope)

**What:** `docs/DESIGN.md:91` (a Decision-5 log entry) still reads "Save reports to `docs/superomni/retros/` (project artifact contract)". This is the same drift class this plan addresses, but it lives OUTSIDE `docs/superomni/`, so the M4 Section 3 guard cannot catch it. Fix it now (boil-the-lake, P2) so the drift class is closed in this docs/ file too.

**Files:** `docs/DESIGN.md`.

**How:** Edit line 91 to reflect the v0.5.8 retirement (the entry is a historical decision log, so annotate rather than delete):

```
- Save reports to `docs/superomni/retros/` (project artifact contract) — NOTE: `retros/` retired in v0.5.8; retrospective content now lives in `docs/superomni/releases/release-*.md`.
```

**Verification:** `grep -n "retired in v0.5.8" docs/DESIGN.md` → 1 match at/near line 91; `grep -n "Save reports to" docs/DESIGN.md` → 1 match, now annotated.

**Effort:** 2 min.

---

## Milestone 3 — Authoritative Convention section + DRY pointers (edit .tmpl, regenerate .md)

**Goal:** Centralize the 3 Process Improvements in `docs/SKILL-DATA-FLOW.md` and add pointer-only references from `brainstorm` + `plan-review` — editing ONLY the `.tmpl` source of truth for each skill and regenerating the `.md` via `node lib/gen-skill-docs.js` (neutralizes P0-A; `.md` is a generated artifact, never hand-edited).

### Step 3.1: Add Convention section to `docs/SKILL-DATA-FLOW.md`

**What:** Insert the single source of truth for the 3 Process Improvements.

**Files:** `docs/SKILL-DATA-FLOW.md`.

**How:** Immediately AFTER the existing `retros/ was removed in v0.5.8` note (lines 33-34) and BEFORE `## Per-Skill Contracts` (line 36), insert a new section titled `## Convention: Declaration Precedence & Doc-Alignment Discipline` containing the 3 items verbatim in spirit:

1. **Declaration precedence** — Produce paths are authoritative from skill frontmatter `produces:`; a disk dir may be retired legacy or not-yet-bootstrapped. Any claim about "what code has" must check 3 sources (disk existence / `produces:` declaration / CHANGELOG retirement record); on conflict, **code declaration wins**.
2. **Quantitative claims pin scope** — Any "N occurrences / X items" claim must pin the grep command + scope on the spot (e.g. "`workflow` is referenced 9 times in `skills/vibe/SKILL.md` = `grep -c workflow skills/vibe/SKILL.md`").
3. **Forbidden-token = drifted expression** — Forbidden-token lists for doc-alignment tasks ban the **drifted expression**, not the bare word (ban "AGENTS.md mirror" not "AGENTS.md"; ban "build-skills byte-identical drift phrasing" not "build-skills"), to avoid collateral damage to legitimate references.

**Verification:** `grep -n "Convention: Declaration Precedence" docs/SKILL-DATA-FLOW.md` → one match, located between the v0.5.8 note and `## Per-Skill Contracts`. All 3 sub-items present (`grep -c "Declaration precedence\|Quantitative claims pin scope\|Forbidden-token = drifted expression"` → 3).

**Effort:** 8 min.

### Step 3.2: Add pointer to `skills/brainstorm/SKILL.md.tmpl` (source of truth), then regenerate `.md`

**What:** One-line pointer under `## Iron Law: Search Before Building` — edit ONLY the `.tmpl` (line 22); the `.md` is regenerated by the generator. Pointer only; do NOT duplicate the 3 items.

**Files:** `skills/brainstorm/SKILL.md.tmpl` (edited); `skills/brainstorm/SKILL.md` (regenerated, NOT hand-edited).

**How:** Directly under the `## Iron Law: Search Before Building` heading in `SKILL.md.tmpl`, add one line:

```
For doc-alignment & declaration-precedence discipline (declaration precedence, quantitative-claim pinning, forbidden-token-as-drifted-expression), see the Convention section in `docs/SKILL-DATA-FLOW.md`.
```

Then run `node lib/gen-skill-docs.js skills/brainstorm/SKILL.md.tmpl` to regenerate `SKILL.md` from the edited `.tmpl` (scoped form avoids touching other skills; `npm run gen-skills` ENOSPC-fails on the full C: drive — see Environment constraint). Do NOT hand-edit `SKILL.md`.

**Verification:** `grep -n "see the Convention section in" skills/brainstorm/SKILL.md.tmpl skills/brainstorm/SKILL.md` → 2 matches (one in source `.tmpl`, one in regenerated `.md` — proves the generator propagated the pointer).

**Effort:** 3 min.

### Step 3.3: Add pointer to `skills/plan-review/SKILL.md.tmpl` (source of truth), then regenerate `.md`

**What:** Same one-line pointer under `## Phase 3: Engineering Review` — edit ONLY the `.tmpl` (line 111); regenerate the `.md`. Engineering review is where fact-grounding happens.

**Files:** `skills/plan-review/SKILL.md.tmpl` (edited); `skills/plan-review/SKILL.md` (regenerated, NOT hand-edited).

**How:** Identical pointer text as Step 3.2, placed directly under the `## Phase 3: Engineering Review` heading in `SKILL.md.tmpl`. Then run `node lib/gen-skill-docs.js skills/plan-review/SKILL.md.tmpl` to regenerate `SKILL.md` (direct node entrypoint — see Environment constraint).

**Verification:** `grep -n "see the Convention section in" skills/plan-review/SKILL.md.tmpl skills/plan-review/SKILL.md` → 2 matches.

**Effort:** 3 min.

---

## Milestone 4 — Implement Section 3 in `lib/check-workflow-contract.js`

**Goal:** Promote "declaration precedence" to a CI-enforced structural invariant: every top-level subdir of `docs/superomni/` must be covered by some skill `produces:` declaration, else error (explicit allowlist exemption).

### Step 4.1: Insert Section 3 after the improvements-loop close (line 255) and before the summary `console.log` (line 257)

**What:** Add the directory-vs-produces coverage check.

**Files:** `lib/check-workflow-contract.js`.

**How:** Insert AFTER the improvements-loop closing brace (line 255 — `for (const file of improvements)` closes here) and BEFORE the summary `console.log(\`Workflow contract check: scanned ...\`)` at line 257. (Do NOT insert after line 241 — that is only the evaluations-loop close; the improvements loop runs lines 243-255 and also pushes into `errors[]`. Inserting at 241 would place Section 3 before the improvements loop and break error-accumulation + console ordering.) Insert a new block:

```js
// ---- Section 3: directory-vs-produces coverage (declaration precedence) ----
// Every top-level subdir of docs/superomni/ must be covered by at least one
// skill's produces: declaration, else it is unaccounted drift.
// Legit legacy dirs not covered by any produces: declaration must be added
// to DECLARATION_ALLOWLIST with a deprecation-version comment. Must be empty
// unless a dir is intentionally retired-but-kept.
const DECLARATION_ALLOWLIST = []; // retros/ removed v0.5.8 → no exemptions needed
const subdirs = fs.readdirSync(docsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
for (const name of subdirs) {
    const prefix = `docs/superomni/${name}/`;
    const covered = allProducePatterns.some(p => p.pattern && p.pattern.startsWith(prefix));
    if (!covered && !DECLARATION_ALLOWLIST.includes(name)) {
        errors.push(`dir docs/superomni/${name}/ is not covered by any skill produces: declaration (add a produces: or add to DECLARATION_ALLOWLIST with deprecation reason)`);
    }
}
console.log(`Section 3: checked ${subdirs.length} top-level subdirs in docs/superomni (allowlist size ${DECLARATION_ALLOWLIST.length}).`);
```

Notes:
- Reuse the existing `allProducePatterns` (built at line 118, entries `{ skill, pattern }`) — do not re-load frontmatters.
- Reuse the existing `errors[]` array and `rel()` helper; `totalErrors` (line 274) already aggregates `errors.length` and drives `process.exit(1)` (line 282), so no exit-code wiring needed.
- The summary `console.log` for Section 3 is placed inline so it reports per-run.
- **Bootstrap workflow contract:** `DECLARATION_ALLOWLIST` starts empty (retros/ is gone). For a NEW artifact type, add the skill's `produces:` declaration BEFORE creating the disk dir — otherwise the guard will (correctly) hard-fail. The allowlist is for retired-but-kept dirs only (add with a deprecation-version comment); it is NOT an escape hatch for new-but-not-yet-declared dirs.

**Verification:**
- `node lib/check-workflow-contract.js` → exit 0, output contains `passed` AND `Section 3: checked N top-level subdirs` (N ≥ 1).
- **Negative test (P0-C cleanup):** create `docs/superomni/__undeclared_test__/` (`mkdir`), re-run `node lib/check-workflow-contract.js` → exit non-zero, error message names the un-declared dir. Then `rmdir docs/superomni/__undeclared_test__` and re-run → exit 0. Confirm `git status --short` shows no leftover untracked dir.

**Effort:** 15 min.

---

## Milestone 5 — Full verification + diff audit

**Goal:** Prove all acceptance criteria from the spec hold and no unintended file changed.

### Step 5.1: Run all verification commands

**What:** Execute the full verification matrix.

**Files:** No edits.

**How:** Run in order (use `node lib/<script>.js` directly — npm wrapper hits the npm-cache on the full C: drive and ENOSPC-fails; the node entrypoints work):

1. `node lib/check-workflow-contract.js` → exit 0, "passed", Section 3 line present.
2. `node lib/check-plan-content.js` → exit 0 (Pre-Destructive Gate satisfied — `careful` keyword present in Step 1.1 preceding the destructive delete in Step 1.2).
3. `node lib/check-skill-docs.js` → exit 0, "Skill docs check passed" (confirms regenerated `.md` matches `.tmpl` source — no drift introduced).
4. `git grep -n "retros/"` → only audit-trail historical docs + `bin/audit-repo-invariants:56` `--exclude-dir=retros` (legitimate); no living produce-path usage.
5. `git ls-files docs/superomni/retros/` → empty.
6. `grep -n "not.*a mirror of" docs/AGENTS.md` → 1 match.
7. `grep -n "Convention: Declaration Precedence" docs/SKILL-DATA-FLOW.md` → 1 match.
8. `grep -rn "see the Convention section in" skills/brainstorm/SKILL.md skills/brainstorm/SKILL.md.tmpl skills/plan-review/SKILL.md skills/plan-review/SKILL.md.tmpl` → 4 matches (2 skills × 2 files: source `.tmpl` + regenerated `.md`).
9. `git diff HEAD --name-only` → exactly:
   - `docs/AGENTS.md`
   - `docs/DESIGN.md`
   - `docs/SKILL-DATA-FLOW.md`
   - `skills/brainstorm/SKILL.md`
   - `skills/brainstorm/SKILL.md.tmpl`
   - `skills/plan-review/SKILL.md`
   - `skills/plan-review/SKILL.md.tmpl`
   - `lib/check-workflow-contract.js`
   - deletion: `docs/superomni/retros/.gitkeep`
   - (plus pre-existing untracked spec/plan/review docs from this vibe flow, which are not part of the diff)
10. `grep -n "retired in v0.5.8" docs/DESIGN.md` → 1 match (M2.2 applied).

**Verification:** All 10 commands produce expected output. Any deviation → stop, debug via `systematic-debugging`, do not mark DONE.

**Effort:** 10 min.

---

## Testing Strategy

- **No unit tests required** — this is a docs + structural-guard change. The contract script IS the test.
- **Primary test:** `node lib/check-workflow-contract.js` exit 0 + "passed" after all edits.
- **Negative test:** M4 Step 4.1 temp-dir insertion proves Section 3 actually fires (not a no-op). Must clean up (P0-C).
- **Regression test:** M5 Step 5.1 #2 confirms `node lib/check-plan-content.js` still green (no script wiring broken).
- **Diff audit:** M5 Step 5.1 #9 is the regression gate — any unexpected file = investigate before DONE.

## Rollback Plan

All changes are tiny and isolated; rollback is trivial and per-milestone:

| Change | Rollback command |
|--------|------------------|
| M1 (retros delete) | `git checkout HEAD -- docs/superomni/retros/.gitkeep` (restores the file; recreate empty dir if needed) |
| M2 (AGENTS.md + DESIGN.md) | `git checkout HEAD -- docs/AGENTS.md docs/DESIGN.md` |
| M3 (SKILL-DATA-FLOW + 2 .tmpl + 2 regenerated .md) | `git checkout HEAD -- docs/SKILL-DATA-FLOW.md skills/brainstorm/SKILL.md.tmpl skills/brainstorm/SKILL.md skills/plan-review/SKILL.md.tmpl skills/plan-review/SKILL.md` (restores .tmpl sources + their generated .md) |
| M4 (contract script) | `git checkout HEAD -- lib/check-workflow-contract.js` |

Nuclear option: `git checkout HEAD -- .` restores everything (none of these changes are load-bearing for runtime — they are docs + a dev-time CI check). No data migration, no schema change, no external dependency. Rollback is safe at any milestone boundary.

## Dependencies

- **None external.** All edits are to in-repo files.
- **Internal ordering:** M1 must complete before M4 verification (Section 3's allowlist is empty *because* retros/ is gone — if retros/ still existed at M4 time it would correctly flag as drift, which is the point, but the plan sequencing keeps the baseline green).
- **CI gate:** `node lib/check-plan-content.js` (Pre-Destructive Gate) must pass — satisfied by Step 1.1's `careful` keyword preceding Step 1.2's `git rm`. `node lib/check-workflow-contract.js` must stay green — satisfied by M4. (Direct node entrypoints; npm wrappers ENOSPC on full C: drive — see Environment constraint.)

## Success Criteria

All of the following must hold at end of M5 (mirrors spec Acceptance Criteria):

**Drift removal**
- [ ] `git ls-files docs/superomni/retros/` empty
- [ ] `git grep -n "retros/"` shows no living produce-path usage (only audit-trail history + `audit-repo-invariants:56` exclude)
- [ ] `docs/AGENTS.md` contains the mirror-disambiguation blockquote
- [ ] `docs/DESIGN.md:91` retros/ reference annotated with v0.5.8 retirement note

**Authoritative source + pointers**
- [ ] `docs/SKILL-DATA-FLOW.md` contains `## Convention: Declaration Precedence & Doc-Alignment Discipline` with all 3 items
- [ ] All 4 skill files (brainstorm + plan-review, each `.tmpl` source + regenerated `.md`) contain the pointer line
- [ ] Pointers reference, do not duplicate, the 3 items (DRY)
- [ ] `node lib/check-skill-docs.js` passes — regenerated `.md` matches `.tmpl` source (no drift)

**Executable guard**
- [ ] `lib/check-workflow-contract.js` has Section 3 with `DECLARATION_ALLOWLIST` (empty, commented)
- [ ] `node lib/check-workflow-contract.js` exits 0 with "passed" + Section 3 summary line
- [ ] Negative test (temp un-declared subdir) triggers non-zero exit; cleanup verified
- [ ] `node lib/check-workflow-contract.js` still green

**Regression**
- [ ] `git diff HEAD --name-only` matches exactly the 8 modified + 1 deleted files listed in M5 #9 (incl. `docs/DESIGN.md`)
- [ ] `node lib/check-plan-content.js` passes (Pre-Destructive Gate satisfied)
- [ ] `node lib/check-skill-docs.js` passes (no `.md`↔`.tmpl` drift from regeneration)

## Notes for the Executor

- **Generator discipline (P0-A):** edit ONLY the `.tmpl`; the `.md` is regenerated by `node lib/gen-skill-docs.js <path-to-tmpl>`. NEVER hand-edit `SKILL.md` — `lib/check-skill-docs.js:126` fails CI on any `.md`↔`.tmpl` drift, and hand-edits risk CRLF advisories. After editing both `.tmpl` files, regenerate each `.md` with the scoped generator, then run `node lib/check-skill-docs.js` to confirm zero drift.
- **Do NOT remove** `bin/audit-repo-invariants` line 56 `--exclude-dir=retros` — it is a legitimate grep-tool exclude for a retired dir, out of scope.
- **Do NOT touch** `lib/check-workflow-contract.js:48-49` `'retro'` back-compat parse — intentionally retained, commented.
- **careful keyword:** M1.1 `**How:**` contains the literal `careful` token; the Pre-Destructive Gate linter greps for it. Do not rephrase it away.
- Status protocol: mark each milestone DONE / DONE_WITH_CONCERNS / BLOCKED. If M4 negative test fails to fire, that is BLOCKED (the guard is a no-op) — do not paper over it.
