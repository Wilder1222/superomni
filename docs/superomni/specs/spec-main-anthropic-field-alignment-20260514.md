# superomni Anthropic Field Alignment + Retro Cleanup (v0.6.2)

**Branch:** main  **Session:** anthropic-field-alignment  **Date:** 20260514
**Predecessors:** v0.6.1 (`spec-main-skill-layering-anthropic-20260514.md`) — progressive-disclosure layering shipped locally on `feat/skill-layering-anthropic` (commit 5810cff). v0.6.2 will ship on top of that branch (or a sibling).

## Why this spec

v0.6.1 closed three layering debts (preamble, agent count, reference extraction) but left **6 Anthropic frontmatter fields** unused project-wide and **3 retro ACTIONs** open. v0.6.1 retro explicitly recorded user pre-authorization to apply the side-effect-skill lock and the background-skill hide.

This sprint cherry-picks the LOW-risk subset of v0.6.1's deferred backlog plus the 3 retro actions, ships them as a single 0.6.2 patch.

Specifically:

1. **Side-effect skill auto-invocation risk.** With current frontmatter, the LLM can auto-trigger `release` / `finishing-branch` / `framework-management` based on description-match. `release` and `finishing-branch` have user-visible side effects (commits, PRs, tags); `framework-management` mutates the project's skill/agent set. None should be triggered without explicit user intent.
2. **`using-skills` clutters the `/` menu.** It's a meta-skill that's always loaded; users have no reason to type `/using-skills`.
3. **No `argument-hint` anywhere.** Skills like `vibe`, `brainstorm`, `execute-plan` accept positional args; users get no autocomplete hint when typing `/<skill> <args>`.
4. **Static `vibe` startup.** `vibe`'s Phase 1 currently *describes* the bash to run for stage detection; the bash actually runs only when the skill body executes. Anthropic's `!\`<command>\`` dynamic context injection runs the command **before** the skill body reaches the LLM, pre-filling state. For `vibe`, this means git status, recent artifacts, and current branch arrive already-resolved instead of as a "go run this script" instruction.
5. **3 v0.6.1 retro ACTIONs deferred** — ps1 generator unit-test, CRLF advisory, validate-skills.sh "Iron Law without examples" upgrade. All small, all related to the v0.6.1 tooling area, all cheaper to do now than later.

## Problem

| # | Concrete problem | Impact |
|---|---|---|
| 1 | LLM may auto-trigger `release` / `finishing-branch` based on description match alone | High: unintended commits / PRs |
| 2 | `framework-management` can be auto-invoked when LLM detects a "create skill" intent | Medium: unintended scaffold churn |
| 3 | `using-skills` shows in `/` menu without offering meaningful user action | Low: menu clutter |
| 4 | No `argument-hint` on `vibe`, `brainstorm`, `execute-plan`, `release` | Low: degraded UX for `/skill` autocomplete |
| 5 | `vibe` bash detection runs *inside* skill body (1 round-trip wasted) | Medium: 1 extra Bash call per `/vibe` invocation |
| 6 | ps1 generator's `count`-arg failure mode caught only by golden fixture; no unit test | Low: regression risk on future generator edits |
| 7 | No advisory if a committed `SKILL.md` accidentally has CRLF | Low: cross-platform parity could re-break silently |
| 8 | `validate-skills.sh` flags TDD as missing examples (post-extraction false positive) | Low: noisy warning during CI |

## Goals

