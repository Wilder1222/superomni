# Plan Review: Wire `gen:changelog` Into Release Skill (v0.6.11)

**Plan:** `docs/superomni/plans/plan-main-release-changelog-discovery-20260515.md`
**Spec:** `docs/superomni/specs/spec-main-release-changelog-discovery-20260515.md`
**Branch:** `feat/release-changelog-discovery`  **Date:** 20260515
**Mode:** Auto

---

## Phase 1 — Strategy Review (CEO Lens)

```
STRATEGY REVIEW
  Premises:        explicit (audit findings table in spec; v0.6.10 commit e819a69 exists)
  Scope:           right-sized (~30 LOC discovery-sync; bounded by spec)
  Alternatives:    documented (3 v0.6.11 candidates; A chosen for staleness-fix value)
  DRY:             reuses existing advisory loop in check-skill-docs.js
  Risks:           top 3:
                     (1) Step 5 contingency vague — N=2 case unstated [E1 amends]
                     (2) docs/IMPLEMENTATION.md line 191 "currently manual" stale [E2 amends]
                     (3) Sed false-positive on 0.6.10 substring (mitigated)
  Strategy mode:   HOLD SCOPE — single-purpose patch, both amendments expand scope by ≤5 LOC
```

**Auto-resolve:** premises validated against spec + repo state. Two scope adjustments needed (E1, E2) — both are straightforward extensions, not pivots.

---

## Phase 2 — Design Review

**Skipped.** No UI / user-facing changes. Internal tooling + skill prose only.

---

## Phase 3 — Engineering Review

```
ENGINEERING REVIEW
  Architecture:    sound (extends existing advisory loop pattern; same shape as 5 sibling advisories)
  Test plan:       solid (negative test in Step 6 proves gate; dogfood in Step 8 proves tool integration)
  Performance:     no risks (linear scan over 27 templates; advisory pattern matches existing complexity)
  Security:        clean (no input parsing, no destructive ops, stdout-only tool)
  Blast radius:    4 files modified (release .tmpl, document-release .tmpl per E1, CHANGELOG.md, check-skill-docs.js, IMPLEMENTATION.md per E2) + 9 version surfaces
```

### Per-area findings

**Advisory regex pattern** — `/gen[:-]changelog/` checked against the corpus: 96 matches across `skills/`, `lib/`, `docs/`, all are real tool refs. The kebab-case `changelog-autogen` session name (used in v0.6.10 sprint artifacts) is `changelog-autogen` not `gen-changelog`, so no false positives. **Pattern sound.** ✓

**Step 5 pre-flight contingency** — plan says "if N>2, surface to user". Empirical pre-flight shows **N=2** (release + document-release both mention CHANGELOG without gen:changelog). Plan's contingency clause is technically OK ("≤2 = absorb") but **does not name document-release explicitly**. Better to bake it in as Step 2b. → **E1 amendment.**

**Step 6 negative test methodology** — sound: backup → mutate → check → restore → re-check. One missing detail: needs to also run `gen-skills` after mutation since check-skill-docs reads the regenerated SKILL.md, not the template. Plan Step 6.3 says "npm run gen-skills && node lib/check-skill-docs.js" — actually correct, my concern resolves. ✓

**Hidden surfaces audit** — found one stale claim:
- `docs/IMPLEMENTATION.md:191`: "**CHANGELOG auto-generation from commits** — currently manual; could template-extract feat:/fix:/etc."
  This was a "Deferred" backlog item; v0.6.10 closed it. Doc still says manual. → **E2 amendment.**

