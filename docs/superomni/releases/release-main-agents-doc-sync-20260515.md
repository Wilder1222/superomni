# Release v0.6.8 — docs/AGENTS.md Rewrite + Sync Invariant

**Branch:** `feat/agents-doc-sync` (off feat/plan-content-linter at 257ecec = v0.6.7 local)
**Session:** `agents-doc-sync`  **Date:** 2026-05-15

Pipeline artifacts: spec / plan / review / execution / evaluation / release all under `docs/superomni/<kind>/<kind>-main-agents-doc-sync-20260515.md`.

---

## Release

### Headline

Fix P0 user-facing doc bug: `docs/AGENTS.md` (linked from README as the canonical agent library reference) still described v0.5.x's 9 retired agents — zero mentions of the 5 current canonical agents. v0.6.8 rewrites the doc to match reality and adds Invariant 5 to `lib/check-plugin-sync.js` to prevent future drift.

### Numbers

| Metric | Value |
|---|---|
| Lines of stale doc fixed | 265 (full rewrite) |
| New CI invariant | 1 (Invariant 5: agent-doc heading set parity) |
| VERSION_DOCS extension | 1 (added AGENTS.md `**Last updated:**` anchor) |
| Negative demos verified | 3 (Invariant 5 missing-agent + Invariant 4 version drift + false-positive avoidance) |
| Files touched | 11 (docs/AGENTS.md + lib/check-plugin-sync.js + 5 manifests + README + 2 docs + CHANGELOG) |
| Skill body lines delta | 0 (this sprint adds no skill content) |
| Skill / agent counts | 28 / 5 (unchanged) |

### Pre-PR Checklist

- [x] All 8 CI gates locally green
- [x] 3 negative demos verified each invariant fires correctly
- [x] All global invariants preserved (28/5/5/0/15/9/0/markers=0)
- [x] Version 0.6.8 across 5 manifests + README + 3 docs + CHANGELOG entry
- [x] `docs/AGENTS.md` agent-section headings = `agents/*.md` filename set (5/5 match)

### Open PR (pending user approval)

Target: `main`. Title: `fix: rewrite docs/AGENTS.md to reflect v0.6.0 agent consolidation + Invariant 5 sync gate (v0.6.8)`. Body: see § Headline + Numbers above.

---

## Retrospective

### Scoring

**Agent total: 14/15**

- Scope management (5/5) — single-purpose patch held tight; resisted bundling `docs/IMPLEMENTATION.md` staleness (legitimate scope boundary; different drift profile)
- Instruction following (5/5) — completed all 12 plan steps in order; 2 plan amendments correctly applied during BUILD
- Escalation behavior (4/5) — REVIEW caught Step 7's redundancy (the original synthetic-injection demo would have been a no-op test). Should have spotted that during PLAN authoring.

### Skill effectiveness avg: 5.0/5

- `brainstorm` — 5/5 (audit-driven scope; spec grounded in grep evidence)
- `writing-plans` — 5/5 (12 steps, 3 milestones, plan amendments captured at REVIEW)
- `plan-review` — 5/5 (2 amendments caught + 12 decisions auto-resolved)
- `executing-plans` — 5/5 (clean execution; mid-build VERSION_DOCS interim correctly understood as expected behavior)
- `verification` — 5/5 (3 demos covered Invariant 5 + Invariant 4 + false-positive avoidance)

### Iron Law compliance: 100%

- Spec approval before plan ✓ (user "A" reply, no marker file per v0.6.6 G7)
- Plan review before build ✓ (caught 2 amendments)
- Status protocol on every artifact ✓
- 6 Decision Principles applied ✓
- **Audit-driven sprint selection (4th consecutive)** ✓ — found higher-value item (P0 user-facing doc bug) than backlog inertia would suggest

### Process insights

1. **Bug-driven sprint selection has now produced 4 consecutive wins** (v0.6.5 README + plugin-sync, v0.6.6 CI gap + marker removal, v0.6.7 plan-content linter, v0.6.8 AGENTS.md). Pattern: read post-merge state → grep for staleness → ship single-purpose patch with new CI invariant. The pattern stabilizes around "audit + fix + new CI gate to prevent recurrence."
2. **REVIEW caught a real design flaw before BUILD** (Step 7 was logically circular). Validates the plan-review-after-PLAN-before-BUILD ordering AGAIN. v0.6.5/v0.6.6/v0.6.7 also had REVIEW catches; this is now a reliable pattern, not an outlier.
3. **VERSION_DOCS interim "yellow" state during sprint is acceptable** (documenting in retro). When a sprint touches a VERSION_DOCS-tracked file (e.g., AGENTS.md gets a new `**Last updated:**` line at Step 2 but package.json bumps at Step 9), there's a window where check-plugin-sync would fail. This is fine — it means the gate is working; it's not a sprint blocker.
4. **5 logical invariants now in check-plugin-sync.js** — versions, commands set, keywords set, multi-doc version anchors, agent-doc heading set. The "logical invariants" framing is more useful than counting individual checks; v0.7.0+ may add Invariant 6 (e.g., skill-frontmatter-vs-CLAUDE.md skills table sync).

### Actions for next sprint

#### ACTION 1 (new from this sprint, P3): Pre-cycle bump check

When a sprint touches a VERSION_DOCS-tracked file's version anchor, prefer to bump `package.json` and the doc anchor in the **same step**, not separated. Avoids the "yellow interim" state where the gate fails mid-sprint. Document in framework-management as a sprint-execution best practice.

**Owner:** future patch
**Success criterion:** framework-management has a "Sprint execution" section noting this convention.

### Carry-forward check

**v0.6.7 retro:** all closed.
**v0.6.6 retro:** all closed.
**v0.6.5 retro:** all closed.
**v0.6.3 retro:**
- ACTION 3 (data-driven exclude list for audit-repo-invariants) — still deferred (P3)
- Plan-content auto-linter — closed in v0.6.7 ✓

**v0.6.2 retro:**
- ACTION 1 (live `/vibe` E2E test) — still deferred (sandbox required)

---

## Status: DONE

**Status:** DONE

All 6 stages produced artifacts. v0.6.8 ready to commit.

Branch chain: main (e33d0f2, v0.6.4 merged) ← feat/plugin-sync-gate (d9461c5, v0.6.5) ← feat/ci-completeness (eb363d0, v0.6.6) ← feat/plan-content-linter (257ecec, v0.6.7) ← feat/agents-doc-sync (this commit, v0.6.8).

P0 user-facing doc bug fixed. CI Invariant 5 prevents recurrence. Bug-driven sprint pattern produces 4th consecutive win.
