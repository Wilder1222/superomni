# superomni Skill Layering — Anthropic Progressive Disclosure Alignment (v3)

**Branch:** main  **Session:** skill-layering-anthropic  **Date:** 20260514
**Predecessors:** `spec-main-framework-optimization-v2-20260513.md` (preamble diet + agent consolidation + pipeline contract). v3 builds on the v0.6.0 baseline merged in PR #47/#48.

## Why this spec

v0.6.0 closed three structural debts:
1. preamble duplication (~3,645 → ~420 lines, 88% reduction)
2. agent consolidation (11 → 5)
3. pipeline contract (`produces` / `consumes` validated in CI)

What v0.6.0 did **not** touch is **Anthropic's progressive-disclosure layering at the skill level**. Specifically: Anthropic's official spec (https://code.claude.com/docs/en/skills, fetched 2026-05-14) recommends that long reference material live in **supporting files** (`reference.md`, `examples/`, `scripts/`) inside the skill directory, with `SKILL.md` linking to them so they load only on demand. Today **0/28** superomni skills use this pattern (only `frontend-design` has a `reference/` directory of design-md sources, but `SKILL.md` itself does not extract any of its own body into supporting files).

Concretely, after the preamble diet the 5 longest skills are still operationally heavy:

| Skill | Lines | Largest extractable sections |
|---|---|---|
| `self-improvement` | 421 | Phases 1–7 reporting templates (~180 lines) |
| `vibe` | 382 | Phase 1 stage-detection bash + stage dispatch brief table (~140 lines) |
| `subagent-development` | 356 | Wave Planning + Consensus Protocol + report templates (~160 lines) |
| `frontend-design` | 338 | Quality Gate scoring rubric + reference-loading checklist (~120 lines) |
| `test-driven-development` | 316 | Red/Green/Refactor templates + anti-patterns table (~110 lines) |

Each line of `SKILL.md` body sits in context **for the rest of the session** once the skill is invoked (per Anthropic's "skill content lifecycle" — they stay in context across turns and survive auto-compaction at 5,000 tokens per re-attached skill, sharing a 25,000-token cross-skill budget). Pulling 600–700 lines of operational templates and rubrics out of the 5 worst offenders into `reference/<topic>.md` files saves ~30% of per-skill recurring token cost during long sessions, which is the dominant context tax in `/vibe auto` runs.

## Problem

Three concrete problems remain after v0.6.0:

1. **No supporting-files pattern in any skill.** 28/28 skills keep all reference material — phase templates, scoring rubrics, anti-patterns tables, evidence-gathering checklists — inline in `SKILL.md`. Anthropic's spec explicitly says: *"Keep `SKILL.md` under 500 lines. Move detailed reference material to separate files."* We satisfy the line ceiling but not the spirit. (One partial exception: `frontend-design/reference/design-md-library/` and 9 sibling design-principle markdown files exist as a vendored external corpus, but `frontend-design/SKILL.md` itself does not extract any of its own body into co-located reference files.)
2. **Recurring token cost during multi-skill sessions.** `/vibe auto` invokes ≥6 skills per pipeline. Each skill's full body is re-attached after auto-compaction (Anthropic: 5,000 tokens per skill, 25,000 total). With current sizes, the 5 long skills alone account for ~14k tokens of the 25k re-attach budget — leaving ~11k for the other skills. After Phase 1 trimming the top 5 to ≤250 lines, the same 5 skills account for ~8k, freeing ~6k of headroom.
3. **No `${CLAUDE_SKILL_DIR}` path resolution.** Skills that want to reference a co-located template currently use relative paths like `../../lib/preamble-ref.md`. Anthropic's spec provides `${CLAUDE_SKILL_DIR}` substitution that resolves correctly whether the skill is installed at personal, project, or plugin scope. 0/28 skills use it. This will block clean distribution if/when superomni ships as a plugin.

Secondary debts (deferred to v4):

- `disable-model-invocation: true` not applied to side-effect skills (`release`, `finishing-branch`, `framework-management`). User has confirmed authorization to apply this in a future sprint.
- `user-invocable: false` not applied to background skills like `using-skills` (a meta-skill that should never appear in the `/` menu).
- `context: fork` + `agent:` not used; current dispatch is via skill body invoking the Task tool. v3 explicitly does NOT touch this — it is a separate architectural decision deserving its own spec.

## Goals

- **G1 (primary).** Reduce the 5 longest `SKILL.md` bodies — `self-improvement`, `vibe`, `subagent-development`, `frontend-design`, `test-driven-development` — to ≤280 lines each by extracting reference material into co-located **`reference/<topic>.md`** files (subdirectory pattern, one project-wide convention).
- **G2 (primary).** Establish a single, project-wide supporting-files convention: every skill that needs reference material puts it under `skills/<name>/reference/<topic>.md`. `framework-management` skill teaches this from day one. Single rule, no platform/skill-specific variants.
- **G3 (primary).** Introduce `${CLAUDE_SKILL_DIR}` substitution support in the generator + checker, and migrate the 5 trimmed skills to use it for any in-skill file reference.
- **G4 (measurement).** Total `SKILL.md` body lines drops by ≥600 (current total 6,793 → target ≤6,180).

## Non-Goals (YAGNI)

- **NOT** trimming any skill that is already ≤300 lines. The lift is in the long tail.
- **NOT** moving the existing `frontend-design/reference/design-md-library/` (8 brand DESIGN.md files) or the 9 sibling design-principle markdown files (`color-and-contrast.md`, `typography.md`, `ux-writing.md`, etc.). They already follow the `reference/` convention and stay where they are.
- **NOT** introducing flat `reference.md` (no subdirectory). Project-wide rule is `reference/<topic>.md` regardless of how many topics. A single-topic skill still lives at `reference/<single-topic>.md` — we accept the one extra path component to avoid two patterns coexisting.
- **NOT** adding `disable-model-invocation` / `user-invocable` / `paths` / `argument-hint` / `model` / `effort` fields. Tracked as v4 backlog.
- **NOT** migrating `dispatch-agent` → Anthropic native `context: fork` + `agent:`. That is a separate architectural sprint.
- **NOT** introducing `!`<command>`` dynamic context injection in any existing skill body. Documented but not adopted this sprint.
- **NOT** changing skill or agent counts. Both stay at 28 and 5 respectively.
- **NOT** retiring or renaming any skill.
- **NOT** changing the pipeline (`THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE`) or the `EnterPlanMode → brainstorm` hard rule.
- **NOT** modifying `lib/preamble-core.md`, `lib/preamble-ref.md`, or any of the 28 frontmatter blocks beyond what `${CLAUDE_SKILL_DIR}` substitution requires.
- **NOT** touching `skills/frontend-design/reference/design-md-library/*` (already cohesive; only the body of `frontend-design/SKILL.md` is in scope).

## Proposed Solution

**Selected approach: D — "Anthropic supporting-files extraction with zero behavioral change."** Three small phases. Each phase ships independently and is gated by the next.

### Phase 1 — Extract reference material from the 5 long skills (LOW risk)

For each of `self-improvement`, `vibe`, `subagent-development`, `frontend-design`, `test-driven-development`:

1. Identify the largest non-operational section in the skill body. "Operational" means: protocol steps, iron laws, status reporting, tool invocations. "Non-operational" means: reporting templates, scoring rubrics, anti-patterns tables, examples, deep reference checklists.
2. Move the section verbatim into `skills/<skill>/reference/<topic>.md` (subdirectory). `<topic>` is a kebab-case noun phrase (e.g., `phase-templates`, `stage-detection`, `wave-planning`, `quality-gate`, `red-green-refactor`).
3. Replace the moved section in `SKILL.md.tmpl` with a 1–3 line link block: `**Reference:** see [reference/<topic>.md](reference/<topic>.md) for [topic].`
4. If a skill needs more than one topic extracted, create one file per topic (`reference/<topic-a>.md`, `reference/<topic-b>.md`); do not concatenate into a single file.
5. Run `npm run gen-skills && npm run verify:skill-docs` after each extraction.
6. After all 5 done, `wc -l` confirms each `SKILL.md` ≤280 lines.

Per-skill extraction targets (initial mapping; refine in PLAN stage if needed):

| Skill | Files to create under `reference/` |
|---|---|
| `self-improvement` | `phase-templates.md` (Phases 1–7 reporting templates) |
| `vibe` | `stage-detection.md` (Phase 1 bash) + `dispatch-brief.md` (stage→agent table) |
| `subagent-development` | `wave-planning.md` + `consensus-protocol.md` + `report-templates.md` |
| `frontend-design` | `quality-gate.md` (scoring rubric) + `reference-loading.md` (loading checklist). Co-exists with the existing `reference/design-md-library/` and 9 design-principle markdown siblings — do not move those. |
| `test-driven-development` | `red-green-refactor.md` (full templates) + `anti-patterns.md` |

### Phase 2 — `${CLAUDE_SKILL_DIR}` substitution support (LOW risk)

1. Update `lib/gen-skill-docs.{js,sh,ps1}` to expand `${CLAUDE_SKILL_DIR}` → the absolute path of the skill directory. Three generators must produce byte-identical output (parity check via golden fixture, mirroring v0.6.0 lessons).
2. Update `lib/check-skill-docs.js` to recognize the same substitution.
3. Migrate the 5 trimmed skills' `SKILL.md.tmpl` to use `${CLAUDE_SKILL_DIR}/reference/<topic>.md` instead of the relative `reference/<topic>.md` form so future plugin distribution works.
4. Add a single-line note in `framework-management/SKILL.md` and the templates it teaches.

### Phase 3 — Teach the supporting-files pattern (LOW risk)

1. Update `framework-management/SKILL.md` (and its `.tmpl` if separate) to include a "Supporting Files" section: the **single project-wide convention** is `skills/<name>/reference/<topic>.md`. Document when to use `examples/` vs `scripts/` (executable vs reference). Cite the 5 Phase-1 extractions as canonical examples.
2. Update `using-skills/SKILL.md` Quick Reference with a one-line pointer to the new section.
3. Add a single AC to `lib/check-skill-docs.js`: warn (not fail) when a `SKILL.md.tmpl` exceeds 300 lines and has no co-located `reference/` directory — this is advisory drift detection, not a hard gate.
4. Add a second advisory check: warn when a skill has a flat `reference.md` file (no subdirectory) — points authors to the project-wide convention.

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| Extraction target | 5 longest skills only | YAGNI — skills already ≤300 lines incur low recurring cost | Plan Lean |
| **Extraction format** | **`reference/<topic>.md` (subdirectory, project-wide)** | **Single convention; prevents two patterns coexisting; matches existing `frontend-design/reference/` precedent; per-topic granularity scales when a skill grows new reference material** | **Explicit, DRY** |
| Body line target | ≤280 lines per skill | 80% of Anthropic's 500-line ceiling — leaves room for future skill growth without re-extraction | Pragmatic |
| Path syntax | `${CLAUDE_SKILL_DIR}/reference/<topic>.md` | Anthropic's official substitution; works at all install scopes | Explicit |
| Generator parity | 3-generator golden fixture (carry-forward from v0.6.0 ACTION 1) | Address v0.6.0 retro action that was not yet implemented | Completeness |
| `disable-model-invocation` etc. | **Deferred** to v4 backlog | User authorized but not in scope this sprint — keeps blast radius small | YAGNI |
| `context: fork` migration | **Deferred** indefinitely | Fundamentally different dispatch architecture; separate spec required | YAGNI |
| Linting | Warning only on 300+ lines without `reference/` dir, and on flat `reference.md` files | Advisory; do not block CI on a soft heuristic | Pragmatic |
| Other 23 skills | Untouched body | They are already lean enough; touching them is busywork | DRY |
| `framework-management` teaching | Updated to teach `reference/<topic>.md` as the single convention | Future skills inherit the right shape; no per-skill judgement needed | Bias to action |

## Acceptance Criteria

### Phase 1

- [ ] `wc -l skills/self-improvement/SKILL.md` ≤ 280.
- [ ] `wc -l skills/vibe/SKILL.md` ≤ 280.
- [ ] `wc -l skills/subagent-development/SKILL.md` ≤ 280.
- [ ] `wc -l skills/frontend-design/SKILL.md` ≤ 280.
- [ ] `wc -l skills/test-driven-development/SKILL.md` ≤ 280.
- [ ] Each of the 5 skills has a `reference/` subdirectory with at least one `<topic>.md` file.
- [ ] Each `SKILL.md` body has a 1–3 line link block pointing to its `reference/<topic>.md` files.
- [ ] No skill in scope has a flat `reference.md` file at the skill root (project-wide convention is the subdirectory form).
- [ ] No content is lost: union of new `SKILL.md` + every file under `reference/` covers every operational instruction the original `SKILL.md` had. (`diff` of an in-memory concatenation against the pre-change file should show only ordering / link-line additions, no semantic deletion.)
- [ ] `npm run gen-skills && npm run verify:skill-docs` exit 0.
- [ ] Total `wc -l skills/*/SKILL.md` total drops by ≥ 600 (baseline 6,793; target ≤ 6,180).

### Phase 2

- [ ] `lib/gen-skill-docs.js`, `lib/gen-skill-docs.sh`, `lib/gen-skill-docs.ps1` all expand `${CLAUDE_SKILL_DIR}` to the skill directory absolute path.
- [ ] Golden fixture `lib/templates/fixture.tmpl` (carrying forward v0.6.0 ACTION 1) is added and produces byte-identical output across the 3 generators (`sha256sum` match).
- [ ] `lib/check-skill-docs.js` recognizes the substitution; no false-positive drift warnings on the 5 migrated skills.
- [ ] Each of the 5 trimmed skills' templates uses `${CLAUDE_SKILL_DIR}/reference/<topic>.md` (not bare relative paths).

### Phase 3

- [ ] `framework-management/SKILL.md` has a "Supporting Files" section ≥ 30 lines documenting the **single project-wide convention** (`skills/<name>/reference/<topic>.md`), with the 5 Phase-1 skills referenced as canonical examples.
- [ ] `using-skills/SKILL.md` Quick Reference has a one-line pointer to the supporting-files section.
- [ ] `lib/check-skill-docs.js` warns (stderr, exit 0) when a `SKILL.md.tmpl` ≥ 300 lines has no co-located `reference/` directory. Demonstrated by adding a temporary fixture and observing the warning.
- [ ] `lib/check-skill-docs.js` warns (stderr, exit 0) when a flat `reference.md` file exists at any skill root. Demonstrated by adding a temporary fixture and observing the warning.

### Global regression gates

- [ ] All 28 skills still listed in `CLAUDE.md` skill table; counts unchanged.
- [ ] All 5 agents still in `agents/`; counts unchanged.
- [ ] `EnterPlanMode → brainstorm` hard routing rule present and unchanged in `CLAUDE.md` and `using-skills/SKILL.md`.
- [ ] `npm run check:skill-docs && npm run validate-skills && npm run check:workflow-contract` all exit 0.
- [ ] `lib/preamble-core.md` and `lib/preamble-ref.md` unchanged.
- [ ] `skills/frontend-design/reference/design-md-library/*` unchanged (8 brand DESIGN.md files intact).
- [ ] No skill's frontmatter `produces` / `consumes` / `dispatch-agent` value changes.

## Open Questions

None. All scope decisions resolved with the user (Option A: progressive-disclosure-only; defer disable-model-invocation lock to v4 backlog despite user pre-authorization).

## Frontend Design Note

`frontend-design` skill itself is in scope for body trimming (Phase 1). Its existing `reference/design-md-library/*` directory and the 9 sibling design-principle markdown files (`color-and-contrast.md`, `interaction-design.md`, `motion-design.md`, `responsive-design.md`, `spatial-design.md`, `typography.md`, `ux-writing.md`, `design-md-adaptation.md`, `design-md-whitelist.md`) are explicitly out of scope and stay where they are — they already follow the `reference/<topic>.md` convention. New extractions (`reference/quality-gate.md`, `reference/reference-loading.md`) live alongside them. No new UI work.

## Deferred to v4 Backlog (user-authorized, not this sprint)

1. **Side-effect skill lock.** Mark `release`, `finishing-branch`, `framework-management` with `disable-model-invocation: true`. User authorized in this sprint's brainstorm.
2. **Background skill hide.** Mark `using-skills` with `user-invocable: false`.
3. **`context: fork` migration.** Move the 7 skills with `dispatch-agent` to Anthropic native `context: fork` + `agent: <type>`. Requires separate architectural spec.
4. **Dynamic context injection.** Adopt `!`<command>`` syntax in `vibe`, `verification`, `release` to pre-fill git/artifact state at skill load time.
5. **`argument-hint` / `$ARGUMENTS`.** Add to skills that accept user input.
6. **`paths` glob auto-trigger.** Probably not applicable to superomni's stage-triggered skills, but worth a one-line review per skill.

## Next Stage

On approval → auto-advance to **PLAN** via `writing-plans`, producing `plan-main-skill-layering-anthropic-20260514.md`.

---

**Status: DONE — spec ready for user approval.**
