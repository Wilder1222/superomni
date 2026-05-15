# Release v0.6.5 — Plugin Sync Gate + Stale-Doc Fixes

**Branch:** `feat/plugin-sync-gate` (off main e33d0f2 = v0.6.4 merge)
**Session:** `plugin-sync-gate`  **Date:** 2026-05-15

Pipeline artifacts: spec / plan / review / execution / evaluation / release all under `docs/superomni/<kind>/<kind>-main-plugin-sync-gate-20260515.md`.

---

## Release

### Headline

Fix two real P1 bugs surfaced post-v0.6.4-merge (README version 4 versions stale; `claude-skill.json` missing `style-capture` command) and add `lib/check-plugin-sync.js` — a structural CI gate that prevents future drift across the 4 plugin manifests + commands directory + README version line.

### Numbers

| Metric | Value |
|---|---|
| P1 bugs fixed | 2 (README version, claude-skill.json commands) |
| New CI gate | 1 (`check:plugin-sync`, ~120 LOC) |
| Invariants checked | 4 (version sync × 5 surfaces; commands set parity; keywords set parity; README version line) |
| Demo cases verified | 4 (each invariant inject + restore) |
| Files touched | 7 (README, claude-skill.json, lib/check-plugin-sync.js, package.json, marketplace.json, plugin.json, CHANGELOG.md) |
| Skill body lines delta | 0 (this sprint adds no skill content) |
| Skill / agent counts | 28 / 5 (unchanged) |

### Pre-PR Checklist

- [x] All 7 CI gates green (gen-skills, check:skill-docs, verify:fixture-parity, test:generators, check:plugin-sync, check:workflow-contract, validate-skills)
- [x] 4 invariants each demonstrated with positive (drift fires) + negative (clean state passes) tests
- [x] All global invariants preserved
- [x] Version 0.6.5 across 5 manifests + README + CHANGELOG entry

### Open PR (pending user approval)

Target: `main`. Title: `fix: plugin manifest sync + README version + new check:plugin-sync gate (v0.6.5)`. Body: see § Headline + Numbers above.

---

## Retrospective

### Scoring

**Agent total: 14/15**

- Scope management (5/5) — held to bug-fix + single-checker scope; no creep into plan-linter or context: fork temptations.
- Instruction following (5/5) — completed all 10 plan steps in order (Step 9 reordered before Step 7 per plan's own self-amendment).
- Escalation behavior (4/5) — caught the bugs by reading actual project state post-merge (README staleness, commands diff). Should have noticed claude-skill.json drift earlier (it was visible across multiple sprints' frontmatter exposure work).

### Skill effectiveness avg: 5.0/5

- `brainstorm` — 5/5 (synthesis spec from grounded code observation, not from backlog list)
- `writing-plans` — 5/5 (10 steps, 3 milestones, plan amended itself for sequencing)
- `plan-review` — 5/5 (11 decisions auto-resolved, 0 user-blocking)
- `executing-plans` — 5/5 (clean execution, mid-build verification confirmed correctness)
- `verification` — 5/5 (4 inject-and-restore demos covered each invariant)

### Iron Law compliance: 100%

- Spec approval before plan ✓
- Plan review before build ✓
- Status protocol on every artifact ✓
- 6 Decision Principles applied ✓
- Bug fixes grounded in observed reality, not assumed backlog priority ✓

### What I would do differently

1. **Notice manifest drift earlier in the v0.6.x series.** The `claude-skill.json` missing `style-capture` was visible across 4 prior sprints — every time we touched `commands/` or did version bumps, the drift was 1 grep away. Lesson: when a project has ≥3 manifest files maintaining overlapping data, it's worth one pass of "what's the truth set?" before each version bump. The new CI gate makes this automatic.
2. **Treat post-merge state as fresh ground for sprint selection.** I initially proposed `plan-content auto-linter` as the next sprint based on backlog inertia. The right answer was "what bugs exist on the post-PR-49 main?" — which surfaced the README + claude-skill.json bugs in 30 seconds. Sprint selection should always start from observed state, not from carry-forward lists.

### Actions for next sprint

#### ACTION 1 (new from this sprint): None unique to this sprint

The CI gate itself prevents recurrence of the bug class. No new follow-up.

### Carry-forward check

**v0.6.4 retro:** all closed.
**v0.6.3 retro:**
- ACTION 1 (sister-script audit) — irrelevant; no migration this sprint
- ACTION 3 (data-driven exclude list for audit-repo-invariants) — still deferred (P3)

**v0.6.2 retro:** ACTION 1 (live `/vibe` E2E test) — still deferred (sandbox required)

---

## Status: DONE

**Status:** DONE

All 6 stages produced artifacts. v0.6.5 ready to commit; branch will have 1 unpushed commit pending user push/PR decision (off fresh main, single sprint).

**Bug-driven sprint instead of backlog-driven** — this is a more honest sprint selection pattern when working on a maintained project. Recorded as a process insight worth carrying forward.
