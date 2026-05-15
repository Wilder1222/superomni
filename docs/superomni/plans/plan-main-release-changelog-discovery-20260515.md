# Implementation Plan: Wire `gen:changelog` Into Release Skill (v0.6.11)

## Overview

Discovery-sync patch: `lib/gen-changelog.js` exists from v0.6.10 but the release skill (which closes sprints) has no pointer to it. Wire the tool into 3 discovery surfaces, add a structural advisory to prevent recurrence, and dogfood the tool against `e819a69` to produce v0.6.11's CHANGELOG entry.

## Prerequisites

- [x] v0.6.10 merged (commit `e819a69` exists locally; tool ready to run)
- [x] On branch `feat/release-changelog-discovery` (off main `5f7d947` + v0.6.10 `e819a69`)
- [x] Spec approved: `docs/superomni/specs/spec-main-release-changelog-discovery-20260515.md`
- [x] All 8 CI gates green at baseline

## Steps

### Step 1: Baseline gate

**What:** Confirm green CI before mutation.
**Files:** none modified.
**How:**
  1. `npm run gen-skills 2>&1 | tail -1`
  2. `npm run verify:skill-docs 2>&1 | tail -3`
  3. `npm run check:workflow-contract`
**Verification:** all exit 0; `Skill docs check passed: 28 generated files, 27 templates`.
**Effort:** S

### Step 2: Update `skills/release/SKILL.md.tmpl` § Changelog

**What:** Insert a 1-line `gen:changelog` hint above the existing manual template at line ~70.
**Files:** `skills/release/SKILL.md.tmpl`
**How:**
  1. Edit before the existing `Update CHANGELOG.md:` block (line 70):
     ```
     Update `CHANGELOG.md`. First scaffold the entry from Conventional Commits in the range `last-tag..HEAD`:

     ```bash
     npm run gen:changelog -- --version <X.Y.Z> > /tmp/changelog-draft.md
     ```

     Paste the draft into `CHANGELOG.md` and complete the *Why this matters*, *Verified*, and *Deferred* subsections manually. Manual fallback template (when the tool is unavailable):

     ```markdown
     [existing 12-line template stays here]
     ```
     ```
**Verification:** `grep -n "gen:changelog" skills/release/SKILL.md.tmpl` returns 1 hit; manual template still present (grep "## \[vX.Y.Z\]").
**Effort:** S

### Step 3: Update `CHANGELOG.md` preamble

**What:** Insert 1-line tool pointer after the "Versioning follows..." line.
**Files:** `CHANGELOG.md`
**How:**
  1. Edit after line `Versioning follows [Semantic Versioning](https://semver.org/).`:
     ```

     **Authoring helper:** run `npm run gen:changelog -- --version <X.Y.Z>` to scaffold a new entry from Conventional Commits in `last-tag..HEAD`.
     ```
**Verification:** `head -10 CHANGELOG.md | grep "gen:changelog"` returns 1 hit.
**Effort:** S

### Step 4: Add 6th advisory to `lib/check-skill-docs.js`

