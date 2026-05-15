# QA Report: v0.6.11 Discovery Sync

**Branch:** `feat/release-changelog-discovery`  **Date:** 20260515
**Code Review:** `docs/superomni/reviews/code-review-main-release-changelog-discovery-20260515.md`

## QA Scope

```
QA SCOPE
─────────────────────────────────
Files changed:      15 (covered in execution doc)
Functions affected: 1 new advisory loop in lib/check-skill-docs.js
Existing tests:     8 CI gates (gen-skills, check:skill-docs, verify:fixture-parity,
                    test:generators, check:plugin-sync, check:plan-content,
                    check:workflow-contract, validate-skills)
Missing tests:      None — verified during BUILD via negative test (Step 6) +
                    dogfood (Step 8); positive case verified at Steps 5/7
Blast radius:       LOW — single advisory addition + 3 text wirings + version bump
─────────────────────────────────
```

## Test Suite Results

```
TEST SUITE RESULTS
─────────────────────────────────
All 8 CI gates: PASSING
Plugin sync 5 invariants: PASSING
Negative test (Step 6): PASSED (advisory fired then cleared)
Dogfood (Step 8): PASSED (1 bullet for e819a69)
Pre-existing warnings: 1 (legacy v0.4.x evaluation artifact missing **Status:**
                       field — exempt by cutoff date 20260514)
─────────────────────────────────
```

## Edge Case Exploration (per user request)

### Gap 1: Advisory positive case — what does the advisory NOT catch?

| Scenario | Pattern | Advisory fires? | Verdict |
|---|---|---|---|
| `.tmpl` mentions only file form `lib/gen-changelog.js` (no `:` or runnable command) | matches `gen[:-]changelog` via `gen-changelog` | ✗ NO | ✓ correct — file ref is sufficient hint |
| `.tmpl` mentions both forms | matches both | ✗ NO | ✓ correct |
| `.tmpl` has CHANGELOG.md inside a code fence (e.g., `find . -name "CHANGELOG.md"`) without gen:changelog elsewhere | matches CHANGELOG.md | ✓ YES | ⚠ **over-eager** — code-fence content shouldn't trigger discovery rule |
| `.tmpl` has CHANGELOG.md inside an inline-backtick span only | matches CHANGELOG.md | ✓ YES | ⚠ **over-eager** — same reason |

**Verdict:** Edge 1c/1d are real but currently **inactive** (no SKILL.md.tmpl in the repo has CHANGELOG.md only inside code fences). Future risk only. The token-literal advisory (sibling, line 187) DOES respect code-fence boundaries — should consider porting that logic if a false positive is observed in the future. **Not blocking merge.**

→ Documented as **P2 finding** in this report; carry-forward to v0.6.12 backlog if observed firing falsely.

### Gap 2: gen:changelog edge cases beyond v0.6.10's verified set

| Scenario | Result | Verdict |
|---|---|---|
| Range with all merge-commits (skip patterns) | header + TODO + `---` only; "0 bullet(s) across 0 section(s)" stderr | ✓ matches Amendment B (empty-range output spec) — generalized correctly |
| Range with non-Conventional commits (e.g., v0.5 era pre-Conventional) | `Other` section populated; per-commit stderr note `[gen-changelog] note: <hash> subject does not match Conventional Commits format; placed under 'Other'` | ✓ matches v0.6.10 spec exactly — graceful degradation |
| Mixed range: 1 feat + 2 non-Conventional | `Added` (1) + `Other` (2) sections both render | ✓ correct |

**Verdict:** No edge case unhandled. v0.6.10's design covered the realistic surface area. ✓

### Gap 3: Documentation coverage of the new advisory

**Found 1 stale doc**: `skills/framework-management/SKILL.md.tmpl` § Supporting Files said:
> Two advisory warnings in `lib/check-skill-docs.js` enforce this: (a) `SKILL.md ≥ 300 lines && no reference/ dir`, (b) any flat `reference.md` at a skill root.

But the actual count is 6 (2 reference-related + 1 CRLF + 1 token-literal + 1 deprecated-phrase + the new v0.6.11 CHANGELOG-discovery). **Pre-existing staleness from v0.6.5 onward** (the line was written when there were 2 advisories; never updated as new ones landed).

**Decision: P2 boil-lakes principle — fix in this sprint.** 1-line edit, <30 sec, prevents compounding staleness. Updated to:
> Six advisory warnings in `lib/check-skill-docs.js` enforce skill-doc hygiene: (a) `SKILL.md ≥ 300 lines && no reference/ dir`, (b) any flat `reference.md` at a skill root, (c) generated `SKILL.md` with CRLF line endings, (d) literal `{{PREAMBLE*}}` token in raw prose (post-canonical occurrence), (e) any `.tmpl` mentioning `CHANGELOG.md` without a `gen:changelog` pointer (v0.6.11+), and the deprecated-phrase scan from v0.6.0.

Now enumerates all 6, with version annotation for the new one. Skill body delta: 0 lines (same line count, longer text).

Re-ran gen-skills + verify:skill-docs after edit; all gates still green.

## Bugs Found

| # | Severity | Description | Status |
|---|---|---|---|
| 1 | P2 (stale doc) | `framework-management` referenced "Two advisory warnings" — actually 6 | FIXED IN-QA |
| 2 | P2 (latent bug) | Advisory does not respect code-fence boundaries; could fire on .tmpl with CHANGELOG.md only inside fences | DOCUMENTED — carry-forward to v0.6.12 if observed |

## Risk Assessment

```
Risk: LOW
```

The change is single-purpose, additive, with both negative test (proves gate works) and dogfood (proves tool integration). The 1 fix-in-QA was a pre-existing doc staleness (not introduced by v0.6.11). The 1 latent issue (code-fence over-eagerness) is currently inactive and easily fixed if observed.

```
QA REPORT
════════════════════════════════════════
Scope:           v0.6.11 discovery sync (3 wiring surfaces + 1 advisory + 9 version)
Changes tested:  15 files, 1 new function (advisory loop), 1 in-QA fix

Test Results (pre-QA):
  CI gates passing: 8/8
  Negative test:    PASSED
  Dogfood:          PASSED
  Plugin sync:      5/5

Test Results (post-QA, after Edge-3 fix):
  CI gates passing: 8/8
  All invariants:   preserved (28/5/5/0/15/9/0)
  Skill body lines: 6,255 (unchanged from BUILD; framework-management edit is 0-delta)

Edge Cases Found:
  - Gap 1c/1d: advisory over-eager on CHANGELOG.md inside code fences — currently inactive
  - Gap 2: confirmed gen:changelog handles non-Conventional commits gracefully
  - Gap 3: framework-management doc staleness ("Two" → "Six") — FIXED

Bugs Found:
  - 1 P2 stale doc — FIXED in this QA pass
  - 1 P2 latent over-eagerness — documented as carry-forward

Flaky Tests:  None observed

Risk Assessment: LOW — single-purpose patch, both negative test + dogfood pass

Status: DONE
════════════════════════════════════════
```

**Status: DONE**

QA found 1 fix-in-place (P2 stale doc count "Two" → "Six" in framework-management) and 1 documented carry-forward (advisory could be over-eager on code-fence content; currently inactive). Both v0.6.11 changes verified working as designed. Risk is LOW. Ready for verification phase.
