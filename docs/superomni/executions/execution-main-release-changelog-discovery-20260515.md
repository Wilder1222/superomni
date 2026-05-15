# Execution: Wire `gen:changelog` Into Release Skill (v0.6.11)

**Plan:** `docs/superomni/plans/plan-main-release-changelog-discovery-20260515.md`
**Review:** `docs/superomni/reviews/plan-review-main-release-changelog-discovery-20260515.md` (2 amendments E1+E2)
**Branch:** `feat/release-changelog-discovery` (off main `5f7d947` + v0.6.10 `e819a69`)  **Date:** 20260515

## Execution log

| Step | Action | Result |
|---|---|---|
| 1 | Baseline CI green | ✓ all 8 gates green |
| 2 | Update `skills/release/SKILL.md.tmpl` § Changelog | ✓ added 4-line gen:changelog hint above existing manual fallback template |
| 2b (E1) | Update `skills/document-release/SKILL.md.tmpl` § Phase 4 | ✓ added 1-line hint before Phase 4 body |
| 3 | Update `CHANGELOG.md` preamble | ✓ added 1-line **Authoring helper** pointer after Versioning line |
| 4 | Add 6th advisory to `lib/check-skill-docs.js` | ✓ ~12 LOC, pattern `/CHANGELOG\.md/` && !`/gen[:-]changelog/`, `framework-management` exempted |
| 5 | Confirmation gate — 0 advisory fires | ✓ `Skill docs check passed: 28 generated files, 27 templates` (no advisories) |
| 6 | Negative test for new advisory | ✓ removed hint via sed, regenerated, advisory fired with **exact expected message**: `skills/release/SKILL.md.tmpl: mentions CHANGELOG.md without 'gen:changelog' pointer`. Restored from backup; advisory cleared. |
| 7 | Regen + invariant gate | ✓ check passes; line counts: release 220, document-release 173 |
| 8 | Dogfood `gen:changelog` | ✓ `--from 5f7d947 --to HEAD --version 0.6.11` produced **1 bullet** under `### Added` referencing `e819a69`, with TODO comment for human subsections — exactly as v0.6.10's design specified |
| 9 | Compose CHANGELOG `[0.6.11]` entry | ✓ Added (3 bullets) / Changed (1 bullet) / Why this matters / Verified / Architectural notes / Deferred (4 items) |
| 9b (E2) | Update `docs/IMPLEMENTATION.md` deferred-backlog list | ✓ "CHANGELOG auto-generation from commits" → strikethrough + "closed by v0.6.10" annotation |
| 10 | Version bump 0.6.10 → 0.6.11 across 9 surfaces | ✓ Read+Edit `package.json`; sed for 8 doc/manifest surfaces (12 substitutions total); `check:plugin-sync` validates 5 invariants |
| 11 | Final regression gate | ✓ all 8 CI gates green; all invariants preserved (28/5/5/0/15/9/0); skill body 6,247 → 6,255 (+8) |

## Plan amendments (from REVIEW)

Both correctly applied during BUILD:
- **Amendment E1**: Step 2b inserted to wire `document-release` skill (which empirical pre-flight showed also mentions CHANGELOG without gen:changelog hint). Without this, the new advisory would have fired on first run.
- **Amendment E2**: Step 9b inserted to mark stale "CHANGELOG auto-generation" backlog item closed in `docs/IMPLEMENTATION.md`. Strikethrough preserves audit trail (sets precedent for future backlog closure pattern).

## Plan deviation

**Step 7: skill body line delta = +8 (plan budget ≤+5)**

Breakdown:
- `skills/release/SKILL.md`: +6 lines (gen:changelog hint expanded from 1 line to 4 lines: intro paragraph + bash code block + transition sentence + manual fallback header)
- `skills/document-release/SKILL.md`: +2 lines (1-line hint before Phase 4 body)
- `skills/framework-management/SKILL.md`: 0 lines (already had hint from v0.6.10)

Decision: accepted. Plan budget was conservative; the 1-line hint became 4 lines for clarity (the bash block needed a code fence and the manual fallback needed a transition sentence). Both edits are minimal narrative additions, no scope creep, no extra files touched. Documented here transparently rather than fudged.

