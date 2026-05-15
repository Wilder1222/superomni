# Release v0.6.3 — Dynamic Context Extension + Pre-Destructive Gate

**Branch:** `feat/skill-layering-anthropic` (continuing from v0.6.2 commit 6361a59)
**Session:** `dynamic-context-and-careful-gate`
**Date:** 2026-05-15
**Spec:** `docs/superomni/specs/spec-main-dynamic-context-and-careful-gate-20260515.md`
**Plan:** `docs/superomni/plans/plan-main-dynamic-context-and-careful-gate-20260515.md`
**Review:** `docs/superomni/reviews/plan-review-main-dynamic-context-and-careful-gate-20260515.md`
**Execution:** `docs/superomni/executions/execution-main-dynamic-context-and-careful-gate-20260515.md`
**Evaluation:** `docs/superomni/evaluations/evaluation-main-dynamic-context-and-careful-gate-20260515.md`

---

## Release

### Headline

Extend v0.6.2's `!`<command>`` dynamic-context pattern to verification + release (saves 2-4 Bash round-trips per pipeline-end skill load), close v0.6.0's two open retro ACTIONs (pre-destructive gate proactive instead of reactive; `bin/audit-repo-invariants` for sister-tool discovery during migrations), and document both inside framework-management as the canonical pattern for future plan authors.

### Numbers

| Metric | Value |
|---|---|
| Skills with `!`<cmd>`` dynamic context | 1 → 3 (vibe + verification + release) |
| New CLI tools | 1 (`bin/audit-repo-invariants`, ~100 LOC bash) |
| New npm scripts | 1 (`audit:invariants`) |
| Skill body deltas | verification +10, release +13, writing-plans +26, careful +2, framework-management +2 (total +53) |
| Total `wc -l skills/*/SKILL.md` | 6,196 → 6,249 (+53 lines, +0.86%) |
| v0.6.0 retro debt closed | 2 of 2 remaining ACTIONs (pre-destructive gate + audit tool) |
| Skill / agent counts | 28 / 5 (unchanged) |

### Files Touched

- **Modified `SKILL.md.tmpl`:** verification, release, writing-plans, careful, framework-management
- **New tooling:** `bin/audit-repo-invariants` (executable)
- **Modified `package.json`:** version 0.6.2 → 0.6.3; new `audit:invariants` script
- **Other version bumps:** `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json`
- **Regenerated 28 SKILL.md** via `npm run gen-skills`
- **CHANGELOG.md:** new `[0.6.3]` entry above the 0.6.2 entry

### Pre-PR Checklist

- [x] `npm run gen-skills` — exit 0
- [x] `npm run check:skill-docs` — exit 0
- [x] `npm run check:workflow-contract` — exit 0
- [x] `npm run verify:fixture-parity` — exit 0, 3 hashes match
- [x] `npm run test:generators` — 3 generators PASS multi-occurrence assertion
- [x] `npm run verify:skill-docs` (umbrella) — exit 0
- [x] `bash lib/validate-skills.sh` — 1 warning (workflow stub only; expected)
- [x] `bin/audit-repo-invariants` 3 cases verified (matches / no-matches / no-args)
- [x] EnterPlanMode rule preserved (5 mentions in CLAUDE.md)
- [x] `frontend-design/reference/design-md-library/*` unchanged (9 entries)
- [x] `${CLAUDE_SKILL_DIR}` literal tokens preserved (15 occurrences)
- [x] No flat `reference.md` files at any skill root

### Open PR (pending user approval)

- Target: `main`
- Title: `feat: dynamic context in verification+release + pre-destructive gate + audit tool (v0.6.3)`
- Body: see § Headline + Numbers above

---

## Retrospective

### Scoring

**Agent total: 13/15**

- Scope management (5/5) — held to spec scope; mid-build bug fix recorded in CHANGELOG `### Fixed` rather than scope-creeping.
- Instruction following (5/5) — completed all 13 plan steps in order.
- Escalation behavior (3/5) — the `{{PREAMBLE}}` token-expansion bug in framework-management body should have been predictable from prior context. v0.6.0 generator design explicitly says `{{PREAMBLE}}` is the deprecated alias still being expanded; documenting it inside the template guarantees expansion. Cost 1 cycle to discover and fix during Phase 3 gate. Should have caught it at Step 7 review.

