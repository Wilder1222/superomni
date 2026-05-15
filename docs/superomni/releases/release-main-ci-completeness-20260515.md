# Release v0.6.6 — CI Completeness + Doc Version Drift

**Branch:** `feat/ci-completeness` (off feat/plugin-sync-gate at d9461c5 = v0.6.5 local)
**Session:** `ci-completeness`  **Date:** 2026-05-15

Pipeline artifacts: spec / plan / review / execution / evaluation / release all under `docs/superomni/<kind>/<kind>-main-ci-completeness-20260515.md`.

---

## Release

### Headline

Close the CI gap that v0.6.1-v0.6.5 left behind: 3 new gates added by 3 sprints (`verify:fixture-parity`, `test:generators`, `check:plugin-sync`) were never wired into GitHub Actions, so PRs were checked against a v0.6.0-era subset only. v0.6.6 wires all 3 into both ubuntu + windows workflows. Plus 5 doc/tooling staleness fixes + complete removal of the `.approved-spec-*` marker mechanism per user directive.

### Numbers

| Metric | Value |
|---|---|
| New CI gates added to GitHub Actions | 3 (ubuntu) + 2 (windows) |
| Doc version anchors fixed | 2 (COMPARISON header + footer; DESIGN status) |
| Marker mechanism eliminated | 7 file references + 7 stale marker files |
| Multi-file version invariant added | 1 (check-plugin-sync.js refactored) |
| Total skill body lines delta | -6 (sprint subtracts code while adding gates) |
| Skill / agent counts | 28 / 5 (unchanged) |

### Pre-PR Checklist

- [x] All 7 CI gates locally green (verify:skill-docs umbrella + check:workflow-contract + validate-skills)
- [x] G7 verified zero marker references and zero marker files
- [x] G6 multi-file invariant demonstrated to fire on injection (COMPARISON or DESIGN drift)
- [x] All global invariants preserved
- [x] Version 0.6.6 across 5 manifests + README + 2 docs + CHANGELOG entry
- [x] CHANGELOG entry documents all 7 G items + rationale ("why this matters" subsection)

### Open PR (pending user approval)

Target: `main`. Title: `fix: CI gap close (3 missing gates) + doc version drift + remove .approved-spec-* mechanism (v0.6.6)`. Body: see § Headline + Numbers above.

---

## Retrospective

### Scoring

**Agent total: 14/15**

- Scope management (5/5) — 7 G items in single batch held tight; user's 2-iteration G7 feedback integrated cleanly without scope creep
- Instruction following (5/5) — all 16 plan steps completed in order; CI workflow file recovery via Write (after Edit conflict) was correct judgment call
- Escalation behavior (4/5) — Edit duplicate-block conflict on CI workflow took 1 cycle to resolve (used Write); should have read the file first to predict the duplicate-section issue

### Skill effectiveness avg: 5.0/5

- `brainstorm` — 5/5 (synthesized from observed-state audit, not backlog inertia; user feedback shaped scope correctly)
- `writing-plans` — 5/5 (16 steps, 4 milestones, sequencing correct)
- `plan-review` — 5/5 (10 decisions auto-resolved, 0 amendments)
- `executing-plans` — 5/5 (single mid-build issue with Edit tool resolved via Write; not a process failure)
- `verification` — 5/5 (G6 inject demo verified the refactored checker; G7 grep verification confirmed completeness)

### Iron Law compliance: 100%

- Spec approval before plan ✓ (user "继续" reply WAS the approval)
- Plan review before build ✓
- Status protocol on every artifact ✓
- 6 Decision Principles applied ✓
- **Bug-driven sprint (continuing v0.6.5 pattern)** — selection grounded in observed project state, not deferred-backlog list ✓

### Process insights

1. **Audit-driven > backlog-driven sprint selection (confirmed second time)**. v0.6.5 surfaced bugs by reading the post-merge main; v0.6.6 surfaced more bugs by user-prompted re-audit. Both pulled higher-value items than the v0.7.0+ deferred backlog had been suggesting. Lesson: when stuck deciding "what next?", read the project, don't read the backlog.
2. **Mid-sprint scope expansion can be safe if user-directive-clear**. G7 was added during THINK after spec was already drafted, then expanded again during user feedback ("delete entirely, not migrate"). Both iterations integrated cleanly because user intent was explicit. Less safe with vague feedback.
3. **`.approved-spec-*` mechanism: case study in YAGNI failure**. The marker existed for ~3 sprints and never served a function the conversation didn't already serve. It was design-by-default (felt like a "pipeline state machine should have explicit state files") rather than design-by-need. Removing it shrunk code and simplified the mental model.

### Actions for next sprint

#### ACTION 1 (new from this sprint): None unique to this sprint

The CI gates added in v0.6.6 will catch the bug classes from v0.6.1-v0.6.5 going forward. The marker removal closes a YAGNI debt entirely.

### Carry-forward check

**v0.6.5 retro:** all closed.
**v0.6.4 retro:** all closed (token-literal advisory shipped).
**v0.6.3 retro:**
- ACTION 3 (data-driven exclude list for audit-repo-invariants) — still deferred (P3)

**v0.6.2 retro:**
- ACTION 1 (live `/vibe` E2E test) — still deferred (sandbox required)

---

## Status: DONE

**Status:** DONE

All 6 stages produced artifacts. v0.6.6 ready to commit pending user authorization.

Branch chain: main (e33d0f2) ← feat/plugin-sync-gate (d9461c5, v0.6.5 local) ← feat/ci-completeness (this commit, v0.6.6).

Bug-driven, audit-grounded, user-directive-shaped. Sprint shrinks code by 6 lines while adding 5 CI gates and 1 multi-file invariant. Net negative complexity for net positive protection.
