# superomni Plugin Sync Gate + Stale-Doc Fixes (v0.6.5)

**Branch:** `feat/plugin-sync-gate` (off main e33d0f2 = v0.6.4 merge)
**Session:** `plugin-sync-gate`  **Date:** 20260515

## Why this spec

Two real bugs surfaced after the v0.6.1-v0.6.4 PR merge to main:

1. **README.md still says "Current stable version: 0.6.0"** — actual is 0.6.4. The user's first impression carries a 4-version-old number. P1 staleness.
2. **`claude-skill.json` is missing `style-capture` from its `commands` array** — but `commands/style-capture.md` exists on disk. Plugin users (who load via `marketplace.json`-driven `commandsDir: "./commands"` discovery) get the command; npm-install legacy users (who load via `claude-skill.json`'s explicit list) don't. Real data drift between two manifest files maintained by hand.

Plus a structural risk: `marketplace.json`, `plugin.json`, `claude-skill.json`, and `package.json` each carry version + skill/command/agent metadata. There is **no CI gate** verifying they stay in sync. v0.6.4 already touched 4 of them for version bump; the next bump is one missed file away from a similar drift.

This sprint:
1. Fixes both stale items.
2. Adds `lib/check-plugin-sync.js` as a CI gate that catches future drift between the manifests + the `commands/` directory + the `skills/` directory.

## Problem

| # | Concrete problem | Impact |
|---|---|---|
| 1 | `README.md` line 5: `Current stable version: 0.6.0` | High user-visible: stale-version foot-impression on landing page |
| 2 | `claude-skill.json` `commands` array missing `style-capture` (file exists in `commands/`) | Medium: npm-install path users miss the command; plugin-install users see it |
| 3 | No CI gate ensures version-string consistency across `package.json` / `.claude-plugin/marketplace.json` (×2 occurrences) / `.claude-plugin/plugin.json` / `claude-skill.json` | Medium: every version bump is N-file manual diff; one miss = silent drift |
| 4 | No CI gate ensures `commands/` directory matches `claude-skill.json` `commands` array | Medium: same drift class as #2 |

## Goals

- **G1.** README.md updated to current version (0.6.5 by end of sprint).
- **G2.** `claude-skill.json` `commands` array includes all 11 commands matching `commands/*.md` files.
- **G3.** `lib/check-plugin-sync.js` — new CI gate that verifies:
  - All 5 version locations match (package.json, marketplace.json ×2, plugin.json, claude-skill.json).
  - `commands/*.md` files exactly match `claude-skill.json` `commands[].name` set (no missing, no extras).
  - `marketplace.json` `keywords` ≡ `plugin.json` `keywords` (set equality).
  - README.md mentions of "Current stable version: X" match `package.json` version.
- **G4.** Wire `check:plugin-sync` into `verify:skill-docs` umbrella.
- **G5.** `commands/release.md` and similar wired commands cross-checked.

## Non-Goals (YAGNI)

- **NOT** auto-generating any of the 4 manifest files from a single source of truth. Keeps the diff small; manual sync is fine if CI catches drift.
- **NOT** versioning the README using a build step. The 1-line text replacement is mechanical.
- **NOT** adding manifest-content schema validation (e.g., JSON Schema). The new check is field-set equality only.
- **NOT** changing skill / agent counts.
- **NOT** plan-content auto-linter (separate sprint, deferred).
- **NOT** `model:` / `effort:` per-skill (deferred).

## Proposed Solution

**Selected approach: H — "Fix two stale items + add structural CI gate."**

Two phases. Each independently shippable.

### Phase 1 — Fix stale items (LOW risk)

1. README.md: replace `Current stable version: 0.6.0` with the current version (will be `0.6.5` after Step 12 version bump). Use a placeholder approach: bump README + 4 manifest files simultaneously in Step 12.
2. `claude-skill.json`: insert `{"name": "style-capture", "file": "commands/style-capture.md"}` in alphabetical position in the `commands` array.
3. Verify: `diff <(jq -r '.commands[].name' claude-skill.json | sort) <(ls commands/ | sed 's/\.md$//' | sort)` returns empty.

### Phase 2 — `lib/check-plugin-sync.js` CI gate (LOW risk)

1. New `lib/check-plugin-sync.js` (~100 LOC node script).
2. Performs 4 checks:
   - **Version sync**: read `package.json` version; assert `.claude-plugin/marketplace.json` (top-level + nested in `plugins[0]`), `.claude-plugin/plugin.json`, `claude-skill.json` all match.
   - **Commands sync**: read `commands/*.md` filenames (strip `.md`); read `claude-skill.json` `commands[].name`; assert set equality.
   - **Keywords sync**: read `plugin.json` keywords (set), `marketplace.json` `plugins[0].keywords` (set); assert equality.
   - **README version sync**: regex-match `Current stable version: X.Y.Z` in README.md; assert matches `package.json` version.
3. On any mismatch: stderr the specific drift, exit 1.
4. On all green: print `Plugin sync check passed: 4 invariants validated.`, exit 0.
5. Wire into `verify:skill-docs` umbrella + standalone `check:plugin-sync` script.

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| Source-of-truth strategy | `package.json` is the single version source; checker compares others to it | matches semver / npm convention; simpler than parsing 4 files for consensus | Explicit |
| Hard error vs advisory | Hard error (exit 1) | These are real correctness invariants, not authoring nudges; advisories are for taste | Explicit, Completeness |
| Commands-set check semantics | Exact set equality; both directions (no missing, no extras) | Either drift is a real bug | Completeness |
| Keywords-set comparison | Order-independent set equality | JSON arrays semantically unordered for keyword tags | Pragmatic |
| README version regex | `/^Current stable version: (\d+\.\d+\.\d+)/m` | Single canonical phrase; existing line is the only match | Explicit |
| Tool: bash or node? | Node (consistent with existing 3 lib/check-*.js + uses no extra deps) | DRY with existing checker family | DRY |
| README/manifest versioning during sprint | Bump all 5 simultaneously in Step 12 | Avoid intermediate-state CI failures | Pragmatic |
| Sprint version target | 0.6.5 patch | Bug-fix + defensive CI gate; no breaking-change surface | Explicit |

## Acceptance Criteria

### Phase 1

- [ ] `grep "Current stable version" README.md` shows `0.6.5`.
- [ ] `jq -r '.commands[].name' claude-skill.json | sort` matches `ls commands/ | sed 's/\.md$//' | sort` exactly.
- [ ] All 11 commands present in claude-skill.json.

### Phase 2

- [ ] `lib/check-plugin-sync.js` exists.
- [ ] `npm run check:plugin-sync` exits 0 on the post-fix repo state.
- [ ] Each of the 4 invariants demonstrated to fire on injection:
  - inject mismatched version in claude-skill.json → exit 1, specific message; restore.
  - delete a command from claude-skill.json → exit 1; restore.
  - change a keyword in plugin.json → exit 1; restore.
  - corrupt the README version line → exit 1; restore.
- [ ] `package.json` adds `check:plugin-sync` script.
- [ ] `verify:skill-docs` umbrella wires it in.

### Global regression gates

- [ ] `${CLAUDE_SKILL_DIR}` literal token preserved (15 occurrences).
- [ ] `EnterPlanMode → brainstorm` rule preserved (5 mentions in CLAUDE.md).
- [ ] `frontend-design/reference/design-md-library/*` unchanged (9 entries).
- [ ] No flat `reference.md` files (0).
- [ ] Skill / agent counts unchanged (28 / 5).
- [ ] All other CI gates remain green: `verify:skill-docs`, `check:workflow-contract`, `validate-skills`, `verify:fixture-parity`, `test:generators`, `audit:invariants`.

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` show `0.6.5`.
- [ ] `README.md` `Current stable version: 0.6.5`.
- [ ] `CHANGELOG.md` has new `[0.6.5] — 2026-05-15` entry.

## Open Questions

None.

## Frontend Design Note

N/A — no UI work.

## Deferred to v0.7.0+ Backlog (unchanged)

1. Plan-content auto-linter (CI hard-gate for v0.6.3 Pre-Destructive Gate).
2. `context: fork` migration (architectural; needs design sprint).
3. `model:` / `effort:` per-skill overrides.
4. `$ARGUMENTS` substitution adoption.
5. `paths` glob auto-trigger (likely never).
6. Live `/vibe` E2E test.

## Next Stage

On approval → auto-advance to **PLAN**.

---

**Status: DONE — spec ready for user approval.**
