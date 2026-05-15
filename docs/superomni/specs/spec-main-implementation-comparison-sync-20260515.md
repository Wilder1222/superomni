# superomni IMPLEMENTATION.md + COMPARISON 7.2 Sync (v0.6.9)

**Branch:** `feat/implementation-comparison-sync` (off feat/agents-doc-sync at 7cdb308 = v0.6.8 local)
**Session:** `implementation-comparison-sync`  **Date:** 20260515

## Why this spec

5th-consecutive audit-driven sprint. v0.6.8 fixed `docs/AGENTS.md`. Same audit pattern surfaces two more user-facing doc bugs:

### Bug 1 — `docs/IMPLEMENTATION.md` version + Roadmap stale (P0)

- `**Version:** 0.3.0` — actual is **0.6.8** (5 minor versions behind)
- 486-line Developer Reference doc; README links to it as "Implementation details and development guide"
- "Roadmap" section (lines 459-486):
  - `### v0.2.0 ✅ Completed` — yes, but listing it as recent achievement is misleading 6 months later
  - `### v0.3.0` listed as `[ ]` backlog — but we shipped through v0.6.8
  - `### v1.0.0 — GitHub Actions CI` listed as future — but CI exists since v0.6.6
- New contributor reading this gets a fundamentally wrong impression of project maturity

### Bug 2 — `docs/COMPARISON.md` § 7.2 has factually-wrong claims (P0)

The "工程质量问题" (Engineering Quality Issues) section contains two **factually false** claims about superomni in a comparative-analysis doc that is **public-facing**:

- Line 392-394: *"`docs/IMPLEMENTATION.md` 明确承认: 'There is no automated test suite currently. Testing is done manually.' 这对于一个声称支持 TDD 的框架是严重的自我矛盾。"*
  - **False.** Since v0.6.6, GitHub Actions runs 8 CI gates: gen-skills, check:skill-docs, check:workflow-contract, score:workflow, validate-skills.sh, verify:fixture-parity, test:generators, check:plugin-sync, check:plan-content (now 9 gates with v0.6.7 plan-content).
- Line 440-441: *"`docs/IMPLEMENTATION.md` 中有 Roadmap，但没有正式的 CHANGELOG.md 记录每个版本的具体变更。gstack 有详细的 CHANGELOG，有助于用户了解升级内容。"*
  - **False.** `CHANGELOG.md` is 45KB, maintained from v0.6.0 through v0.6.8 with detailed per-version entries.

These are **factual errors in self-comparison docs** — worse than v0.6.8's stale agent doc because they actively misrepresent the project to readers comparing it against alternatives.

### Bug 3 — VERSION_DOCS gap (P2)

`docs/IMPLEMENTATION.md` has `**Version:**` at top — but `lib/check-plugin-sync.js` Invariant 4 doesn't include it in `VERSION_DOCS`. Adding it follows the established pattern (v0.6.6 added README+COMPARISON+DESIGN; v0.6.8 added AGENTS).

## Problem

| # | Bug | Severity | Evidence |
|---|-----|----------|----------|
| 1 | `docs/IMPLEMENTATION.md` `**Version:** 0.3.0` (5 minor stale) | **P0** | line 5 |
| 2 | `docs/IMPLEMENTATION.md` Roadmap section lists v0.2.0 as recent + v0.3.0 as backlog (5 versions stale) | **P0** | lines 459-486 |
| 3 | `docs/COMPARISON.md` § 7.2 false claim "no automated test suite" | **P0** | lines 392-394; 9-gate CI exists since v0.6.6 |
| 4 | `docs/COMPARISON.md` § 7.2 false claim "no CHANGELOG.md" | **P0** | lines 440-441; CHANGELOG is 45KB |
| 5 | `lib/check-plugin-sync.js` VERSION_DOCS missing `docs/IMPLEMENTATION.md` entry | **P2** | post-fix #1, this gap allows regression |

## Goals

