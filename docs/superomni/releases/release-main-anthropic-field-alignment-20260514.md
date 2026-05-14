# Release v0.6.2 — Anthropic Field Alignment + Retro Cleanup

**Branch:** `feat/skill-layering-anthropic` (continuing from v0.6.1's branch)
**Session:** `anthropic-field-alignment`
**Date:** 2026-05-14
**Spec:** `docs/superomni/specs/spec-main-anthropic-field-alignment-20260514.md`
**Plan:** `docs/superomni/plans/plan-main-anthropic-field-alignment-20260514.md`
**Review:** `docs/superomni/reviews/plan-review-main-anthropic-field-alignment-20260514.md`
**Execution:** `docs/superomni/executions/execution-main-anthropic-field-alignment-20260514.md`
**Evaluation:** `docs/superomni/evaluations/evaluation-main-anthropic-field-alignment-20260514.md`

---

## Release

### Headline

Adopt 6 Anthropic frontmatter capabilities (`disable-model-invocation`, `user-invocable`, `argument-hint`, `!`<command>`` dynamic context) on the high-traffic skills, plus the 3 v0.6.1 retro tooling cleanups (multi-occurrence regression test, CRLF advisory, validate-skills upgrade). Bonus: REFLECT gate broadened to recognize the merged retro-in-release convention.

### Numbers

| Metric | Value |
|---|---|
| Skills with `disable-model-invocation: true` | 0 → 3 (release, finishing-branch, framework-management) |
| Skills with `user-invocable: false` | 0 → 1 (using-skills) |
| Skills with `argument-hint` | 0 → 3 (vibe, brainstorm, release) |
| Skills with `!`<command>`` dynamic context | 0 → 1 (vibe) |
| New CI gates | 1 (`test:generators`) wired into `verify:skill-docs` umbrella |
| New advisories | 1 (CRLF detection in `check-skill-docs.js`) |
| Tooling fixes | 2 (validate-skills examples-check, REFLECT gate broadened) |
| `SKILL.md` body lines | 6,181 → 6,196 (+15, vibe gained 9 from auto-inject + 6 frontmatter additions across 4 skills) |
| Skill / agent counts | 28 / 5 (unchanged) |

### Files Touched (this sprint)

- **Modified `SKILL.md.tmpl`:** `release`, `finishing-branch`, `framework-management`, `vibe`, `brainstorm`
- **Modified direct (no .tmpl):** `using-skills/SKILL.md` (frontmatter + line-ending normalization)
- **Modified tooling:** `lib/check-skill-docs.js` (CRLF advisory), `lib/validate-skills.sh` (examples upgrade), `lib/check-workflow-contract.js` (REFLECT gate)
- **New tooling:** `lib/test-generators.js`, `lib/templates/multi-occurrence-fixture.md.tmpl`
- **Regenerated 28 SKILL.md** via `npm run gen-skills`
- **Modified `package.json`:** version 0.6.1 → 0.6.2; new `test:generators` script
- **Other version bumps:** `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json`
- **CHANGELOG.md:** new `[0.6.2]` entry

### Pre-PR Checklist

- [x] `npm run gen-skills` — exit 0 (28 generated, 27 templates)
- [x] `npm run check:skill-docs` — exit 0
- [x] `npm run check:workflow-contract` — exit 0 (after REFLECT-gate fix; v0.6.1 false-error resolved)
- [x] `npm run verify:fixture-parity` — exit 0, 3 hashes match
- [x] `npm run test:generators` — exit 0, all 3 generators PASS multi-occurrence assertion
- [x] `npm run verify:skill-docs` (umbrella) — exit 0
- [x] `bash lib/validate-skills.sh` — 1 warning (workflow stub only; was 2 before)
- [x] All 6 modified frontmatters parse as valid YAML
- [x] EnterPlanMode rule preserved (5 mentions in CLAUDE.md)
- [x] `frontend-design/reference/design-md-library/*` unchanged (9 entries)
- [x] `${CLAUDE_SKILL_DIR}` literal tokens preserved (15 in 5 v0.6.1-trimmed skills)

### Open PR (pending user approval)

- Target: `main`
- Title: `feat: Anthropic frontmatter alignment + 3 retro cleanups (v0.6.2)`
- Body: see § Headline + Numbers above

---

## Retrospective

### Scoring

**Agent total: 14/15**

- Scope management (5/5) — held to spec scope; 1 in-build addition (REFLECT-gate broadening) documented and justified by Principle 2 (Boil Lakes).
- Instruction following (5/5) — completed all 13 plan steps in order; user-gate (Step 7 of v0.6.1) explicitly inline'd given the user's "自动完成" continuation.
- Escalation behavior (4/5) — caught the `using-skills` CRLF leak organically via the new advisory (rather than escalating to user). Still went 2 cycles on the multi-occurrence assertion (first version used wrong discriminator, fixed by switching to `**Status protocol**` count).

### Skill effectiveness avg: 4.7/5

- `brainstorm` — 5/5 (no clarifying questions needed; spec's predecessor scope already covered all 6 v0.6.1-deferred items)
- `writing-plans` — 5/5 (13 steps, 7 milestones, P0=none honest)
- `plan-review` — 5/5 (15 decisions auto-resolved, 1 plan amendment recorded — field ordering — applied inline)
- `executing-plans` — 4/5 (the multi-occurrence test discriminator took 2 iterations; CRLF leak in `using-skills` was caught by the advisory rather than predicted)
- `verification` — 5/5 (positive + negative regression demos for both new advisories)
- `release` — n/a (writing this artifact now)

### Iron Law compliance: 100%

- Spec approval before plan ✓
- Plan review before build ✓
- Phase gates respected ✓
- Status protocol on every artifact ✓
- 6 Decision Principles applied to every taste decision (15 in REVIEW + 2 in BUILD) ✓

### What I would do differently

1. **Detect the `using-skills` CRLF leak earlier.** I edited `using-skills/SKILL.md` directly with the Edit tool, which on Windows can introduce CRLF if the surrounding context has CRLF. Lesson: when editing files outside the `.tmpl` chain, run `npm run check:skill-docs` immediately after — the new CRLF advisory would have surfaced this in seconds.
2. **Author the multi-occurrence fixture more carefully on the first pass.** My initial fixture had 4 literal `{{PREAMBLE_CORE}}` mentions in prose; the assertion expected 1. Fixing it required re-thinking the test's discriminator (counting `**Status protocol**` is the actual signal). Lesson: when writing a regression test, identify the unique observable signal first, then write the fixture to maximize it.
3. **Run `npm run check:workflow-contract` standalone earlier.** The REFLECT-gate error surfaced only at Step 10's gate; running the contract checker after Phase 1 would have caught it sooner and let me schedule the bonus fix into a planned step rather than a Boil Lakes bonus. Not a process violation (Boil Lakes is a valid Principle 2 invocation), just a sequencing improvement.

### Actions for next sprint

#### ACTION 1 (carry-forward from v0.6.1 retro): Sister-script migration checklist

**Priority: P2** (still open from v0.6.1)

Build a `bin/audit-repo-invariants <pattern>` helper that finds all scripts referencing a given pattern and flags them before migration starts. Was deferred from v0.6.1; v0.6.2 didn't need it because no migration was sprint scope. Re-defer to v0.7.0 if a migration is on the table.

#### ACTION 2 (carry-forward from v0.6.1 retro): Pre-destructive gate in plan templates

**Priority: P0** (still open)

Update `writing-plans/SKILL.md` template: if any plan step contains `git rm`, rename, or mass-delete, the immediately-prior step MUST invoke `careful` with explicit blast-radius enumeration. v0.6.2 had no destructive ops; bug stays latent. **Recommend doing this before any sprint that involves migration or removal.**

#### ACTION 3 (new): Live `/vibe` test for `!`<command>`` injection

**Priority: P2**

`vibe`'s new `!`<command>`` block hasn't been validated in a live Claude Code session. If the runtime fails to parse it (older builds, sandbox modes), the block degrades to literal text — acceptable but not ideal. Add a sandboxed `/vibe` invocation to a future sprint and confirm pre-resolution actually happens.

**Owner:** future sprint (v0.7.0+)
**Success criterion:** invoke `/vibe` in a fresh session; observe pre-resolved git status / artifact paths in the LLM's first message, without an explicit Bash tool call.

### Carry-forward check

Prior sprint actions (from v0.6.1's retro inside `release-main-skill-layering-anthropic-20260514.md`):

- ACTION 1 (ps1 generator unit test) — **CLOSED THIS SPRINT** via `lib/test-generators.js` + multi-occurrence fixture.
- ACTION 2 (.gitattributes review skill / CRLF check) — **CLOSED THIS SPRINT** via the new CRLF advisory in `lib/check-skill-docs.js`.
- ACTION 3 (Retire `validate-skills.sh` "Iron Law without examples" warning) — **CLOSED THIS SPRINT** via the inline-OR-reference/ wrapper.

3 of 3 v0.6.1 retro ACTIONs resolved. v0.6.0 retro carry-forwards (sister-script audit, pre-destructive gate) re-listed above; not resolved.

---

## Status: DONE

**Status:** DONE

All 6 pipeline stages produced artifacts. v0.6.2 ready to commit pending user authorization. v0.6.1 (commit 5810cff) still unpushed; v0.6.2 will layer on top.
