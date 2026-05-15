# Plan Review — docs/AGENTS.md Rewrite + Sync Invariant (v0.6.8)

**Plan:** `docs/superomni/plans/plan-main-agents-doc-sync-20260515.md`
**Spec:** `docs/superomni/specs/spec-main-agents-doc-sync-20260515.md`
**Branch:** `feat/agents-doc-sync`  **Date:** 20260515  **Mode:** Auto.

## Phase 1: Strategy Review

```
STRATEGY REVIEW
  Premises: explicit (P0 user-facing doc bug grep-verified; README links to AGENTS.md)
  Scope:    right-sized — single doc rewrite + 1 new invariant + VERSION_DOCS extension
  Alternatives: considered — partial-edit instead of full rewrite (rejected: 9 retired agents take 245 of 265 lines, partial edit retains misleading prose); skip Invariant 5 (rejected: drift will recur)
  DRY:      reuses existing — VERSION_DOCS pattern from v0.6.6, set-equality check from Invariant 2 (commands sync), CI wiring already exists
  Risks:    (1) heading-regex may not match v0.5.x doc's actual style; (2) VERSION_DOCS regex needs careful design
  Strategy mode: SELECTIVE EXPANSION (closes P0 doc bug + adds defensive invariant; same shape as v0.6.5/v0.6.6)
```

**Auto-decisions (Strategy):**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| S1 | Full rewrite or partial edit? | Full rewrite | M | 245/265 lines describe retired agents; partial edit is more error-prone than rewrite |
| S2 | Bundle Invariant 5 with rewrite? | Yes | T | Same touch surface (lib/check-plugin-sync.js + docs/AGENTS.md); single CI cycle |
| S3 | Migration table format — table or prose? | Table | M | Clearest mapping; matches CHANGELOG style for breaking changes |
| S4 | Should VERSION_DOCS extension be separate sprint? | No, bundle | T | DRY — sprint already touches AGENTS.md and check-plugin-sync.js |

## Phase 2: Design Review

N/A — no UI work. Doc rewrite is markdown content with structural decisions (sections, headings, tables) — covered by Engineering review's heading-pattern checks.

## Phase 3: Engineering Review — **2 plan amendments required**

```
ENGINEERING REVIEW
  Architecture: sound — mirrors v0.6.5/v0.6.6 invariant-add pattern
  Test plan:    comprehensive but Step 7 description is contradictory (see E1 amendment)
  Performance:  neutral — checker reads 5 small files + 1 doc
  Security:     improves — defense against doc drift
  Blast radius: 4 files modified (1 doc + 1 checker + 5 manifests + CHANGELOG); 0 new files
```

**Auto-decisions (Engineering) — including 2 plan amendments:**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| **E1** | **Step 7 demo ("fake-agent heading") description is internally contradictory** | **Amendment A**: rewrite Step 7 to demo a different scenario | **M** | **The plan says: "Add fake-agent heading → linter does NOT fail because fake-agent isn't in agents/*.md (bidirectional filter)... This is the intended false-positive avoidance behavior." But this isn't really a "demo of failure detection" — it's a demo of the FILTER working as designed. To demonstrate Invariant 5's positive failure case, Step 6 (delete a real agent's heading) is sufficient. Step 7 should be reframed: "Verify false-positive avoidance — prose mentions of agent names in body text don't trigger spurious failures." Demo: confirm the existing v0.6.6/v0.6.7 docs section that mentions `explorer` in prose body without `### \`explorer\`` heading doesn't cause false fail.** |
| **E2** | **Plan claims "5 invariants validated" but check-plugin-sync.js currently says "4 invariants validated"** | **Amendment B**: update success message to match new invariant count, but be precise — Invariant 4 is multi-doc internally, so "5 invariants" describes logical groupings, not check-count | **M** | The success message should be: `Plugin sync check passed: 5 invariants validated.` (just bump the number). Document in code comment that "Invariant 4" covers multiple doc anchors but is logically one invariant. |
| E3 | Heading regex case sensitivity | Lowercase only (matches agent filename convention) | M | Plan-explicit |
| E4 | Migration table column count | 3 (retired / current / notes) | M | Plan-explicit |
| E5 | Where to insert Invariant 5 in checker | After Invariant 4 (the multi-doc VERSION check) | M | Logical layering — set-equality after content-match |
| E6 | Should Step 9 verify VERSION_DOCS regex matches AGENTS.md format BEFORE bumping? | No — Step 2 ensures the format; Step 5 verifies the linter passes; Step 8 verifies the regex by injection | T | Steps 2 → 5 → 8 already form the verification chain |
| E7 | Tools whitelist in agent sections — paraphrase or quote? | Quote verbatim (e.g., `tools: [Read, Grep, Glob, Bash]`) | M | DRY — agent files are source of truth |
| E8 | "Migration from v0.5.x" placement | After 5 agent sections, before "Installing Agents" | M | Plan-explicit; flow: present → past → operational |

