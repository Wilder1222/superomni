# Release v0.6.4 — Token-Literal Advisory

**Branch:** `feat/skill-layering-anthropic` (continuing from v0.6.3 commit fda1cb1)
**Session:** `token-literal-advisory`  **Date:** 2026-05-15

Pipeline artifacts: spec / plan / review / execution / evaluation / release all under `docs/superomni/<kind>/<kind>-main-token-literal-advisory-20260515.md`.

---

## Release

### Headline

Single-purpose patch closing v0.6.3's outstanding retro ACTION: a 4th advisory in `lib/check-skill-docs.js` that catches literal `{{PREAMBLE*}}` tokens in raw prose before the generator silently expands them. ~30 LOC; respects both fenced code blocks AND inline-backtick spans (markdown semantics-aware).

### Numbers

| Metric | Value |
|---|---|
| Files modified | 6 (lib/check-skill-docs.js + 4 config + CHANGELOG) |
| Files added | 0 (existing checker extended in place) |
| Total skill body lines | 6,249 → 6,249 (unchanged) |
| New advisories | 1 (4th in the series) |
| v0.6.3 retro debt closed | 1 of 1 |
| Skill / agent counts | 28 / 5 (unchanged) |

### Pre-PR Checklist

- [x] All 5 CI commands exit 0
- [x] Positive + negative demos verified (3 of 3 cases)
- [x] All global invariants preserved
- [x] Version 0.6.4 in 5 files + CHANGELOG entry

### Open PR (pending user approval)

Target: `main`. Title: `feat: token-literal advisory (v0.6.4)`. Body: see § Headline + Numbers above.

---

## Retrospective

### Scoring

**Agent total: 14/15**

- Scope management (5/5) — single-purpose patch held to scope; mid-build refinement (inline-backtick handling) stayed inside spec G1
- Instruction following (5/5) — completed all 8 plan steps in order
- Escalation behavior (4/5) — initial advisory implementation didn't account for inline backticks; surfaced via clean-state run on `framework-management:226` and refined immediately. Could have anticipated by reading the markdown spec more carefully

### Skill effectiveness avg: 5.0/5

- `brainstorm` — 5/5 (single-purpose spec, no clarifying questions needed)
- `writing-plans` — 5/5 (compact 8-step plan, 3 milestones)
- `plan-review` — 5/5 (9 decisions auto-resolved, 0 amendments)
- `executing-plans` — 5/5 (1 corrective iteration on inline-backtick — caught at clean-state check, fixed within minutes)
- `verification` — 5/5 (3 test cases all positive; explicit positive + 2 negative demos)

### Iron Law compliance: 100%

- Spec approval before plan ✓
- Plan review before build ✓
- Status protocol on every artifact ✓
- 6 Decision Principles applied ✓

### What I would do differently

1. **Read the markdown rendering spec before writing markdown-aware tooling.** I treated inline backticks as prose initially; the clean-state check on framework-management surfaced this in 30 seconds, but a 1-minute upfront read of the markdown spec would have prevented the rework.
2. **Acknowledge that "single-purpose patch" doesn't mean "skip iteration".** Even a 30-LOC advisory benefited from a refinement cycle. Future tiny-patches: budget for 1-2 corrective passes, don't expect perfection on first pass.

### Actions for next sprint

#### ACTION 1 (new from this sprint): None

The advisory itself catches a foreseeable bug class. No new follow-up actions needed from THIS sprint specifically.

### Carry-forward check

**v0.6.3 retro:**
- ACTION 1 (sister-script audit) — irrelevant; no migration this sprint
- ACTION 2 (token-literal advisory) — **CLOSED THIS SPRINT** ✓
- ACTION 3 (data-driven exclude list for audit-repo-invariants) — still deferred (P3)

**v0.6.2 retro:**
- ACTION 1 (live `/vibe` E2E test) — still deferred (requires sandbox)

**v0.6.1, v0.6.0 retros:** all closed.

---

## Status: DONE

**Status:** DONE

All 5 stages produced artifacts. v0.6.4 ready to commit; branch will have 4 unpushed commits (v0.6.1 → v0.6.2 → v0.6.3 → v0.6.4) pending user push/PR decision.
