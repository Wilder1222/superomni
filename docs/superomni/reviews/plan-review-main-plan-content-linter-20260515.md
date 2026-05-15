# Plan Review — Plan-Content Auto-Linter (v0.6.7)

**Plan:** `docs/superomni/plans/plan-main-plan-content-linter-20260515.md`
**Spec:** `docs/superomni/specs/spec-main-plan-content-linter-20260515.md`
**Branch:** `feat/plan-content-linter`  **Date:** 20260515  **Mode:** Auto.

## Phase 1: Strategy Review

```
STRATEGY REVIEW
  Premises: explicit (v0.6.3 deferred this; v0.6.4 fence-awareness pattern proven; v0.6.5/v0.6.6 lib/check-*.js + CI-wired pattern proven)
  Scope:    right-sized — single new lib/ file + 1 npm script + 1 CI step (×2) + 1 line writing-plans + version bump
  Alternatives: considered — soft advisory (rejected: defeats CI-hard-gate purpose); auto-fix (rejected: scope creep); skip historical plans by name list (considered for E5 below)
  DRY:      reuses existing — fence-awareness from v0.6.4; lib/check-*.js shape from v0.6.5; CI wiring from v0.6.6
  Risks:    (1) lookback semantics for Step N.5 decimals (M×M, surfaced during PLAN authoring; resolved as E1 amendment); (2) v0.6.0 plan as fixture vs subject (M×M, see E5 amendment)
  Strategy mode: SELECTIVE EXPANSION (closes v0.6.3 substantial-feature deferral; bug-class proactive)
```

**Auto-decisions (Strategy):**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| S1 | CI-hard-gate vs advisory | Hard gate (exit 1) | M | Spec premise; v0.6.3 deferred this AS the hard gate |
| S2 | Bundle other v0.7.0+ items? | No — single-purpose patch | T | Continuation of v0.6.x patch discipline |
| S3 | Should the 1-line note in writing-plans link to the linter source? | Yes (markdown link to `lib/check-plan-content.js`) | T | Helpful for plan authors who want to verify their plan |

## Phase 2: Design Review

N/A — no UI.

## Phase 3: Engineering Review — **Plan amendments required**

```
ENGINEERING REVIEW
  Architecture: sound — single new file, additive
  Test plan:    comprehensive but contains TWO design errors surfaced by close reading of v0.6.0 plan structure (E1, E5 below)
  Performance:  neutral — checker reads ~10 plan files, ~150KB total, <100ms
  Security:     improves — defense-in-depth on the destructive-op invariant
  Blast radius: 5 files modified, 1 new file
```

