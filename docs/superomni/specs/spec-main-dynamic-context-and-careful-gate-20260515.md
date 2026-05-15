# superomni Dynamic Context Extension + Pre-Destructive Gate (v0.6.3)

**Branch:** main  **Session:** dynamic-context-and-careful-gate  **Date:** 20260515
**Predecessors:** v0.6.2 (`spec-main-anthropic-field-alignment-20260514.md`) shipped locally on `feat/skill-layering-anthropic` (commit 6361a59). v0.6.3 layers on top.

## Why this spec

Two things are open and cheap:

1. **`!`<command>`` pattern stops at vibe.** v0.6.2 introduced Anthropic dynamic-context injection in `vibe`'s Phase 1. The pattern saves 1 Bash round-trip per skill load. The same technique applies to `verification` (which always runs `git diff --stat`, counts open `- [ ]` items in the latest plan, and reads test output) and `release` (which always reads version, recent commits, CHANGELOG header, unpushed commit count). Right now those skills tell the LLM "here's bash to run"; with `!`<cmd>`` they pre-resolve.
2. **Pre-destructive gate still missing in `writing-plans`.** v0.6.0 retro flagged this as **P0 — open**: when a plan step contains `git rm`, mass rename, or any destructive op, the prior step MUST invoke `careful` with explicit blast-radius enumeration. v0.6.0 sprint discovered this reactively (Step 14.5 amendment); v0.6.1, v0.6.2 had no destructive ops so the bug stayed latent. The next sprint that does have destructive ops will bump into the same hole. Cheap to close now while we're already touching `writing-plans` adjacencies.
3. **`bin/audit-repo-invariants <pattern>`** — v0.6.0 retro ACTION 3 (P1, still open). When migrating a repo-wide invariant (e.g., `{{PREAMBLE}}` → `{{PREAMBLE_CORE}}`), the plan must enumerate every file referencing the old form. Currently this is a manual grep that has missed sister-tools twice (v0.6.0 missed `validate-skills.sh`). A 50-line bash script would catch them.

Combining these into a single 0.6.3 patch sprint: same touch surface (skill bodies + writing-plans template + new bin/), same CI cycle.

## Problem

| # | Concrete problem | Impact |
|---|---|---|
| 1 | `verification` skill body tells LLM to run bash for `git diff --stat`, plan-checkbox count, test output | 2-3 wasted Bash round-trips per `/verify` |
| 2 | `release` skill body tells LLM to run bash for current version, recent commits, CHANGELOG head, unpushed commits | 2-4 wasted Bash round-trips per `/release` |
| 3 | `writing-plans` template doesn't require `careful` invocation before destructive plan steps | Latent P0 bug; next sprint with `git rm` likely repeats the v0.6.0 reactive discovery |
| 4 | No automated invariant audit when migrating repo-wide patterns | v0.6.0 missed `validate-skills.sh` reference; could happen again |

## Goals

- **G1.** `verification/SKILL.md.tmpl` Phase 1 (or its analog) gains a `## Current State (auto-injected)` block with `!`<command>`` lines covering: branch, diff stat, plan checkbox count, evaluations dir count.
- **G2.** `release/SKILL.md.tmpl` Phase 1 (Pre-Release Assessment) gains a `## Current State (auto-injected)` block covering: current version, recent commits since last release, CHANGELOG top entry, unpushed commit count, plan/evaluation paths.
- **G3.** `writing-plans/SKILL.md.tmpl` adds a "Pre-Destructive Gate" sub-section under Phase 3 ("Generate Plan"): if any step contains `git rm`, rename, or mass-delete patterns, the immediately-prior step MUST invoke `careful` with blast-radius enumeration.
- **G4.** `bin/audit-repo-invariants <pattern>` — new bash script that finds all files referencing a given pattern, groups by directory, and flags whether each is a usage site or a sister-tool that reads the pattern.

