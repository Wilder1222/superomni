# Implementation Plan: CHANGELOG Auto-Generation (v0.6.10)

**Spec:** `docs/superomni/specs/spec-main-changelog-autogen-20260515.md`
**Branch:** `feat/changelog-autogen` (off main 5f7d947 = PR #50 merged)
**Session:** `changelog-autogen`  **Date:** 20260515

## Overview

Single-phase patch: ship `lib/gen-changelog.js` skeleton-generator + `gen:changelog` npm script + framework-management note + version bump 0.6.9 → 0.6.10 across the standard 9 surfaces.

## Steps

### Step 1: Baseline

`git status` clean (only sprint artifacts untracked); all 8 CI gates green from v0.6.9.

### Step 2: Author `lib/gen-changelog.js`

~200 LOC node script. Structure:

```js
// 1. Parse CLI args: --from <ref>, --to <ref>, --version <X.Y.Z>
// 2. Defaults: --from = `git describe --tags --abbrev=0` (last tag) || ROOT_COMMIT_FALLBACK
//             --to = HEAD
//             --version = JSON.parse(package.json).version
// 3. Run: git log --no-merges <from>..<to> --format='COMMIT-START\n%H\n%s\n%b\nCOMMIT-END'
// 4. For each commit:
//    - Parse subject: ^(feat|fix|chore|docs|refactor|test)(\(.+\))?: (.+?)(\s*\(v[\d.]+\))?$
//    - Skip if subject is "Merge pull request..." or matches BOT_AUTHORS pattern
//    - Skip if message body is empty AND no Conventional prefix (very low signal)
//    - Group into PREFIX_TO_SECTION map
//    - Body: extract first paragraph (until blank line); skip Co-Authored-By trailer; truncate ~200 chars
// 5. Print template:
//    ## [<version>] — <YYYY-MM-DD>
//
//    ### Added
//    - **<scope>** — <body summary>
//    ...
//    ### Fixed
//    ...
//    ### Other (non-conventional commits)  // only if any non-prefix commits found
//    ...
//
//    <!-- TODO: add 'Why this matters' / 'Verified' / 'Deferred (v0.X.Y+ backlog)' subsections manually -->
//
//    ---
```

Mirrors the shape of `lib/check-plugin-sync.js` for consistency: shebang + strict mode + top-of-file constants (`PREFIX_TO_SECTION`, `BODY_TRUNCATE`, `MERGE_PATTERN`) + main body + `process.exit(0)`.

### Step 3: Wire `gen:changelog` npm script

Edit `package.json` `scripts` block:
```json
"gen:changelog": "node lib/gen-changelog.js",
```

Place after `gen-skills:ps` for grouping with other generators.

### Step 4: Run on v0.6.5-v0.6.9 commits — verify shape

```bash
npm run gen:changelog -- --from e33d0f2 --to 5f7d947 --version 0.6.10-test
```

Expected:
- Stdout starts with `## [0.6.10-test] — 2026-05-15`
- At least 2 sections (Added + Fixed) populated
- Each bullet has scope + body summary
- TODO comment present at end
- Non-empty: ≥ 5 bullets total (5 commits in range, all Conventional)
- No file written (verified by `git status` post-run)

### Step 5: Edge case demos

1. Invalid range: `npm run gen:changelog -- --from nonexistent-sha`. Expected: exit 1, stderr error message.
2. No commits in range: `npm run gen:changelog -- --from HEAD --to HEAD`. Expected: exit 0 with empty skeleton (just the version header + TODO).
3. Range including merge commits: confirmed via Step 4 (e33d0f2..5f7d947 includes the merge `5f7d947`); merge skipped silently.

### Step 6: Add framework-management note

Add 1-line entry to `skills/framework-management/SKILL.md.tmpl` Supporting Files section:

```
**CHANGELOG draft generator (v0.6.10+):** for new sprints, run `npm run gen:changelog -- --version <X.Y.Z>` to scaffold the CHANGELOG entry from Conventional Commits. The tool prints a skeleton draft to stdout; manually complete the *Why this matters*, *Verified*, and *Deferred* subsections.
```

### Step 7: Version bump 0.6.9 → 0.6.10

Bump in 9 surfaces:
- `package.json`
- `.claude-plugin/marketplace.json` (×2)
- `.claude-plugin/plugin.json`
- `claude-skill.json`
- `README.md` `Current stable version`
- `docs/COMPARISON.md` (header + footer)
- `docs/DESIGN.md` (Version + Status)
- `docs/AGENTS.md` `**Last updated:**`
- `docs/IMPLEMENTATION.md` (Version + Last updated)

### Step 8: Generate v0.6.10 CHANGELOG entry using the new tool (DOGFOOD)

```bash
npm run gen:changelog -- --version 0.6.10 > /tmp/v0.6.10-skeleton.md
```

Read the skeleton; manually complete it into a full CHANGELOG entry (Why this matters / Verified / Deferred). Insert above the `## [0.6.9]` entry. Recording in execution doc whether the skeleton was useful (real-world dogfood signal for the tool).

### Step 9: Final regression gate

All 8 CI gates locally green. All global invariants preserved.

### Step 10: Commit + write evaluation + release artifacts

Single commit on top of 5f7d947 (post-PR-50 main). ASK before push.

## Testing Strategy

- Step 4: positive run on real fixture (v0.6.5-v0.6.9 range)
- Step 5: 3 edge case demos
- Step 8: real-world dogfood (use the tool to generate v0.6.10's own CHANGELOG entry)
- Step 9: full umbrella green

## Rollback

`git revert <commit>` or `git reset --hard 5f7d947`.

## Success Criteria

- [ ] `lib/gen-changelog.js` exists and produces well-formed skeleton
- [ ] `gen:changelog` npm script wired
- [ ] 3 edge cases verified
- [ ] v0.6.10 CHANGELOG entry written using the tool (dogfood)
- [ ] framework-management 1-line note added
- [ ] Version 0.6.10 across 5 manifests + README + 4 docs + CHANGELOG
- [ ] All 8 CI gates green; all global invariants preserved

## Milestones (3)

1. **M1** — `lib/gen-changelog.js` works on real commits (Steps 1-5)
2. **M2** — Tool dogfooded for v0.6.10 entry; framework-management note added (Steps 6-8)
3. **M3** — Version bump + final gate + commit (Steps 7, 9, 10)

P0 risks: **none**. Highest = body extraction misparses Co-Authored-By trailers (mitigation: strip lines matching `^Co-Authored-By:` before paragraph extraction).

## Next Stage

On DONE → REVIEW.