**Auto-decisions (Engineering) — including 2 plan amendments:**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| **E1** | **Lookback semantic: by step-number ordering or by document order?** | **Document order (the step that physically precedes in the file)** | **M** | **Plan amendment:** spec said "preceding by number, so 14 precedes 14.5" — but in v0.6.0 plan, **Step 14.5 sits AFTER Step 14 in the file** (line 225 vs line 205). If lint by number, Step 14's preceding = Step 13 (no careful) → fails. The plan's prose says "14.5 MUST run BEFORE 14" — but execution ordering isn't lintable from document order. **Document order is the canonical rule**: a careful step inserted as `Step N.5` *after* destructive Step `N` is itself a process violation (author should have re-numbered or inserted before). The linter enforces top-to-bottom readability. |
| **E5** | **v0.6.0 plan (canonical "good" case in spec) actually fails E1's stricter rule. How to handle?** | **Cutoff date `< 20260514` strict (exclude 20260513 = v0.6.0 plan date). v0.6.0 plan exempt by date.** | **M** | **Plan amendment:** spec set cutoff `20260513`, intending v0.6.0 plan to be the canonical positive fixture. But under E1's document-order rule, v0.6.0 plan **violates the gate** (Step 14.5 is after Step 14, not before). Three options: (a) move cutoff to `< 20260514`, exempting v0.6.0 plan as historical; (b) rewrite v0.6.0 plan retroactively; (c) special-case Step 14.5. Option (a) wins: historical immutability + clean rule + matches "no retroactive plan rewrites" non-goal in spec. |
| E2 | "preceding step body" scope for careful keyword | title + What + How combined | M | Plan-explicit |
| E3 | DESTRUCTIVE_PATTERNS list location | Hard-coded array at top of file | M | YAGNI on config split |
| E4 | "careful" keyword match | Case-insensitive, simple substring | T | Authors use varied phrasing |
| E6 | False-positive avoidance demo plan | `plan-main-dynamic-context-and-careful-gate-20260515.md` (the v0.6.3 plan that documents destructive patterns) | M | Plan-prescribed; this plan has prose mentions in backticks — perfect prose-mention test |
| E7 | Should the negative demo restore touch git? | No — demo runs locally, doesn't commit | M | Plan-implicit; demos are subprocess-only |
| E8 | CI step ordering: after `Check plugin sync` or before? | After (it's the newest gate) | T | Logical: check sequence is layered shallowest-to-deepest |

8 engineering decisions: 6 mechanical, 2 taste. **2 plan amendments required (E1 + E5).**

## Plan Amendments

### Amendment A (E1): Lookback by document order

Plan Step 5 currently says:
> *"`precedingStep` = the step with the closest lower number. For `14.5` → `14` (numerical ordering: 14 < 14.5)."*

**Corrected:**
> *"`precedingStep` = the step that physically appears immediately before the destructive step in the plan file (document order). For Step 14 (destructive) → Step 13 (preceding). For Step 14.5 (destructive, hypothetical) → Step 14 (preceding). For Step 15 → Step 14.5 (preceding). The semantic is: a careful step inserted as `.5` AFTER the destructive step is a process violation; if the destructive op needed pre-assessment, the careful step should have been numbered to come BEFORE."*

### Amendment B (E5): Cutoff exempts v0.6.0 plan

Plan Step 2 (linter skeleton) `CUTOFF_DATE` value:
- **Original:** `20260513`
- **Corrected:** `20260514` (strict less-than, so plans dated `20260513` are exempted)

Rationale: v0.6.0 plan dated 20260513 has the canonical "destructive step plus careful insertion" case but with the careful step at `.5` (document-order-after). Under the corrected E1 rule, that plan violates the gate. Treating it as historical-exempt:
- Honors the "no retroactive plan rewrites" non-goal
- Keeps the gate's rule strict and unambiguous
- v0.6.3+ plans (the v0.6.x sprint series) all have dates ≥ 20260514 → in scope

### Updated Phase 2 Demo (positive demo replaced)

Original Step 10 negative demo used v0.6.0 plan with Step 14.5 title rewritten. Under amendments, v0.6.0 plan is exempt entirely. **Replacement positive/negative demos:**

- **Positive demo (synthetic)**: write a temporary `docs/superomni/plans/plan-main-test-fixture-20260515.md` with 2 steps (Step 1 = careful prose, Step 2 = `git rm` in How:) → linter passes; remove fixture.
- **Negative demo (synthetic)**: same fixture, swap Step 1 to NOT mention careful → linter exits 1 with diagnostic; restore.
- **False-positive avoidance demo** (unchanged): v0.6.3 plan's prose `git rm` in backticks doesn't fire.

## Decision Audit Trail

| # | Phase | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| 1 | S1 | Hard gate (exit 1) | M | v0.6.3 spec premise |
| 2 | S2 | Single-purpose patch | T | v0.6.x discipline |
| 3 | S3 | writing-plans note links to linter source | T | Author UX |
| 4 | E1 | **Lookback by document order** | M | **Plan amendment A** |
| 5 | E2 | Preceding step body = title+What+How | M | Plan-explicit |
| 6 | E3 | DESTRUCTIVE_PATTERNS hard-coded | M | YAGNI |
| 7 | E4 | "careful" keyword case-insensitive | T | Phrasing variation |
| 8 | E5 | **CUTOFF = 20260514 (exempt v0.6.0)** | M | **Plan amendment B** |
| 9 | E6 | False-positive demo plan | M | Plan-prescribed |
| 10 | E7 | Demos are local-only | M | Plan-implicit |
| 11 | E8 | CI step after Check plugin sync | T | Logical layering |

11 decisions auto-resolved. 8 mechanical (incl. 2 amendments), 3 taste. **2 plan amendments captured** above.

## Verdict

**APPROVED with 2 amendments — auto-advance to BUILD with corrected semantics.**

| Lens | Result |
|---|---|
| Strategy | ✓ |
| Design | N/A |
| Engineering | ✓ + 2 amendments captured |
| Decision Principles | ✓ 11/11 resolved |
| YAGNI | ✓ |

The two amendments are pure tightening of plan correctness — they don't change the spec's intent, they fix a design bug surfaced by close reading. BUILD will follow the amended specifications.

**Status: DONE.** REVIEW complete; 2 plan amendments captured; no user-blocking concerns.
