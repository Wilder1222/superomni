# Release v0.6.11 — Wire `gen:changelog` Into Release Skill

**Branch:** `feat/release-changelog-discovery` (off main `5f7d947` + v0.6.10 `e819a69`)
**Session:** `release-changelog-discovery`  **Date:** 2026-05-15

Pipeline artifacts under `docs/superomni/<kind>/<kind>-main-release-changelog-discovery-20260515.md`:
- spec / plan / review (plan-review) / execution / review (code-review) / qa / evaluation / release

---

## Release

### Headline

Discovery-sync patch that closes the v0.6.10 → v0.6.11 ship-then-wire pattern. v0.6.10 shipped `lib/gen-changelog.js`; this sprint wires it into the 3 skills that touch CHANGELOG (`release`, `document-release`) + the CHANGELOG.md preamble + adds a 5th advisory in `check-skill-docs.js` to prevent the staleness from recurring. **First real-world dogfood** of the tool: produced v0.6.11's own `### Added` bullet from `e819a69`.

Per user directive (continuing from v0.6.10): patch cadence respected. v0.7.0 reserved for architectural minor.

### Numbers

| Metric | Value |
|---|---|
| Discovery surfaces wired | 3 (`release` skill, `document-release` skill, `CHANGELOG.md` preamble) |
| New CI advisory | 1 (5 advisories total now in `check-skill-docs.js`) |
| Files changed | 17 (94 insertions / 18 deletions) |
| Plan steps | 13 (11 planned + 2 review-amendment inserts: E1+E2) |
| In-flight VERIFY fixes | 4 (2 in code-review, 1 in QA, 1 in verification) |
| Edge cases verified | 6 (regex pattern + dogfood non-Conventional + dogfood empty range + 2 advisory fence-edge) |
| Skill body lines delta | +8 (release +6, document-release +2; budget was ≤+5; documented overage) |
| Skills / agents counts | 28 / 5 (unchanged) |

### Pre-PR Checklist

- [x] All 8 CI gates locally green (gen-skills, check:skill-docs, verify:fixture-parity, test:generators, check:plugin-sync 5-invariants, check:plan-content, check:workflow-contract, validate-skills.sh)
- [x] Negative test for new advisory: fired-then-cleared cycle (Step 6 of execution)
- [x] Dogfood: `gen:changelog --from 5f7d947 --to HEAD --version 0.6.11` produced 1 bullet for `e819a69`
- [x] All global invariants preserved (28/5/5/0/15/9/0/markers=0)
- [x] Both REVIEW amendments correctly applied (E1: document-release wiring; E2: IMPLEMENTATION.md strikethrough)
- [x] All 4 in-flight VERIFY fixes captured transparently (P0 IMPLEMENTATION.md version revert, P1 CRLF fix, P2 framework-management count "Two"→"Five", P2 verification correction "Six"→"Five")
- [x] Version 0.6.11 across 5 manifests + README + 4 docs + CHANGELOG entry
- [x] CHANGELOG entry uses tool-output format (Added/Changed) + manual subsections (Why / Verified / Architectural notes / Deferred)

### Open PR (pending user approval)

Target: `main`. Title: `feat: wire gen:changelog into release+document-release skills, add 5th check-skill-docs advisory (v0.6.11)`.

Per `careful` skill: artifact written; commit + push + PR await user approval signal.

### Rollback Plan

If post-merge problems surface:
- Revert via `git revert <commit-sha>` on main, ship as v0.6.12 fix.
- Tool itself is stdout-only (no destructive ops); rollback risk is purely textual.
- Worst case: roll back the new advisory by deleting the 13-line block at `lib/check-skill-docs.js:184-196`; existing 4 advisories continue to function.

---

## Retrospective

### Scoring

**Agent total: 13/15**

- Scope management (5/5) — Patch held tight; both review amendments expanded scope ≤+5 LOC. QA's adjacent-issue fix (framework-management advisory count staleness) was justified P2 boil-lakes.
- Instruction following (5/5) — Completed all 13 steps; both REVIEW amendments correctly applied; user's directives (patch cadence, no push without approval) respected.
- Escalation behavior (3/5) — **Two correctness misses caught in VERIFY**: (1) sed pass bumped historical "v0.6.10" reference in IMPLEMENTATION.md strikethrough to "v0.6.11" — should have anticipated this; (2) QA's "Six" advisory count overcounted because deprecated-phrase scan uses `errors.push` not `advisories.push` — sloppy enumeration. Both fixed in same VERIFY phase but should have been caught in BUILD or QA first pass.

