# Implementation Plan: CI Completeness + Doc Version Drift (v0.6.6)

**Spec:** `docs/superomni/specs/spec-main-ci-completeness-20260515.md`
**Branch:** `feat/ci-completeness` (off feat/plugin-sync-gate at d9461c5 = v0.6.5 local)
**Session:** `ci-completeness`  **Date:** 20260515

## Overview

Single bug-batch patch covering 7 observed bugs. Touch surfaces don't overlap; one CI cycle covers all.

## Scope

**Build:**
- `.github/workflows/validate.yml`: 3 new ubuntu steps + 2 new windows steps
- `docs/COMPARISON.md`: header v0.3.0 → v0.6.6, footer same
- `docs/DESIGN.md`: Status v0.5.7 → v0.6.6
- `package.json`: `files` += CHANGELOG.md
- `lib/validate-skills.sh`: comment line 3 update
- `lib/check-plugin-sync.js`: refactor invariant 4 to multi-file list
- `skills/brainstorm/SKILL.md.tmpl`: remove `touch .approved-*` block
- `skills/vibe/SKILL.md.tmpl`: remove 6 `.approved-spec-*` references
- `skills/vibe/reference/stage-detection.md`: remove `_HAS_SPEC_APPROVAL` variable + helper
- Version bump 0.6.5 → 0.6.6 across 5 manifest files + 3 docs files
- CHANGELOG entry

**Out of scope:** v0.7.0+ backlog items.

## Steps

### Step 1: Baseline
Confirm clean tree (only sprint artifacts untracked); `npm run verify:skill-docs && check:workflow-contract && validate-skills` all green.

### Step 2: G7 — Remove brainstorm `touch .approved-*` block
Edit `skills/brainstorm/SKILL.md.tmpl` lines 215-219: replace bash block with prose explaining the user's reply IS the approval.

### Step 3: G7 — Update vibe SKILL.md.tmpl
Edit 6 references to `.approved-spec-*`:
- Lines 78-79 (stage matrix): collapse rows 1-2 into a single THINK row keyed on `spec-*.md` existence (no marker check).
- Line 105 (artifact contract): drop the `+ .approved-spec-...` requirement.
- Line 168 (Phase 3 dispatch description): rewrite "approved (marker file ... written)" → "approved (user reply)".
- Line 180: drop "resume on marker .approved-spec-*" mention.
- Line 220 (status display): remove `.approved-spec-* [Y/N]` column from the artifact list.

### Step 4: G7 — Update vibe stage-detection.md reference
Edit `skills/vibe/reference/stage-detection.md`:
- Lines 26, 28: remove `_HAS_SPEC_APPROVAL` variable (both `find` and `ls` fallback lines).
- Line 74: remove the helper case `THINK)   [ -n "$_HAS_SPEC" ] && [ -n "$_HAS_SPEC_APPROVAL" ] ;;` — replace with `THINK)   [ -n "$_HAS_SPEC" ] ;;` (existence of spec is the THINK trigger; PLAN advances when plan-*.md is written).

### Step 5: G2 — Fix docs/COMPARISON.md version
Replace `v0.3.0` at lines 5 and 563 with `v0.6.6`.

### Step 6: G3 — Fix docs/DESIGN.md status
Line 6: `Implemented (v0.5.7)` → `Implemented (v0.6.6)`.

### Step 7: G4 — package.json files += CHANGELOG.md
Insert `"CHANGELOG.md"` in alphabetical position (after `CLAUDE.md`).

### Step 8: G5 — validate-skills.sh comment update
Line 3 (and surrounding comment block): `{{PREAMBLE}} macro` → `{{PREAMBLE_CORE}} + {{PREAMBLE_REF_LINK}} tokens`.