**What:** New advisory: any skill `.tmpl` mentioning `CHANGELOG.md` must also mention `gen:changelog`. Exempt `framework-management`.
**Files:** `lib/check-skill-docs.js`
**How:**
  1. Locate the existing advisory block (after CRLF check, before token-literal check; around line 182).
  2. Insert new advisory loop:
     ```js
     // Advisory: a skill .tmpl that mentions CHANGELOG.md must also mention
     // gen:changelog so the v0.6.10 tool stays wired into discovery. Catches
     // future drift when new skills touch CHANGELOG without the pointer.
     // framework-management is exempted (it teaches the rules abstractly).
     for (const tmpl of templateFiles) {
         const content = fs.readFileSync(tmpl, "utf8");
         const skillName = path.basename(path.dirname(tmpl));
         if (skillName === "framework-management") continue;
         if (/CHANGELOG\.md/.test(content) && !/gen[:-]changelog/.test(content)) {
             advisories.push(
                 `${rel(tmpl)}: mentions CHANGELOG.md without 'gen:changelog' pointer. ` +
                 `Add: \`npm run gen:changelog -- --version <X.Y.Z>\`.`
             );
         }
     }
     ```
**Verification:** `node lib/check-skill-docs.js` exits 0; output contains no new advisories (since Step 2 already satisfies the rule for release skill, and grep shows release is the only non-FM template mentioning CHANGELOG.md).
**Effort:** S

### Step 5: Pre-flight grep — what other skills mention CHANGELOG.md?

**What:** Confirm release is the only non-FM skill mentioning CHANGELOG.md, OR identify others that need the same hint.
**Files:** none modified.
**How:**
  1. `grep -ln "CHANGELOG\.md" skills/*/SKILL.md.tmpl`
  2. Filter out `framework-management/SKILL.md.tmpl`
  3. For each remaining, check if `gen:changelog` is also mentioned. If not, the new advisory will fire — add the hint to that skill (NOT scope creep; necessary to keep the new gate green).
**Verification:** advisory fires zero times when running `node lib/check-skill-docs.js` after Step 4. If extra skills need updating, document them and add the hint.
**Effort:** S
**Risk note:** if N>2 skills need updates, this exceeds patch scope — flag and re-spec rather than absorb silently.

### Step 6: Negative test for new advisory

**What:** Prove the new advisory actually catches drift.
**Files:** none committed (test in working tree only).
**How:**
  1. Save current state: `cp skills/release/SKILL.md.tmpl /tmp/release.tmpl.bak`
  2. Remove the `gen:changelog` hint from release `.tmpl` (sed delete the new line)
  3. Run `npm run gen-skills && node lib/check-skill-docs.js`
  4. Verify advisory fires with message containing `release/SKILL.md.tmpl: mentions CHANGELOG.md without 'gen:changelog' pointer`
  5. Restore: `cp /tmp/release.tmpl.bak skills/release/SKILL.md.tmpl && npm run gen-skills`
  6. Re-run check; advisory must NOT fire.
**Verification:** advisory message captured before restore; absent after restore.
**Effort:** S

### Step 7: Regenerate skill docs + invariant gate

**What:** Run `gen-skills` so `release/SKILL.md` matches the new `.tmpl`.
**Files:** `skills/release/SKILL.md` (auto-regenerated)
**How:**
  1. `npm run gen-skills 2>&1 | tail -1`
  2. `npm run check:skill-docs`
  3. Verify line count delta of `skills/release/SKILL.md` is small (≤ +5 vs HEAD).
**Verification:** processed 27 templates; check passes; `wc -l skills/release/SKILL.md` shows expected delta.
**Effort:** S

### Step 8: Dogfood — generate v0.6.11 CHANGELOG entry

**What:** First real run of `gen:changelog` against the v0.6.10 commit (`e819a69`).
**Files:** none modified yet.
**How:**
  1. `npm run gen:changelog -- --from 5f7d947 --to HEAD --version 0.6.11`
  2. Capture output to a scratch file
  3. Inspect: should produce 1 bullet under Added (`feat: lib/gen-changelog.js …`) referencing `e819a69`
**Verification:** stdout contains `## [0.6.11] — 2026-05-15` + `### Added` section + 1 bullet with `e819a69` hash.
**Effort:** S

### Step 9: Compose CHANGELOG `[0.6.11]` entry

**What:** Use Step 8 output as skeleton; manually add Why/Verified/Deferred subsections.
**Files:** `CHANGELOG.md`
**How:**
  1. Insert new `[0.6.11] — 2026-05-15` entry above `[0.6.10]`
  2. Use the tool-generated `### Added` block as-is (1 bullet referencing `e819a69`)
  3. Add `### Changed` subsection covering the 3 wiring surfaces (release `.tmpl`, CHANGELOG preamble, check-skill-docs advisory)
  4. Add **Why this matters** (~3-4 lines: discovery sync + first dogfood + structural defense)
  5. Add **Verified** subsection (8 CI gates + negative test fired-then-restored + dogfood produced expected output)
  6. Add **Deferred (v0.6.12+ backlog)** preserving v0.6.10 carry-forward (Conventional Commits enforcement P2; lib/ category split P3) + v0.6.3 ACTION 3 P3
**Verification:** `head -100 CHANGELOG.md` shows valid `[0.6.11]` entry with all 5 subsections; preserves `[0.6.10]` entry below.
**Effort:** M

### Step 10: Version bump 0.6.10 → 0.6.11 across 9 surfaces

**What:** Standard 9-surface version sync.
**Files:**
  - `package.json`
  - `.claude-plugin/marketplace.json` (×2 entries inside)
  - `.claude-plugin/plugin.json`
  - `claude-skill.json`
  - `README.md`
  - `docs/COMPARISON.md` (header + footer)
  - `docs/DESIGN.md` (Version + Status)
  - `docs/AGENTS.md` (Last updated)
  - `docs/IMPLEMENTATION.md` (Version + Last updated)
**How:**
  1. Read+Edit `package.json` (only file requiring exact-match Edit)
  2. `sed -i 's/0\.6\.10/0.6.11/g'` for the 8 doc/manifest surfaces (verify each is a clean substitution, no false positives)
  3. `npm run check:plugin-sync` to verify 5 invariants
**Verification:** `grep -rn "0\.6\.10" .claude-plugin/ package.json claude-skill.json README.md docs/*.md | grep -v CHANGELOG | grep -v docs/superomni/` returns 0 lines (CHANGELOG legitimately retains the historical entry).
**Effort:** S

### Step 11: Final regression gate

**What:** Re-run all 8 CI gates + invariant snapshot.
**Files:** none modified.
**How:**
  1. `npm run gen-skills`
  2. `npm run verify:skill-docs`
  3. `npm run check:workflow-contract`
  4. `bash lib/validate-skills.sh` (if available; else `validate-skills.ps1`)
  5. Invariant snapshot:
     ```bash
     echo "skills=$(ls -d skills/*/ | wc -l)"
     echo "agents=$(ls agents/*.md | wc -l)"
     echo "EnterPlanMode=$(grep -c EnterPlanMode CLAUDE.md)"
     echo "flat-ref=$(find skills -maxdepth 2 -name reference.md | wc -l)"
     echo "skill-dir-token=$(grep -rln '\${CLAUDE_SKILL_DIR}' skills/ | wc -l)"
     echo "design-md-library=$(ls skills/frontend-design/reference/design-md-library/ 2>/dev/null | wc -l)"
     echo "markers=$(find docs/superomni/specs -name '.approved-spec-*' | wc -l)"
     wc -l skills/*/SKILL.md | tail -1
     ```
**Verification:** skills=28, agents=5, EnterPlanMode=5, flat-ref=0, skill-dir-token=15, design-md-library=9, markers=0; total skill lines within ≤+5 of pre-sprint (6,247).
**Effort:** S

## Testing Strategy

- **Unit:** none (no new logic except 1 advisory; covered by negative test)
- **Integration:** `npm run gen-skills && npm run verify:skill-docs` end-to-end
- **Manual:** Step 6 negative test (advisory fires when hint removed); Step 8 dogfood (real tool run on real commit)

## Rollback Plan

`git reset --hard 5f7d947` (back to post-PR-50 main) then `git checkout main && git branch -D feat/release-changelog-discovery`.

## Dependencies

- v0.6.10's `lib/gen-changelog.js` (already merged into branch via parent commit)
- Existing 8 CI gates

## Success Criteria

- [ ] release `.tmpl` mentions `gen:changelog` above existing manual template
- [ ] `CHANGELOG.md` preamble has 1-line tool pointer
- [ ] `lib/check-skill-docs.js` has 6th advisory; framework-management exempted
- [ ] Negative test demonstrates advisory fires correctly (Step 6)
- [ ] Dogfood: v0.6.11 CHANGELOG entry composed from real `gen:changelog` output (Step 8-9)
- [ ] All 9 version surfaces at 0.6.11
- [ ] All 8 CI gates green; all global invariants preserved (28/5/5/0/15/9/0/markers=0)
- [ ] Total skill body line delta ≤ +5

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Step 5 finds extra skills mentioning CHANGELOG.md | Low | Spec said scope is patch; if N>2 extra skills need updates, surface to user before absorbing into this sprint |
| Dogfood output structure mismatches expectations | Low | Tool was edge-case-verified in v0.6.10; output format frozen |
| Version sed false-positives on 0.6.10 substring (e.g., 0.6.100) | Very Low | Word-boundary check after sed |
| New advisory pattern `/gen[:-]changelog/` matches incidental text | Very Low | Pattern specific enough; framework-management exempted |

## Status: DONE

Plan written. ≤7 milestones (11 steps grouped: M1=Steps 1-4 wiring, M2=Steps 5-7 invariant + regen, M3=Steps 8-11 dogfood + version + final gate). P0 risks: none. Path: `docs/superomni/plans/plan-main-release-changelog-discovery-20260515.md`.

**Next stage:** REVIEW — invoke `plan-review` skill.
