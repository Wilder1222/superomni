# Code Review: v0.6.11 Discovery Sync

**Branch:** `feat/release-changelog-discovery`
**Date:** 20260515
**Plan:** `docs/superomni/plans/plan-main-release-changelog-discovery-20260515.md`
**Execution:** `docs/superomni/executions/execution-main-release-changelog-discovery-20260515.md`

```
CODE REVIEW
════════════════════════════════════════
PR/Branch:     feat/release-changelog-discovery
Files changed: 15 (92 insertions, 16 deletions)
Blast radius:  LOW — discovery-sync patch; no behavior changes; advisory loop addition
```

## Layer 1: Correctness (P0)

| Check | Result |
|---|---|
| Spec coverage (3 surfaces wired + 1 advisory + 9 version + 2 amendments E1/E2) | ✓ all 13 plan steps complete |
| Advisory negative test fired correctly | ✓ exact expected message captured then cleared after restore |
| Dogfood produced expected 1 bullet | ✓ refs `e819a69`, TODO comment present |
| Version 0.6.11 across 9 surfaces | ✓ |
| New advisory does not regress existing 5 advisories | ✓ all advisories use same array; ordering preserved |

## Layer 2: Security (P0)

```
SECURITY: CLEAN
```

No security-sensitive patterns in diff (verified by `grep -iE "password|secret|token|api[_-]?key|credential|sql|exec\(|eval\(|encrypt|cookie|session|jwt"` — only false-positive: literal `${CLAUDE_SKILL_DIR}-tokens=15` in CHANGELOG narrative). No external input parsing. Advisory uses static regex against file content read by trusted internal generator. Stdout-only tool unchanged.

## Layer 3: Tests (P0)

| Test surface | Result |
|---|---|
| Negative test for new advisory | ✓ Step 6 fired-then-restored cycle (in execution doc) |
| Dogfood as integration test | ✓ Step 8 produced 1 bullet referencing `e819a69` |
| All 8 CI gates green | ✓ baseline + final |
| Plugin sync 5 invariants | ✓ |

```
TESTS: ADEQUATE
```

## Layer 4: Code Quality (P1)

### Advisory implementation review

```js
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

**Soundness:** mirrors the shape of the 5 sibling advisory loops (3 use `for (const tmpl of templateFiles)`, 2 use `for (const file of skillFiles)`). Reads file once, regex tests are O(N) on content length, no allocation amplification. ✓

**Exemption logic:** `framework-management` skip is at the top of the loop body before reading the file (skipReadOptimization) — actually small win. Sibling advisory at line 144 uses the same pattern. Consistent. ✓

**Message text:** descriptive, includes both `rel(tmpl)` (file path), the rule violated, and the fix command. Matches v0.6.5 advisory format. ✓

### Regex pattern edge cases (deep dive)

| Input | Pattern matches? | Verdict |
|---|---|---|
| `gen:changelog` (npm script form) | ✓ true | true positive |
| `gen-changelog` (file form) | ✓ true | true positive |
| `gen_changelog` (underscore) | ✗ false | correct rejection |
| `changelog generation` (whitespace) | ✗ false | correct rejection |
| `Run npm run gen:changelog -- now` (in sentence) | ✓ true | true positive |
| `CHANGELOG.md.bak` (false sub-match for trigger) | ✓ true on `/CHANGELOG\.md/` | harmless — would only fire if `.tmpl` had this string AND no `gen:changelog`, which is essentially impossible in practice |

Pattern is sound. No false positives across 96 corpus matches verified in plan-review phase. ✓

### Layer 4 issues found during review

**P0 — FIXED IN-REVIEW**: `docs/IMPLEMENTATION.md:492` — the strikethrough item said "closed by v0.6.11" but `gen-changelog.js` actually shipped in v0.6.10. Caused by sed bumping `0.6.10 → 0.6.11` AFTER the manual strikethrough edit (the historical reference was bumped along with the live version refs). Fixed by Edit reverting that one occurrence. Verified post-fix.

**P1 — FIXED IN-REVIEW**: `skills/document-release/SKILL.md.tmpl` had CRLF line endings after Edit on Windows (other tmpls are LF). Git warned. Generated `.md` was LF (correct), but the `.tmpl` source mismatched siblings. Fixed via `sed -i 's/\r$//'`. Re-regenerated; check passes.

```
P0 ISSUES (must fix before merge):
  (none — both fixed in-review)

P1 ISSUES (should fix):
  (none — both fixed in-review)

P2 SUGGESTIONS (optional improvement):
  - Consider adding a comment in lib/check-skill-docs.js noting that future
    "tool-discovery" advisories should follow the same shape (precedent set).
  - Plan budget for skill body delta should be ≤+10 (not ≤+5) for any change
    that adds a code-block-bearing hint — observed in this sprint.
```

## Layer 5: Blast Radius (P1)

```
Blast radius: LOW (3 .tmpl files modified + 1 lib/ + 1 doc strikethrough + 9 version surfaces)
```

- `skills/release/SKILL.md.tmpl`: only § Changelog modified (line 70 area)
- `skills/document-release/SKILL.md.tmpl`: only § Phase 4 header area modified
- `lib/check-skill-docs.js`: pure additive (1 new advisory loop after CRLF check)
- `docs/IMPLEMENTATION.md`: 1 line changed (strikethrough) + version refs
- `CHANGELOG.md`: pure additive (preamble + new entry)
- 9 version surfaces: mechanical sed substitution

No imports affected. No test files touched. No CI workflow changes. No public API changes.

## Layer 6: Architecture (P2)

- New advisory follows the established pattern (5 siblings already use this shape)
- Pattern: ship-tool → wire-into-discovery → defend-with-advisory is now the canonical 2-sprint sequence
- Strikethrough convention for closing backlog items in IMPLEMENTATION.md sets a precedent worth documenting in framework-management later

## Strikethrough — Unintended Consequences Audit

User asked specifically about this. Verified:

| Concern | Result |
|---|---|
| Other docs reference the original "currently manual" claim? | ✓ none — only `docs/IMPLEMENTATION.md` had it |
| The strikethrough text itself contains the searchable phrase "CHANGELOG auto-generation"? | ✓ yes — preserves discoverability for someone searching for the deferred item |
| External links (issues, PRs) referencing the deferred item? | ✓ none in repo |
| The closure attribution causes confusion in CHANGELOG?  | ✓ no — CHANGELOG attributes correctly to v0.6.10; IMPLEMENTATION.md mirrors that |
| Strikethrough semantics in markdown (renders as ~~text~~) | ✓ standard CommonMark — renders as crossed-out in all markdown renderers |

**Verdict: No unintended consequences. The strikethrough preserves audit trail and is correctly attributed.**

## Decision Questions

None. All taste decisions auto-resolved during plan-review (E1, E2, regex pattern, manual fallback). All P0/P1 issues found in this review fixed in-place.

## Verdict

```
VERDICT: APPROVED_WITH_NOTES
Status:  DONE_WITH_CONCERNS
```

**Concerns** (already documented):
- Skill body delta +8 vs plan budget ≤+5 (low-impact narrative; documented in execution doc)
- 2 in-review fixes applied (P0 version bump bug, P1 CRLF) — both verified

The change is sound. Discovery sync correctly wired into 3 surfaces; structural defense in place via advisory; backlog closure pattern established. Ready for QA + verification phases.

════════════════════════════════════════
