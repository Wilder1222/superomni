# Implementation Plan: Plugin Sync Gate + Stale-Doc Fixes (v0.6.5)

**Spec:** `docs/superomni/specs/spec-main-plugin-sync-gate-20260515.md`
**Branch:** `feat/plugin-sync-gate` (off main e33d0f2 = v0.6.4 merge)
**Session:** `plugin-sync-gate`  **Date:** 20260515

## Overview

Two phases on a fresh main branch. Phase 1 fixes 2 P1 stale items. Phase 2 adds a CI sync checker. ~10 LOC fix + ~100 LOC checker.

## Prerequisites

- [x] Spec approved
- [x] On `feat/plugin-sync-gate` branched off main HEAD (e33d0f2 = v0.6.4)
- [x] Working tree clean (only sprint artifact untracked)

## Steps

### Step 1: Baseline

`git status` clean; `npm run verify:skill-docs && check:workflow-contract && validate-skills` all green; record current state.

### Step 2: Fix README.md stale version (Phase 1)

Edit `README.md` line 5: `Current stable version: 0.6.0` → temporarily leave as `0.6.0`; will bump to `0.6.5` in Step 9 along with the rest. (Reason: avoid intermediate-state CI failures during checker-build steps before the checker exists.)

### Step 3: Add `style-capture` to `claude-skill.json` (Phase 1)

Insert the missing command entry in alphabetical position. Verify: `diff <(jq -r '.commands[].name' claude-skill.json | sort) <(ls commands/ | sed 's/\.md$//' | sort)` returns empty.

### Step 4: Author `lib/check-plugin-sync.js` (Phase 2)

~100 LOC node script. 4 invariant checks:

```js
// Pseudo:
// 1. Read package.json version. Read marketplace.json (top + nested), plugin.json, claude-skill.json. All must equal.
// 2. Read commands/*.md filenames. Read claude-skill.json commands[].name. Set equality.
// 3. Read plugin.json keywords. Read marketplace.json plugins[0].keywords. Set equality.
// 4. Read README.md regex match for "Current stable version: X.Y.Z". Must equal package.json version.
// On any drift: stderr the specific failure, exit 1. Otherwise print success summary, exit 0.
```

Use `JSON.parse` (no extra deps); no `js-yaml` needed since all 4 manifest files are JSON.

### Step 5: Wire `check:plugin-sync` into `package.json`

Add `"check:plugin-sync": "node lib/check-plugin-sync.js"`. Extend `verify:skill-docs` to include it.

### Step 6: Demo each invariant fires (Phase 2 verification)

For each of the 4 invariants:
1. Inject deliberate drift (e.g., change a single character in a version string).
2. Run `npm run check:plugin-sync`; expect exit 1 with specific drift message.
3. Restore original.
4. Run again; expect exit 0.

### Step 7: Phase 1+2 gate

`npm run check:plugin-sync && npm run verify:skill-docs && npm run check:workflow-contract && bash lib/validate-skills.sh` — all exit 0.

Note: at this point the checker will FAIL on the README version (still 0.6.0) until Step 9. Strategy options:
- (a) Skip Step 7 README check until Step 9; wire-in but expect fail until version bump.
- (b) Run Step 9 BEFORE Step 7 (version bump first). **Pick (b)** — cleaner sequence.

Reorder: do Step 9 (version bump) *before* Step 7 (gate run). Plan amended accordingly.

### Step 8: Final regression invariants

- Skill / agent counts: 28 / 5
- EnterPlanMode mentions in CLAUDE.md ≥ 5
- Flat reference.md files: 0
- `${CLAUDE_SKILL_DIR}` literal tokens: 15
- `frontend-design/reference/design-md-library/`: 9
- Total `wc -l skills/*/SKILL.md`: 6,249 (unchanged; this sprint adds no skill-body content)

### Step 9: Version bump (run BEFORE Step 7 per amendment)

Bump 0.6.4 → 0.6.5 in 5 files:
- `package.json`
- `.claude-plugin/marketplace.json` (×2 occurrences)
- `.claude-plugin/plugin.json`
- `claude-skill.json`
- README.md (`Current stable version: 0.6.0` → `0.6.5`)

CHANGELOG `[0.6.5] — 2026-05-15` entry above 0.6.4.

### Step 10: Commit + write evaluation + release artifacts

Single commit on top of e33d0f2. Evaluation + release artifacts. ASK before push (continuing v0.6.x practice).

## Effective Step Order (post-amendment)

1. Step 1 — Baseline
2. Step 3 — claude-skill.json fix
3. Step 4 — Author checker
4. Step 5 — Wire npm script
5. Step 9 — Version bump (5 files + CHANGELOG)
6. Step 6 — Demo each invariant fires
7. Step 7 — Final gate (now passes because version bumped)
8. Step 8 — Final regression invariants
9. Step 10 — Commit + artifacts + ASK push

(Original Step 2 dropped — README version handled inside Step 9 alongside the rest.)

## Testing Strategy

- Phase 1 verification: `diff` of commands/ vs claude-skill.json (Step 3).
- Phase 2 verification: 4 inject-and-restore demos (Step 6).
- Final regression: standard 6-gate suite (Step 7).

## Rollback

`git revert <commit>` or `git reset --hard e33d0f2`.

## Success Criteria

- [ ] Phase 1: README version + claude-skill.json commands aligned.
- [ ] Phase 2: 4 invariants each demonstrated to fire and to clear.
- [ ] All 6 CI gates green.
- [ ] Global invariants preserved.
- [ ] Version bump landed across 6 files (5 manifest + README) + CHANGELOG.

## Milestones (3)

1. **M1** — Phase 1 stale fixes done (Steps 1, 3)
2. **M2** — Phase 2 checker + bump done; all 4 demos pass (Steps 4, 5, 9, 6)
3. **M3** — Final gate green + commit + artifacts (Steps 7, 8, 10)

P0 risks: **none**. Highest = checker false-positive on edge cases (e.g., a future commands/ file with no claude-skill.json entry meant for plugin-only); current scope assumes 1:1 set parity.

## Next Stage

On DONE → REVIEW.