No other hidden surfaces (.github workflows clean; ETHOS.md clean; README.md links to CHANGELOG.md but doesn't describe authoring).

---

## Decision Audit Trail

| # | Phase | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| 1 | Strategy | Adopt v0.6.11 patch cadence (per user) | M | P5 | Explicit user directive; consistent with v0.6.5-v0.6.10 chain |
| 2 | Strategy | Pre-flight grep before commit | M | P1 | Spec already requires Step 5; confirmed catches the document-release case |
| 3 | Engineering | Add document-release to scope (E1) | T | P1 | Completeness — N=2 must be handled NOW or new advisory fires immediately on first run |
| 4 | Engineering | Mark IMPLEMENTATION.md backlog item closed (E2) | T | P2 | Boil lakes — adjacent doc staleness in blast radius, ≤2 LOC delete |
| 5 | Engineering | Keep manual fallback template in release skill | M | P1+P5 | Tool may be unavailable in some setups; explicit fallback > clever abstraction |
| 6 | Engineering | Regex `/gen[:-]changelog/` (not stricter) | T | P5 | Matches both `gen:changelog` (npm script form) and `gen-changelog` (file form); explicit over clever |

---

## Amendments to Plan

### E1 (must-apply): Add Step 2b — also wire `document-release` skill

After Step 2, insert:

> ### Step 2b: Update `skills/document-release/SKILL.md.tmpl` § Phase 4
>
> **What:** Empirical pre-flight (Step 5 logic, run early) shows `document-release` Phase 4 also mentions CHANGELOG.md without gen:changelog. Add the same hint to keep the new advisory green at first run.
>
> **Files:** `skills/document-release/SKILL.md.tmpl`
>
> **How:**
>   1. Locate "## Phase 4: Update CHANGELOG" (line 85)
>   2. Insert before the existing Phase 4 body:
>      ```
>      Scaffold the entry from Conventional Commits using `npm run gen:changelog -- --version <X.Y.Z>`, then complete the *Why this matters* / *Verified* / *Deferred* subsections manually.
>      ```
>
> **Verification:** `grep -n "gen:changelog" skills/document-release/SKILL.md.tmpl` returns 1 hit; new advisory fires zero times after both Step 2 and Step 2b applied.
>
> **Effort:** S

Renumber subsequent steps unchanged in spirit; Step 5 then becomes a confirmation gate (run advisory check; expect 0 fires).

### E2 (must-apply): Add Step 9b — close stale IMPLEMENTATION.md backlog item

After Step 9 (CHANGELOG entry), insert:

> ### Step 9b: Update `docs/IMPLEMENTATION.md` deferred-backlog list
>
> **What:** Mark "CHANGELOG auto-generation from commits" as closed by v0.6.10. Adjacent doc staleness, P2 boil-lake principle.
>
> **Files:** `docs/IMPLEMENTATION.md`
>
> **How:**
>   1. Locate line: `- **CHANGELOG auto-generation from commits** — currently manual; could template-extract feat:/fix:/etc.`
>   2. Either delete the line OR amend to: `- ~~CHANGELOG auto-generation from commits~~ — **closed by v0.6.10** (`lib/gen-changelog.js`).`
>   3. Pick the strikethrough version (preserves audit trail; aligns with how prior backlog items were closed).
>
> **Verification:** `grep -n "CHANGELOG auto-generation" docs/IMPLEMENTATION.md` returns the strikethrough line; `grep -n "closed by v0.6.10" docs/IMPLEMENTATION.md` returns 1 hit.
>
> **Effort:** S

### Optional E3 (NOT applying): regex stricter

Considered tightening regex to `/(npm run gen:changelog|lib\/gen-changelog\.js)/` for stricter matching. Rejected by P5 (explicit over clever) — current pattern catches both forms cleanly with no false positives, no need to over-engineer. **Auto-decision: keep current pattern.**

---

## TASTE DECISIONS — AUTO-RESOLVED

```
TASTE DECISIONS — AUTO-RESOLVED
═══════════════════════════════════════

1. Document-release scope: keep with release in same patch?
   Chosen: YES — Principle 1 (Completeness)
   Rationale: New advisory will fire on document-release immediately if not wired. Splitting into v0.6.12 leaves CI broken at v0.6.11 merge. Both edits are 1-line additions; total scope still ≤30 LOC.

2. IMPLEMENTATION.md stale claim: strikethrough vs delete?
   Chosen: STRIKETHROUGH — Principle 1 + 2 (Completeness + Boil lakes)
   Rationale: Preserves audit trail (this was an explicit backlog item; closing it visibly = signal). Sets precedent for future backlog closure pattern.

3. Manual fallback template in release skill: keep or remove?
   Chosen: KEEP — Principle 5 + 1 (Explicit + Completeness)
   Rationale: Tool may be unavailable (fresh checkout, broken node, offline). Manual template = cheap insurance; ~12 lines. Spec explicitly requested it.

═══════════════════════════════════════
```

---

## PLAN REVIEW COMPLETE

```
PLAN REVIEW COMPLETE
════════════════════════════════════════
Phases completed:     1, 2 (skipped: no UI), 3
Issues found:         2 (both must-fix)
Decisions made:       6 mechanical + 0 taste = all auto-resolved
Plan status:          APPROVED_WITH_NOTES (2 amendments to apply during BUILD)

Revisions to apply during BUILD:
  - E1: Insert Step 2b for document-release skill wiring
  - E2: Insert Step 9b for IMPLEMENTATION.md backlog closure

Taste decisions auto-resolved:
  - Document-release in scope: YES (P1 Completeness)
  - IMPLEMENTATION.md stale fix: STRIKETHROUGH (P1+P2)
  - Manual fallback template: KEEP (P5+P1)

Status: DONE
════════════════════════════════════════
```

**REVIEW DONE → advancing to BUILD.**

Apply both amendments during execution. Total scope still patch-size: 4 source files modified + 1 doc + 1 CHANGELOG entry + 9 version surfaces.
