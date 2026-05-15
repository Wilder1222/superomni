# Execution: Plugin Sync Gate + Stale-Doc Fixes (v0.6.5)

**Plan:** `docs/superomni/plans/plan-main-plugin-sync-gate-20260515.md`
**Review:** `docs/superomni/reviews/plan-review-main-plugin-sync-gate-20260515.md`
**Branch:** `feat/plugin-sync-gate` (off main e33d0f2 = v0.6.4 merge)  **Date:** 20260515

## Step 1: Baseline ✓
Branch off fresh main HEAD; clean tree (only sprint artifacts untracked); all 6 prior CI gates green.

## Step 3: claude-skill.json fix ✓
Inserted `{"name": "style-capture", "file": "commands/style-capture.md"}` after the `release` entry. Verified by `diff` between `claude-skill.json` commands[] (sorted) and `commands/*.md` filenames (sorted) — exact match.

## Step 4: lib/check-plugin-sync.js ✓
~120 LOC node script implementing 4 invariants. Uses Node stdlib only (`JSON.parse`, `fs.readdirSync`, regex). Mirrors the shape of existing `lib/check-skill-docs.js` and `lib/check-workflow-contract.js`.

## Step 5: package.json wiring ✓
Added `check:plugin-sync` standalone script. Extended `verify:skill-docs` umbrella to include it (now: gen-skills + check:skill-docs + verify:fixture-parity + test:generators + check:plugin-sync).

## Mid-build observation
First run of `check:plugin-sync` (before Step 9 version bump) fired correctly on the README invariant: `"Current stable version: 0.6.0" does not match package.json version 0.6.4`. The checker caught the very bug we were fixing — confirming the implementation is correct.

## Step 9: Version bump ✓
- `package.json` 0.6.4 → 0.6.5
- `.claude-plugin/marketplace.json` ×2 → 0.6.5
- `.claude-plugin/plugin.json` → 0.6.5
- `claude-skill.json` → 0.6.5
- `README.md` `Current stable version: 0.6.0` → `0.6.5`

## Step 6: Demo each invariant fires ✓

| Demo | Injection | Expected | Result |
|---|---|---|---|
| 1 — version drift | claude-skill.json: 0.6.5 → 0.6.4 | exit 1 + version mismatch msg | ✓ `version drift: claude-skill.json = "0.6.4", expected "0.6.5" (from package.json)` |
| 2 — missing command | drop `vibe` from claude-skill.json `commands` array | exit 1 + missing-command msg | ✓ `commands sync: 1 file(s) in commands/ but missing from claude-skill.json: vibe` |
| 3 — keywords drift | append `test-only-extra-kw` to plugin.json keywords | exit 1 + keywords diff | ✓ `keywords sync: ... In plugin.json only: [test-only-extra-kw]. In marketplace.json plugins[0] only: [].` |
| 4 — README version drift | change README to `Current stable version: 9.9.9` | exit 1 + README mismatch msg | ✓ `README version: "Current stable version: 9.9.9" ... does not match package.json version 0.6.5` |

All 4 cleared after restore (`Plugin sync check passed: 4 invariants validated.`).

## Step 7+8: Final gates + regression ✓

| Gate | Result |
|---|---|
| `npm run verify:skill-docs` (umbrella) | exit 0; 5 sub-checks PASS |
| `npm run check:workflow-contract` | exit 0 (legacy advisories only) |
| `bash lib/validate-skills.sh` | 0 errors, 1 warning (workflow stub) |
| `npm run check:plugin-sync` (standalone) | exit 0 |

| Invariant | Pre-sprint | Post-sprint | Status |
|---|---|---|---|
| Skills count | 28 | 28 | ✓ |
| Agents count | 5 | 5 | ✓ |
| EnterPlanMode mentions in CLAUDE.md | 5 | 5 | ✓ |
| Flat reference.md files | 0 | 0 | ✓ |
| `${CLAUDE_SKILL_DIR}` literal token refs | 15 | 15 | ✓ |
| `frontend-design/reference/design-md-library/` entries | 9 | 9 | ✓ |
| Total `wc -l skills/*/SKILL.md` | 6,249 | 6,249 | ✓ (no skill content touched) |
| Version 0.6.5 across 5 manifests + README | n/a | confirmed | ✓ |

**Overall execution status: DONE.** All ACs met; all 4 invariants demonstrated functional; sprint scope held tight.
