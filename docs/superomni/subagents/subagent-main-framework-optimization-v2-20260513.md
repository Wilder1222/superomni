# Sub-Agent Session: main — framework-optimization-v2 — 20260513

**Branch:** feat/framework-optimization-v2 (off main @ ebf5f6d)
**Session:** framework-optimization-v2
**Scope:** Phase 1 only (Steps 1-12). Phases 2 and 3 deferred per user pause strategy.

## Agents Dispatched

Phase 1 was executed by the main orchestrator in-process. No external parallel sub-agents were spawned for the actual Phase 1 work — see wave analysis below for the reason.

For the THINK stage (spec drafting), **one Explore sub-agent** was dispatched to produce a DELTA-focused inventory of post-pull main (new skills: refactoring/dependency-audit/framework-management; new agents: doc-writer/refactoring-agent; frontend-design design-md-library vendored; preamble status unchanged). That report fed spec v2.

## Wave analysis (why in-process for Phase 1)

| Wave | Steps | Approach | Result |
|------|-------|----------|--------|
| 1 | 1, 2, 3 | inline | baseline captured, preamble-core.md (15) + preamble-ref.md (127) written |
| 2 | 4, 5, 6 | inline + one-shot node script | 3 generators updated + check-skill-docs mirrored + 27 tmpls migrated |
| 3 | 7 (skipped), 8, 9 | inline + one-shot node script (`apply-frontmatter.js` + `frontmatter-map.json`) | 28 skills got new frontmatter; all YAML valid |
| 4 | 10, 11, 12 | inline | framework-management taught new pattern; CLAUDE.md disambiguated; Phase 1 gate verified |

Phase 1's work was inherently sequential (preamble files → generator update → tmpl migration → frontmatter expansion → gate). Parallel dispatch would have added coordination cost without reducing elapsed time. Step 9's 28-skill frontmatter expansion is mechanical enough to be handled by a single deterministic script rather than 28 parallel editor sub-agents.

Phase 2 (Steps 14-17, not executed in this session) is a better candidate for parallel sub-agents — agent content merging can be parallelized across multiple files. That will be revisited when Phase 2 runs.

## Integration Summary

**Conflicts resolved during integration:**
1. Generators had cross-platform whitespace divergence on the first run — fixed by normalizing all 3 to strip a single trailing newline from preamble content before token interpolation.
2. YAML parse errors from embedded `:` / `→` in description strings — fixed by switching all description/when_to_use emission to block-scalar (`|`) form.
3. `framework-management`'s scaffolding example contained `{{PREAMBLE}}` which the generator would have eagerly expanded — fixed by updating both the example AND the prose checklist to teach the new 2-token form.

**Final state:**
- `npm run verify:skill-docs`: PASS
- `js-yaml` parse on all 28 frontmatters: 28 ok / 0 bad
- Platform parity across js/sh/ps1: PASS (byte-identical)
- All 8 Phase 1 ACs: PASS
- All 5 global regression gates: PASS
- Total skill-line drop: **3,080 lines (30.9%)**
- Upstream consolidations preserved: `ship→release`, `framework-management`, `design-md-library/`

## Status

**DONE** — Phase 1 v2 complete. No concerns.

All plan deviations (Step 7 skipped, preamble-ref 127 vs estimated 105, framework-management scaffold teaches 4 frontmatter fields) were inside tolerance or proactive upgrades.

## Deliverables

- `docs/superomni/specs/spec-main-framework-optimization-v2-20260513.md`
- `docs/superomni/plans/plan-main-framework-optimization-v2-20260513.md`
- `docs/superomni/reviews/review-main-framework-optimization-v2-20260513.md`
- `docs/superomni/executions/execution-main-framework-optimization-v2-20260513.md`
- `docs/superomni/subagents/subagent-main-framework-optimization-v2-20260513.md` (this file)
- `lib/preamble-core.md`, `lib/preamble-ref.md`, `lib/frontmatter-map.json`, `lib/apply-frontmatter.js`
- Updated: `lib/gen-skill-docs.{js,sh,ps1}`, `lib/check-skill-docs.js`, `CLAUDE.md`, 27 `.tmpl`, 28 `SKILL.md`