### Skill effectiveness avg: 4.7/5

- `brainstorm` — 5/5 (synthesized 1+7 spec without clarifying questions; user choices already locked from previous sprint pick)
- `writing-plans` — 5/5 (13 steps, 7 milestones, P0=none honest)
- `plan-review` — 5/5 (17 decisions auto-resolved; 0 amendments)
- `executing-plans` — 4/5 (the framework-management token-expansion bug took 1 corrective cycle; all other steps were clean)
- `verification` — 5/5 (caught the +53 vs ≤50 line miss honestly; documented rather than gamed)
- `release` — n/a (current artifact)

### Iron Law compliance: 100%

- Spec approval before plan ✓
- Plan review before build ✓
- Phase gates respected ✓
- Status protocol on every artifact ✓
- 6 Decision Principles applied to every taste decision ✓
- DONE_WITH_NOTE used honestly when AC missed by 3 lines (not silently gamed) ✓

### What I would do differently

1. **Predict the `{{PREAMBLE}}` expansion in framework-management.** When editing framework-management — the skill that documents the very token-expansion mechanism — any literal token in prose is a foot-gun. Prefer prose phrasing or backtick-fenced code blocks (which the generator does NOT scan inside, except for the canonical-position tokens). Add to v0.7.0+ backlog: an advisory check for "literal `{{PREAMBLE}}` outside code fences in any tmpl" — would have caught this at Step 7's regen.
2. **Spec ceiling honesty.** "≤ 50 lines" was a back-of-envelope estimate that didn't account for the worked example's natural length. Future specs with similar ceilings should sample the actual content first or use percentage delta (e.g., ≤1% of baseline) rather than absolute counts.
3. **Step 5's `audit-repo-invariants` exclude list could be data-driven.** I hard-coded the runtime-artifact dir list. A future enhancement: read it from `docs/superomni/<convention-config>.json` so adding a new artifact dir to the project doesn't require editing the bash. Deferred.

### Actions for next sprint

#### ACTION 1 (carry-forward, still open from v0.6.0 retro): None remain

All v0.6.0 ACTIONs (1: golden fixture v0.6.1; 2: pre-destructive gate v0.6.3; 3: audit-repo-invariants v0.6.3) are now closed.

#### ACTION 2 (new from this sprint): Token-literal advisory in `lib/check-skill-docs.js`

**Priority: P2**

Add a new advisory: warn when a `SKILL.md.tmpl` contains literal `{{PREAMBLE}}` (or `{{PREAMBLE_CORE}}`, `{{PREAMBLE_REF_LINK}}`) outside of canonical position OR a code-fenced block. Catches the v0.6.3 framework-management foot-gun proactively.

**Owner:** future patch
**Success criterion:** advisory fires when a tmpl has the literal token in prose, doesn't fire when in canonical position or inside ```` ``` ```` fences.

#### ACTION 3 (new from this sprint): `bin/audit-repo-invariants` data-driven exclude list

**Priority: P3**

Move the hard-coded runtime-artifact exclude list out of the bash script into a config file (e.g., `lib/audit-config.json`) so adding a new docs/superomni/ subdirectory doesn't require touching the bash.

**Owner:** future patch (low priority; current list is stable)

### Carry-forward check

Prior sprint actions:

**v0.6.2 retro:**
- ACTION 1 (live `/vibe` test for `!`<command>`` injection) — **DEFERRED** to v0.7.0+ (separate sandbox required); v0.6.3 extends the pattern to 2 more skills, so the test surface is larger when finally run.

**v0.6.1 retro:** all 3 closed in v0.6.2.

**v0.6.0 retro:** all 3 ACTIONs now closed (golden fixture in v0.6.1; pre-destructive gate + audit tool in v0.6.3).

---

## Status: DONE_WITH_NOTE

**Status:** DONE_WITH_NOTE

All hard ACs met. One informational soft AC (≤50 line growth) missed by 3 lines — recorded transparently. v0.6.3 ready to commit pending user authorization. v0.6.1 (5810cff) + v0.6.2 (6361a59) still unpushed; v0.6.3 layers on top.