## Non-Goals (YAGNI)

- **NOT** extending `!`<command>`` to other skills beyond `verification` and `release`. Both are pipeline-end skills with deterministic data-gathering needs; other skills have varying needs.
- **NOT** wiring the pre-destructive gate into `lib/check-skill-docs.js` as an automatic checker. The gate is **template guidance** for plan authors — it shapes future plans, not a CI hard-fail. Auto-checking plan content is a separate "plan linter" sprint.
- **NOT** shipping `bin/audit-repo-invariants` with auto-discovery of "usage" vs "tool" — that's a heuristic-heavy classifier. v0.6.3 ships pure file-listing grouped by directory; the user reads and classifies.
- **NOT** migrating `dispatch-agent` to `context: fork` (architectural; deferred to v0.7.0+).
- **NOT** adopting `$ARGUMENTS` / `$N` substitution.
- **NOT** per-skill `model:` / `effort:` overrides.
- **NOT** changing skill / agent counts.
- **NOT** modifying the v0.6.1 `reference/<topic>.md` extractions or v0.6.2 frontmatter additions.

## Proposed Solution

**Selected approach: F — "Dynamic-context extension + pre-destructive template gate + audit tool, single patch sprint."**

Three small phases. Same shape as v0.6.2 — frontmatter/skill body in Phase 1, tooling in Phase 2, gate teaching in Phase 3.

### Phase 1 — `!`<command>`` extension to verification + release (LOW risk)

1. Add `## Current State (auto-injected)` block early in `verification/SKILL.md.tmpl`, after the Iron Law section, before the verification checklist.
2. Add `## Current State (auto-injected)` block in `release/SKILL.md.tmpl` Phase 1 (Pre-Release Assessment).
3. Each block includes 5-7 `!`<command>`` lines with project-specific commands.
4. Verify generators preserve the literal pattern (regression test from v0.6.2 still passes).

### Phase 2 — `bin/audit-repo-invariants` (LOW risk)

1. Author a bash script at `bin/audit-repo-invariants` that takes a pattern argument and outputs:
   - Files matched grouped by top-level directory
   - For each match, count of occurrences
   - Hint header explaining "usage site" vs "sister-tool" classification (user reads)
2. Add npm script `audit:invariants` for discoverability.
3. Document in `framework-management/SKILL.md` § Supporting Files (one-line pointer).

### Phase 3 — Pre-Destructive Gate in writing-plans (LOW risk)

1. Add a new "Pre-Destructive Gate" sub-section to `writing-plans/SKILL.md.tmpl` Phase 3.
2. Pattern documented: any plan step containing `git rm`, `rm -rf`, `mv` (mass), `git filter-branch`, `gh repo delete`, etc., MUST be preceded by a step that invokes `careful` skill with explicit blast-radius enumeration.
3. Add a worked example showing the v0.6.0 Step 14 → Step 14.5 amendment pattern.
4. Add 1-line note in `careful/SKILL.md` linking back ("invoked by writing-plans pre-destructive gate").

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| `!`<cmd>`` scope | verification + release only | These are deterministic pipeline-end skills with stable data-gathering needs; other skills vary | YAGNI |
| Block placement | After Iron Law, before main protocol | Matches vibe pattern from v0.6.2 (consistency); reader sees state first | Explicit |
| Pre-destructive gate enforcement | Template guidance, not CI hard-fail | Plans are markdown; auto-linting them is a separate sprint | YAGNI, Pragmatic |
| Audit tool format | bash + grep, no node | Mirrors existing `bin/` (slug, build-skills, etc. are all bash) | DRY |
| Audit tool output | files grouped by dir, no auto-classification | Heuristic classification ("is this a usage site?") is brittle; user reads + decides | Explicit > clever |
| `careful` skill linking back | 1-line note only | The gate teaches plan authors; the careful skill itself doesn't change | YAGNI |
| Combined patch (1 + 7) | Yes | Same touch surface, single CI cycle | Boil lakes |

