# Plan Review — Token-Literal Advisory (v0.6.4)

**Plan:** `docs/superomni/plans/plan-main-token-literal-advisory-20260515.md`
**Spec:** `docs/superomni/specs/spec-main-token-literal-advisory-20260515.md`
**Branch:** `feat/skill-layering-anthropic`  **Date:** 20260515  **Mode:** Auto.

## Phase 1: Strategy Review

```
STRATEGY REVIEW
  Premises: explicit (v0.6.3 retro identifies the bug class with concrete reproducer)
  Scope:    minimal & right-sized (single advisory, single file edit + version bump)
  Alternatives: considered — auto-fix (rejected: scope creep), hard-error (rejected: matches v0.6.x advisory pattern), no-action (rejected: P2 retro ACTION 2 stays open)
  DRY:      reuses existing — extends v0.6.1-v0.6.2-v0.6.3's advisory pattern in check-skill-docs.js
  Risks:    (1) code-fence tracking false-positive on edge cases (L×L) — Step 5 negative demo
  Strategy mode: SELECTIVE EXPANSION (single retro action; no other carry-forwards bundled)
```

**Auto-decisions (Strategy):**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| S1 | Bundle other v0.7.0+ items? | No | T | YAGNI; keep patch single-purpose |
| S2 | Should advisory exempt framework-management? | No | M | Plan correct; if fm reverts to literal token, we want the warning |

## Phase 2: Design Review

N/A — no UI.

## Phase 3: Engineering Review

```
ENGINEERING REVIEW
  Architecture: sound — single advisory loop, mirrors existing 3 advisories' shape
  Test plan:    comprehensive (positive + negative + regression)
  Performance:  neutral — adds O(N*L) line scan where N=27 tmpls, L=avg lines; <100ms total
  Security:     improves — defense-in-depth against silent token expansion
  Blast radius: 1 file (lib/check-skill-docs.js) + 4 config files + CHANGELOG
```

**Auto-decisions (Engineering):**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| E1 | Code-fence detection: only ` ``` ` start-of-line, or ` ```! ` blocks too? | Both, via `trimStart().startsWith("```")` | M | Anthropic spec uses ` ```! ` for multi-line bang-cmd blocks; same toggle |
| E2 | Should the advisory include line:col or just line? | line only | T | grep-style line refs are conventional; col adds noise |
| E3 | Token list scope | All 3 (PREAMBLE, PREAMBLE_CORE, PREAMBLE_REF_LINK) | M | Each is generator-expanded |
| E4 | First-occurrence semantics: per-token or shared? | Per-token | M | Each token has its own canonical position |
| E5 | "Canonical position" check: line range or first-occurrence? | First-occurrence (simpler) | T | Matches generator behavior; avoids brittle line-range heuristic |
| E6 | Fence detection on indented code blocks (4-space indent)? | Not handled (false-negative on indented code) | T | Anthropic skills convention is fenced blocks; v0.6.x repo uses fenced exclusively (verified) |
| E7 | Should advisory be removable per-skill via comment marker? | No | T | If the warning fires, fix the prose. No suppression mechanism (YAGNI) |

7 decisions: 4 mechanical, 3 taste. All confirm plan; no amendments.

## Decision Audit Trail

| # | Phase | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| 1 | S1 | Single-purpose patch | T | YAGNI |
| 2 | S2 | No framework-management exemption | M | Explicit |
| 3 | E1 | Both ` ``` ` and ` ```! ` fences toggle | M | Spec match |
| 4 | E2 | Line-number only (no column) | T | Convention |
| 5 | E3 | All 3 tokens covered | M | Completeness |
| 6 | E4 | Per-token first-occurrence | M | Generator parity |
| 7 | E5 | First-occurrence simpler than line-range | T | Explicit > clever |
| 8 | E6 | Fenced-only, no indented-code handling | T | Repo convention |
| 9 | E7 | No per-skill suppression | T | YAGNI |

## Verdict

**APPROVED — auto-advance to BUILD.** 9 decisions auto-resolved, 0 amendments, 0 user-blocking concerns.

**Status: DONE.**