8 engineering decisions: 6 mechanical (incl. 2 amendments), 2 taste. **2 plan amendments captured.**

## Plan Amendments

### Amendment A (E1): Reframe Step 7 demo

**Original:** Step 7 adds a fake `### \`fake-agent\`` heading and observes that the linter doesn't fire (because the heading name isn't in agents/*.md set, so it's filtered out via bidirectional intersection). Plan describes this as "the intended false-positive avoidance behavior" but doesn't actually verify any failure case.

**Corrected:** Step 7 verifies false-positive avoidance differently:
- Confirm a prose mention of an agent name (e.g., the body text already references `explorer` without using a `### \`explorer\`` heading at the same line) does NOT cause spurious failures.
- The actual demo is implicit: the rewritten `docs/AGENTS.md` will have many prose mentions throughout the body; if the heading regex were too loose (matching prose), Step 5 would already fail. So Step 5's clean pass IS the false-positive avoidance demo.
- Remove Step 7 as a standalone synthetic injection; rename to "Step 7: Confirm prose mentions don't false-trigger" and verify by examining the heading-extraction logic + observing Step 5's clean pass.

### Amendment B (E2): Update success message count

In `lib/check-plugin-sync.js` final success line, update:
```diff
- console.log(`Plugin sync check passed: 4 invariants validated.`);
+ console.log(`Plugin sync check passed: 5 invariants validated.`);
```

Add a code comment: "5 logical invariants (versions, commands, keywords, doc-versions multi-file, agent-doc set)".

## Decision Audit Trail

| # | Phase | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| 1 | S1 | Full rewrite | M | Volume-driven |
| 2 | S2 | Bundle Invariant 5 | T | Boil lakes |
| 3 | S3 | Migration table | M | Clarity |
| 4 | S4 | Bundle VERSION_DOCS extension | T | DRY |
| 5 | E1 | **Reframe Step 7** | M | **Plan amendment A** |
| 6 | E2 | **Success msg count → 5** | M | **Plan amendment B** |
| 7 | E3 | Heading regex lowercase | M | Convention |
| 8 | E4 | Migration table 3 columns | M | Plan-explicit |
| 9 | E5 | Invariant 5 after Invariant 4 | M | Layering |
| 10 | E6 | Verify chain via Steps 2→5→8 | T | Existing chain sufficient |
| 11 | E7 | Tools verbatim quote | M | DRY |
| 12 | E8 | Migration section placement | M | Plan-explicit |

12 decisions auto-resolved. 9 mechanical (incl. 2 amendments), 3 taste. **2 plan amendments captured.**

## Verdict

**APPROVED with 2 amendments — auto-advance to BUILD.**

| Lens | Result |
|---|---|
| Strategy | ✓ |
| Design | N/A |
| Engineering | ✓ + 2 amendments |
| Decision Principles | ✓ 12/12 resolved |
| YAGNI | ✓ |

**Status: DONE.** REVIEW complete; 2 plan amendments captured (Step 7 reframe + success message count); 0 user-blocking concerns.