## Implementation details

### S1 — `skills/release/SKILL.md.tmpl` § Changelog

Before:
```markdown
### Changelog

Update `CHANGELOG.md`:

```markdown
## [vX.Y.Z] — YYYY-MM-DD
...
```
```

After:
```markdown
### Changelog

Update `CHANGELOG.md`. First scaffold the entry from Conventional Commits in the range `last-tag..HEAD`:

```bash
npm run gen:changelog -- --version <X.Y.Z> > /tmp/changelog-draft.md
```

Then paste the draft into `CHANGELOG.md` and complete the *Why this matters*, *Verified*, and *Deferred* subsections manually (the human-synthesis 40%). Manual fallback template (when the tool is unavailable):

```markdown
## [vX.Y.Z] — YYYY-MM-DD
...
```
```

Net: +6 lines. The original 12-line manual template stays as the fallback (per spec + REVIEW Decision 5: keep manual fallback per P5+P1).

### S2b (E1) — `skills/document-release/SKILL.md.tmpl` § Phase 4

Inserted single line before Phase 4 body:
> Scaffold the entry from Conventional Commits using `npm run gen:changelog -- --version <X.Y.Z>`, then complete the *Why this matters* / *Verified* / *Deferred* subsections manually.

Net: +2 lines (1 content + 1 blank line).

### S3 — `CHANGELOG.md` preamble

Inserted between "Versioning follows..." and `---`:
> **Authoring helper:** run `npm run gen:changelog -- --version <X.Y.Z>` to scaffold a new entry from Conventional Commits in `last-tag..HEAD`.

### S4 — 6th advisory in `lib/check-skill-docs.js`

```js
// Advisory: a skill .tmpl that mentions CHANGELOG.md must also mention
// gen:changelog so the v0.6.10 tool stays wired into discovery. Catches
// future drift when new skills touch CHANGELOG without the pointer.
// framework-management is exempted (it teaches the rules abstractly).
for (const tmpl of templateFiles) {
    const skillName = path.basename(path.dirname(tmpl));
    if (skillName === "framework-management") continue;
    const content = fs.readFileSync(tmpl, "utf8");
    if (/CHANGELOG\.md/.test(content) && !/gen[:-]changelog/.test(content)) {
        advisories.push(
            `${rel(tmpl)}: mentions CHANGELOG.md without 'gen:changelog' pointer. ` +
            `Add: \`npm run gen:changelog -- --version <X.Y.Z>\`.`
        );
    }
}
```

Placed after CRLF-line-endings advisory, before token-literal advisory (~line 184). Pattern `/gen[:-]changelog/` matches both `gen:changelog` (npm script invocation) and `gen-changelog` (file/directory ref). 96 corpus matches all valid; no false positives.

### Step 6 — Negative test full sequence

```bash
$ cp skills/release/SKILL.md.tmpl /tmp/release.tmpl.bak
$ sed -i '/npm run gen:changelog -- --version <X.Y.Z>/d' skills/release/SKILL.md.tmpl
$ sed -i '/Then paste the draft/d' skills/release/SKILL.md.tmpl
$ sed -i '/scaffold the entry/d' skills/release/SKILL.md.tmpl
$ npm run gen-skills && node lib/check-skill-docs.js
[advisory] skills/release/SKILL.md.tmpl: mentions CHANGELOG.md without 'gen:changelog' pointer. Add: `npm run gen:changelog -- --version <X.Y.Z>`.
$ cp /tmp/release.tmpl.bak skills/release/SKILL.md.tmpl
$ npm run gen-skills && node lib/check-skill-docs.js
Skill docs check passed: 28 generated files, 27 templates    # advisory cleared
```

This proves the gate works (not just that current state happens to satisfy it). Critical for confidence that future drift will be caught.

### Step 8 — Dogfood

```bash
$ npm run gen:changelog -- --from 5f7d947 --to HEAD --version 0.6.11
## [0.6.11] — 2026-05-15