- **G1.** `docs/IMPLEMENTATION.md` `**Version:**` → `0.6.9` + add `**Last updated:** v0.6.9` (matches AGENTS.md pattern from v0.6.8)
- **G2.** `docs/IMPLEMENTATION.md` Roadmap section rewritten:
  - Move v0.2.0 / v0.3.0 / etc. into a "Version History" subsection summarizing what shipped (compressed; not full per-version detail since CHANGELOG.md does that)
  - "Current backlog" subsection lists actual current backlog (the v0.7.0+ items the v0.6.x retros consistently defer)
- **G3.** `docs/COMPARISON.md` § 7.2 corrected:
  - Delete or rewrite the "无自动测试套件" claim — replace with current state ("v0.6.6 起 GitHub Actions 跑 9 个 CI gate")
  - Delete or rewrite the "无 CHANGELOG" claim — replace with current state ("CHANGELOG.md 自 v0.6.0 起维护，详细记录每个 patch")
- **G4.** Extend `lib/check-plugin-sync.js` VERSION_DOCS with `docs/IMPLEMENTATION.md` `**Last updated:**` anchor (5th entry in array)
- **G5.** Verify `npm run check:plugin-sync` post-fix exits 0 with "5 invariants validated" (Invariant 4 now checks 5 docs internally; Invariant 5 already validates docs/AGENTS.md)

## Non-Goals (YAGNI)

- **NOT** rewriting all of `docs/IMPLEMENTATION.md` — only Version, Last updated, and Roadmap section
- **NOT** rewriting all of `docs/COMPARISON.md` § 7 — only § 7.2's two false claims
- **NOT** adding a 6th invariant (5 is sufficient; just extending VERSION_DOCS within Invariant 4)
- **NOT** auditing other ## sections of COMPARISON for staleness (focused fix; broader audit would be its own sprint)
- **NOT** changing skill / agent / command counts
- **NOT** touching version-history sections that are correctly historical (v0.2.0 ✅ Completed in IMPLEMENTATION.md is honest history; only the Roadmap framing is stale)

## Proposed Solution

**Selected approach: L — "Two doc fixes + VERSION_DOCS extension in single patch."**

One phase. Touch surfaces:
- `docs/IMPLEMENTATION.md` (lines 5 + 459-486)
- `docs/COMPARISON.md` (§ 7.2 around lines 390-441)
- `lib/check-plugin-sync.js` (VERSION_DOCS array)
- Version bump 0.6.8 → 0.6.9 across 5 manifests + README + 4 docs (COMPARISON, DESIGN, AGENTS, IMPLEMENTATION) + CHANGELOG

### Phase 1 — Doc fixes + invariant extension

1. Rewrite `docs/IMPLEMENTATION.md` lines 5 + Roadmap section (lines 459-486)
2. Rewrite `docs/COMPARISON.md` § 7.2 false-claim items (lines ~392-394 and ~440-441)
3. Add `docs/IMPLEMENTATION.md` to `VERSION_DOCS` array in `lib/check-plugin-sync.js`
4. Verify Invariant 4 now checks 5 docs (README + COMPARISON + DESIGN + AGENTS + IMPLEMENTATION)
5. Version bump

## Key Design Decisions

| Decision | Choice | Rationale | Principle |
|----------|--------|-----------|-----------|
| IMPLEMENTATION.md Roadmap rewrite — keep history? | Yes (as "Version History" subsection); rewrite framing | Honest about what shipped, accurate about current state | Explicit |
| COMPARISON.md fix — delete the "weakness" items or correct them? | Correct them (replace prose with current accurate state) | Doc structure (7.2 = "Engineering Quality Issues") still meaningful — superomni had these gaps once; correcting acknowledges progress | Pragmatic |
| Add 6th invariant for COMPARISON content claims? | No (YAGNI) | The factually-wrong claims existed because the doc was old; once fixed and check-plugin-sync's VERSION_DOCS has the doc tracked, future drift is bounded. Content-correctness CI checks are infinite scope. | YAGNI |
| Add `**Last updated:**` to IMPLEMENTATION.md? | Yes | Consistent with AGENTS.md pattern from v0.6.8; lets VERSION_DOCS pick it up via Invariant 4 | DRY |
| `docs/COMPARISON.md` get a `**Last updated:**` line too? | No (already has `**生成日期：** 2026-03-27` + the existing `**版本：**` regex catches it) | Existing version anchor sufficient | YAGNI |
| Sprint version target | 0.6.9 patch | Bug-fix + minor extension; matches v0.6.5-v0.6.8 cadence | Explicit |