### Step 9: G6 — check-plugin-sync.js multi-file invariant
Refactor invariant 4 from single regex on README to a configurable list:
```js
const VERSION_DOCS = [
    {file: "README.md", regex: /^Current stable version: (\d+\.\d+\.\d+)/m, label: "README.md"},
    {file: "docs/COMPARISON.md", regex: /\*\*版本：\*\* superomni v(\d+\.\d+\.\d+)/, label: "docs/COMPARISON.md header"},
    {file: "docs/DESIGN.md", regex: /\*\*Status:\*\* Implemented \(v(\d+\.\d+\.\d+)\)/, label: "docs/DESIGN.md status"},
];
```
For each: read file; if file exists but regex doesn't match → fail with hint. If matches → assert version equals package.json version.

### Step 10: Verify check-plugin-sync still green after refactor
`npm run check:plugin-sync` exits 0 (after Steps 5-6 fixed the docs).

### Step 11: G7 demo — verify no marker references remain
- `grep -rn "approved-spec\|HAS_SPEC_APPROVAL\|approval marker" skills/vibe/ skills/brainstorm/ skills/using-skills/` returns 0.
- `find docs/superomni/specs -name ".approved-spec-*"` returns 0.

### Step 12: G6 demo — multi-file version drift firing
Inject mismatch in `docs/DESIGN.md` (e.g., change v0.6.6 → v9.9.9); run `npm run check:plugin-sync`; expect exit 1 with specific diagnostic; restore.

### Step 13: G1 — Update CI workflow
Edit `.github/workflows/validate.yml`:
- Ubuntu `validate` job: add 3 steps after `Validate skill format`:
  - `Verify fixture parity` → `npm run verify:fixture-parity`
  - `Test generators` → `npm run test:generators`
  - `Check plugin sync` → `npm run check:plugin-sync`
- Windows `validate-windows` job: add 2 steps after `Score workflow reports`:
  - `Test generators` → `npm run test:generators`
  - `Check plugin sync` → `npm run check:plugin-sync`

### Step 14: Version bump (0.6.5 → 0.6.6)
- `package.json`
- `.claude-plugin/marketplace.json` ×2
- `.claude-plugin/plugin.json`
- `claude-skill.json`
- `README.md` `Current stable version: 0.6.5` → `0.6.6`

### Step 15: CHANGELOG entry
`[0.6.6] — 2026-05-15` above the 0.6.5 entry. Document all 7 G items.

### Step 16: Final regression gate
- All 7 CI gates locally green: `verify:skill-docs` (umbrella) + `check:workflow-contract` + `validate-skills`
- All global invariants preserved (skill/agent counts, EnterPlanMode rule, design-md-library, ${CLAUDE_SKILL_DIR}, no flat reference.md, total skill body lines)

### Step 17: Commit + write evaluation + release artifacts
Single commit on top of d9461c5 (v0.6.5). Evaluation + release artifacts. ASK before push.

## Testing Strategy

- Per-step grep + line-count + filesystem checks
- Step 10: `check-plugin-sync` re-run after multi-file refactor (regression for already-fixed bugs)
- Step 11: `grep`-based G7 completeness verification
- Step 12: Inject + restore for G6 multi-file invariant
- Step 16: Full umbrella green

## Rollback

`git revert <commit>` or `git reset --hard d9461c5`.

## Success Criteria

- [ ] All 7 G items implemented (verifiable via grep/file-existence/CI-pass).
- [ ] All 7 CI gates green (locally; CI itself will validate this on push).
- [ ] Version bump landed across 5 manifests + README + 2 docs + CHANGELOG.
- [ ] G7: zero marker file references remain anywhere.

## Milestones (4)

1. **M1** — G7 marker removal complete (Steps 2-4, 11)
2. **M2** — Doc version drifts fixed + G6 multi-file (Steps 5-6, 9-10, 12)
3. **M3** — Tooling cleanups (Steps 7-8) + CI workflow added (Step 13) + version bump (Step 14)
4. **M4** — Final gate + commit (Steps 16, 17)

P0 risks: **none**. Highest = vibe stage detection breaks after G7 refactor → mitigated by Step 11 grep verification + Step 16 final gate.

## Next Stage

On DONE → REVIEW.
