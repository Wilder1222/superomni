# Evaluation: superomni Framework Optimization v2

**Spec:** `docs/superomni/specs/spec-main-framework-optimization-v2-20260513.md`
**Plan:** `docs/superomni/plans/plan-main-framework-optimization-v2-20260513.md` (with Step 14.5 amendment)
**Branch:** feat/framework-optimization-v2 (6 commits ahead of `main`)
**Date:** 20260513

**Status:** DONE

## Scope reviewed

All 3 phases of the optimization sprint:
- **Phase 1** — 2-tier preamble + skill stratification + frontmatter expansion + cross-platform generator parity
- **Phase 2** — agent consolidation 11→5 + pipeline stage→agent routing remap
- **Phase 3** — produces/consumes contract validation + `/vibe auto` + workflow skill demoted to 50-line stub

## Goal alignment

| Spec goal | Acceptance criterion | Result |
|-----------|----------------------|--------|
| **G1** Preamble duplication ≤ 800 lines (from ~3,645) | dedup savings measurable | **PASS** — ~3,186 lines of duplicated preamble eliminated. 27 skills now carry a 15-line core + 1-line ref link (16 lines each) instead of 135-line full preamble. |
| **G2** Every SKILL.md body ≤ 500 lines | 0 over 500 | **PASS** — max is now 421 (self-improvement); was 535. |
| **G3** Anthropic-spec frontmatter on all 28 skills | 28/28 each field | **PASS** — `when_to_use` 28/28, `produces` 28/28, `consumes` 28/28. All parse as valid YAML. |
| **G4** Agent consolidation 11→5 | `agents/` has exactly 5 files | **PASS** — `planner-reviewer` (multi-mode), `frontend-designer` (renamed), `explorer` (new), `refactoring-agent`, `doc-writer`. |
| **G5** `/vibe auto` single-command end-to-end pipeline | documented + mode section in skill | **PASS** — 6 mentions in `commands/vibe.md`; `### /vibe auto` section in `skills/vibe/SKILL.md.tmpl` Phase 3. |
| **G6** Contract checker validates produces/consumes linkage | inject-break EXIT=1, restore EXIT=0 | **PASS** — verified via temporary break in `writing-plans` consumes field. |

## Impact range

### Files touched

84 files changed vs. `main`:
- 27 `skills/*/SKILL.md.tmpl` — preamble token migration + frontmatter expansion + pipeline-routing remap
- 28 `skills/*/SKILL.md` — regenerated from updated tmpls (+ `using-skills/SKILL.md` direct-edited)
- 11 agents: 7 deleted, 2 renamed, 1 added, 3 frontmatter-updated (doc-writer, refactoring-agent, frontend-designer, planner-reviewer, explorer)
- `lib/` — 5 files modified/added: `preamble-core.md`, `preamble-ref.md`, `gen-skill-docs.{js,sh,ps1}`, `check-skill-docs.js`, `check-workflow-contract.js`, `validate-skills.sh`, `apply-frontmatter.js`, `frontmatter-map.json`, `preamble.md.bak`
- `commands/vibe.md` — added `/vibe auto` section
- `CLAUDE.md` — sharpened skill trigger column; added Agents Available table
- `package.json` / `package-lock.json` — added `js-yaml` dev dep
- `docs/superomni/` — 5 new session artifacts (spec, plan, review, 3 execution docs)

Net diff: **+2,527 / −5,045 = −2,518 lines** (the − side is mostly duplicated-preamble removal + retired agent content; the + side is new tooling and session artifacts).

### Per-commit shape

| Commit | Concern | Δ Files | Δ Lines |
|--------|---------|--------:|---------|
| `6c95701` | feat(preamble): 2-tier progressive disclosure + parity | 10 | +669 / −58 |
| `ae28610` | feat(skills): 27 tmpl + 28 frontmatters + triggers | 56 | +661 / −3,559 |
| `0102dae` | docs: spec + plan + approval marker | 3 | +522 |
| `9688a30` | docs(plan): Phase 2 amendment | 1 | +48 |
| `4a7e770` | feat(agents): 11→5 consolidation + remap routing | 44 | +316 / −1,141 |
| `3a416e5` | feat(pipeline): /vibe auto + contract + workflow stub | 7 | +319 / −295 |

### Downstream impact (users of `superomni` as a dependency)

| Audience | Impact | Migration effort |
|----------|--------|-----------------|
| Vanilla users running `/vibe`, `/brainstorm`, etc. | None — slash commands behave identically; new `/vibe auto` is additive | 0 |
| Users who invoke retired agents by name in their own scripts or skills | **BREAKING** if they reference `ceo-advisor`, `code-reviewer`, `debugger`, `evaluator`, `planner`, `security-auditor`, `test-writer` | Rename to `planner-reviewer` (modes: strategy/code-review/evaluation/security) or `explorer` (debugger Phase-2 evidence only). Each retired agent's content is absorbed into its parallel skill so behavior is preserved. |
| Template authors copying `SKILL.md.tmpl` patterns | `{{PREAMBLE}}` still works but emits build-time warning | Replace with `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}` |
| External CI wiring `lib/check-workflow-contract.js` | New section-1 checks may surface pre-existing frontmatter gaps in non-superomni skills installed locally | Expected — authors should add `when_to_use` / `produces` / `consumes` to any new skill |