- **G1.** `release`, `finishing-branch`, `framework-management` get `disable-model-invocation: true`. Auto-invocation by LLM blocked; user-typed `/release` etc. still works.
- **G2.** `using-skills` gets `user-invocable: false`. Hidden from `/` menu; LLM still loads it (description visible to LLM).
- **G3.** `argument-hint` added to 4 skills that accept positional args: `vibe` (`[skill-arg-or-status-or-reset]`), `brainstorm` (`[idea]`), `execute-plan` (no args; skip), `release` (`[version]`), and any others identified in BUILD.
- **G4.** `vibe`'s Phase 1 stage-detection bash migrated from "run this" textual instruction to Anthropic native `!\`<command>\`` dynamic context injection. The skill body, when loaded, already shows current branch, recent artifacts, git status. Saves 1 Bash round-trip per `/vibe`.
- **G5.** ps1 generator unit-test added (`npm run test:generators` or wired into existing CI script).
- **G6.** `lib/check-skill-docs.js` adds 3rd advisory: warn if any committed `skills/**/SKILL.md` contains `\r\n`.
- **G7.** `lib/validate-skills.sh` "Iron Law present but no example blocks" warning upgraded: passes if either inline example fences exist OR the skill has a `reference/<topic>.md` file (extraction-aware check).

## Non-Goals (YAGNI)

- **NOT** migrating `dispatch-agent` to `context: fork` + `agent:`. Architectural; deserves its own spec.
- **NOT** adding `paths` glob auto-trigger to any skill. Skills are stage-triggered, not file-triggered, in superomni.
- **NOT** adopting `$ARGUMENTS` / `$N` substitution in skill bodies. argument-hint is purely a UX / autocomplete improvement; substitution is a separate refactor.
- **NOT** adding `model:` or `effort:` overrides on any skill. Per-skill model selection is a future cost-optimization sprint.
- **NOT** adding `!\`cmd\`` dynamic context to `verification` or `release`. Out of v0.6.2 scope; handle in a follow-up if `/vibe` adoption goes well.
- **NOT** changing pipeline stages, `EnterPlanMode → brainstorm` rule, or skill/agent counts.
- **NOT** trimming the 5 skills currently at 280-295 lines (executing-plans, framework-management, verification, code-review, harness-engineering). They're already compliant; no current pain point.

## Proposed Solution

**Selected approach: E — "frontmatter alignment + tooling cleanup, single patch sprint."**

Two phases. Each is self-contained and can ship independently.

### Phase 1 — Frontmatter alignment (LOW risk, high UX value)

