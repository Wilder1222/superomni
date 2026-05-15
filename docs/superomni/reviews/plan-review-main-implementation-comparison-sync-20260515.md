# Plan Review — IMPLEMENTATION.md + COMPARISON 7.2 Sync (v0.6.9)

**Plan:** `docs/superomni/plans/plan-main-implementation-comparison-sync-20260515.md`
**Spec:** `docs/superomni/specs/spec-main-implementation-comparison-sync-20260515.md`
**Branch:** `feat/implementation-comparison-sync`  **Date:** 20260515  **Mode:** Auto.

## Phase 1: Strategy Review

```
STRATEGY REVIEW
  Premises: explicit (5th-consecutive audit-driven sprint; both bugs grep-verified with line numbers)
  Scope:    right-sized — 2 doc fixes + 1 small checker extension
  Alternatives: considered — split into v0.6.9 (IMPLEMENTATION) + v0.6.10 (COMPARISON) (rejected: same touch surface domain, single CI cycle); skip § 7.2 fix (rejected: factual errors in public-facing comparison doc)
  DRY:      reuses existing — VERSION_DOCS pattern from v0.6.6 + v0.6.8
  Risks:    (1) COMPARISON.md tone-matching during prose rewrite; (2) Roadmap framing rewrite scope creep
  Strategy mode: SELECTIVE EXPANSION (continues bug-driven pattern; 5th win)
```

**Auto-decisions (Strategy):**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| S1 | Bundle both doc fixes? | Yes | T | Same docs/* domain, single CI cycle |
| S2 | Should § 7.2 ❌ items become ✅ items, or be removed entirely? | Become ✅ items (preserve structure, correct content) | T | Honest about progress; preserves comparison framework |
| S3 | Roadmap rewrite — keep historical detail or compress? | Compress to 1-2 lines per minor; defer to CHANGELOG.md for detail | M | DRY — CHANGELOG is canonical |

## Phase 2: Design Review

N/A — no UI work; doc rewrites only.

## Phase 3: Engineering Review — **1 amendment**

```
ENGINEERING REVIEW
  Architecture: sound — additive (VERSION_DOCS entry); subtractive (false claims removed)
  Test plan:    adequate but missing one demo case (E1 amendment)
  Performance:  neutral
  Security:     improves (defensible against doc drift)
  Blast radius: 4 files modified (1 checker + 2 docs + 1 manifest set + 4 doc bumps)
```

**Auto-decisions (Engineering) — 1 amendment:**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| **E1** | **Plan Step 9 has only 1 negative demo (IMPLEMENTATION.md). Should also demo COMPARISON.md works through existing Invariant 4 entry.** | **Amendment A**: Step 9 adds 2nd verification — confirm Invariant 4 already covers COMPARISON.md (was added in v0.6.6) by injecting drift there too | **M** | **Verifies that BOTH new and existing VERSION_DOCS entries fire correctly. Otherwise we only test the new entry, not the existing infrastructure post-Step-5 refactor.** |
| E2 | Roadmap "Version History" subsection — list every patch or only major themes? | Only major themes (1-2 lines per minor) | M | YAGNI; CHANGELOG is canonical |
| E3 | COMPARISON.md fix — preserve "❌ 无 X" → "✅ X" structure or rewrite as prose? | Keep checkmark structure | T | Matches doc voice |
| E4 | New VERSION_DOCS entry placement | After existing AGENTS.md entry | M | Chronological extension |
| E5 | If § 7.2 false claims contained other specific false items, scope creep risk? | No — only 2 items identified; spec § Non-Goals locks scope | M | Spec-explicit |
| E6 | Version bump for AGENTS.md `Last updated` to 0.6.9 — same step as other version bumps? | Yes (Step 6 batch) | M | Plan-explicit |

6 decisions: 5 mechanical (incl. 1 amendment), 1 taste. **1 plan amendment captured.**

## Plan Amendment

### Amendment A (E1): Step 9 demo extension

**Original Step 9:**
> Negative demo: change `docs/IMPLEMENTATION.md` `**Last updated:**` to v9.9.9; run check:plugin-sync; expect exit 1; restore.

**Corrected Step 9 (two demos):**
1. Negative demo (new entry): inject mismatch in `docs/IMPLEMENTATION.md` `**Last updated:**` → checker fires; restore → passes.
2. Negative demo (existing entry): inject mismatch in `docs/COMPARISON.md` header version → checker fires (verifies post-Step-5 refactor didn't break Invariant 4 for existing docs); restore → passes.

This ensures Invariant 4 works for the full 5-doc set, not just the new addition.

## Decision Audit Trail

| # | Phase | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| 1 | S1 | Bundle both fixes | T | Boil lakes |
| 2 | S2 | ❌ items → ✅ items | T | Honest progress |
| 3 | S3 | Compressed Version History | M | DRY with CHANGELOG |
| 4 | E1 | **Step 9 has 2 demos** | M | **Plan amendment A** |
| 5 | E2 | Version History compressed | M | YAGNI |
| 6 | E3 | Keep checkmark structure | T | Voice |
| 7 | E4 | VERSION_DOCS entry chronological | M | Convention |
| 8 | E5 | No scope creep | M | Spec-locked |
| 9 | E6 | Single batch version bump | M | Plan-explicit |

9 decisions. 7 mechanical (incl. 1 amendment), 2 taste.

## Verdict

**APPROVED with 1 amendment — auto-advance to BUILD.**

| Lens | Result |
|---|---|
| Strategy | ✓ |
| Design | N/A |
| Engineering | ✓ + 1 amendment |
| Decision Principles | ✓ 9/9 resolved |
| YAGNI | ✓ |

**Status: DONE.** REVIEW complete; 1 amendment captured (Step 9 demo extension); 0 user-blocking concerns.
