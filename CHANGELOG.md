# Changelog

All notable changes to superomni are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

**Authoring helper:** run `npm run gen:changelog -- --version <X.Y.Z>` to scaffold a new entry from Conventional Commits in `last-tag..HEAD`.

---

## [0.6.11] — 2026-05-15

### Added
- **Discovery sync** — `lib/gen-changelog.js` (shipped in v0.6.10) is now wired into the skills that close sprints, so the tool actually gets used.
  - `skills/release/SKILL.md.tmpl` § Changelog: 1-line `npm run gen:changelog` hint above the existing manual fallback template (the manual template stays — fallback when tool is unavailable)
  - `skills/document-release/SKILL.md.tmpl` § Phase 4 (Update CHANGELOG): same hint
  - `CHANGELOG.md` preamble: 1-line tool pointer for new contributors
- **Structural defense** — `lib/check-skill-docs.js` gains a 6th advisory: any skill `.tmpl` mentioning `CHANGELOG.md` must also mention `gen:changelog`. Catches future drift when new skills are added that touch CHANGELOG without the discovery pointer. `framework-management` skill exempted (it teaches the rules abstractly via examples).

### Changed
- `docs/IMPLEMENTATION.md` "Deferred / out of scope" list: ~~CHANGELOG auto-generation from commits~~ marked **closed by v0.6.10** (preserves audit trail of how backlog items get closed).

### Why this matters

v0.6.10 shipped the tool but **the skills that should use it had no pointer to it** — `release` and `document-release` had hand-written CHANGELOG templates with no mention of `gen:changelog`. Classic staleness pattern: ship a tool in one sprint, wire it into discovery in the next. Without this patch, future sprints would keep hand-writing CHANGELOG entries because the agent invoking the release skill never sees the tool reference.

The new advisory is the **structural defense** — it ensures any future skill that touches CHANGELOG.md also points at the tool, preventing the same staleness pattern from recurring at v0.7.x.

This sprint also marks the **first real dogfood** of `gen:changelog`. v0.6.10's CHANGELOG entry was written manually because the v0.6.10 commit didn't exist yet (chicken-and-egg). v0.6.11 closes the loop: tool ran against `e819a69` and produced the `### Added` bullet for this entry.

### Verified

- All 8 CI gates green (`gen-skills`, `check:skill-docs`, `verify:fixture-parity`, `test:generators`, `check:plugin-sync` 5-invariants, `check:plan-content`, `check:workflow-contract`, `validate-skills`)
- **Negative test for new advisory**: temporarily removed the `gen:changelog` hint from `skills/release/SKILL.md.tmpl`, regenerated, ran `check-skill-docs` — advisory fired with exact expected message `skills/release/SKILL.md.tmpl: mentions CHANGELOG.md without 'gen:changelog' pointer`. Restored backup; advisory cleared. Confirms the gate works (not just that current state happens to satisfy it).
- **Dogfood**: `npm run gen:changelog -- --from 5f7d947 --to HEAD --version 0.6.11` produced exactly 1 bullet under `### Added` referencing `e819a69` (the v0.6.10 commit), with the TODO comment for manual subsections — exactly as v0.6.10's design specified.
- All global invariants preserved: skills=28, agents=5, EnterPlanMode-mentions=5, flat-reference.md=0, `${CLAUDE_SKILL_DIR}`-tokens=15, design-md-library entries=9, `.approved-spec-*`-markers=0
- Skill body lines: 6,247 → 6,255 (+8). Slight overage of plan's ≤+5 budget — accepted as low-impact narrative additions to release/document-release skill prose. Documented in execution artifact.

### Architectural notes

- Pattern: **ship tool → wire into discovery → defend with advisory**. v0.6.10 (ship) + v0.6.11 (wire + defend) is now the canonical 2-sprint sequence for adding any authoring helper. Future `lib/gen-*.js` tools should follow it.
- The `/gen[:-]changelog/` regex matches both forms (`gen:changelog` npm script invocation, `gen-changelog` file/directory ref). Verified no false positives across 96 corpus matches.

### Deferred (v0.6.12+ backlog)

- **Conventional Commits enforcement** (P2 — carry-forward from v0.6.10) — husky / pre-commit hook OR advisory in `check-skill-docs.js` scanning recent commits. Becomes increasingly important now that `gen:changelog` depends on the format.
- **`lib/` category split documentation** (P3 — carry-forward from v0.6.10) — `framework-management` should explicitly document: `check-*.js` / `verify-*.js` / `test-*.js` = CI gates (in umbrella); `gen-*.js` = authoring helpers (NOT in umbrella).
- **`bin/audit-repo-invariants` data-driven exclude list** (P3 — carry-forward from v0.6.3) — config-driven exclude list for the audit tool.
- **Live `/vibe` E2E test** (deferred from v0.6.2) — sandbox required.

---

## [0.6.10] — 2026-05-15

### Added
- **`lib/gen-changelog.js`** — CHANGELOG entry skeleton generator from Conventional Commits. Closes the v0.6.5-v0.6.9-deferred "CHANGELOG auto-generation" backlog item.
  - CLI: `npm run gen:changelog -- [--from <ref>] [--to <ref>] [--version <X.Y.Z>]`
  - Defaults: `--from` = last git tag (or root commit if no tags); `--to` = HEAD; `--version` = `package.json` version
  - Maps Conventional Commits prefix (10 standard: feat/fix/chore/docs/refactor/test/perf/build/ci/style) → CHANGELOG sections (Added/Fixed/Changed)
  - Skip patterns: merge commits, dependabot/bot author commits silently dropped
  - Body extraction: first paragraph (until blank line), Co-Authored-By and Signed-off-by trailers stripped, truncated to 200 chars at last whitespace
  - Output: stdout only (no file writes — `careful` skill compliant); skeleton ends with TODO comment prompting human to add Why-this-matters / Verified / Deferred subsections