1. Edit 3 `SKILL.md.tmpl`: add `disable-model-invocation: true` to `release`, `finishing-branch`, `framework-management`.
2. Edit `using-skills/SKILL.md` directly (no `.tmpl` for it): add `user-invocable: false`.
3. Add `argument-hint` to 4 skills based on actual usage signature (verify by grepping each skill's "Usage" section).
4. Migrate `vibe/SKILL.md.tmpl` Phase 1 detection bash from text-block to `!\`<command>\``-injected blocks. Generated `SKILL.md` will run those commands at skill-load time; the LLM sees already-resolved output.
5. Run `npm run gen-skills && npm run verify:skill-docs && npm run check:workflow-contract` — confirm 0 regression.

### Phase 2 — Tooling cleanup (LOW risk, low value)

1. Add `lib/test-generators.js` (or `.sh`) that exercises both first-occurrence-only and multi-occurrence cases for js / sh / ps1 substitution. Wire into `verify:skill-docs` umbrella or a new `npm run test:generators`.
2. Extend `lib/check-skill-docs.js` with a 3rd advisory: scan committed `SKILL.md` files for `\r\n`; warn if found. Skip if `.gitattributes` LF-pin would re-normalize on next commit (we want to catch the case where someone manually edited and forgot to run gen-skills).
3. Update `lib/validate-skills.sh` "Iron Law without examples" check: pass if either inline example fences exist OR a `reference/` subdir exists with at least one `<topic>.md`.

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| Lock scope | release / finishing-branch / framework-management | All 3 have user-visible side effects or framework mutation | Explicit |
| `using-skills` visibility | `user-invocable: false` (not also `disable-model-invocation`) | LLM should still load it (it's the meta-skill); only user menu hide | Pragmatic |
| `argument-hint` scope | 4 skills, no `$ARGUMENTS` substitution this sprint | UX improvement only; substitution adoption is separate refactor | YAGNI |
| `!\`cmd\`` adoption | `vibe` only, not `verification` / `release` | Test the pattern on highest-traffic skill first; expand if adoption is positive | Bias to action, but lean |
| ps1 unit test format | bash + node fallback | bash is already used by `validate-skills.sh`; node ensures parity if `bash` not available | Pragmatic |
| CRLF advisory placement | `check-skill-docs.js` (existing) | DRY — keep all SKILL.md advisories in one place | DRY |
| validate-skills examples check | Either inline OR `reference/` subdir | The reference/ extraction is the canonical pattern v0.6.1 established; check must match reality | Explicit |
| Combined sprint | A + E in one patch, not two | Same touch surface (frontmatter + lib/), one CI cycle, faster feedback | Boil lakes |

## Acceptance Criteria

### Phase 1 (Frontmatter alignment)

- [ ] `grep -l "disable-model-invocation: true" skills/{release,finishing-branch,framework-management}/SKILL.md` returns 3 paths.
- [ ] `grep -c "user-invocable: false" skills/using-skills/SKILL.md` ≥ 1.
- [ ] `grep -l "argument-hint:" skills/{vibe,brainstorm,release}/SKILL.md` returns ≥ 3 paths (additional skills discovered in BUILD acceptable).
- [ ] `vibe/SKILL.md` contains at least one `` !`<command>` `` block in its Phase 1 section after generation.
- [ ] `npm run gen-skills && npm run verify:skill-docs` exit 0.
- [ ] `npm run check:workflow-contract` exit 0 (no regressions; legacy advisories OK).
- [ ] Skill count unchanged (28). Agent count unchanged (5).

### Phase 2 (Tooling cleanup)

- [ ] `lib/test-generators.js` (or `.sh`) exists; runs against a fixture with 2+ occurrences of one token; asserts only first occurrence is replaced for all 3 generators.
- [ ] Wired into `package.json` scripts; running it on current `main` exits 0.
- [ ] `lib/check-skill-docs.js` warns (not fails) when any `skills/**/SKILL.md` contains `\r\n`. Demonstrated by writing a test fixture with CRLF and observing the warning.
- [ ] `lib/validate-skills.sh` no longer warns on `test-driven-development/SKILL.md.tmpl` (the post-extraction false positive). Confirmed by running on current TDD skill: 0 warnings on TDD.
- [ ] `bash lib/validate-skills.sh` exit code unchanged (it already passes; we only suppress the false positive).

### Global regression gates

- [ ] All 4 CI commands exit 0: `verify:skill-docs`, `check:workflow-contract`, `verify:fixture-parity`, `validate-skills`.
- [ ] `${CLAUDE_SKILL_DIR}` literal token still preserved in generated SKILL.md (15 occurrences across the 5 v0.6.1-trimmed skills, unchanged).
- [ ] `EnterPlanMode → brainstorm` rule preserved in CLAUDE.md (5 mentions).
- [ ] `frontend-design/reference/design-md-library/*` unchanged.
- [ ] No SKILL.md body line count grows by ≥ 20 lines (frontmatter additions are 1-2 lines each).

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` all show `0.6.2`.
- [ ] `CHANGELOG.md` has new `[0.6.2] — 2026-05-14` entry.

## Open Questions

None. All scope items are mechanical applications of fields the user has already pre-authorized in v0.6.1's brainstorm.

## Frontend Design Note

N/A — no UI work.

## Deferred to v0.7.0+ Backlog

1. `context: fork` + `agent:` migration for the 7 dispatch-agent skills (architectural minor bump).
2. `!\`<command>\`` dynamic context injection in `verification` / `release` (extension of v0.6.2 G4).
3. `$ARGUMENTS` / `$N` substitution in skill bodies (depends on argument-hint signal first).
4. `model:` / `effort:` per-skill overrides (cost-optimization sprint).
5. `paths` glob auto-trigger review (probably never — superomni is stage-triggered).

## Next Stage

On approval → auto-advance to **PLAN** via `writing-plans`, producing `plan-main-anthropic-field-alignment-20260514.md`.

---

**Status: DONE — spec ready for user approval.**