### Skill effectiveness avg: 4.7/5

- `brainstorm` — 5/5 (audit identified 3 candidates; A chosen for staleness-fix value)
- `writing-plans` — 5/5 (11 steps with risks table; explicit Step 5 contingency)
- `plan-review` — 5/5 (caught 2 amendments; pre-flight grep was decisive)
- `executing-plans` — 4/5 (correct execution but the sed-after-strikethrough collision was preventable by reordering Steps 9b and 10)
- `code-review` — 5/5 (caught both V0/V1 issues immediately; deep regex edge case testing)
- `qa` — 4/5 (good edge case exploration but advisory-count fix was numerically wrong; required verification correction)
- `verification` — 5/5 (caught and fixed QA's overcorrection)

### Iron Law compliance: 100%

- Spec approval before plan ✓
- Plan review before build ✓ (caught 2 amendments)
- Status protocol on every artifact ✓
- 6 Decision Principles applied ✓
- Patch cadence respected ✓ (per user directive: v0.6.11 not v0.7.0)
- No push without explicit approval (`careful` skill protocol respected)
- EnterPlanMode → brainstorm routing ✓

### Process insights

1. **Sed-after-content-edit collision**: Step 9b (manual strikethrough adding `v0.6.10` reference) ran BEFORE Step 10 (sed `0.6.10 → 0.6.11`), so the manual edit got bumped. Should have either: (a) used a sed pattern that excluded the strikethrough line, or (b) reordered: sed first, then manual edits. **Carry-forward to writing-plans skill: when manual edits add historical version refs that match the current sed target, run sed first and add manual edits after.**

2. **Numeric statements about code structure should be auto-counted, not asserted**: QA's "Six advisory warnings" was wrong because it conflated `advisories.push` (5 sites) with `errors.push` (1 site). Easy mistake; expensive to catch (required full verification re-pass). **Carry-forward: when a SKILL.md.tmpl includes a numeric assertion about lib/ code structure, write the count as `!grep -c "advisories\.push" lib/check-skill-docs.js` dynamic-context style** — this lands cleanly with v0.6.0's `!`<command>`` runtime resolution.

3. **The 60% mechanical / 40% synthesis pattern proved out at v0.6.11**: dogfood produced the `### Added` bullet (mechanical 60%); human wrote Why/Verified/Architectural-notes/Deferred (synthesis 40%). Validates the v0.6.10 design choice. Pattern is now repeatable at every future sprint.

4. **The ship-then-wire pattern is now the canonical 2-sprint sequence for new authoring helpers**: v0.6.10 ships the tool; v0.6.11 wires it into discovery + structural defense via advisory. Document this in framework-management when v0.6.12+ has occasion.

5. **Pre-flight grep in plan-review saved a CI break**: REVIEW E1 (insert Step 2b for document-release) was based on grep. Without it, BUILD's first regen would have fired the new advisory immediately on document-release. **Iron Law candidate**: when adding a new advisory, the plan-review phase MUST run a pre-flight grep to confirm 0 templates currently violate the rule.

6. **Code-fence-aware regex is harder than it looks**: the new advisory does not respect code-fence boundaries (unlike the token-literal advisory at line 220+). Currently inactive but a real latent issue. Pattern: when a future advisory could fire on prose-only mentions, port the inFence state-machine from the token-literal advisory.

### Actions for next sprint

#### ACTION 1 (P2, new from this sprint): Conventional Commits enforcement

Carry-forward from v0.6.10 + v0.6.11 retros. Now that 2 sprints depend on `gen:changelog` being able to parse commits, malformed commits become a real problem (commits go to "Other" requiring manual fix-up). Options:
- husky `commit-msg` hook validating subject format
- Advisory in `check-skill-docs.js` scanning recent commits for non-Conventional subjects
- New script `lib/check-conventional-commits.js` runnable in CI

**Owner:** v0.6.12  **Success criterion:** non-Conventional commit either fails pre-commit OR generates an advisory at CI time.

#### ACTION 2 (P2 latent, new from this sprint): Code-fence-aware advisory pattern

The new advisory `(/CHANGELOG\.md/.test(c) && !/gen[:-]changelog/.test(c))` doesn't respect code fences. Currently inactive, but the moment a `.tmpl` adds an unrelated bash example mentioning `CHANGELOG.md` (e.g., a `find . -name "CHANGELOG.md"` snippet), the advisory will fire falsely. Solution: copy the inFence state-machine from line 209 (token-literal advisory) and apply same protection.

**Owner:** v0.6.12 (or fix-on-fire when first observed)  **Success criterion:** advisory ignores `.tmpl` content inside ```` ``` ```` fences and `` ` ` `` inline-backticks.

#### ACTION 3 (P3, carry-forward from v0.6.10): lib/ category split documentation

`framework-management` should explicitly document: `check-*.js` / `verify-*.js` / `test-*.js` = CI gates (in `verify:skill-docs` umbrella); `gen-*.js` = authoring helpers (NOT in umbrella).

**Owner:** future v0.6.x  **Success criterion:** framework-management has the category-split note.

#### ACTION 4 (P3, carry-forward from v0.6.3): audit-repo-invariants exclude list

Hard-coded exclude list works; making it config-driven is P3 polish.

**Owner:** future v0.6.x  **Success criterion:** `bin/audit-repo-invariants` reads exclude patterns from a JSON/YAML config rather than hard-coded array.

#### ACTION 5 (P3, lessons learned this sprint): plan-step ordering rule

Document in `writing-plans` skill: when a plan has both a manual edit that mentions a current version AND a sed-replace bumping that version, sed must run FIRST or the sed pattern must explicitly exclude the manual-edit line.

**Owner:** future v0.6.x docs sprint  **Success criterion:** writing-plans § Phase 4 (6 Decision Principles) has a note about ordering manual edits vs mechanical replaces.

### Carry-forward check

**v0.6.10 retro:**
- ACTION 1 (lib/ category split docs P3) — still deferred → renumbered ACTION 3 here
- ACTION 2 (Conventional Commits enforcement P2) — still deferred → ACTION 1 here

**v0.6.9 retro:** all closed.
**v0.6.8 retro:** all closed.
**v0.6.7 retro:** all closed.
**v0.6.6 retro:** all closed.
**v0.6.5 retro:** all closed.
**v0.6.3 retro:**
- ACTION 3 (data-driven exclude list for audit-repo-invariants P3) — still deferred → ACTION 4 here

**v0.6.2 retro:**
- ACTION 1 (live `/vibe` E2E test) — still deferred (sandbox required)

---

## Status: DONE_WITH_CONCERNS

**Status:** DONE_WITH_CONCERNS

All 6 stages produced artifacts. v0.6.11 ready to commit (awaiting user approval per `careful` protocol).

**Concerns:**
- Skill body delta +8 vs plan budget ≤+5 (low-impact narrative; documented in execution doc and CHANGELOG)
- Code-fence over-eagerness in new advisory (currently inactive; carry-forward as ACTION 2)
- Two preventable correctness misses caught in VERIFY (sed-after-strikethrough collision; advisory-count enumeration error) — both reflected in retro insights 1 and 2; carry-forward as ACTION 5

Branch chain: main (5f7d947, includes v0.6.5-v0.6.9 PR #50 merged; v0.6.10 e819a69 not yet on main) ← feat/release-changelog-discovery (this sprint, v0.6.11).

**Note on branch chain:** v0.6.10 is committed to a separate branch (`feat/changelog-autogen` per the prior summary, commit `e819a69`) that has NOT yet been merged to main as of this sprint's start. v0.6.11 was branched from `e819a69` (post-v0.6.10 commit). The eventual PR sequence will be: PR for v0.6.10 first → main → PR for v0.6.11 → main, OR a single combined PR for v0.6.10+v0.6.11 if user prefers.

**First v0.7.0+ backlog item ship-then-wire pattern complete.** Pattern: ship tool (v0.6.10) → wire into discovery + structural defense (v0.6.11). Repeatable for any future authoring helper.
