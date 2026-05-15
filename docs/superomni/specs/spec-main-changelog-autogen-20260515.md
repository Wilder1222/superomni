# superomni CHANGELOG Auto-Generation (v0.6.10)

**Branch:** `feat/changelog-autogen` (off main 5f7d947 = PR #50 merged)
**Session:** `changelog-autogen`  **Date:** 20260515

## Why this spec

After 5 audit-driven sprints (v0.6.5-v0.6.9), each one wrote a manual `CHANGELOG.md` entry that took 5-10 minutes to compose. The entries are rich and structured — Fixed / Added / Changed / Removed / Why this matters / Verified / Deferred — but composition is repetitive and pattern-matchable.

`docs/IMPLEMENTATION.md` Current Backlog explicitly defers "CHANGELOG auto-generation from commits" as a v0.7.0+ item.

Examination of v0.6.5-v0.6.9 commits shows commit messages are **already structured**:
- **Header**: Conventional Commits format (`feat:` / `fix:` / `chore:` + scope summary + `(vX.Y.Z)` suffix)
- **Body**: rich multi-paragraph content with sections like `What:`, `Plan amendments`, `Verified:`, `Pipeline artifacts:`

A generator that **extracts structure from commits** and produces a **CHANGELOG draft skeleton** would save real authoring time without trying to fully replace human judgment.

## Problem

| # | Problem | Severity |
|---|---|---|
| 1 | CHANGELOG entry composition is manual; ~5-10 min per sprint to format Fixed/Added/Changed sections from commit data | **P2** (real cost; not blocking) |
| 2 | Conventional Commits prefix → CHANGELOG section mapping is folk-knowledge (`feat:` → Added, `fix:` → Fixed, etc.); no tooling enforces consistency | **P3** |
| 3 | CHANGELOG entries are **the** canonical record. Manually composing them risks omission (forgetting an item) or inconsistency (different sprints using slightly different section names) | **P2** |

## Goals

- **G1.** New `lib/gen-changelog.js` (~200 LOC). Inputs: a version range (`<from>..<to>` or "since last tag" auto-detection). Outputs: a CHANGELOG entry skeleton **printed to stdout** (caller redirects or copy-pastes).
- **G2.** Categorization: parse Conventional Commits prefix (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`) → map to CHANGELOG sections (Added, Fixed, Changed, Changed, Changed, Changed). Configurable via top-of-file `PREFIX_TO_SECTION` map.
- **G3.** Commit body parsing: extract the first 1-3 sentences of body following the header (skipping blank lines + boilerplate like Co-Authored-By trailer) as the bullet's expanded description.
- **G4.** Skip merge commits (`Merge pull request ...`) and bot commits (Dependabot, etc.) — the actual change is in the underlying feat/fix commits.
- **G5.** Output template includes:
  - `## [<target-version>] — <today-YYYY-MM-DD>`
  - Sections in order: Added, Fixed, Changed, Removed (only sections with at least one bullet print)
  - Each bullet: `- **<scope>** — <expanded body summary>`
  - Trailing reminder: `<!-- TODO: add Why this matters / Verified / Deferred subsections manually -->`
- **G6.** New npm script `gen:changelog` for discoverability. Optional `--from <ref>` / `--to <ref>` flags; default = "since last tag, to HEAD".
- **G7.** Add 1-line note in `framework-management/SKILL.md.tmpl` Supporting Files documenting the tool ("for new sprints, run `npm run gen:changelog -- --to HEAD` to scaffold the CHANGELOG entry; fill in Why-this-matters + Verified manually").

## Non-Goals (YAGNI)

- **NOT** auto-generating Why this matters, Verified, or Deferred subsections. These require synthesis the commit doesn't carry; human writes them.
- **NOT** replacing the manual entry. Tool produces a **skeleton draft**; human reviews and completes.
- **NOT** auto-committing or auto-editing CHANGELOG.md. Output to stdout only; safe to dry-run.
- **NOT** parsing commit body beyond first few sentences. Full body extraction would clutter the skeleton.
- **NOT** Conventional Commits validation (e.g., enforcing the format on commit). That's a husky/pre-commit-hook concern, separate sprint.
- **NOT** version bump automation (`npm version patch` etc.). Separate concern.
- **NOT** CHANGELOG drift verification (does the file match git log?). Could be a future Invariant 6 in check-plugin-sync, but separate.
- **NOT** changing skill / agent / command counts.

## Proposed Solution

**Selected approach: M — "Skeleton generator. Stdout only. Conventional Commits driven."**

### Phase 1 — Implementation

1. New file `lib/gen-changelog.js`:
   - CLI args: `--from <ref>` / `--to <ref>` / `--version <X.Y.Z>` (defaults: since last tag, to HEAD, package.json version)
   - Run `git log --no-merges --format='%H|%s|%b---END---' <range>` to get structured commit list
   - For each commit:
     - Parse header: `^(feat|fix|chore|docs|refactor|test)(\(.+\))?: (.+?)(\s*\(v[\d.]+\))?$`
     - If no match (Merge, Co-Authored-By trailer-only commits, etc.): skip with stderr note
     - Map prefix to section via `PREFIX_TO_SECTION`
     - Body parse: first paragraph (lines until blank line) → use as expanded description; truncate to 200 chars
   - Group commits by section
   - Print skeleton:
     ```
     ## [<version>] — <today YYYY-MM-DD>

     ### Added
     - **<header summary>** — <body first sentence>
     - ...

     ### Fixed
     - ...

     <!-- TODO: add 'Why this matters' / 'Verified' / 'Deferred (v0.X.Y+ backlog)' subsections manually -->

     ---
     ```
2. `package.json` script: `"gen:changelog": "node lib/gen-changelog.js"`
3. `framework-management/SKILL.md.tmpl` Supporting Files: 1-line note documenting the tool

### Phase 2 — Verification

- Run on v0.6.5-v0.6.9 commits (`gen-changelog --from e33d0f2 --to 5f7d947 --version 0.7.0-test`)
- Compare output to actual CHANGELOG entries; confirm skeleton is meaningful starting point
- Edge cases: merge commits skipped; commits without prefix flagged on stderr but not crashed
- Negative demo: pass invalid range → exit 1 with usage message
- Positive demo: pass valid range → stdout has `## [version]` + at least one section + TODO comment

## Key Design Decisions

| Decision | Choice | Rationale | Principle |
|----------|--------|-----------|-----------|
| Output format | Stdout only (no file write) | Tool produces draft; user reviews and pastes/edits. Avoids destructive file ops. | YAGNI, careful |
| Body extraction | First paragraph (until blank line), truncated 200 chars | Preserves the most informative sentence; longer body would clutter skeleton | Pragmatic |
| Version inference | `package.json` version (default); `--version` override | Matches project convention; v0.6.x sprints all bump package.json before CHANGELOG entry | DRY |
| Date format | `YYYY-MM-DD` (matches existing CHANGELOG entries) | Consistency with manual style | DRY |
| Ref defaults | `--from <last-tag>`, `--to HEAD` | "Since last shipped" semantics | Explicit |
| Sections | Added/Fixed/Changed/Removed (4 standard); skip empty sections | Matches Keep-a-Changelog spec + actual usage in v0.6.x | Convention |
| Merge commit handling | Skip silently (header matches `Merge pull request`) | Real changes are in the merged commits | Pragmatic |
| Conventional Commits validation strictness | Permissive — non-matching commits get stderr note + grouped under "Other" section | Don't crash on irregular commits; flag for human review | Pragmatic |
| Test fixture / golden | Run on v0.6.5-v0.6.9 range; diff vs actual entries (informational) | Real-world test; never assert byte-equality (skeleton ≠ final) | Explicit |
| `bin/` vs `lib/` location | `lib/gen-changelog.js` | Matches `lib/gen-skill-docs.js`, `lib/check-*.js` family pattern | DRY |

## Acceptance Criteria

### Phase 1 — Implementation

- [ ] `lib/gen-changelog.js` exists; ~200 LOC; node stdlib only
- [ ] CLI accepts `--from <ref>`, `--to <ref>`, `--version <X.Y.Z>`; sensible defaults
- [ ] Conventional Commits prefix → section mapping table at top of file
- [ ] Merge commits skipped silently; non-Conventional commits go to "Other" section with stderr note
- [ ] Body extraction: first paragraph, truncated to ~200 chars
- [ ] Output: `## [<version>] — <date>` + section headers + bullets + TODO comment
- [ ] `package.json` adds `gen:changelog` script

### Phase 2 — Verification

- [ ] Run `npm run gen:changelog -- --from e33d0f2 --to HEAD --version 0.7.0-draft` on the v0.6.5-v0.6.9 range; output is non-empty, well-formed, includes `## [0.7.0-draft]`, has at least 5 bullets across Added/Fixed sections
- [ ] Negative: invalid range (`--from nonexistent-sha`) → exit 1 with stderr error
- [ ] No file is written by default (stdout only)
- [ ] Clean state: `npm run verify:skill-docs` umbrella unaffected

### Documentation

- [ ] `framework-management/SKILL.md.tmpl` Supporting Files section has 1-line note about the tool

### Global regression gates

- [ ] All 8 CI gates locally green: `verify:skill-docs` umbrella + `check:workflow-contract` + `validate-skills`
- [ ] `${CLAUDE_SKILL_DIR}` literal token preserved (15)
- [ ] `EnterPlanMode → brainstorm` rule preserved (5 mentions in CLAUDE.md)
- [ ] `frontend-design/reference/design-md-library/*` unchanged (9 entries)
- [ ] No flat `reference.md` files (0)
- [ ] Skill / agent counts unchanged (28 / 5)
- [ ] No `.approved-spec-*` markers (0; v0.6.6 G7 invariant)
- [ ] Total skill body lines: max +5 (framework-management note only)

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` show `0.6.10`
- [ ] `README.md` `Current stable version: 0.6.10`
- [ ] `docs/COMPARISON.md` header + footer → 0.6.10
- [ ] `docs/DESIGN.md` Version + Status → 0.6.10
- [ ] `docs/AGENTS.md` `**Last updated:** v0.6.10`
- [ ] `docs/IMPLEMENTATION.md` Version + Last updated → 0.6.10
- [ ] `CHANGELOG.md` has new `[0.6.10] — 2026-05-15` entry — **and this entry itself was generated using the new tool, then manually completed (dogfooding)**

## Why patch (0.6.10) — per user directive

User decided: stay on the v0.6.x patch cadence. Tool is small (~200 LOC, single new lib file, no API breaks, no behavior change to existing CI). Continues the established v0.6.5-v0.6.9 patch rhythm. v0.7.0 reserved for future architectural minor (e.g., `context: fork` migration when runtime evidence is available).

## Open Questions

None. Tool is small + scoped; design choices are mostly Conventional Commits convention.

## Frontend Design Note

N/A — CLI tool only.

## Deferred to v0.7.0+ Backlog

1. `context: fork` migration (architectural; runtime evidence required).
2. `model:` / `effort:` per-skill overrides.
3. `$ARGUMENTS` substitution adoption (low signal; raise priority if observed).
4. `paths` glob auto-trigger (likely never).
5. Live `/vibe` E2E test (sandbox required).
6. CHANGELOG drift verification (Invariant 6 candidate — does CHANGELOG match git log?). Built on top of v0.6.10's gen-changelog.
7. Windows job fixture-parity.
8. `bin/audit-repo-invariants` data-driven exclude list.
9. Conventional Commits enforcement (pre-commit hook). Separate from this sprint.

## Next Stage

On approval → auto-advance to **PLAN**.

---

**Status: DONE — spec ready for user approval.**

Patch (v0.6.10) per user directive — stays on v0.6.x cadence. Single new lib/, single new npm script, ~200 LOC, no behavior change to existing CI. v0.7.0 reserved for architectural minor.
