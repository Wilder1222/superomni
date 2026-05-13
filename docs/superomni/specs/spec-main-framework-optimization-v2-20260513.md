# superomni Framework Optimization (v2) — Spec

**Branch:** main  **Session:** framework-optimization-v2  **Date:** 20260513
**Supersedes:** `spec-main-framework-optimization-20260513.md` (written earlier this session against an older main; repo was pulled 42 upstream commits and the spec was rebased onto new main).

## Why a v2 spec

The earlier v1 spec was drafted against a `main` that had 9 agents and 28 skills including `ship`, `agent-management`, `writing-skills`. After pulling 42 upstream commits, the shape of the repo changed:

- **Skill count still 28**, but composition differs. Retired: `ship`, `agent-management`, `writing-skills`. Added: `refactoring`, `dependency-audit`, `framework-management` (the last consolidates the two retired meta-skills).
- **Agents 9 → 11**. Added: `doc-writer`, `refactoring-agent`. 3 agents now have explicit skill-dispatch paths (`architect`, `doc-writer`, `refactoring-agent`), up from 1 in v1.
- **`frontend-design` gained an 8-brand DESIGN.md reference library** vendored from `VoltAgent/awesome-design-md`. Whitelist file gates loading.
- **Pipeline unchanged**: `THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE` (SHIP+REFLECT merged into RELEASE per commit 757840b).
- **`lib/preamble.md` still 135 lines**, all 27 `.tmpl` still use bare `{{PREAMBLE}}`, frontmatter still lacks `when_to_use` / `produces` / `consumes`. The three structural debts identified in v1 are fully intact.

The user confirmed all v1 decisions (three optimization lines, Claude-Code-spec compatibility as sole forbidden zone, Phase 1 first). Those are carried forward; this v2 spec only revises the work items that changed.

## Problem

Three structural debts remain against the current (post-pull) `main`:

1. **Preamble duplication — ~3,645 lines (~37% of 9,947 total SKILL.md bytes).** `lib/preamble.md` (135 lines, 13 sections) is expanded verbatim into 27 of 28 `SKILL.md` files at build time. Anthropic's spec: *"keep SKILL.md under 500 lines — move detailed reference material to separate files."* 4 skills now exceed 500 lines (`self-improvement` at 535, up from 507 pre-pull; `subagent-development` 473; `frontend-design` 450; `vibe` 447).
2. **Agent ↔ skill responsibility collision — improved but not resolved.** 8 of 11 agents still lack explicit dispatch paths (`ceo-advisor`, `code-reviewer`, `debugger`, `designer`, `evaluator`, `planner`, `security-auditor`, `test-writer`). Each still overlaps 1:1 with an existing skill. Good news: `doc-writer` and `refactoring-agent` were added *with* explicit dispatches, validating the v1 pattern.
3. **No pipeline artifact contract.** Skill frontmatter does not declare `produces:` / `consumes:`, so `lib/check-workflow-contract.js` can only check presence, not linkage. `/vibe` requires manual skill invocation between stages.

Secondary debts (carried from v1): trigger conflicts on `"release" / "review" / "what's next" / "implement"` (reduced but not eliminated); no per-skill `allowed-tools` beyond today's minimum; no skill manifest index; no `skillOverrides`-equivalent.

## Goals

