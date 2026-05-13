# Plan Review (v2): superomni Framework Optimization

**Plan:** `docs/superomni/plans/plan-main-framework-optimization-v2-20260513.md`
**Spec:** `docs/superomni/specs/spec-main-framework-optimization-v2-20260513.md`
**Branch:** main  **Session:** framework-optimization-v2  **Date:** 20260513
**Mode:** Full auto (no user input)

---

## Phase 1 — Strategy Review (CEO Lens)

| Question | Finding |
|----------|---------|
| Premise validity | **Explicit.** Every claim backed by concrete numbers: 9,947 skill lines, 135-line preamble, 4 skills over 500 (535/473/450/447), 11 agents, direct Anthropic-spec quotes in spec. Upstream consolidation acknowledged (ship→release, agent-management+writing-skills→framework-management) — spec builds on, doesn't redo. |
| Scope calibration | **Right-sized.** 22 steps with 3 phase gates (12, 17, 21) and one user-pause gate (13). Phase 1 alone ships value if Phases 2-3 blocked. User pause strategy (Phase 1 ships in isolation) is honored explicitly. |
| Alternatives considered | **Documented in spec.** Options A (preamble-only), B (agent-only), D (pipeline-first) were rejected in spec v1 with reasons; v2 inherits the decision. |
| DRY | **Passes.** Extends `gen-skill-docs.*` rather than rewriting. Extends `check-workflow-contract.js`. Extends `commands/vibe.md` rather than adding `/autoplan`. Preserves ALL upstream consolidations (ship→release, framework-management). Reuses v1-proven patterns (block-scalar YAML quoting, trailing-newline parity, deprecated-alias migration). |
| Top 3 risks | (1) Step 6 27-file blast radius — mechanical & idempotent; (2) Step 19 `/vibe auto` UX change — dry-run required; (3) Step 18 contract checker false-positive on legacy sessions — exempted by date filter. All documented with mitigation. |
| Success measurability | **Measurable.** Every AC is a command (`wc -l`, `grep`, `ls | wc`, npm exit code, `diff`, `sha256sum`). Zero subjective criteria. |

```
STRATEGY REVIEW
  Premises:     explicit
  Scope:        right-sized (22 steps, 3 phase gates + 1 user gate)
  Alternatives: inherited from v1 spec rejection record
  DRY:          extends existing + preserves upstream consolidation
  Risks:        3 identified, all mitigated
```

**Phase 1 verdict:** APPROVED.

---

## Phase 2 — Design Review

**SKIPPED.** Spec and plan both confirm no UI work. `frontend-design` skill not invoked. No user-facing visual changes.

---

## Phase 3 — Engineering Review

| Check | Finding |
|-------|---------|
| Architecture soundness | **Sound.** Separation of concerns: `lib/preamble-*.md` (data) vs `lib/gen-skill-docs.*` (code) vs `lib/check-workflow-contract.js` (contract) vs `skills/vibe/` (orchestration). Each file single-responsibility. |
| Test coverage | **Comprehensive.** Unit (`wc -l` / `grep` / `ls | wc`), integration (`npm run verify:skill-docs` / `validate-skills` / `check:workflow-contract`), cross-platform (`diff` 3 generators), YAML validity (`js-yaml`), contract-break test (Step 18), E2E (`/vibe auto` dry-run). |
| Performance | **No risks.** Build-time static text expansion. Contract checker ~1 s on 28 YAML frontmatters. |
| Error paths | **Adequate.** Gates on `BLOCKED / DONE_WITH_CONCERNS / NEEDS_CONTEXT`. Rollback section covers all three phases. Deprecated-alias warning ensures migration isn't silent. |
| Security | **Low surface.** No auth, user input, network. Only file I/O under project root. `allowed-tools` per-skill is a **net security improvement**. |
| Backward compatibility | **Strong.** `{{PREAMBLE}}` preserved as deprecated alias → external template copies still build. `docs/superomni/<kind>/` filename contract preserved (non-goal). `EnterPlanMode → brainstorm` rule preserved. Upstream `ship→release` + `framework-management` consolidation preserved. Legacy sessions exempted from contract checker. |
| Blast radius | Step 6: 27 tmpl (mechanical). Step 9: 28 skills (mechanical). Step 14: 9 agent files (user-gated — Step 13 pause). Step 19: 2 files (`commands/vibe.md` + `vibe/SKILL.md`). |

```
ENGINEERING REVIEW
  Architecture: sound (single-responsibility per file)
  Test plan:    comprehensive (6 test dimensions: unit/integration/parity/YAML/contract-break/E2E)
  Performance:  no risks
  Security:     clean (per-skill allowed-tools is net improvement)
  BC:           strong (deprecated alias + EnterPlanMode rule + upstream preservation + session exemption)
  Blast radius: Step 6 = 27 files mechanical; Step 14 destructive — pre-gated by Step 13 user pause
```