### Added
- lib/gen-changelog.js — Conventional Commits → CHANGELOG skeleton generator First v0.7.0+ backlog item closed. Per user directive, shipped as v0.6.10 patch (continues v0.6.x cadence; v0.7.0 reserved for architectural minor).  *(e819a69)*

<!-- TODO: add 'Why this matters' / 'Verified' / 'Deferred (v0.X.Y+ backlog)' subsections manually -->

---
[gen-changelog] generated 1 bullet(s) across 1 section(s) for [0.6.11].
```

This is the **first real-world run** of `gen:changelog`. Validates: (a) Conventional Commits parse works on actual prose, (b) body extraction strips trailers, (c) commit-hash trailer rendering correct, (d) section grouping correct, (e) TODO comment renders, (f) stderr summary correct.

The dogfood output then formed the skeleton for Step 9's CHANGELOG entry — proving the "60% mechanical / 40% synthesis" framing in practice. The `### Added` bullet was tool-generated (mechanical); Why-this-matters / Architectural-notes / Deferred subsections were human synthesis (the 40%).

## Mid-build observations

1. **Empirical pre-flight saved a CI break**: REVIEW's E1 amendment (insert Step 2b for document-release) was based on running the pre-flight grep early. Without E1, Step 7's check-skill-docs run would have fired the new advisory immediately on document-release. REVIEW correctly identified this.

2. **The hint vs the bash block**: Original 1-line plan estimate was naive. A useful gen:changelog hint needs: (a) intro paragraph explaining what to do, (b) bash code block with the actual command, (c) note about manual subsections, (d) transition to manual fallback. That's 4 lines minimum. Plan budget should have been ≤+10.

3. **Strikethrough vs delete in IMPLEMENTATION.md**: REVIEW Decision 4 chose strikethrough over deletion to preserve audit trail. The result is good — readers can see "this was a backlog item, here's how it got closed" rather than just "this item disappeared". Sets a precedent: future backlog item closures should use the same `~~item~~ — **closed by vX.Y.Z**` pattern.

4. **First real dogfood validated v0.6.10's design**: every claim in v0.6.10's design (no false positives, body extraction works, Conventional Commits parse handles real prose) verified against actual `e819a69` output. Tool ships at v0.6.10 → wires into discovery at v0.6.11 → real dogfood happens at v0.6.11 = the canonical 2-sprint sequence for any new authoring helper.

## Step 11 — Regression Gate

| Invariant | Pre-sprint (v0.6.10) | Post-sprint | Status |
|---|---|---|---|
| Skills count | 28 | 28 | ✓ |
| Agents count | 5 | 5 | ✓ |
| EnterPlanMode mentions in CLAUDE.md | 5 | 5 | ✓ |
| Flat reference.md files | 0 | 0 | ✓ |
| `${CLAUDE_SKILL_DIR}` literal token refs | 15 | 15 | ✓ |
| `frontend-design/reference/design-md-library/` entries | 9 | 9 | ✓ |
| `.approved-spec-*` markers | 0 | 0 | ✓ (G7 invariant) |
| Total `wc -l skills/*/SKILL.md` | 6,247 | 6,255 | ⚠ +8 (plan budget ≤+5; documented deviation) |
| `verify:skill-docs` (umbrella) | green (6 sub-checks) | green (6 sub-checks; new advisory included) | ✓ |
| `check:workflow-contract` | exit 0 | exit 0 | ✓ |
| `validate-skills.sh` | 1 warning | 1 warning | ✓ |
| `check:plugin-sync` | 5 invariants | 5 invariants | ✓ |
| Version 0.6.11 across 5 manifests + README + 4 docs | n/a | confirmed | ✓ |
| `gen:changelog` dogfood | n/a | 1 bullet ref `e819a69` | ✓ |

**Overall execution status: DONE_WITH_CONCERNS**

Concerns:
- Skill body delta +8 vs plan budget ≤+5 (low-impact narrative additions; documented above)

All 13 steps complete (11 planned + 2 amendment inserts). Both REVIEW amendments correctly applied. First real-world dogfood of `gen:changelog` succeeded, validating v0.6.10's design.
