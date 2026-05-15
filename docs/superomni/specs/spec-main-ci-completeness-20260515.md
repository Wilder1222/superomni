# superomni CI Completeness + Doc Version Drift (v0.6.6)

**Branch:** `feat/ci-completeness` (off feat/plugin-sync-gate at d9461c5 = v0.6.5 local)
**Session:** `ci-completeness`  **Date:** 20260515

## Why this spec

Project审阅 (post-v0.6.5) surfaced 6 real bugs across 3 severity tiers. Common theme: **work that has shipped locally is not actually enforced for everyone else**. Specifically:

1. `.github/workflows/validate.yml` runs `gen-skills`, `check:skill-docs`, `check:workflow-contract`, `score:workflow`, `validate-skills`. It does **not** run `verify:fixture-parity` (v0.6.1), `test:generators` (v0.6.2), or `check:plugin-sync` (v0.6.5). Three CI gates added by 3 sprints; zero of them on GitHub.
2. `docs/COMPARISON.md` header says "superomni v0.3.0" — 8 minor versions stale; this is the public comparison doc.
3. `docs/DESIGN.md` says "Status: Implemented (v0.5.7)" — 8 patches stale.
4. `package.json` `files` array does not include `CHANGELOG.md` — npm-published tarballs don't carry version history.
5. `lib/validate-skills.sh` line 3 comment says check for `{{PREAMBLE}} macro` — actual token is `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}` since v0.6.0.
6. `check-plugin-sync.js` only checks the README version line. `docs/COMPARISON.md` and `docs/DESIGN.md` carry version assertions (1 of 6 above) that are not invariant-checked.

This sprint fixes all 6 in a single patch.

## Problem

