# Plan Review — Anthropic Field Alignment + Retro Cleanup (v0.6.2)

**Plan:** `docs/superomni/plans/plan-main-anthropic-field-alignment-20260514.md`
**Spec:** `docs/superomni/specs/spec-main-anthropic-field-alignment-20260514.md`
**Branch:** `feat/skill-layering-anthropic`  **Session:** `anthropic-field-alignment`  **Date:** 20260514
**Mode:** Auto (full pipeline). All decisions auto-resolved via the 6 Decision Principles.

---

## Phase 1: Strategy Review (CEO Lens)

```
STRATEGY REVIEW
  Premises: explicit (spec cites Anthropic doc URL; user pre-authorized side-effect locks during v0.6.1 brainstorm)
  Scope:    right-sized (5 frontmatter additions + 1 dynamic-context site + 3 tooling cleanups; 13 plan steps; YAGNI enforced via 5-item v0.7.0+ deferred backlog)
  Alternatives: considered — A vs A+B (architecture migration) vs A+E (chosen) vs C (push v0.6.1 first); A+E selected for atomic patch + retro debt cleanup co-located with related touch surface
  DRY:      reuses existing — extends v0.6.1 advisory pattern in check-skill-docs.js; mirrors verify:fixture-parity script shape for test:generators; reuses .gitattributes LF lock
  Risks:    (1) generators mangling backtick-bang pattern (L×M) → Step 5 verification grep; (2) disable-lock breaking existing automation (L×M) → 3 locked skills are user-gated by design; (3) examples-check wrapper false-negative (L×L) → Step 9 negative-case test
  Strategy mode: SELECTIVE EXPANSION — 5 fields + 3 tooling fixes; explicit refusal to scope-creep into context: fork or $ARGUMENTS or per-skill model overrides
```

**Auto-decisions (Strategy):**

| # | Topic | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| S1 | Branch off v0.6.1 commit (5810cff) or rebase off main? | Off v0.6.1 (current branch HEAD) | Mechanical | P3 Pragmatic | v0.6.1 is unmerged but stable; rebasing onto main would miss v0.6.1's gen/checker normalization which v0.6.2 depends on |
| S2 | Should we push v0.6.1 first as prereq? | No | Taste | P5 Explicit | The user chose "B 只提交，不推送" for v0.6.1 deliberately; v0.6.2 layers on the local commit. Both can be pushed together when user is ready |
| S3 | Add `disable-model-invocation` to `framework-management`? | Yes (per spec) | Mechanical | P5 Explicit | User pre-authorized in v0.6.1 brainstorm and confirmed again in v0.6.2 sprint pick |
| S4 | Argument-hint scope — only 3 skills or grep-discover more? | Step 4 has the grep sub-step; 3 is the floor, not ceiling | Mechanical | P1 Completeness | Plan already enforces grep-then-add |
| S5 | Should `!`<command>`` injection extend to verification + release? | No (defer to v0.7.0) | Taste | P3 Pragmatic | Test on highest-traffic skill (vibe) first; expand based on adoption signal. Premature broadcast would force-test 3 skill bodies at once |
| S6 | Combined patch vs split into 0.6.2 (frontmatter) + 0.6.3 (tooling)? | Combined | Taste | P2 Boil lakes | Same touch surface (frontmatter + lib/check-skill-docs.js); split would force 2 CI cycles for ~equivalent engineering. Boil this small lake |
| S7 | Document `!`<command>`` runtime semantics in vibe body? | Yes — 1-line note | Mechanical | P1 Completeness | The pattern is non-obvious to readers; absent the note, they'll think it's pseudocode |

---

## Phase 2: Design Review

**N/A.** No UI. Skipped per `plan-review` skill conditional.

---

## Phase 3: Engineering Review

```
ENGINEERING REVIEW
  Architecture: sound — additive frontmatter fields (no schema break); !`<cmd>` is plain markdown until Anthropic runtime parses (generators leave it alone, verified by Step 5 grep); test:generators mirrors verify:fixture-parity shape (DRY)
  Test plan:    comprehensive — 5 explicit test surfaces (frontmatter parses YAML, generated output preserves bang-cmd, multi-occurrence regression, CRLF advisory positive+negative, validator examples-check positive+negative)
  Performance:  IMPROVES — vibe gains ~1 Bash round-trip elimination per /vibe invocation via dynamic context
  Security:     clean — disable-model-invocation tightens (not loosens) the auto-trigger surface; CRLF advisory adds defense in depth
  Blast radius: 5 SKILL.md.tmpl + 1 SKILL.md (using-skills direct) + 3 lib/* files + new lib/test-generators.js + new fixture + 4 config files = ~13 files modified, 2 new
```

**Auto-decisions (Engineering):**