- **`gen:changelog` npm script** — discoverable via `npm run`. Standalone tool (NOT wired into `verify:skill-docs` umbrella because it's an authoring helper, not a CI gate).
- **`framework-management/SKILL.md.tmpl` Supporting Files** — 1-line note documenting the tool so future authors find it.

### Why this matters

After 5 audit-driven sprints (v0.6.5-v0.6.9), each one wrote a manual CHANGELOG entry that took 5-10 minutes to compose from commit data. The entries are rich (Fixed/Added/Why this matters/Verified/Deferred), but the **first 60% of composition is mechanical**: extract Conventional Commits prefix, group by category, summarize body. The tool automates exactly that 60%, leaving the human to write the parts that require synthesis (impact framing, demo verification, deferred-item rationale).

The tool is intentionally **not** a CI gate. CHANGELOG content is the canonical sprint record; making it CI-enforced would require defining "matches" semantics (textual? structural? semantic?) that the tool can't verify. Authoring helper > correctness checker for this domain.

### Verified

- Positive demo: ran on v0.6.5-v0.6.9 commit range (`e33d0f2..5f7d947`) → output had `## [0.6.10-test]` header + Added section (1 bullet for v0.6.7 feat) + Fixed section (4 bullets for v0.6.5/6/8/9 fix) + TODO comment + commit-hash trailers. Stderr summary: "generated 5 bullet(s) across 2 section(s)".
- Negative demo: invalid `--from` ref → exit 1 with specific git-revision error message.
- Edge case: empty range (HEAD..HEAD) → version header + TODO comment only (no section headers); matches Amendment B from REVIEW.
- Edge case: invalid `--version` arg (not semver) → exit 1 with format-error message.
- Edge case: `--help` flag → usage message + exit 0.
- No-write check: post-run `git status` showed no file modifications by the tool itself (stdout-only design verified).
- Conventional Commits parser handles 10 standard prefixes; non-matching commits go to "Other" section with stderr note.

### Architectural notes

This is the **first v0.7.0+ backlog item closed** since the v0.6.x audit-driven series concluded. Continues the v0.6.5-v0.6.9 patch cadence per user directive ("v0.6.10, not v0.7.0"). v0.7.0 minor remains reserved for future architectural changes (e.g., `context: fork` migration) when runtime evidence is available.

The tool is a **first-time authoring helper, not a correctness checker**. It is the first non-CI-gate `lib/` script added since v0.6.4 — the lib/ family now has both validators (check-*.js, verify-*.js, test-*.js) and generators (gen-*.js, gen-changelog.js). Worth noting in framework-management as a category split: validators run in CI, generators run by humans on demand.

### Deferred (v0.7.0+ backlog)

1. `context: fork` migration (architectural; needs runtime evidence first)
2. `model:` / `effort:` per-skill overrides
3. `$ARGUMENTS` / `$N` substitution adoption (low signal; raise priority if observed)
4. `paths` glob auto-trigger (likely never)
5. Live `/vibe` E2E test (sandbox required)
6. **Conventional Commits enforcement (pre-commit hook)** — newly relevant now that gen-changelog depends on the format. Could be a husky/pre-commit hook or a v0.6.x-style advisory in check-skill-docs.js.
7. **CHANGELOG drift verification (Invariant 6 candidate)** — does the latest CHANGELOG entry's commit-hash trailers match git log of the corresponding range? Built on top of gen-changelog. Defer until the gen-changelog tool sees real-world use across 2-3 sprints.
8. Windows job fixture-parity
9. `bin/audit-repo-invariants` data-driven exclude list

---

## [0.6.9] — 2026-05-15

### Fixed
- **`docs/IMPLEMENTATION.md` (P0 user-facing doc bug)** — `**Version:** 0.3.0` (5 minor versions stale) → `0.6.9`. README links to this doc as "Implementation details and development guide"; new contributors now see accurate version + last-updated metadata.
- **`docs/IMPLEMENTATION.md` Roadmap section** — replaced stale "v0.2.0 ✅ Completed" + "v0.3.0 [ ] backlog" + "v1.0.0 GitHub Actions CI" framing with accurate "Version History" (v0.2.0 → v0.6.9 summarized; defer to CHANGELOG for detail) + "Current Backlog (v0.7.0+)" (real deferred items from v0.6.x retros) + v1.0.0 goals.
- **`docs/COMPARISON.md` § 7.2 (P0 factually-wrong public claims)** — corrected 4 false claims that became outdated after v0.6.0+:
  - "❌ 无自动化测试套件" → "✅ 自动化 CI 测试套件 (v0.6.6 起)" — describes 9 CI gates running on ubuntu + windows
  - "❌ GitHub Actions CI 缺失" → folded into the CI testing item above (was the same gap)
  - "⚠️ SKILL.md.tmpl + SKILL.md 双文件维护负担" → "✅ 双文件已 CI 检查" — describes v0.6.0+ check-skill-docs.js drift detection + 3-generator parity
  - "⚠️ 版本文档不同步" → "✅ 版本文档同步 CI 强制" — describes v0.6.5+ check-plugin-sync 5 invariants
  - "❌ 无变更日志" → "✅ 完整 CHANGELOG.md" — describes v0.6.0+ structured changelog
- The "❌ 缺少自动升级机制" item retained as legitimate v0.7.0+ gap.

### Added
- **`lib/check-plugin-sync.js` VERSION_DOCS extension** — added 5th entry for `docs/IMPLEMENTATION.md` `**Last updated:** vX.Y.Z` line. Bumping `package.json` version now requires bumping 5 doc anchors (README + COMPARISON + DESIGN + AGENTS + IMPLEMENTATION), all CI-enforced.
- **`docs/IMPLEMENTATION.md` `**Last updated:**` version anchor** — explicit version line near top of doc, sync-checked by Invariant 4.

### Why this matters

After v0.6.0 transformed the project (agent consolidation, CI infrastructure, CHANGELOG maintenance), `docs/COMPARISON.md` § 7.2 still listed those very gaps as **current weaknesses**. A reader comparing superomni against alternatives saw a project description **8 minor versions out of date in the worst possible direction** (claiming gaps that had been closed). Same drift class as v0.6.5 (README) / v0.6.6 (COMPARISON header) / v0.6.8 (AGENTS) — but for **factually-wrong self-comparison claims** instead of version strings or inventory.

`docs/IMPLEMENTATION.md` had similar drift: Roadmap listed v0.2.0 as the most recent achievement and v0.3.0 features as backlog, but we shipped through v0.6.8.

### Verified

- Negative demo 1 (new entry): change `docs/IMPLEMENTATION.md` `**Last updated:**` to v9.9.9 → check-plugin-sync exits 1 with diagnostic; restore → passes
- Negative demo 2 (existing entry): change `docs/COMPARISON.md` header version to v9.9.9 → check-plugin-sync exits 1 with diagnostic; restore → passes (verifies post-Step-5 refactor didn't break Invariant 4 for existing docs)
- Positive demo: clean state with all 5 docs (README + COMPARISON + DESIGN + AGENTS + IMPLEMENTATION) at v0.6.9 → "Plugin sync check passed: 5 invariants validated"

### Deferred (v0.7.0+ backlog, unchanged)
- `context: fork` migration
- `model:` / `effort:` per-skill overrides
- `$ARGUMENTS` substitution adoption
- `paths` glob auto-trigger (likely never)
- Live `/vibe` E2E test (sandbox required)
- CHANGELOG auto-generation from commits
- Windows job fixture-parity
- `bin/audit-repo-invariants` data-driven exclude list
- Broader audit of `docs/COMPARISON.md` other sections (only § 7.2 + § 7.4's CHANGELOG item were in scope this sprint)

---

## [0.6.8] — 2026-05-15

### Fixed
- **`docs/AGENTS.md` (P0 user-facing doc bug)** — completely rewrote 265-line agent library reference. Pre-fix doc described 9 retired v0.5.x agents (`code-reviewer`, `planner`, `debugger`, `test-writer`, `security-auditor`, `architect`, `evaluator`, `ceo-advisor`, `designer`) with **zero mentions** of the 5 current agents. Post-fix doc accurately describes the 5 canonical agents (`doc-writer`, `explorer`, `frontend-designer`, `planner-reviewer`, `refactoring-agent`) with identity / iron law / tools / when-to-invoke / output format for each, plus a "Migration from v0.5.x" section mapping retired→current. README.md (lines 234, 390) links here as the canonical "agent library reference"; new contributors now get accurate information.

### Added
- **`lib/check-plugin-sync.js` Invariant 5** — `docs/AGENTS.md` agent-section headings (`### \`<name>\``) must equal `agents/*.md` filename set. Bidirectional intersection (heading must match an actual agent file) avoids false-positives on prose. When a new agent is added but not documented in `docs/AGENTS.md`, CI fails.
- **`lib/check-plugin-sync.js` VERSION_DOCS extension** — added 4th entry for `docs/AGENTS.md` `**Last updated:** vX.Y.Z` line. Bumping `package.json` version now requires bumping AGENTS.md `Last updated` too (CI-enforced).
- **`docs/AGENTS.md` `**Last updated:**` version anchor** — explicit version line at top of doc, sync-checked by Invariant 4.

### Changed
- `lib/check-plugin-sync.js` success message updated to `Plugin sync check passed: 5 invariants validated.` (was 4 invariants, now 5 logical groups).

### Why this matters

After v0.6.0 consolidated 9 agents into 5, every release (v0.6.0 through v0.6.7) shipped with `docs/AGENTS.md` describing the wrong architecture. README.md actively pointed contributors at this doc. The bug shipped for 8 minor versions before this audit caught it. Same drift class as v0.6.5 (README version stale) and v0.6.6 (docs/COMPARISON.md and docs/DESIGN.md version drift) — but for **agent inventory** instead of version strings. Invariant 5 prevents the recurrence pattern.

### Verified

- Negative demo (Invariant 5): rename `### \`explorer\`` heading → linter exits 1 with "1 agent(s) ... missing from docs/AGENTS.md: explorer"; restore → passes
- Negative demo (Invariant 4 on AGENTS.md): change `**Last updated:** v0.6.8` → `v9.9.9` → linter exits 1 with version mismatch diagnostic; restore → passes
- False-positive avoidance: prose mentions of `explorer` / `planner-reviewer` etc. throughout doc body do not trigger Invariant 5 (heading regex + bidirectional filter correctly limit detection to `### \`name\`` headings only)

### Deferred (v0.7.0+ backlog, unchanged)
- `context: fork` migration (architectural; runtime evidence required).
- `model:` / `effort:` per-skill overrides.
- `$ARGUMENTS` substitution adoption.
- `paths` glob auto-trigger (likely never).
- Live `/vibe` E2E test (sandbox required).
- CHANGELOG auto-generation from commits.
- Windows job fixture-parity.
- `bin/audit-repo-invariants` data-driven exclude list.
- `docs/IMPLEMENTATION.md` version stale (separate audit; different drift profile).

---

## [0.6.7] — 2026-05-15

### Added
- **`lib/check-plan-content.js`** — CI hard-gate enforcing v0.6.3's Pre-Destructive Gate. Closes the v0.6.3-deferred plan-content-linter substantial feature.
  - Scans `docs/superomni/plans/plan-*.md` (date >= 20260514; v0.6.0 plan exempt by historical-immutability convention).
  - For each step whose `**How:**` subsection contains a destructive pattern (12 patterns: `git rm`, `git filter-branch`, `git reset --hard`, `git push --force`, `rm -rf`, `gh repo delete`, `gh release delete`, `DROP TABLE`, `DELETE FROM`, `TRUNCATE`, `npm publish`, `npm unpublish`), the immediately-preceding step in document order MUST contain the keyword `careful` (case-insensitive).
  - Markdown-aware: skips fenced code blocks (multi-line ```...```; usually documentation), but does NOT strip inline-backticks (in plan How sections, `cmd` typically means "run this command", not "literal token reference" — opposite semantic from skill bodies).
  - On violation: exit 1 with file path + step number + which pattern + which preceding step + remediation hint.
- New npm scripts: `check:plan-content` (standalone) + included in `verify:skill-docs` umbrella.
- 1 new step in `.github/workflows/validate.yml` ubuntu and windows jobs (after `Check plugin sync`).

### Changed
- **`skills/writing-plans/SKILL.md.tmpl` Pre-Destructive Gate section** — added 1-line CI-enforcement note pointing plan authors to `lib/check-plan-content.js`.

### Why this matters

v0.6.3 added the Pre-Destructive Gate as **template guidance** — plan authors were told "if your plan has destructive steps, insert a careful step first". Worked example used v0.6.0's reactive Step 14.5 amendment as cautionary tale. But the gate was honor-system: a plan author skipping the careful step wouldn't be caught until execution time (or by careful human review). v0.6.7 makes the gate CI-enforced. Future plans with `git rm` lacking a preceding careful step fail CI immediately, before any actual destructive op runs.

### Verified

- Positive demo (synthetic fixture): 2-step plan with `careful` in Step 1's title + body, `git rm` in Step 2's How → linter passes
- Negative demo (synthetic fixture): same plan but Step 1 lacks `careful` keyword → linter exits 1 with clear diagnostic; restore → linter passes
- False-positive avoidance (real plan: v0.6.3 plan-main-dynamic-context-and-careful-gate-20260515.md) — multiple `git rm` mentions in prose inside fenced code blocks (the gate teaches the pattern via worked example) → linter does NOT fire (fence-stripping correctly suppresses)

### Architectural significance

This is a CI hard-gate (architectural-level: enforces correctness invariants on plan authoring at build time), shipped as a single-purpose patch. The user requested architectural-level changes still follow patch cadence; this sprint demonstrates that pattern. ~200 LOC linter + 1 CI step + 1 line in writing-plans + version bump.

### Deferred (v0.7.0+ backlog, unchanged)
- `context: fork` migration (still architectural-level, requires runtime evidence first; user could test by running `/investigate` outside this session).
- `model:` / `effort:` per-skill overrides.
- `$ARGUMENTS` substitution adoption.
- `paths` glob auto-trigger (likely never).
- Live `/vibe` E2E test (sandbox required).
- CHANGELOG auto-generation from commits.
- Windows job fixture-parity.
- `bin/audit-repo-invariants` data-driven exclude list.

---

## [0.6.6] — 2026-05-15

### Fixed
- **CI gap (P1)** — `.github/workflows/validate.yml` did not run 3 gates added in v0.6.1-v0.6.5: `verify:fixture-parity` (3-generator parity), `test:generators` (multi-occurrence regression), `check:plugin-sync` (cross-manifest invariants). All 3 now run on both ubuntu and windows jobs (ubuntu adds all 3 after `Validate skill format`; windows adds the 2 cross-platform-safe ones after `Score workflow reports`).
- **Doc version drift (P1)** — `docs/COMPARISON.md` header + footer said `superomni v0.3.0` (8 minor versions stale). Now reflects 0.6.6.
- **Doc version drift (P2)** — `docs/DESIGN.md` `**Status:** Implemented (v0.5.7)` (7 patches stale). Now reflects 0.6.6.
- **`package.json` `files` array missing `CHANGELOG.md`** — npm-published tarballs didn't carry version history. Now included.
- **`lib/validate-skills.sh` comment stale** — line 6 still referenced the deprecated `{{PREAMBLE}}` macro. Updated to `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}`.

### Changed
- **`lib/check-plugin-sync.js` invariant 4 generalized** — was a single regex against README; now scans a configurable `VERSION_DOCS` list (3 entries: README, docs/COMPARISON.md, docs/DESIGN.md). Permissive on missing files (skip with warning), strict on regex-no-match (fail loudly — likely doc reformatting that needs human review).

### Removed
- **`.approved-spec-*` marker mechanism (P1, user-directed)** — eliminated entirely. The user's conversational reply to a spec-approval prompt IS the approval signal; no filesystem flag is written or read. Affected:
  - `skills/brainstorm/SKILL.md.tmpl`: removed the `touch ".approved-${spec}"` bash block; rewrote prose to clarify approval is conversational.
  - `skills/vibe/SKILL.md.tmpl`: collapsed stage-detection rows 1-2 (THINK/awaiting-approval and PLAN/approved-not-planned) into a single "spec exists, no plan yet" row keyed purely on `spec-*.md` existence; removed marker requirement from artifact contract; removed `.approved-spec-* [Y/N]` column from `/vibe status` display.
  - `skills/vibe/reference/stage-detection.md`: removed `_HAS_SPEC_APPROVAL` variable and the helper case that depended on it.
  - 7 pre-existing `.approved-spec-*` files in `docs/superomni/specs/` deleted.

### Why this matters

Each of v0.6.1-v0.6.5 added local CI gates that GitHub Actions never ran. After each merge to main, contributors saw "all checks passed" while in fact only the v0.6.0 subset was being checked. v0.6.6 closes the gap so the engineering invested over 5 sprints actually protects every PR.

The `.approved-spec-*` removal is a smaller concern but nonetheless real: every sprint dropped a 0-byte hidden file in `docs/superomni/specs/` that served only to communicate state between two skill invocations within the same session. The conversation already carries that state. Removing the file system signal simplifies the model and matches user mental-model.

### Deferred (v0.7.0+ backlog, unchanged)
- Plan-content auto-linter (CI hard-gate for v0.6.3 Pre-Destructive Gate).
- `context: fork` migration.
- `model:` / `effort:` per-skill overrides.
- `$ARGUMENTS` substitution adoption.
- `paths` glob auto-trigger (likely never).
- Live `/vibe` E2E test.
- CHANGELOG auto-generation from commits.
- Windows job fixture-parity (after verifying bash availability on windows-latest).

---

## [0.6.5] — 2026-05-15

### Fixed
- **README.md** said `Current stable version: 0.6.0` (4 versions stale). Now reflects 0.6.5.
- **`claude-skill.json`** `commands` array was missing `style-capture` (the file existed in `commands/` but plugin/marketplace and npm-install paths saw different command sets). Now matches the on-disk `commands/*.md` set exactly.

### Added
- **`lib/check-plugin-sync.js`** — new CI gate validating 4 cross-manifest invariants:
  1. **Version sync**: `package.json` is canonical; `marketplace.json` (top-level + `plugins[0]`), `plugin.json`, `claude-skill.json` must all match.
  2. **Commands sync**: filenames in `commands/*.md` must equal `claude-skill.json` `commands[].name` set (no missing, no extras).
  3. **Keywords sync**: `plugin.json` keywords must equal `marketplace.json plugins[0].keywords`.
  4. **README version**: `Current stable version: X.Y.Z` line must match `package.json` version.
- New npm scripts: `check:plugin-sync` (standalone) and inclusion in the `verify:skill-docs` umbrella.
- 4 inject-and-restore demos verified each invariant fires with a specific diagnostic.

### Why this matters

The v0.6.1-v0.6.4 series bumped versions across 4-5 surfaces by hand each time. Without a checker, the next bump is one missed file away from silent drift — exactly what happened with `claude-skill.json` missing `style-capture`. This gate catches the drift class proactively in `verify:skill-docs`.

### Deferred (v0.7.0+ backlog, unchanged)
- Plan-content auto-linter (CI hard-gate for v0.6.3 Pre-Destructive Gate).
- `context: fork` migration.
- `model:` / `effort:` per-skill overrides.
- `$ARGUMENTS` substitution adoption.
- `paths` glob auto-trigger (likely never).
- Live `/vibe` E2E test.

---

## [0.6.4] — 2026-05-15

### Added
- **Token-literal advisory in `lib/check-skill-docs.js`** — 4th advisory in the existing series (≥300-line / flat-reference / CRLF / token-literal). Warns (stderr; exit 0) when a `SKILL.md.tmpl` contains `{{PREAMBLE}}`, `{{PREAMBLE_CORE}}`, or `{{PREAMBLE_REF_LINK}}` in raw prose (outside both fenced code blocks AND inline-backtick spans), after the canonical first-occurrence position. Catches the v0.6.3 framework-management self-expansion bug class proactively. Closes v0.6.3 retro ACTION 2.

### Verified
- Positive demo: literal token in raw prose → advisory fires with `file:line` and remediation hint.
- Negative demo: token inside `\`\`\`` fence → no advisory.
- Inline-backtick edge case: `` `{{PREAMBLE_CORE}}` `` → no advisory (markdown renders as inline code; generator first-occurrence-only protects it).

### Deferred (v0.7.0+ backlog, unchanged)
- `context: fork` + `agent:` migration (architectural minor; needs design sprint — not 1:1 with current dispatch model).
- `$ARGUMENTS` / `$N` substitution adoption.
- `model:` / `effort:` per-skill overrides.
- `paths` glob auto-trigger (likely never).
- Plan-content auto-linter (CI hard-gate for v0.6.3's Pre-Destructive Gate).
- Live `/vibe` E2E test (deferred from v0.6.2 retro).

---

## [0.6.3] — 2026-05-15

### Added
- **Anthropic `!`<command>`` dynamic context injection in `verification` and `release`** — extending the v0.6.2 pattern from `vibe`. `verification` Phase 1 pre-resolves branch / status / `git diff --stat main...HEAD` / latest plan path / unchecked-item count / latest evaluation. `release` Phase 1 pre-resolves current version / working tree / recent commits since last tag / unpushed-commit count / CHANGELOG top entry / latest evaluation. Saves 2-4 Bash round-trips per `/verify` or `/release` invocation. Plain-text fallback bash retained for runtimes that don't parse the bang-command syntax.
- **`bin/audit-repo-invariants <pattern>`** — new bash tool that lists every file referencing a given pattern, grouped by top-level directory, with per-file occurrence counts. Use it BEFORE migrating a repo-wide invariant to classify usage sites vs sister-tools. Closes v0.6.0 retro ACTION 3 (the `lib/validate-skills.sh` miss during the `{{PREAMBLE}}` migration would have been caught by this tool). Wired as `npm run audit:invariants -- <pattern>`. Documented in `framework-management` § Supporting Files.
- **Pre-Destructive Gate in `writing-plans`** — new sub-section under Phase 3 mandating that any plan step containing destructive operations (`git rm`, `rm -rf`, mass `mv`, `gh repo delete`, DB drops, `npm publish`, etc.) MUST be preceded by a step invoking the `careful` skill with explicit blast-radius enumeration. Includes the v0.6.0 Step 14.5 worked example. Closes v0.6.0 retro ACTION 2 (proactive instead of reactive). 1-line link-back note added to `careful/SKILL.md`.

### Changed
- **`framework-management/SKILL.md` Supporting Files section** — added 1-line pointer to the new audit tool with the v0.6.0 sister-tool-miss anecdote as motivation.

### Fixed
- Latent issue in `framework-management/SKILL.md.tmpl`: the literal text `{{PREAMBLE}}` (used in prose to reference the deprecated alias) was being expanded by the generator's deprecated-alias path, ballooning the body. Switched to the prose form "legacy single-token preamble" to avoid the escape ambiguity.

### Deferred (v0.7.0+ backlog, unchanged from v0.6.2)
- `context: fork` + `agent:` migration for the 7 dispatch-agent skills.
- `$ARGUMENTS` / `$N` substitution in skill bodies.
- `model:` / `effort:` per-skill overrides.
- `paths` glob auto-trigger review (likely never).
- Plan linter that auto-checks pre-destructive gate compliance in plan files (extension of v0.6.3's template-only enforcement).

---

## [0.6.2] — 2026-05-14

### Added
- **`disable-model-invocation: true` on 3 side-effect skills** — `release`, `finishing-branch`, `framework-management` now require explicit user invocation (typed `/release`, `/finishing-branch`, `/framework-management`). Prevents the LLM from auto-triggering side-effect or framework-mutating skills based on description-match alone.
- **`user-invocable: false` on `using-skills`** — meta-skill is hidden from the `/` menu (LLM still loads it; users have no reason to type `/using-skills`).
- **`argument-hint` on 3 skills** — `vibe` (`[idea-or-status-or-reset-or-auto]`), `brainstorm` (`[idea]`), `release` (`[version]`). Improves `/skill <args>` autocomplete UX.
- **Anthropic `!`<command>`` dynamic context injection in `vibe` Phase 1** — current branch, git status, recent artifacts (latest spec/plan/evaluation/release) pre-resolved at skill-load time. Saves 1 Bash round-trip per `/vibe` invocation. Phase 1 still links to `reference/stage-detection.md` for the full session-aware bash; the auto-inject covers the high-signal subset.
- **`npm run test:generators`** — multi-occurrence first-occurrence-only regression test. New `lib/templates/multi-occurrence-fixture.md.tmpl` has 2× `{{PREAMBLE_CORE}}` (canonical + code-fenced); `lib/test-generators.js` asserts that all 3 generators (js / sh / ps1) expand only the canonical occurrence (signature: exactly 1 `**Status protocol**` in output). Catches the v0.6.1 ps1 `[regex]::Replace(..., MatchEvaluator, count=1)` silent-failure regression class. Wired into `verify:skill-docs` umbrella.
- **CRLF advisory in `lib/check-skill-docs.js`** — warns (stderr-only) if any committed `skills/**/SKILL.md` contains `\r\n`, indicating someone bypassed `npm run gen-skills` after a manual edit. Defense-in-depth on top of v0.6.1's `.gitattributes` LF-pin.

### Changed
- **`lib/validate-skills.sh` Iron Law examples check upgraded** — passes if EITHER inline example fences exist OR a `reference/<topic>.md` file exists. Fixes the post-v0.6.1 false positive on `test-driven-development` (which moved its Good/Bad examples to `reference/red-green-refactor.md`).
- **`lib/check-workflow-contract.js` REFLECT gate** — now accepts `release-*.md` (which since v0.5.8 contains the `## Retrospective` section per the `self-improvement` skill's "retro merged into release" convention) as fulfilling the gate. Standalone `improvement-*.md` is still accepted. Removes the false error on v0.6.1's `main-skill-layering-anthropic` flow.
- **`skills/using-skills/SKILL.md` line endings** — normalized from CRLF to LF (caught by the new CRLF advisory while testing it).

### Deferred (v0.7.0+ backlog)
- `context: fork` + `agent:` migration for the 7 dispatch-agent skills.
- `!`<command>`` dynamic context injection in `verification` / `release` (extension of v0.6.2's vibe-only adoption).
- `$ARGUMENTS` / `$N` substitution (depends on argument-hint signal first).
- `model:` / `effort:` per-skill overrides.
- `paths` glob auto-trigger review (probably not applicable).

---

## [0.6.1] — 2026-05-14

### Added
- **`reference/<topic>.md` supporting-files convention** — Anthropic's progressive-disclosure pattern adopted as the single project-wide rule. Long reference material now lives at `skills/<name>/reference/<topic>.md` (subdirectory always; flat `reference.md` at skill root is non-conforming). Documented canonically in `framework-management` skill § Supporting Files.
- **11 new `reference/<topic>.md` files** across 5 trimmed skills (`self-improvement`, `vibe`, `subagent-development`, `frontend-design`, `test-driven-development`) and `framework-management` itself (eat-our-own-dogfood pointer).
- **`${CLAUDE_SKILL_DIR}` runtime token** — generators preserve the literal token in generated `SKILL.md`; Anthropic's skill runtime resolves it at load time. Used in 15 cross-skill link URLs across the 5 trimmed skills for plugin-portable references.
- **Golden-fixture parity check (`npm run verify:fixture-parity`)** — closes v0.6.0 retro ACTION 1. `lib/templates/fixture.md.tmpl` exercises every substitution token; `lib/verify-fixture-parity.js` runs all 3 generators (js / sh / ps1) and asserts byte-identical output via `sha256` triple-equality. Wired into the `verify:skill-docs` umbrella script.
- **Two advisory warnings in `lib/check-skill-docs.js`** — (1) `SKILL.md.tmpl ≥ 300 lines && no reference/ subdir`, (2) any flat `skills/<name>/reference.md` at skill root. Both are stderr-only and never fail CI; they're authoring nudges. `framework-management` skip-listed because it documents the rules literally.
- **`.gitattributes` LF lock** — `skills/**/SKILL.md`, `skills/**/SKILL.md.tmpl`, `skills/**/reference/*.md`, `lib/templates/*.tmpl`, `lib/templates/*.md`, `lib/preamble*.md` all pinned to LF line endings so cross-platform `sha256sum` parity holds regardless of `core.autocrlf` settings.

### Changed
- **5 longest skill bodies trimmed** by extracting reference material into `reference/<topic>.md`:
  - `self-improvement` 421 → 270 lines (-151) — Phases 0/3/6/7 templates + final block extracted to `reference/phase-templates.md`.
  - `vibe` 382 → 275 lines (-107) — Phase 1 detection bash + dispatch-brief table extracted to `reference/stage-detection.md` and `reference/dispatch-brief.md`.
  - `subagent-development` 356 → 213 lines (-143) — Wave Planning, Consensus Protocol, and report templates extracted to `reference/wave-planning.md`, `reference/consensus-protocol.md`, `reference/report-templates.md`.
  - `frontend-design` 338 → 248 lines (-90) — Quality Gate scoring rubric and Steering Command Protocol extracted to `reference/quality-gate.md` and `reference/reference-loading.md` (alongside existing 9 design-principle siblings + `design-md-library/`, all unchanged).
  - `test-driven-development` 316 → 205 lines (-111) — Iron Law worked examples + anti-patterns table + test organization extracted to `reference/red-green-refactor.md` and `reference/anti-patterns.md`.
- **Total `SKILL.md` body lines: 6,793 → 6,181 (-612 lines, -9%)** — recurring per-session token cost reduced ~30% on the 5 worst-offender skills, freeing ~6k tokens of Anthropic's 25k cross-skill re-attach budget for `/vibe auto` runs.
- **`framework-management/SKILL.md`** — added new § Supporting Files (with own `reference/supporting-files.md` for full convention details). Body net +13 lines.
- **`using-skills/SKILL.md`** — 1-line pointer added to the Document Output Convention section, directing skill authors to framework-management § Supporting Files.
- **Cross-platform generator parity hardened** — all 3 generators (`lib/gen-skill-docs.{js,sh,ps1}`) and `lib/check-skill-docs.js` now normalize CRLF/CR → LF on read and strip trailing newlines on write. `gen-skill-docs.ps1` Expand-Token rewritten to use `IndexOf` + `Substring` (the prior `[regex]::Replace(..., MatchEvaluator, count=1)` silently ignored the count argument with the evaluator overload).

### Deferred (v4 backlog, user pre-authorized)
- `disable-model-invocation: true` on `release` / `finishing-branch` / `framework-management`.
- `user-invocable: false` on `using-skills`.
- `context: fork` + `agent:` migration for the 7 dispatch-agent skills.
- `!`<command>`` dynamic context injection in `vibe` / `verification` / `release`.
- `argument-hint` / `$ARGUMENTS` field adoption.
- `paths` glob auto-trigger review.

---

## [0.6.0] — 2026-05-13

### Added
- **`/vibe auto` subcommand** — single-command end-to-end pipeline. Chains `brainstorm → writing-plans → plan-review → executing-plans → code-review → qa → verification → release` with only the THINK spec-approval human gate. Documented in `commands/vibe.md` + new mode section in `skills/vibe/SKILL.md` Phase 3. See flow diagram and "when NOT to use" guidance in `commands/vibe.md`.
- **2-tier preamble (progressive disclosure)** — `lib/preamble-core.md` (15 lines, inlined into every SKILL.md via `{{PREAMBLE_CORE}}`) + `lib/preamble-ref.md` (127 lines, loaded on demand via `{{PREAMBLE_REF_LINK}}` markdown link). Matches Anthropic's official skill guideline: skill body loads only when invoked, long reference loads on demand. Legacy `{{PREAMBLE}}` kept as deprecated alias with build-time warning.
- **Canonical frontmatter fields on all 28 skills** — every skill now declares `when_to_use`, `produces`, `consumes`, optional `dispatch-agent`. All 28 frontmatters parse as valid YAML. Enables machine-checkable stage linkage.
- **Produces/consumes linkage validation** — `lib/check-workflow-contract.js` gained Section 1: builds a graph of `produces` → `consumes` across all skills and fails when a `consumes` target matches no `produces` pattern. Legacy sessions predating `20260513` are exempted via `CONTRACT_CUTOFF_YYYYMMDD` constant.
- **`agents/explorer.md`** — new read-only isolated-context exploration agent. Tools: Read / Grep / Glob / safe read-only Bash. Dispatched by `investigate`, `systematic-debugging` (debug evidence), and `executing-plans` (cross-file surveys on ≥5-step waves). Absorbs the Phase-2 evidence-gathering role of the retired `debugger` agent.
- **`lib/frontmatter-map.json` + `lib/apply-frontmatter.js`** — tooling used during the v0.6.0 migration to rewrite frontmatter consistently across 28 skills. Block-scalar YAML form used for descriptions containing `:` / `→` / quotes to avoid parse errors.

### Changed
- **Agent consolidation: 11 → 5.** `planner-reviewer` (renamed from `architect`) absorbs the retired `planner`, `ceo-advisor`, `evaluator`, `security-auditor`, `code-reviewer` agents via mode selector (planning / strategy / engineering / evaluation / security / code-review). `frontend-designer` (renamed from `designer`). `explorer` (new). `refactoring-agent` and `doc-writer` unchanged. Surviving 5 agents all have ≥ 4 skill dispatchers (fan-in).
- **Pipeline stage→agent routing** in `skills/vibe/SKILL.md` fully remapped to the 5 canonical agents. All 13 skill bodies that referenced retired agent names were updated (exception: `debugger` as JS keyword in lint-grep patterns is preserved in `code-review`/`verification`/`finishing-branch`).
- **Cross-platform generator parity enforced** — `lib/gen-skill-docs.{js,sh,ps1}` normalized to strip a single trailing newline from preamble content before token interpolation. Verified byte-identical output across all three generators on a `brainstorm` fixture.
- **`skills/workflow/SKILL.md` demoted to 50-line stub** — operational pipeline logic now lives in exactly two places (`vibe` runtime + `using-skills` routing). Body is a pointer table to `/vibe auto`, `using-skills` Quick Reference, and `check:workflow-contract`. Eliminates prior 3-way drift between workflow/vibe/using-skills descriptions.
- **Trigger-conflict disambiguation** in `CLAUDE.md` — sharpened trigger column for 5 conflict pairs: `executing-plans` vs `test-driven-development`, `code-review` vs `plan-review`, `workflow` vs `vibe`, `release` vs `ship`, `refactoring` vs `code-review`.
- **`lib/validate-skills.sh`** updated to accept either `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}` (new, canonical) or `{{PREAMBLE}}` (legacy, deprecated warning). SKILL.md expansion check now accepts either the new `Preamble (Core)` marker or the legacy `Completion Status Protocol` header.
- **`framework-management/SKILL.md.tmpl`** — scaffolding example now teaches the new 2-token pattern and the 3 required frontmatter fields (`when_to_use`, `produces`, `consumes`). Newly-authored skills inherit the progressive-disclosure convention from day one.
- **`CLAUDE.md`** — added "Agents Available" table between the Skills and Commands sections, describing the 5 canonical agents + their dispatchers.

### Removed
- **7 retired agent files**: `ceo-advisor.md`, `code-reviewer.md`, `debugger.md`, `evaluator.md`, `planner.md`, `security-auditor.md`, `test-writer.md`. Each agent's unique content was absorbed into its parallel skill before deletion (zero knowledge loss). History preserved in git; `git show <old-commit>:agents/X.md` still works.

### Migration notes

**If you have your own skills or scripts that reference retired agent names, remap as follows:**

| Retired agent | Replacement | Notes |
|---------------|-------------|-------|
| `planner` | `planner-reviewer` (planning mode) | Mode specified in dispatch prompt |
| `architect` | `planner-reviewer` (engineering mode) | Renamed |
| `ceo-advisor` | `planner-reviewer` (strategy mode) | Absorbed |
| `evaluator` | `planner-reviewer` (evaluation mode) OR `verification` skill | Most use cases covered by `verification` in main context |
| `code-reviewer` | `planner-reviewer` (code-review mode) | Absorbed |
| `security-auditor` | `planner-reviewer` (security audit mode) | Absorbed; dependency sub-mode for OWASP A06 |
| `test-writer` | `test-driven-development` skill | No longer an agent — runs in main context |
| `debugger` | `explorer` (Phase-2 evidence) OR `systematic-debugging` skill | Debug protocol moved into skill; `explorer` provides isolated-context survey |
| `designer` | `frontend-designer` | Renamed; same responsibilities |

**If you copy `SKILL.md.tmpl` patterns from this repo:**
Replace `{{PREAMBLE}}` with `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}`. The legacy token still works but emits a build-time warning.

### Results

- 9,947 → 6,793 skill lines (−3,154, −31.7 %)
- 4 → 0 skills over Anthropic's 500-line guideline
- 11 → 5 agents (−54 %)
- 0/28 → 28/28 frontmatter coverage on `when_to_use` / `produces` / `consumes`
- New CI invariant: `gen-skill-docs.{js,sh,ps1}` produce byte-identical output
- New CI invariant: `consumes` must resolve to some skill's `produces`

---

## [0.5.9] — 2026-05-07

### Added
- **Unified KPI schema** — new `docs/superomni/style-profiles/evaluation-kpi-schema.md` defining 6 measurement dimensions: gate pass rate, evaluation coverage, agent performance score, skill effectiveness score, Iron Law compliance rate, and context efficiency (preamble size).
- **Missing output directories** — bootstrapped `docs/superomni/{evaluations,improvements,releases,harness-audits,reviews,executions,subagents,production-readiness}/` with `.gitkeep` so all artifact paths exist before any skill writes to them.

### Changed
- **`lib/check-workflow-contract.js`** — extended artifact recognition: `release` and `harness-audit` types now parsed; date pattern updated to accept both `YYYYMMDD` (session artifacts) and `YYYY-MM-DD-HHmmss` (runtime-generated artifacts); added content validation: release files must contain both `## Release` and `## Retrospective`; evaluation files must carry a `**Status:**` field.
- **`lib/score-workflow.js`** — added evaluator verdict parsing (`APPROVED` / `APPROVED_WITH_NOTES` / `CHANGES_REQUIRED`), gate pass rate calculation, Iron Law compliance rate, and preamble line-count efficiency metric; output now includes a top-level `kpi` summary block.
- **`skills/self-improvement/SKILL.md.tmpl`** — ACTION items now carry a `Priority: P0/P1/P2` field; new **Phase 6.5 — Loop Back to Next Plan** explicitly carries forward unresolved P0/P1 actions from the prior improvement report to prevent silent drop.
- **`CLAUDE.md`** — removed deprecated `retros/` row from Document Output Convention (standalone retro files deprecated in v0.5.8; retrospective content now lives inside release artifacts).

---

## [0.5.8] — 2026-04-20

### Changed
- Skill consolidation review artifacts updated to final-state wording so historical review docs match the merged canonical skill model.
- Documentation cleanup continued for canonical naming consistency in active docs and review artifacts.

### Fixed
- Version metadata synchronized to `0.5.8` across package/runtime/plugin manifests (`package.json`, `claude-skill.json`, `.claude-plugin/*`, `lib/setup.js`, `hooks/session-start`).
- README synchronized with current stable version.

## [0.5.7] — 2026-04-20

### Added
- **RELEASE stage** — merged SHIP + REFLECT into a single `RELEASE` stage; pipeline is now 6 stages (THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE)
- New `skills/release/` skill with parallel Release + Retrospective output in one artifact (`docs/superomni/releases/`)
- New `/release` command registered in `claude-skill.json` and `commands/release.md`

### Fixed
- **Windows Git Bash compatibility** — replaced `stat -c %Y`/`stat -f %m` loop in `_session_files()` with cross-platform `find -newer` approach
- **Soft artifact skip removed** — `_verify_stage_artifact("SHIP") || true` eliminated; RELEASE now requires `release-*.md` artifact before auto-advancing
- **Spec approval gate** — `brainstorm` now writes `.approved-spec-*` marker on approval; `vibe` stage detection uses this to prevent auto-advancing past THINK without explicit user approval

### Changed
- `lib/preamble.md` compressed from 221 → 148 lines (−33%) by replacing verbose bash blocks with prose descriptions
- All 30 compiled `SKILL.md` files updated with new preamble and RELEASE pipeline references
- `CLAUDE.md` updated with 6-stage pipeline, `release` skill entry, and `docs/superomni/releases/` directory

---

## [0.5.4] — 2026-04-08

### Added
- **Plan Mode Fallback** — Added a "Plan Mode Fallback" section to the shared preamble (`lib/preamble.md`) and `using-skills/SKILL.md`. If Claude enters Plan Mode despite the routing rule, skills now take precedence: skill instructions are treated as executable steps, STOP points are respected, and planning output routes to `docs/superomni/plans/` instead of Claude's built-in plan file. Inspired by garrytan/gstack's "coexist with plan mode" approach.
- **Two-layer EnterPlanMode defense** — Layer 1 (CLAUDE.md + EXTREMELY-IMPORTANT): hard routing rule intercepts EnterPlanMode → brainstorm. Layer 2 (Plan Mode Fallback in all 29 skills): if already in plan mode, vibe workflow still governs.

### Changed
- **CLAUDE.md** — Upgraded "Planning route" soft guidance to "CRITICAL RULE — EnterPlanMode routes to brainstorm skill" with hard conditional language.
- **`using-skills/SKILL.md`** — `<EXTREMELY-IMPORTANT>` block changed from "feel the urge" soft redirect to "HARD ROUTING RULE: Do NOT call EnterPlanMode" with direct action instruction.
- **28 skill preambles rebuilt** — All templated skills regenerated to include Plan Mode Fallback section.

---

## [0.5.3] — 2026-04-07

### Changed
- **EnterPlanMode: prohibition → redirect** — Replaced "CRITICAL: No EnterPlanMode" prohibitions across all 27 skills, `using-skills`, `vibe`, and `CLAUDE.md` with a superpowers-inspired redirect pattern. Instead of telling the model "never use Plan Mode", the framework now intercepts the planning impulse and routes it to `brainstorm` or `writing-plans` skills via a decision flow graph.
- **`using-skills/SKILL.md`** — Added `<EXTREMELY-IMPORTANT>` tagged redirect block and dot-language flow graph (inspired by obra/superpowers) that intercepts "About to EnterPlanMode?" decision point.
- **`vibe/SKILL.md`** — Replaced "CRITICAL: Do NOT use EnterPlanMode" with "Planning Route" section listing skill alternatives per intent.
- **27 skill preambles** — `### CRITICAL: No EnterPlanMode` (3 lines) → `### Planning Route` (1-line redirect).

### Removed
- **PreToolUse hook** (`hooks/block-plan-mode`) — Removed the hook-based hard block approach in favor of the redirect pattern.
- **`.claude/settings.json`** — Removed project-level settings that registered the PreToolUse hook.
- **`hooks.json` PreToolUse entries** — Restored to SessionStart-only configuration.

---

## [0.5.1] — 2026-04

### Added
- **`/vibe` entry point skill** (`skills/vibe/SKILL.md`): Unified framework activation command that auto-detects the current pipeline stage (THINK→PLAN→BUILD→REVIEW→TEST→PROD-CHECK→SHIP→REFLECT) from existing artifacts and routes to the appropriate skill. Supports `/vibe`, `/vibe status`, and `/vibe reset` subcommands.
- **`[session]` identifier in file naming**: All generated documents now use the pattern `[type]-[branch]-[session]-[date].md` where `[session]` is a short kebab-case label auto-generated from conversation context (e.g., `vibe-skill`, `auth-refactor`). Enables agents to search and retrieve relevant prior sessions.

### Changed
- **Document output reorganization**: `spec.md` moved to `docs/superomni/specs/`, `plan.md` moved to `docs/superomni/plans/`. All generated artifacts now live in categorized subdirectories — no loose files in `docs/superomni/` root.
- **Self-improvement docs now user-facing**: Improvement reports, evaluation reports, and harness audit reports moved from `.superomni/` (internal) to `docs/superomni/` (user-facing). Agents can now index these for self-improvement across sessions.
- Updated all 50+ files with new document paths and naming conventions.

---

## [0.5.0] — 2026-04

### Changed
- **Installation redesign**: `npx github:Wilder1222/superomni` is now the primary project-level install method for all platforms (Claude, Codex, Copilot, Gemini). Global install via `npm install -g` + `superomni setup`.
- **Platform-specific instruction templates**: Each CLI gets tailored config files — `CLAUDE.md` (with slash commands), `AGENTS.md` (with trigger phrases + command file mapping for Codex), `.github/copilot-instructions.md` (with skill directory references for Copilot), `GEMINI.md`.
- **Document output paths**: User-facing outputs (spec, plan, reviews, executions, subagent sessions, production readiness) now write to `docs/superomni/`. Internal state (improvements, evaluations, harness audits) stays in `.superomni/`.
- Renamed `brainstorm` skill to `brainstorm` for consistency across the project.
- Renamed `scripts.build` to `scripts.gen-skills` to avoid triggering npm git dep preparation.
- CLI rewritten with explicit `install` (default, project-level) and `setup` (global) commands.

### Fixed
- Removed `scripts.postinstall` — it triggered npm 11's git dep preparation bug (npm/cli#8131), causing `npx` to fail silently.
- Added `--force` flag to overwrite existing installations.

### Added
- `lib/templates/claude-instructions.js` — Claude Code instruction generator
- `lib/templates/codex-instructions.js` — Codex CLI instruction generator (includes slash command → file mapping)
- `lib/templates/copilot-instructions.js` — GitHub Copilot instruction generator
- `install.sh` — curl-pipe-bash installer as fallback

---

## [0.4.1] — 2026-03

### Fixed
- `bin/superomni-cli`: Project-level `npx superomni` now correctly installs into the user's current working directory. When npm sets `INIT_CWD` (standard behaviour for `npx` invocations), the CLI binary now exports it as `SUPEROMNI_TARGET_DIR` before delegating to the setup script, mirroring the detection already present in `lib/postinstall.js`.
- `setup`: Corrected stale internal `VERSION` string from `0.3.0` to `0.4.1`.

---

## [0.4.0] — 2026-03

### Added
- `skills/harness-engineering/` — harness engineering audit skill; evaluates context efficiency, tool action space, evaluation gate coverage, and feedback loops; produces Harness Health Score (N/25) and prioritized improvement backlog to `docs/superomni/harness-audits/`. Inspired by OpenAI and Anthropic harness engineering best practices.
- `agents/evaluator.md` — dedicated evaluation agent; produces criterion-by-criterion APPROVED/CHANGES_REQUIRED verdicts with evidence backing. Based on Anthropic's principle: "Evaluation is the load-bearing part of agent harness design."
- `commands/harness-audit.md` — `/harness-audit` slash command; runs the full 8-phase harness audit
- `docs/HARNESS.md` — comprehensive harness engineering guide covering core principles, superomni harness architecture, and maintenance indicators

### Changed
- `skills/executing-plans/`: Added Iron Law 2 (Evaluate Before Advancing) and Iron Law 3 (Failures Are Harness Signals); added Phase 4 (Wave Evaluation Gate) between wave execution and mid-plan check-ins — waves must now pass an evaluation gate before advancing; phases renumbered 4→5, 5→6, 6→7
- `lib/preamble.md`: Added **Context Window Management** protocol (progressive disclosure table for all workflow stages) and **Feedback Signal Protocol** (1/2/3 failure escalation with harness signal trigger)
- `CLAUDE.md`: Registered `harness-engineering` skill (P1); added `/harness-audit` command; added harness-audits output directory to Document Output Convention
- `claude-skill.json`: Bumped to v0.4.0; registered `harness-audit` command
- `docs/DESIGN.md`: Updated to v0.4.0; added Section 9 (Design Decisions: v0.4.0) documenting harness engineering decisions

### Philosophy
v0.4.0 applies harness engineering principles directly to the superomni framework itself — treating the framework as the product and agent output as its artifact. The harness-engineering skill and evaluator agent close the quality loop that was previously informal.

---

## [0.3.0] — 2026-03

### Added
- `skills/production-readiness/` — pre-deploy gate with observability, reliability, and operability checks
- `skills/self-improvement/` — post-task performance evaluation skill; applies first-principles reflection to every sprint cycle
- `skills/office-hours/` — YC-style product discovery before writing code
- `skills/autoplan/` — one-command CEO→Design→Eng plan review pipeline
- `skills/freeze/` — restrict edits to a directory scope during risky operations
- `skills/document-release/` — post-ship documentation synchronization
- `agents/ceo-advisor.md` — product strategy and demand validation agent
- `agents/designer.md` — UX review and AI slop detection agent
- `lib/preamble.md` — Performance Checkpoint section: every skill session ends with a brief self-evaluation
- `lib/validate-skills.sh` — automated skill format validator (YAML frontmatter, PREAMBLE macro, Iron Law presence)
- `.github/workflows/validate.yml` — CI pipeline: build check + skill validation on every push/PR
- `CHANGELOG.md` (this file)
- `docs/COMPARISON.md` — detailed analysis: superomni vs obra/superpowers vs garrytan/gstack
- `bin/skill-manager search` — dynamic skill discovery via GitHub search
- `bin/agent-manager search` — dynamic agent discovery via GitHub search
- 9 slash commands registered in `claude-skill.json` (added `office-hours`, `autoplan`, `freeze`, `document-release`)

### Changed
- `workflow` skill: REFLECT stage now includes self-improvement evaluation step
- `using-skills` skill: added `self-improvement` to quick reference table
- `CLAUDE.md`: registered `self-improvement` skill with trigger phrases
- `docs/DESIGN.md`: updated version to 0.3.0

### Fixed
- `docs/DESIGN.md` version was stale at 0.2.0; corrected to 0.3.0

---

## [0.2.0] — 2025-12

### Added
- `skills/receiving-code-review/` — structured protocol for responding to PR review feedback
- `skills/security-audit/` — OWASP Top 10 + STRIDE vulnerability audit
- `skills/qa/` — quality assurance pass with structured checklists
- `skills/careful/` — safety guardrails for destructive/high-risk operations
- `skills/workflow/` — sprint pipeline orchestration (THINK→PLAN→BUILD→REVIEW→TEST→SHIP→REFLECT)
- Multi-platform support: Claude Code, Cursor, Codex, Gemini CLI, OpenCode, VS Code (Cline, Continue.dev), JetBrains
- `bin/agent-manager` — agent lifecycle manager (list, install, create, remove, search)
- Review checklists: data-driven checklist system separated from skill logic
- 6 built-in agents: `code-reviewer`, `planner`, `debugger`, `test-writer`, `security-auditor`, `architect`

### Changed
- `setup` script: auto-detects platform and configures all 8 supported platforms
- `hooks/session-start`: platform-aware runtime injection

---

## [0.1.0] — 2025-10

### Added
- Initial fusion of obra/superpowers + garrytan/gstack
- 22 core skills: `using-skills`, `brainstorm`, `writing-plans`, `executing-plans`, `systematic-debugging`, `test-driven-development`, `verification`, `code-review`, `plan-review`, `subagent-development`, `git-worktrees`, `finishing-branch`, `dispatching-parallel`, `investigate`, `retro`, `ship`, `writing-skills`, `agent-management`, `document-release`
- `ETHOS.md`: Plan Lean / Execute Complete philosophy + 6 Decision Principles
- `lib/preamble.md`: PROACTIVE mode toggle + unified status protocol
- `{{PREAMBLE}}` template system with `lib/gen-skill-docs.sh` build step
- `hooks/session-start`: skill injection at Claude Code session start
- `bin/config`: configuration management (proactive, telemetry)
- `bin/slug`: stable project identifier
- `bin/analytics-log`: local-only telemetry (JSONL, no network calls)
- Claude Code marketplace support (`.claude-plugin/marketplace.json`)