## Acceptance Criteria

### Phase 1

- [ ] `docs/IMPLEMENTATION.md` line 5 = `**Version:** 0.6.9`
- [ ] `docs/IMPLEMENTATION.md` has `**Last updated:** v0.6.9` line near top
- [ ] `docs/IMPLEMENTATION.md` Roadmap rewritten:
  - [ ] "Version History" subsection summarizes v0.2.0 → v0.6.x at appropriate detail (1-2 lines per minor)
  - [ ] "Current Backlog (v0.7.0+)" subsection accurately reflects v0.6.x retros' deferred items
  - [ ] No `[ ]` checkboxes for already-shipped features
- [ ] `docs/COMPARISON.md` § 7.2 false claims corrected:
  - [ ] No "无自动化测试套件" claim (replace with accurate state since v0.6.6)
  - [ ] No "无 CHANGELOG.md" claim (replace with accurate state)
- [ ] `lib/check-plugin-sync.js` VERSION_DOCS array has 5 entries (README + COMPARISON + DESIGN + AGENTS + IMPLEMENTATION)
- [ ] `npm run check:plugin-sync` exits 0 post-rewrite with "5 invariants validated"

### Demos

- [ ] Negative demo: change `docs/IMPLEMENTATION.md` `**Last updated:** v0.6.9` → `v9.9.9` → checker fires; restore → passes
- [ ] Positive demo: confirm `npm run check:plugin-sync` clean state with all 5 docs synced

### Global regression gates

- [ ] All 8 CI commands locally green
- [ ] `${CLAUDE_SKILL_DIR}` literal token preserved (15)
- [ ] `EnterPlanMode → brainstorm` rule preserved (5 mentions in CLAUDE.md)
- [ ] `frontend-design/reference/design-md-library/*` unchanged (9 entries)
- [ ] No flat `reference.md` files (0)
- [ ] Skill / agent counts unchanged (28 / 5)
- [ ] No `.approved-spec-*` markers (0; v0.6.6 G7 invariant)
- [ ] Total skill body lines unchanged (this sprint adds no skill content)

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` show `0.6.9`
- [ ] `README.md` `Current stable version: 0.6.9`
- [ ] `docs/COMPARISON.md` header + footer → 0.6.9
- [ ] `docs/DESIGN.md` Status: Implemented (v0.6.9)
- [ ] `docs/AGENTS.md` `**Last updated:** v0.6.9`
- [ ] `docs/IMPLEMENTATION.md` Version + Last updated → 0.6.9
- [ ] `CHANGELOG.md` has new `[0.6.9] — 2026-05-15` entry

## Open Questions

None.

## Frontend Design Note

N/A — no UI work.

## Deferred to v0.7.0+ Backlog (unchanged)

1. `context: fork` migration
2. `model:` / `effort:` per-skill overrides
3. `$ARGUMENTS` substitution adoption
4. `paths` glob auto-trigger (likely never)
5. Live `/vibe` E2E test (sandbox required)
6. CHANGELOG auto-generation from commits
7. Windows job fixture-parity
8. `bin/audit-repo-invariants` data-driven exclude list
9. Broader audit of `docs/COMPARISON.md` other sections (only § 7.2 in scope this sprint)

## Next Stage

On approval → auto-advance to **PLAN**.

---

**Status: DONE — spec ready for user approval.**

5th-consecutive audit-driven sprint. Pattern: read post-merge state → grep for staleness → ship single-purpose patch with new CI invariant or extension. v0.6.8 closed AGENTS.md; v0.6.9 closes IMPLEMENTATION.md + COMPARISON.md § 7.2 false claims. Same shape, same risk profile.
