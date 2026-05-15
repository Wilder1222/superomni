# Implementation Plan: IMPLEMENTATION.md + COMPARISON 7.2 Sync (v0.6.9)

**Spec:** `docs/superomni/specs/spec-main-implementation-comparison-sync-20260515.md`
**Branch:** `feat/implementation-comparison-sync` (off feat/agents-doc-sync at 7cdb308 = v0.6.8 local)
**Session:** `implementation-comparison-sync`  **Date:** 20260515

## Overview

Single-phase patch. Two doc fixes (IMPLEMENTATION.md version+roadmap; COMPARISON 7.2 false claims) + VERSION_DOCS extension + version bump.

## Steps

### Step 1: Baseline

`git status` clean (only sprint artifacts untracked); all 8 CI gates green from v0.6.8.

### Step 2: Rewrite `docs/IMPLEMENTATION.md` Version + Last updated lines

- Line 5: `**Version:** 0.3.0` → `**Version:** 0.6.9`
- Insert new line after: `**Last updated:** v0.6.9`

### Step 3: Rewrite `docs/IMPLEMENTATION.md` Roadmap section (lines 459-486)

Replace with two subsections:

**Version History** (compressed):
- v0.2.0–v0.5.x: foundational skill set + agent v1 + ship+retrospective merge
- v0.6.0: agent consolidation 11→5; preamble diet; reference/<topic>.md; Anthropic frontmatter alignment
- v0.6.1–v0.6.4: incremental — token-literal advisory; argument-hint; disable-model-invocation; dynamic context (vibe/verification/release)
- v0.6.5: README+plugin-sync gate
- v0.6.6: CI gap close + 3 missing gates wired + .approved-spec-* marker mechanism removed
- v0.6.7: plan-content auto-linter (CI hard-gate for v0.6.3 Pre-Destructive Gate)
- v0.6.8: docs/AGENTS.md rewrite + Invariant 5 (agent-doc sync)
- v0.6.9: docs/IMPLEMENTATION.md + docs/COMPARISON.md § 7.2 sync

Note: each major item summarized; full per-version detail lives in CHANGELOG.md.

**Current Backlog (v0.7.0+)** (the v0.6.x retros' deferred items):
- `context: fork` migration (architectural; needs runtime evidence)
- `model:` / `effort:` per-skill overrides
- `$ARGUMENTS` / `$N` substitution adoption
- `paths` glob auto-trigger (likely never)
- Live `/vibe` E2E test (sandbox required)
- CHANGELOG auto-generation from commits
- Windows job fixture-parity
- `bin/audit-repo-invariants` data-driven exclude list

### Step 4: Rewrite `docs/COMPARISON.md` § 7.2 false claims

- Lines ~390-394: replace "❌ 无自动化测试套件" item with "✅ 自动化测试套件" item describing v0.6.6+ CI infrastructure (9 gates)
- Lines ~438-441: replace "❌ 无变更日志" item with "✅ 完整 CHANGELOG.md" item describing v0.6.0+ maintenance

Preserve § 7 structural framing (it's a comparative weakness/strength analysis); only correct the claims that became false after v0.6.0+.

### Step 5: Extend `lib/check-plugin-sync.js` VERSION_DOCS

Add 5th entry to VERSION_DOCS array:

```js
{
    file: "docs/IMPLEMENTATION.md",
    regex: /\*\*Last updated:\*\* v(\d+\.\d+\.\d+)/,
    label: "docs/IMPLEMENTATION.md `**Last updated:** vX.Y.Z`",
},
```

### Step 6: Version bump 0.6.8 → 0.6.9

Bump in:
- `package.json`
- `.claude-plugin/marketplace.json` (×2)
- `.claude-plugin/plugin.json`
- `claude-skill.json`
- `README.md` `Current stable version`
- `docs/COMPARISON.md` (header + footer)
- `docs/DESIGN.md` (Version + Status)
- `docs/AGENTS.md` `**Last updated:**`
- `docs/IMPLEMENTATION.md` (Version + Last updated — already done in Step 2)

### Step 7: CHANGELOG entry

`[0.6.9] — 2026-05-15` above 0.6.8. Document under Fixed (IMPLEMENTATION.md, COMPARISON 7.2) + Added (VERSION_DOCS extension).

### Step 8: Final regression gate

All 8 CI gates locally green. All global invariants preserved (28/5/5/0/15/9/0/markers=0).

### Step 9: Demos

- Negative demo: change `docs/IMPLEMENTATION.md` `**Last updated:**` to v9.9.9; run check:plugin-sync; expect exit 1; restore.
- Positive demo: confirm clean state with 5 docs synced (Invariant 4 covers all 5 via VERSION_DOCS).

### Step 10: Commit + write evaluation + release artifacts

Single commit on top of 7cdb308 (v0.6.8). ASK before push.

## Testing Strategy

- Steps 2-5: per-step grep verification
- Step 8: `npm run verify:skill-docs` umbrella + `check:workflow-contract` + `validate-skills`
- Step 9: inject + restore demo for VERSION_DOCS extension

## Rollback

`git revert <commit>` or `git reset --hard 7cdb308`.

## Success Criteria

- [ ] `docs/IMPLEMENTATION.md` Version 0.6.9 + Last updated line + Roadmap rewritten
- [ ] `docs/COMPARISON.md` § 7.2 corrected (no false claims)
- [ ] VERSION_DOCS has 5 entries
- [ ] All 8 CI gates green + 1 negative demo verified
- [ ] Version 0.6.9 across 5 manifests + README + 4 docs + CHANGELOG
- [ ] All global invariants preserved

## Milestones (3)

1. **M1** — IMPLEMENTATION.md fixed (Steps 1-3)
2. **M2** — COMPARISON 7.2 fixed + VERSION_DOCS extended (Steps 4-5)
3. **M3** — Version bump + final gate + commit (Steps 6-10)

P0 risks: **none**. Highest = COMPARISON.md prose rewrite tone matches existing doc voice (mitigation: read context around § 7.2 before editing).

## Next Stage

On DONE → REVIEW.