| # | Bug | Severity | Evidence |
|---|-----|----------|----------|
| 1 | CI does not run `verify:fixture-parity`, `test:generators`, `check:plugin-sync` | **P1** | `.github/workflows/validate.yml` reviewed; 3 npm scripts absent |
| 2 | `docs/COMPARISON.md` header says v0.3.0 (actual 0.6.5) | **P1** | line 5 + line 563 footer |
| 3 | `docs/DESIGN.md` Status: "Implemented (v0.5.7)" (actual 0.6.5) | **P2** | line 6 |
| 4 | `package.json` `files` array missing `CHANGELOG.md` | **P2** | `npm pack --dry-run` output omits CHANGELOG |
| 5 | `lib/validate-skills.sh` comment says `{{PREAMBLE}}` (deprecated since v0.6.0) | **P3** | line 3 |
| 6 | `check-plugin-sync.js` invariant covers README only; misses docs/* version anchors | **P2** | post-fix #2/#3 they would still drift silently |
| 7 | `.approved-spec-*` marker file mechanism entirely (user directive: no approval-marker storage anywhere). The pipeline gates on user's conversational reply, not on a filesystem signal | **P1** | user feedback during this sprint's THINK stage (two iterations: first "specs/ should be clean", then "no marker file at all") |

## Goals

- **G1.** `.github/workflows/validate.yml` runs all 3 missing gates on both ubuntu and windows jobs (where applicable; ps1-fixture parity is intrinsically Windows-friendly via pwsh).
- **G2.** `docs/COMPARISON.md` header version → 0.6.6; footer reference → 0.6.6.
- **G3.** `docs/DESIGN.md` Status → "Implemented (v0.6.6)".
- **G4.** `package.json` `files` array includes `CHANGELOG.md`.
- **G5.** `lib/validate-skills.sh` comment block updated.
- **G6.** `lib/check-plugin-sync.js` invariant 4 (README version) generalized: scans a configured set of docs for "version: X.Y.Z" patterns, all must match `package.json`. `README.md`, `docs/COMPARISON.md`, `docs/DESIGN.md` initial set.
- **G7.** Remove the `.approved-spec-*` marker mechanism entirely (per user directive: no approval-marker file storage at all). The user's intent: the spec approval gate is the user's literal in-conversation reply ("继续" / "批准" / "A"); no filesystem signal needs to exist. Eliminate writes (`brainstorm`), reads (`vibe` Phase 1 detection), and references (vibe stage matrix + artifact contract) of `.approved-spec-*` files.

**Scope of removal:**
- `skills/brainstorm/SKILL.md.tmpl` lines 214-219: remove `touch ".approved-..."` block; replace with prose "If approved → report DONE and auto-advance to PLAN".
- `skills/vibe/SKILL.md.tmpl` lines 78, 79, 105, 168, 180, 220: rewrite stage matrix rows + artifact contract + status display to not reference `.approved-spec-*`. The new THINK→PLAN gate becomes: "spec-*.md exists AND user has explicitly said continue/approve in conversation" (a runtime conversational signal, not a filesystem marker).
- `skills/vibe/reference/stage-detection.md` lines 26, 28, 74: remove `_HAS_SPEC_APPROVAL` variable + the file-existence check.
- 7 pre-existing `.approved-spec-*` files already removed at sprint start (Step 0 done).

## Non-Goals (YAGNI)

- **NOT** doing a full audit of every `0.5.x` historical reference in `docs/DESIGN.md` — those are legitimate version-history sections and should stay.
- **NOT** generating CHANGELOG.md from commit history (separate enhancement).
- **NOT** adding `npm publish` automation in CI.
- **NOT** modifying any skill / agent / command counts.
- **NOT** modifying any v0.6.5 work (commits stay).
- **NOT** changing the CI workflow's job structure (just adding steps).

## Proposed Solution

**Selected approach: I — "Single bug-batch patch."**

One phase. Touch surfaces don't overlap. Single CI cycle.

### Phase 1 — Fix all 6 in lockstep

1. Update `.github/workflows/validate.yml`:
   - In ubuntu `validate` job, add 3 steps: `Verify fixture parity`, `Test generators`, `Check plugin sync`.
   - In windows `validate-windows` job, add 2: `Test generators`, `Check plugin sync`. (Skip fixture-parity on Windows since pwsh always exists; fixture-parity script self-skips ps1 if pwsh missing — it's bash that can't always run. On windows-latest GitHub runners bash via Git for Windows is available, so we could include it — but minimal scope: just add what's missing on ubuntu.)
2. `docs/COMPARISON.md`: line 5 `v0.3.0` → `v0.6.6`; line 563 `v0.3.0` → `v0.6.6`.
3. `docs/DESIGN.md`: line 6 `Implemented (v0.5.7)` → `Implemented (v0.6.6)`.
4. `package.json`: `files` array += `"CHANGELOG.md"`.
5. `lib/validate-skills.sh`: comment line 3 → reflect new tokens.
6. `lib/check-plugin-sync.js`: refactor invariant 4 to scan a list `[{file: "README.md", regex: /^Current stable version: (\d+\.\d+\.\d+)/m}, {file: "docs/COMPARISON.md", regex: /^\*\*版本：\*\* superomni v(\d+\.\d+\.\d+)/m}, {file: "docs/DESIGN.md", regex: /^\*\*Status:\*\* Implemented \(v(\d+\.\d+\.\d+)\)/m}]`. All matched versions must equal `package.json` version.
7. Remove approval-marker mechanism (G7):
   - 7 pre-existing `.approved-spec-*` files already deleted from `docs/superomni/specs/` at sprint start.
   - `skills/brainstorm/SKILL.md.tmpl`: remove the `touch ".approved-..."` bash block (lines 215-219). Rewrite the surrounding prose to say: "If approved → report DONE; the user's reply IS the approval signal; vibe will detect spec-*.md exists and the user said go."
   - `skills/vibe/SKILL.md.tmpl`: rewrite stage matrix rows 78-79 to collapse into a single THINK row: "`spec-*.md` exists + user has not yet replied with continue/approve" → THINK (spec awaiting reply). Adjust artifact contract (line 105) to remove the marker file requirement.
   - `skills/vibe/SKILL.md.tmpl` lines 168, 180: rewrite to say "the user reply IS the approval; no marker file needed".
   - `skills/vibe/SKILL.md.tmpl` line 220 status display: remove `.approved-spec-* [Y/N]` column.
   - `skills/vibe/reference/stage-detection.md`: remove `_HAS_SPEC_APPROVAL` variable (lines 26, 28); remove the helper line 74 that depends on it.
   - The new pipeline gate is purely conversational: brainstorm produces spec → STOPs and asks user → user says "继续" / "A" / "批准" → vibe (driven by user's same conversational turn) advances to PLAN. No filesystem signal between THINK-stop and PLAN-start.
8. Bump 0.6.5 → 0.6.6 across 5 manifest files + 3 docs files (covered above) + CHANGELOG.

## Key Design Decisions

| Decision | Choice | Rationale | Principle |
|----------|--------|-----------|-----------|
| Sprint shape | Single bug-batch | All 7 are LOW risk; touch surfaces don't overlap | Boil lakes |
| `check-plugin-sync.js` extension | Configurable list of doc-version anchors | Adding more docs later is just a list entry | Explicit, DRY |
| CI windows job — add fixture-parity? | No this sprint | Windows-bash availability assumption needs verification; ubuntu coverage is the urgent gap | Pragmatic |
| CHANGELOG in npm tarball | Yes | Standard practice; semver-aware users expect it | Pragmatic |
| `docs/IMPLEMENTATION.md` v0.2.0/v0.3.0 markers | Untouched | Those are roadmap history sections; legitimate historical content | Explicit |
| `docs/DESIGN.md` v0.x.x section headers | Untouched | History sections; only the top "Status: Implemented" is the canonical current-state assertion | Explicit |
| Approval signal | **User's conversational reply, no filesystem marker** | User directive (twofold: clean specs/, then no markers anywhere). The session conversation already carries the approval semantically; persisting it as a file added complexity for no value | Explicit, YAGNI |
| Cross-session resume | The `~/.omni-skills/sessions/last-session-artifacts.txt` cross-session fallback (already in vibe Phase 1) handles "approved spec from prior session" by detecting `spec-*.md` + `plan-*.md` co-existence (plan written = spec was approved). No marker required. | Existing cross-session-resume mechanism is sufficient | DRY |
| Batch all into 0.6.6 patch | Yes | LOW risk, single CI cycle, single PR | Boil lakes |

## Acceptance Criteria

### Phase 1

- [ ] `.github/workflows/validate.yml` ubuntu job runs `verify:fixture-parity`, `test:generators`, `check:plugin-sync` after `validate-skills`.
- [ ] `.github/workflows/validate.yml` windows job runs `test:generators` and `check:plugin-sync`.
- [ ] `grep "v0.3.0\|v0.5.7" docs/COMPARISON.md docs/DESIGN.md` returns 0 hits in headers (history sections OK).
- [ ] `node -e "console.log(require('./package.json').files.includes('CHANGELOG.md'))"` returns `true`.
- [ ] `grep "{{PREAMBLE}} macro" lib/validate-skills.sh` returns 0 hits.
- [ ] `lib/check-plugin-sync.js` reads version anchors from a list-based config; demonstrated to fire on injection of mismatch in `docs/COMPARISON.md` or `docs/DESIGN.md`.
- [ ] `npm run check:plugin-sync` exits 0 post-fix.
- [ ] G7: `find docs/superomni/specs -name ".approved-spec-*"` returns 0 matches (no markers anywhere).
- [ ] G7: `grep -rn "approved-spec\|HAS_SPEC_APPROVAL\|approval marker" skills/vibe/ skills/brainstorm/ skills/using-skills/` returns 0 matches.
- [ ] G7: `vibe/SKILL.md` stage matrix has 7 rows (one row per priority); the marker-dependent rows 1-2 are now collapsed into a single THINK detection row keyed on `spec-*.md` existence + conversational state.
- [ ] G7: `brainstorm/SKILL.md` Phase-final block contains no `touch .approved-*` bash; the human-gate prose is purely conversational.
- [ ] G7: Cross-session resume still works: a session with both `spec-*.md` and `plan-*.md` (the v0.6.x sprints' shape) is detected as PLAN/REVIEW stage by vibe, not stuck at THINK awaiting a marker.

### Global regression gates

- [ ] All 7 CI commands locally green: `verify:skill-docs` (now also runs check:plugin-sync), `check:workflow-contract`, `validate-skills`.
- [ ] `${CLAUDE_SKILL_DIR}` literal token preserved (15).
- [ ] `EnterPlanMode → brainstorm` rule preserved (5 mentions in CLAUDE.md).
- [ ] `frontend-design/reference/design-md-library/*` unchanged (9 entries).
- [ ] No flat `reference.md` files (0).
- [ ] Skill / agent counts unchanged (28 / 5).
- [ ] Total skill body lines unchanged (6,249).

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` show `0.6.6`.
- [ ] `README.md` `Current stable version: 0.6.6`.
- [ ] `docs/COMPARISON.md` header + footer → 0.6.6.
- [ ] `docs/DESIGN.md` Status: Implemented (v0.6.6).
- [ ] `CHANGELOG.md` has new `[0.6.6] — 2026-05-15` entry.

## Open Questions

None. All scope items are observed bugs with clear fixes.

## Frontend Design Note

N/A — no UI work.

## Deferred to v0.7.0+ Backlog (unchanged)

1. Plan-content auto-linter (CI hard-gate for v0.6.3 Pre-Destructive Gate).
2. `context: fork` migration (architectural).
3. `model:` / `effort:` per-skill overrides.
4. `$ARGUMENTS` substitution adoption.
5. `paths` glob auto-trigger (likely never).
6. Live `/vibe` E2E test.
7. CHANGELOG auto-generation from commits.
8. Windows job fixture-parity (after verifying bash-via-Git availability on windows-latest runners).

## Next Stage

On approval → auto-advance to **PLAN**.

---

**Status: DONE — spec ready for user approval.**