- **G1 (primary, Phase 1).** Reduce duplicated preamble from ~3,645 lines to ≤800 lines (≥78% reduction) via 2-tier preamble (`preamble-core.md` ≤30 lines inlined; `preamble-ref.md` ~105–130 lines loaded on demand via markdown link). Measured by `wc -l` after migration.
- **G2 (primary, Phase 1).** Bring every `SKILL.md` body under **500 lines** (Anthropic guideline). Currently 4 skills exceed (`self-improvement` 535, `subagent-development` 473, `frontend-design` 450, `vibe` 447). After preamble-core extraction the new max must be ≤500.
- **G3 (primary, Phase 1).** Enrich skill frontmatter across all 28 skills with Anthropic canonical fields: `name`, `description` (≤1,536 chars combined with `when_to_use`), `when_to_use`, `allowed-tools`, `produces`, `consumes`, optional `dispatch-agent`.
- **G4 (Phase 2).** Consolidate 11 agents → **3 canonical plus 2 pass-through** = 5. Canonical: `explorer`, `planner-reviewer`, `frontend-designer`. Pass-through: `doc-writer`, `refactoring-agent` (both already have dispatch paths and distinct responsibilities; retained). Retire 6 (`ceo-advisor`, `code-reviewer`, `debugger`, `designer→frontend-designer`, `evaluator`, `planner`, `security-auditor`, `test-writer`; `architect→planner-reviewer`). Every surviving skill that benefits from context isolation declares `dispatch-agent: <name>` in its frontmatter.
- **G5 (Phase 3).** Introduce `/vibe auto` that chains `brainstorm → writing-plans → plan-review → executing-plans → code-review → qa → verification → release`, honoring only the THINK spec-approval gate.
- **G6 (Phase 3).** Strengthen `lib/check-workflow-contract.js` to validate `produces: ↔ consumes:` linkage across consecutive stages. Scope pre-20260513 sessions are exempted (decision #5 from v1 plan-review carried forward).

## Non-Goals (YAGNI)

- **NOT** renaming the 6 pipeline stages or changing their order.
- **NOT** renaming directories under `docs/superomni/` or the `[branch]-[session]-[date]` filename contract.
- **NOT** removing the `EnterPlanMode → brainstorm` hard routing rule.
- **NOT** rewriting `ETHOS.md`, the 6 Decision Principles, or the status protocol.
- **NOT** adding cross-session learning storage (`/learn`), `skillOverrides`, or `/doctor`-equivalent budget diagnostics. Tracked as backlog.
- **NOT** adding net-new skills. Phase 2 may RETIRE a skill but must not ADD one.
- **NOT** adding net-new agents (Phase 2 only consolidates).
- **NOT** re-undoing the upstream consolidation (`ship→release`, `agent-management+writing-skills→framework-management`) — that upstream work is preserved and built on.
- **NOT** touching `skills/frontend-design/reference/design-md-library/*`. The 8-brand library is new, cohesive, and outside the preamble/frontmatter/agent scope of this optimization.

## Proposed Solution

**Selected approach: C — "Anthropic-aligned progressive disclosure + artifact contract."** (Same as v1.) Three phases, lowest risk → highest risk.

### Phase 1 — Preamble diet & skill stratification (LOW risk, widest blast radius)

1. Split `lib/preamble.md` (135 lines) → `lib/preamble-core.md` (≤30 lines, inlined) + `lib/preamble-ref.md` (~105–130 lines, on-demand link).
2. Update `lib/gen-skill-docs.{js,sh,ps1}` to recognize `{{PREAMBLE_CORE}}` (expand to core) + `{{PREAMBLE_REF_LINK}}` (emit fixed markdown link line). Keep `{{PREAMBLE}}` as deprecated alias with stderr warning. Mirror the 3-token expansion in `lib/check-skill-docs.js` for the drift check.
3. Migrate all 27 `SKILL.md.tmpl` from `{{PREAMBLE}}` to `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}`. Regenerate.
4. For each of the 4 still-over-quota skills after Step 3 (`self-improvement`, `subagent-development`, `frontend-design`, `vibe`), extract one verbose template/reference section into a co-located `reference.md` and replace with a 1-line link. If preamble diet alone drops all 4 under 500, skip this step.
5. Expand frontmatter on all 28 skills with Anthropic canonical fields. Ground-truth `produces:` / `consumes:` from `CLAUDE.md`'s document output convention + `workflow` skill. Resolve remaining trigger conflicts via `description` / `when_to_use` disambiguation:
   - `brainstorm` vs `office-hours` (sprint vs product-discovery)
   - `code-review` vs `plan-review` (code vs plan)
   - `vibe` vs `workflow` (action vs reference)
   - `test-driven-development` vs `subagent-development` (code-writing vs decomposition)
   - `verification` vs `self-improvement` (task-done vs sprint-retro)
   - `refactoring` vs `code-review` (proactive tech-debt vs reactive PR)
6. Update `writing-skills`'s successor — `framework-management/SKILL.md.tmpl` — to teach the new 2-token pattern so future-authored skills don't inherit the deprecated form.

### Phase 2 — Agent consolidation (MEDIUM risk, high visibility, USER-GATED)

1. Retire 6 orphan agents (`ceo-advisor`, `code-reviewer`, `debugger`, `evaluator`, `planner`, `security-auditor`, `test-writer`). Move any unique content into the matching skill's body or a skill-level `reference.md`.
2. Rename: `architect.md` → `planner-reviewer.md`; `designer.md` → `frontend-designer.md`.
3. Add: `explorer.md` (read-only repo exploration, tools restricted). No new prompt invention — same shape as other agents.
4. Retain with their existing dispatch paths: `doc-writer.md` (dispatched by `document-release`); `refactoring-agent.md` (dispatched by `refactoring`, `executing-plans`, `code-review`).
5. Every agent file gets Anthropic-spec frontmatter (`description`, `tools`, `model`, `when_to_invoke`).
6. Update `CLAUDE.md` agent table and `using-skills/SKILL.md` Quick Reference.

**Final agent count: 5** — `explorer`, `planner-reviewer`, `frontend-designer`, `doc-writer`, `refactoring-agent`.

### Phase 3 — Pipeline contract + /vibe auto (MEDIUM risk, user-visible)

1. Strengthen `lib/check-workflow-contract.js` to validate `produces` / `consumes` linkage. Exempt pre-20260513 sessions.
2. Add `/vibe auto` subcommand in `commands/vibe.md` + `skills/vibe/SKILL.md`. Single human gate: THINK spec approval.
3. Demote `workflow/SKILL.md` to ≤50-line reference stub.

### Deltas from v1

| v1 | v2 | Reason |
|----|----|--------|
| 9 agents → 3 | 11 agents → 5 | `doc-writer` and `refactoring-agent` are kept (distinct, dispatched, non-overlapping) |
| skipped `refactoring`, `dependency-audit`, `framework-management` frontmatter | included | These are new skills in the current main |
| `writing-skills` retire planned | **already retired upstream** — consolidated into `framework-management` | N/A |
| `ship` retire planned | **already retired upstream** — consolidated into `release` | N/A |
| Skill count goal: 28 → 27 | Skill count goal: 28 → 28 | Upstream already did the consolidation; no further retirements planned this sprint |
| Step 6 content extraction: 10 possible files | 4 possible files (`self-improvement` / `subagent-development` / `frontend-design` / `vibe`) | Upstream added weight to some skills; preamble diet still primary lever |
| design-md-library untouched | explicit non-goal | New asset, cohesive, out of scope |

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| Preamble split | 2-tier (core ≤30 + ref ~105) | Anthropic progressive-disclosure spec | Plan Lean |
| Preamble ref linkage | Markdown link to `lib/preamble-ref.md` | Works in native skill-loader, no custom runtime | Explicit over clever |
| Agent count target | 11 → 5 (not 3) | Keep already-dispatched `doc-writer`/`refactoring-agent` | DRY |
| Retired agents content | Merge into overlapping skill body as optional section | Zero knowledge loss | DRY |
| Pipeline contract | `produces` / `consumes` in frontmatter, validated in CI | Machine-checkable closes 2026-04-09 REFLECT-gate gap | Completeness |
| `/vibe auto` | Extend existing `/vibe` as subcommand | Fewer commands to learn | DRY, bias to action |
| `workflow` skill fate | ≤50-line reference stub | Inbound links survive | Pragmatic |
| `EnterPlanMode → brainstorm` | Unchanged | Memory + session continuity depend on it | Constraint |
| `framework-management` | Unchanged (upstream pattern preserved) | Upstream correctly consolidated | Pragmatic |
| `design-md-library/` | Untouched | Non-goal | YAGNI |
| Trigger conflicts fix | Sharpen `description` + `when_to_use` per pair | Anthropic: description drives dispatch | Explicit |
| Net new skills/agents | **Zero** | Optimization-only sprint | YAGNI |

## Acceptance Criteria

### Phase 1

- [ ] `lib/preamble-core.md` exists and `wc -l` returns ≤30.
- [ ] `lib/preamble-ref.md` exists, contains all 9 detail sections.
- [ ] `wc -l skills/*/SKILL.md | awk '$1 > 500'` returns nothing.
- [ ] Total lines across all 28 `SKILL.md` drops by **≥ 2,800** (baseline 9,947; target ≤ 7,147).
- [ ] Every `SKILL.md` frontmatter has: `name`, `description`, `when_to_use`, `allowed-tools`, `produces`. `consumes` is declared where applicable.
- [ ] `npm run verify:skill-docs` passes with the updated generators.
- [ ] `gen-skill-docs.{js,sh,ps1}` produce byte-identical output on a golden fixture (`sha256sum` check).
- [ ] `framework-management/SKILL.md.tmpl` teaches `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}` (not `{{PREAMBLE}}`).

### Phase 2

- [ ] `agents/` contains exactly 5 files: `explorer.md`, `planner-reviewer.md`, `frontend-designer.md`, `doc-writer.md`, `refactoring-agent.md`.
- [ ] Each agent has Anthropic-spec frontmatter (`description`, `tools`, `model`, `when_to_invoke`).
- [ ] `grep -rE 'ceo-advisor|code-reviewer|debugger|evaluator|security-auditor|test-writer|\bplanner\.md|\barchitect\.md|\bdesigner\.md' skills/` returns 0 matches for retired or renamed (without new name) forms.
- [ ] `CLAUDE.md` agent table and `using-skills` Quick Reference reference only the 5 surviving agents.
- [ ] Every skill that benefits from isolated context declares `dispatch-agent:` in frontmatter AND has a concrete call block in its body.

### Phase 3

- [ ] `npm run check:workflow-contract` exits 1 when a downstream skill's `consumes:` target is missing and 0 otherwise. Demonstrated via an injected break that is then restored.
- [ ] `/vibe auto` command documented in `commands/vibe.md`. On a trivial test spec, it produces all 6 stage artifacts with exactly one human interaction (spec approval).
- [ ] `workflow/SKILL.md` demoted to ≤50-line reference stub.
- [ ] Trigger-conflict grep (phrases shared by 2+ skills) returns 0 collisions.

### Global regression gates

- [ ] `CLAUDE.md` declares all 28 surviving skills and 5 agents with accurate rows.
- [ ] `EnterPlanMode → brainstorm` hard routing rule present and unchanged.
- [ ] Every `docs/superomni/<kind>/<kind>-[branch]-[session]-[date].md` filename pattern remains valid.
- [ ] `npm run check:skill-docs && npm run validate-skills && npm run check:workflow-contract` all exit 0.
- [ ] `skills/frontend-design/reference/design-md-library/*` unchanged (8 brand DESIGN.md files intact).
- [ ] `framework-management/SKILL.md` preserves its upstream consolidation of agent-management + writing-skills responsibilities.

## Open Questions

None. Same taste decisions as v1, all resolved with prior user confirmation (three optimization lines, Claude Code spec compatibility as sole forbidden zone, Phase 1 first).

## Frontend Design Note

No UI work. `frontend-design` skill is not invoked.

## Next Stage

On approval → auto-advance to **PLAN** via `writing-plans`, producing `plan-main-framework-optimization-v2-20260513.md`.
