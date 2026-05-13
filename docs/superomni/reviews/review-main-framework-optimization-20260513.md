# Plan Review: superomni Framework Optimization

**Plan reviewed:** `docs/superomni/plans/plan-main-framework-optimization-20260513.md`
**Spec anchor:** `docs/superomni/specs/spec-main-framework-optimization-20260513.md`
**Branch:** main  **Session:** framework-optimization  **Date:** 20260513
**Mode:** Full auto (no user input)

---

## Phase 1 — Strategy Review (CEO Lens)

| Question | Finding |
|----------|---------|
| Premise validity | **Explicit.** Spec backed every premise with concrete numbers (135 preamble lines, 9,635 total skill lines, 9 agents with 8 unreferenced, line ceilings from Anthropic docs with direct quotes). No hidden assumption. |
| Scope calibration | **Right-sized.** Three phases gated independently (Steps 8, 12, 16). Phase 1 alone is shippable if Phases 2-3 blocked. Matches user's "low-risk-first deliverability" preference. |
| Alternatives considered | **Documented.** Spec §"Why not the alternatives" rejected Options A (preamble-only), B (agent-only), D (pipeline-first) with reasons. |
| DRY check | **Passes.** Plan reuses `lib/gen-skill-docs.{js,sh,ps1}` build path, extends `lib/check-workflow-contract.js` rather than rewriting, extends `commands/vibe.md` rather than adding new command, demotes `workflow/SKILL.md` instead of deleting (preserves inbound links). |
| Top 3 risks | (1) Step 5 blast radius = 27 files; (2) Step 14 `/vibe auto` changes user-visible behavior; (3) Step 13 contract checker may false-positive on legacy sessions. All three mitigated in the plan's Risks section. |
| Success measurability | **Measurable.** Every acceptance criterion is a command (`wc -l`, `grep`, exit code, file existence). Zero subjective criteria. |

```
STRATEGY REVIEW
  Premises:     explicit
  Scope:        right-sized (3 phases, independent gates)
  Alternatives: considered (A/B/D rejected with reasons)
  DRY:          reuses existing build + CI pipelines
  Risks:        (1) 27-file blast radius Step 5 — mitigated (mechanical line-level change, git revert)
                (2) /vibe auto UX change Step 14 — mitigated (dry-run on demo spec)
                (3) contract checker false-positive on legacy sessions — mitigated (exempt pre-existing in Step 13)
```

**Phase 1 verdict:** APPROVED — premises valid, scope calibrated, risks bounded.

---

## Phase 2 — Design Review

**SKIPPED.** Spec and plan both explicitly state no UI work. `frontend-design` not invoked. No user-facing visual changes.

---

## Phase 3 — Engineering Review

| Check | Finding |
|-------|---------|
| Architecture soundness | **Sound.** Clean separation: data (`lib/preamble-{core,ref}.md`) vs. code (`lib/gen-skill-docs.*`) vs. contract (`lib/check-workflow-contract.js`) vs. orchestration (`skills/vibe/SKILL.md`). Each file has one responsibility. |
| Test coverage plan | **Sufficient.** Unit-level file-shape checks (`wc`/`grep`), integration-level CI scripts (`verify:skill-docs`, `validate-skills`, `check:workflow-contract`), cross-platform parity (3 `gen-skill-docs` variants, byte-identical golden fixture), end-to-end (`/vibe auto` on demo spec), negative test (inject contract break → exit non-zero). |
| Performance risks | **None identified.** Build-time static text expansion, no runtime hot paths. Contract checker parses 28 YAML frontmatters once per CI run (< 1 s). |
| Error path handling | **Adequate.** Plan gates on `BLOCKED / DONE_WITH_CONCERNS / NEEDS_CONTEXT`; rollback section covers all three phases; deprecated-placeholder warning ensures migration isn't silent. |
| Security considerations | **Low surface.** No auth, no user input, no network. Only file IO under project root. `allowed-tools` per-skill frontmatter is a security **improvement**, not a regression. |
| Backward compatibility | **Preserved.** `{{PREAMBLE}}` kept as deprecated alias (Step 4) so external skills copying the template still build. `docs/superomni/<kind>/` directory contract preserved (non-goal). `EnterPlanMode → brainstorm` rule preserved. All existing spec/plan/review files continue to parse. |
| Blast radius | Step 5: 27 tmpl files (mechanical line-level). Step 6: up to 10 tmpl + up to 10 reference.md. Step 7: 28 skills. Step 9: deletes 6 agents, renames 2 (user-confirmed in spec). Step 14: 2 files (`commands/vibe.md` + `skills/vibe/SKILL.md`). |

```
ENGINEERING REVIEW
  Architecture: sound (single-responsibility per file)
  Test plan:    comprehensive (unit + integration + parity + e2e + negative)
  Performance:  no risks (build-time only, < 1 s contract checker)
  Security:     clean (allowed-tools is a net improvement)
  BC:           preserved (deprecated alias, EnterPlanMode rule, directory contract)
  Blast radius: Step 5 = 27 files; Steps 9 + 14 user-confirmed
```

**Phase 3 verdict:** APPROVED — no P0 issues, all risks documented and mitigated.

---

## Decision Audit Trail