**Phase 3 verdict:** APPROVED.

---

## Decision Audit Trail

| # | Phase | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| 1 | Strategy | Inherit v1's Option C (progressive disclosure + artifact contract) | M | P1, P5 | User already confirmed; upstream state doesn't change the fundamental strategy |
| 2 | Strategy | Preserve upstream consolidations (ship→release, agent-management+writing-skills→framework-management) | M | P3 (pragmatic), P4 (DRY) | Upstream did the right consolidation; don't redo |
| 3 | Strategy | Retain 5 agents instead of v1's 3 | T | P1 (completeness), P4 (DRY) | `doc-writer` and `refactoring-agent` were added upstream WITH explicit dispatch paths, unlike the v1-targeted orphan agents; keeping them violates no principle |
| 4 | Engineering | Keep `{{PREAMBLE}}` as deprecated alias | M | P5, P6 | Zero breakage for external copies; deprecation path provides runway |
| 5 | Engineering | Contract checker exempts pre-20260513 sessions | T | P6 (bias to action) | Boiling historical sessions is out of scope; filter date in filename |
| 6 | Engineering | Retire 6 orphan agents + 2 renames via `git rm` | M | P5, P3 | User confirmed in spec; git history is rollback |
| 7 | Engineering | `/vibe auto` as subcommand on `/vibe` | T | P4 | Fewer commands to learn; reuses existing stage-detection |
| 8 | Engineering | `agents/explorer.md` is NEW (not renamed) | M | P1 | No existing agent covers read-only isolated exploration |
| 9 | Engineering | `allowed-tools` scoped per-skill to minimum | T | P1, P5 | Net security + spec compliance improvement; one-time cost |
| 10 | Engineering | Step 7 (overflow extraction) is conditional | T | P3, P6 | Only run if Step 6 doesn't drop all 4 under 500; avoids unnecessary work |
| 11 | Engineering | Update `framework-management` (successor of `writing-skills`) for new token teaching | M | P1 | Required — without this, new skills author via `framework-management` will inherit deprecated pattern |
| 12 | Engineering | `design-md-library/` is explicit non-goal | M | P3 | Upstream-added, cohesive, outside preamble/frontmatter/agent scope |

---

## Taste Decisions — Auto-Resolved

```
TASTE DECISIONS — AUTO-RESOLVED
═══════════════════════════════════════

1. Agent count target: 3 (v1) vs 5 (v2)
   Chosen: 5 — Principle 1 (completeness), Principle 4 (DRY)
   Rationale: Upstream added doc-writer/refactoring-agent with dispatch paths; they are NOT orphans like the others. Removing them would be regressive.

2. Contract checker scope for pre-20260513 sessions
   Chosen: Exempt, inherit from v1 Decision #5 — Principle 6
   Rationale: Lake-boiling historical sessions is out of sprint scope.

3. /vibe auto placement
   Chosen: Subcommand — Principle 4 (DRY)
   Rationale: Reuses stage-detection; avoids new slash command surface.

4. Step 7 overflow extraction
   Chosen: Conditional — Principle 3 (pragmatic)
   Rationale: v1 run showed Step 5 alone often suffices; don't over-plan.

5. Which skills get dispatch-agent declarations
   Chosen: investigate, code-review, systematic-debugging, plan-review, frontend-design, qa, document-release, refactoring, executing-plans (9 skills)
   Chosen by: Principle 1 (completeness) — every skill that benefits from isolated context gets one
   Rationale: Covers all isolated-review + exploration + specialized-agent patterns.

═══════════════════════════════════════
```

No taste decisions escalated to user. All resolved via 6 Decision Principles.

---

## Revisions Applied to Plan

None. v2 plan already incorporates both v1 plan-review §SUGGESTIONS carried forward:
1. **Step 6b (diff snapshot checkpoint)** — explicit intermediate step between Step 6 and Step 7.
2. **Step 18 legacy-session exemption** — explicit sub-step in the contract checker design.

Both were proactively included in v2 plan text.

---

## Plan Review Report

```
PLAN REVIEW COMPLETE
════════════════════════════════════════
Phases completed:     1 (Strategy), 2 (Design — SKIPPED, no UI), 3 (Engineering)
Issues found:         0 P0, 2 P1 (both mitigated)
Decisions made:       8 mechanical + 5 taste — all auto-resolved
Plan status:          APPROVED

Taste decisions auto-resolved (5):
  - Agent count: 5 (preserve upstream doc-writer + refactoring-agent)
  - Contract checker exempts pre-20260513 sessions
  - /vibe auto as subcommand (not new /autoplan)
  - Step 7 overflow extraction conditional
  - 9-skill dispatch-agent declaration scope

Status: DONE
════════════════════════════════════════
```

**Next stage:** BUILD via `subagent-development` or `executing-plans`. Phase 1 Steps 1-12 will execute; Step 13 is the user pause per approved strategy.