| # | Topic | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| E1 | Field ordering — where does `disable-model-invocation:` sit in frontmatter? | Between `allowed-tools:` and `when_to_use:` | Mechanical | P5 Explicit | Anthropic spec lists fields in: name → description → when_to_use → allowed-tools → disable-model-invocation → user-invocable. Plan Step 2's "between allowed-tools and when_to_use" is *inverted* from canonical; should be after when_to_use, not before. **PLAN AMENDMENT REQUIRED.** |
| E2 | Step 5 `!`<cmd>`` block placement — top of vibe body or after Phase 1? | After Phase 1 Iron Law section, before Phase 1's reference link | Taste | P5 Explicit | Reader sees "Phase 1: Detect" → state injected → reference for full bash. Logical flow |
| E3 | Step 7 fixture filename | `lib/templates/multi-occurrence-fixture.md.tmpl` | Mechanical | P5 Explicit | Plan-named already; no alternative considered |
| E4 | Step 7 — should `test:generators` use Node's child_process or shell out? | Node `execSync` (mirror `verify-fixture-parity.js`) | Mechanical | P4 DRY | Existing `verify-fixture-parity.js` uses execSync; copy that shape |
| E5 | Step 8 CRLF advisory should also check `.tmpl` files? | No, only generated `SKILL.md` | Taste | P3 Pragmatic | `.tmpl` files are source-of-truth and may legitimately have local CRLF on Windows checkouts; .gitattributes normalizes them on commit. Only generated `SKILL.md` should be LF |
| E6 | Step 9 wrapper logic — and OR or? | "warn only if BOTH no-inline AND no-reference/" | Mechanical | P5 Explicit | Plan already specifies; mechanical match |
| E7 | Should `lib/test-generators.js` be wired into `verify:skill-docs` or kept separate? | Wired (per plan Step 7) | Taste | P4 DRY | Single CI invocation = single command for users; `verify:skill-docs` is the existing umbrella |
| E8 | Step 5 — Phase 1 prose change vs full re-write? | Insert auto-inject block; keep existing prose | Taste | P5 Explicit | Existing prose links to reference/stage-detection.md and remains correct; the auto-inject block adds, not replaces |

**E1 triggers a plan amendment.** The plan's frontmatter-position guidance is inverted. The canonical Anthropic order (per https://code.claude.com/docs/en/skills "Frontmatter reference") is:
- `name`
- `description`
- `when_to_use`
- `argument-hint`
- `arguments`
- `disable-model-invocation`
- `user-invocable`
- `allowed-tools`
- `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`

The plan's "between allowed-tools and when_to_use" is wrong. Correct: after `when_to_use`, before `allowed-tools`. BUILD must use the canonical order.

---

## Decision Audit Trail (Consolidated)

| # | Phase | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| 1 | Strategy | Branch off v0.6.1 HEAD | M | P3 | Continuity with v0.6.1 |
| 2 | Strategy | Don't gate on v0.6.1 push | T | P5 | User chose local-only; respect that |
| 3 | Strategy | Lock framework-management | M | P5 | User pre-authorized |
| 4 | Strategy | argument-hint floor=3, ceiling via grep | M | P1 | Plan enforces |
| 5 | Strategy | `!`<cmd>`` only in vibe this sprint | T | P3 | Test on highest-traffic site first |
| 6 | Strategy | Combined patch (A+E) | T | P2 | Boil small lake |
| 7 | Strategy | Document runtime semantics in vibe body | M | P1 | Non-obvious pattern |
| 8 | Engineering | **Frontmatter field order: corrected to Anthropic canonical** | M | P5 | **Plan amendment** |
| 9 | Engineering | `!`<cmd>`` after Phase 1 prose | T | P5 | Reader flow |
| 10 | Engineering | Multi-occurrence fixture filename | M | P5 | Plan-named |
| 11 | Engineering | test:generators uses Node execSync | M | P4 | Mirror existing |
| 12 | Engineering | CRLF advisory: generated only, not .tmpl | T | P3 | Source-of-truth respect |
| 13 | Engineering | Validator wrapper: AND, not OR | M | P5 | Plan-explicit |
| 14 | Engineering | test:generators wired into verify:skill-docs | T | P4 | Single umbrella |
| 15 | Engineering | Step 5: insert, don't rewrite Phase 1 | T | P5 | Preserve existing reference linkage |

15 decisions: 9 mechanical, 6 taste. 14 confirm plan; 1 (E1) requires amendment.

---

## Plan Amendment Required

**Plan Step 2** says: *"insert `disable-model-invocation: true` between `allowed-tools:` and `when_to_use:` lines"*

**Correct (Anthropic canonical order):** insert `disable-model-invocation: true` **after `when_to_use:` and before `allowed-tools:`** (or anywhere after `when_to_use` and before any closing `---`, but canonical order keeps fields grouped).

Same correction applies to Step 3 (`user-invocable: false`) and Step 4 (`argument-hint`):

| Field | Canonical position |
|-------|-------------------|
| `argument-hint` | after `when_to_use`, before `arguments` (if present) |
| `disable-model-invocation` | after `argument-hint`/`when_to_use`, before `user-invocable` |
| `user-invocable` | after `disable-model-invocation`, before `allowed-tools` |
| `allowed-tools` | after `user-invocable` |

BUILD will use this corrected order.

---

## Final Gate

15 decisions auto-resolved. 1 plan amendment recorded above (frontmatter field ordering). No user input needed; amendment is mechanical.

**Plan additions/edits required:** field-order amendment (recorded above; BUILD uses canonical order). No other changes.

---

## Verdict

**APPROVED — auto-advance to BUILD with field-order amendment applied inline.**

| Lens | Result |
|---|---|
| Strategy | ✓ Premises explicit, scope right-sized, alternatives considered, DRY honored |
| Design | N/A — no UI |
| Engineering | ✓ Architecture sound, test plan comprehensive, security improves; 1 plan amendment |
| Decision Principles | ✓ 15/15 resolved |
| YAGNI | ✓ 5 v0.7.0+ items deferred |

**Next stage:** auto-advance to BUILD via `executing-plans` with the field-order amendment.

---

**Status: DONE** — REVIEW complete; plan amended for Anthropic canonical field order; 0 user-blocking concerns.