| # | Phase | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| 1 | Strategy | Accept plan's phase-gating (8, 12, 16) as completeness boundary | M | P1 (completeness) | Gates convert a 17-step monolith into 3 independent deliverables; each phase self-verifies before next. |
| 2 | Strategy | Accept `lib/preamble-core.md` + `lib/preamble-ref.md` over a single shorter preamble | T | P1, P5 | Two-file split is explicit-over-clever: core=always-loaded, ref=on-demand, matches Anthropic's progressive disclosure verbatim. Single-file would force a lossy trim. |
| 3 | Strategy | Accept phase ordering Phase1→Phase2→Phase3 (preamble → agents → pipeline) | M | P6 (bias to action) | User confirmed in spec; lowest-risk/widest-blast-radius first. |
| 4 | Engineering | Keep `{{PREAMBLE}}` as deprecated alias vs. hard-remove | T | P5, P6 | Deprecated alias with stderr warning = backward-compatible for external copies of the template; hard-remove is a breakage for no win. |
| 5 | Engineering | Contract-checker exempts pre-existing sessions | T | P6 | Applying new frontmatter contract to 2026-04-07/2026-04-09/2026-04-20 sessions is lake-boiling beyond phase scope; scope to new sessions, add backlog note. (Accept suggestion from own plan review §SUGGESTIONS.) |
| 6 | Engineering | Retire 6 agents via `git rm` vs. soft-deprecate | M | P5, P3 | User confirmed in spec; git history IS the rollback; soft-deprecate would leak dead files for no win. |
| 7 | Engineering | `/vibe auto` as subcommand on existing `commands/vibe.md` vs. new `/autoplan` | T | P4 (DRY), P3 | Fewer slash commands to learn; `vibe` already has stage-detection logic; `/autoplan` would duplicate it. |
| 8 | Engineering | `agents/explorer.md` is NEW (not renamed) | M | P1 | No existing agent covers read-only exploration with tool restriction; Anthropic's pattern requires it; retired agents don't fit that shape. |
| 9 | Engineering | `allowed-tools` scoped per-skill to minimum surface | T | P1, P5 | Explicit tool surface improves Anthropic-spec compliance + reduces blast radius if a skill is ever corrupted. Small extra work, durable benefit. |
| 10 | Engineering | Step 6 section-identification is run-time, not pre-decided in plan | T | P3 | Which sections overflow depends on Step 5's actual outcome; pre-deciding would be over-planning (violates Plan Lean). Filter "NOT an operational step" is explicit enough. |

---

## Taste Decisions — Auto-Resolved

```
TASTE DECISIONS — AUTO-RESOLVED
═══════════════════════════════════════

1. Preamble split shape: 2-tier (core + ref) vs. single trimmed preamble
   Chosen: 2-tier — Principle 1 (completeness), Principle 5 (explicit)
   Rationale: Anthropic's progressive disclosure requires on-demand ref loading. Single-file would force knowledge loss.

2. Backward-compat for {{PREAMBLE}} placeholder
   Chosen: Deprecated alias with stderr warning — Principle 5, Principle 6
   Rationale: Zero breakage for external template copies; deprecation path provides migration runway.

3. Contract checker scope for pre-existing sessions
   Chosen: Exempt pre-20260513 sessions, add backlog note — Principle 6 (bias to action)
   Rationale: Lake-boiling historical sessions is out of this sprint's scope; backlog preserves visibility.

4. /vibe auto placement
   Chosen: Subcommand on existing /vibe — Principle 4 (DRY)
   Rationale: Reuses stage-detection; avoids teaching users a new slash command.

5. allowed-tools granularity
   Chosen: Minimum-surface per skill — Principle 1, Principle 5
   Rationale: Improves Anthropic-spec compliance AND reduces blast radius; one-time cost, durable benefit.

═══════════════════════════════════════
```

No taste decisions escalated to the user. All resolved via 6 Decision Principles.

---

## Revisions Applied to Plan

1. **Step 13 (contract checker) gets a scope-clarifying sub-step:** checker exempts `docs/superomni/` sessions predating `20260513`. Recorded as Decision #5 above; the plan's Step 13 sub-step 3 already notes this will be added as a 1-line exemption during execution (captured in the plan's own pre-execution review §SUGGESTIONS).
2. **Step 5 execution adds a diff-snapshot checkpoint** between Step 5 completion and Step 6 start — captures post-migration line counts into the execution doc before extracting overflow. Per the plan's own §SUGGESTIONS.

Both revisions are additive notes, not structural changes; they will be applied during BUILD execution without requiring a plan re-write.

---

## Plan Review Report

```
PLAN REVIEW COMPLETE
════════════════════════════════════════
Phases completed:     1 (Strategy), 2 (Design — SKIPPED, no UI), 3 (Engineering)
Issues found:         0 P0, 2 P1 (both mitigated in plan text)
Decisions made:       4 mechanical + 5 taste — all auto-resolved via 6 Decision Principles
Plan status:          APPROVED_WITH_NOTES

Revisions applied (additive notes only):
  - Step 13: scope contract checker to post-20260513 sessions; add 1-line exemption
  - Step 5: capture post-Step5 diff snapshot into execution doc before Step 6

Taste decisions auto-resolved (5):
  - 2-tier preamble split (core + ref)
  - {{PREAMBLE}} deprecated alias with warning
  - Contract checker exempts pre-existing sessions
  - /vibe auto as subcommand (not new /autoplan)
  - allowed-tools minimum-surface granularity

Status: DONE
════════════════════════════════════════
```

**Next stage:** BUILD via `executing-plans` or (preferred here) `subagent-development` for parallel wave execution. Phase 1 Steps 1-7 can run mostly sequentially with Step 2, 3, 4 parallelizable; Step 5 must follow Step 4; Steps 6, 7 can parallelize after Step 5.