## Acceptance Criteria

### Phase 1 (`!`<command>`` extension)

- [ ] `verification/SKILL.md.tmpl` contains `!`<command>`` block with ≥ 4 commands.
- [ ] `release/SKILL.md.tmpl` contains `!`<command>`` block with ≥ 5 commands.
- [ ] After `npm run gen-skills`, generated `verification/SKILL.md` + `release/SKILL.md` contain literal `!`<command>`` patterns (verified by `grep -c '!\`'`).
- [ ] `npm run test:generators` exit 0 (multi-occurrence regression test from v0.6.2 still green — guard against future generator changes).
- [ ] `npm run verify:skill-docs` exit 0.
- [ ] verification body line count ≤ 300 (was 287; +5-10 lines acceptable).
- [ ] release body line count ≤ 220 (was 201; +5-15 lines acceptable).

### Phase 2 (`bin/audit-repo-invariants`)

- [ ] `bin/audit-repo-invariants` exists, executable bit set.
- [ ] `bin/audit-repo-invariants '{{PREAMBLE}}'` runs and outputs a non-empty group-by-directory listing on the current repo (the legacy alias still appears in some teaching examples).
- [ ] `bin/audit-repo-invariants 'nonexistent-pattern-xyz'` exits 0 with a "no matches" message (graceful empty case).
- [ ] `package.json` adds `audit:invariants` script.
- [ ] `framework-management/SKILL.md.tmpl` Supporting Files section gets 1-line pointer.

### Phase 3 (Pre-Destructive Gate)

- [ ] `writing-plans/SKILL.md.tmpl` has a "Pre-Destructive Gate" sub-section ≥ 15 lines under Phase 3.
- [ ] Section documents the pattern AND includes the v0.6.0 Step 14.5 worked example.
- [ ] `careful/SKILL.md.tmpl` has a 1-line note linking back to writing-plans.
- [ ] `npm run gen-skills && npm run verify:skill-docs` exit 0.
- [ ] writing-plans body line count ≤ 200 (was 155 + ~25 = 180; safe).

### Global regression gates

- [ ] All 5 CI commands exit 0: `verify:skill-docs` (gen + check + fixture-parity + test:generators), `check:workflow-contract`, `validate-skills`.
- [ ] `${CLAUDE_SKILL_DIR}` literal token preserved (15 occurrences across the 5 v0.6.1-trimmed skills).
- [ ] `EnterPlanMode → brainstorm` rule preserved (5 mentions in CLAUDE.md).
- [ ] `frontend-design/reference/design-md-library/*` unchanged.
- [ ] No flat `reference.md` files at any skill root.
- [ ] Skill / agent counts unchanged (28 / 5).
- [ ] Total `wc -l skills/*/SKILL.md` grows by ≤ 50 lines (4 surfaces × ~10 lines each).

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` all show `0.6.3`.
- [ ] `CHANGELOG.md` has new `[0.6.3] — 2026-05-15` entry.

## Open Questions

None. All scope items are mechanical applications of patterns the user has already approved or that are explicit retro carry-forwards.

## Frontend Design Note

N/A — no UI work.

## Deferred to v0.7.0+ Backlog

(Carried forward unchanged from v0.6.2):

1. `context: fork` + `agent:` migration for the 7 dispatch-agent skills (architectural minor).
2. `$ARGUMENTS` / `$N` substitution in skill bodies.
3. `model:` / `effort:` per-skill overrides.
4. `paths` glob auto-trigger review (likely never).
5. Plan linter that auto-checks pre-destructive gate compliance in plan files (extension of v0.6.3 G3).

## Next Stage

On approval → auto-advance to **PLAN** via `writing-plans`, producing `plan-main-dynamic-context-and-careful-gate-20260515.md`.

---

**Status: DONE — spec ready for user approval.**