## Realized benefits (measured)

| Benefit | Before | After | Delta |
|---------|--------|-------|-------|
| Skill lines total | 9,947 | 6,793 | **−3,154 (−31.7 %)** |
| Skills > 500 lines | 4 | 0 | **−4** |
| Max skill size | 535 | 421 | **−21 %** |
| Agents | 11 | 5 | **−54 %** |
| Frontmatter compliance (when_to_use/produces/consumes) | 0 / 0 / 0 | 28 / 28 / 28 | **full coverage** |
| Preamble duplication across skills | ~3,645 lines | ~459 lines | **~3,186 lines saved** |
| Generator parity (js vs sh vs ps1) | not enforced | byte-identical | **invariant introduced** |
| Contract-checker scope | session presence only | + skill produces/consumes linkage | **new invariant** |
| End-to-end pipeline run | required 5+ slash commands | `/vibe auto` single command | **5→1 command chain** |

### Quality gate results

- `npm run check:skill-docs`: PASS
- `npm run check:workflow-contract`: PASS (legacy sessions degraded to warnings per 20260513 cutoff)
- `bash lib/validate-skills.sh`: 0 errors, 1 expected warning on `workflow` stub (by design)
- YAML frontmatter parse on all 28 skills (js-yaml): 28/28 valid

### Agent fan-in (dispatch paths)

| Surviving agent | Skills that dispatch it |
|-----------------|-----------------------:|
| planner-reviewer | 10 |
| frontend-designer | 8 |
| refactoring-agent | 5 |
| explorer | 4 |
| doc-writer | 4 |

Every surviving agent has ≥ 4 dispatchers — zero orphans (the original audit found 8 of 9 agents orphaned). This is the clearest indicator that the consolidation succeeded: each remaining agent is actively used by multiple skills, each retired agent's responsibilities are absorbed without a skill losing a capability.

## Risks and concerns

| Risk | Mitigation | Residual? |
|------|------------|-----------|
| Users with custom skills that reference retired agents break | `{{PREAMBLE}}` deprecated-alias preserved; retired agent content absorbed into parallel skills | **MEDIUM** — only surfaces if a user hand-wrote `- [code-reviewer] —` style dispatch text. Mitigated by SemVer minor bump + CHANGELOG migration note. |
| Legacy sessions predating 20260513 won't pass the new produces/consumes contract | Cutoff constant `CONTRACT_CUTOFF_YYYYMMDD = 20260513` in checker; pre-cutoff sessions degrade to warnings | NONE — by design. |
| `validate-skills.sh` warning on workflow stub | Workflow is explicitly a reference stub with no phases | NONE — expected behavior. |
| `preamble-ref.md` at 127 lines exceeds spec estimate of ~105 | Loaded on demand only, not eagerly inlined — zero runtime cost | NONE — within acceptable tolerance. |
| `commands/vibe.md` grew ~100 lines for `/vibe auto` docs | Command docs are not eagerly loaded by the framework; only read when user invokes `/vibe` | LOW — follow-up opportunity to trim if style calls for tighter command docs. |

## Process observations

- **The plan amendment (Step 14.5) was the single most important process win.** Without the `careful` skill's blast-radius assessment surfacing the hidden coupling (vibe stage routing table + 78 retired-agent references), Phase 2 would have been a broken commit. The amendment took ~5 minutes; it averted ~30 minutes of corrupt-state debugging. This validates that `careful` must run *before* any destructive Phase 2-style operation, not after.
- **The 1-session rebase-to-latest-main pattern worked.** After pulling 42 upstream commits mid-sprint, the original Phase 1 work on the old main was cleanly abandoned (backup branch `phase1-backup-20260513` preserved for reference), and re-running the pipeline on the new main produced a cleaner result because the upstream team had already done partial consolidation (ship→release, agent-management+writing-skills→framework-management). Building on their work rather than re-doing it was the right call.
- **The phase-gate-then-pause pattern validated itself.** Pausing at Phase 1 (low-risk, mechanical) gave the user a clean checkpoint to review before authorizing destructive Phase 2 operations. The 3-commit Phase 1 structure also made the branch bisectable.

## Acceptance criteria summary

| Category | Total | PASS | FAIL | WARN |
|----------|-------|------|------|------|
| Phase 1 AC | 8 | 8 | 0 | 0 |
| Phase 2 AC | 6 | 6 | 0 | 0 |
| Phase 3 AC | 5 | 5 | 0 | 0 |
| Global regression gates | 5 | 5 | 0 | 0 |
| **Total** | **24** | **24** | **0** | **0** |

**Status: DONE** — All acceptance criteria met. No CHANGES_REQUIRED. Ready for RELEASE stage.

## Next step

RELEASE stage: write `release-main-framework-optimization-v2-20260513.md` with required `## Release` and `## Retrospective` sections, bump version to 0.6.0, update CHANGELOG, commit.
