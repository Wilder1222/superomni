# Execution: docs/AGENTS.md Rewrite + Sync Invariant (v0.6.8)

**Plan:** `docs/superomni/plans/plan-main-agents-doc-sync-20260515.md`
**Review:** `docs/superomni/reviews/plan-review-main-agents-doc-sync-20260515.md` (2 amendments)
**Branch:** `feat/agents-doc-sync` (off feat/plan-content-linter at 257ecec = v0.6.7 local)  **Date:** 20260515

## Execution log

| Step | Action | Result |
|---|---|---|
| 1 | Baseline CI green | ✓ |
| 2 | Rewrite `docs/AGENTS.md` (244 lines; was 265 of all-stale) | ✓ — 5 agent sections (alphabetical) + Migration table + Installing/Creating sections |
| 3 | Add Invariant 5 to `lib/check-plugin-sync.js` | ✓ — heading regex `^#{2,3}\s+\`?([a-z][a-z0-9-]+)\`?\s*$` + bidirectional filter |
| 4 | Extend VERSION_DOCS array with AGENTS.md entry | ✓ |
| 5 | Run linter post-rewrite | ✓ "5 invariants validated" after Step 9 version bump (Invariant 4 fired during Step 5 because AGENTS.md was at 0.6.8 but package.json still 0.6.7 — resolved by Step 9) |
| 6 | Negative demo: rename `### \`explorer\`` → "explorer-renamed" | ✓ exit 1: "agents-doc sync: 1 agent(s) ... missing from docs/AGENTS.md: explorer"; restore → pass |
| 7 | False-positive avoidance: confirmed prose mentions of agent names throughout body don't trigger Invariant 5 (Step 5 clean pass = implicit verification) | ✓ — Amendment A applied: removed planned synthetic injection (which was logically circular per REVIEW E1) |
| 8 | Negative demo: change `**Last updated:** v0.6.8` → `v9.9.9` | ✓ exit 1 with "doc version: docs/AGENTS.md = 9.9.9, expected 0.6.8"; restore → pass |
| 9 | Version bump 0.6.7 → 0.6.8 across 8 surfaces | ✓ |
| 10 | CHANGELOG `[0.6.8]` entry above 0.6.7 | ✓ |
| 11 | Final regression gate | ✓ all 8 CI gates green; all invariants preserved |

## Plan amendments (from REVIEW)

Both correctly applied during BUILD:
- **Amendment A (E1)**: Step 7 reframed from "synthetic fake-agent injection" (which was logically a no-op since bidirectional filter would silently drop fake names) to "verify prose mentions don't trigger via Step 5's clean pass on full doc with many prose mentions" — implicit verification.
- **Amendment B (E2)**: success message updated to "5 invariants validated" + code comment documenting "5 logical invariants" semantic.

## Key implementation details

### Invariant 5 design

```js
const headingRe = /^#{2,3}\s+`?([a-z][a-z0-9-]+)`?\s*$/gm;
// ... iterate matches ...
if (agentsOnDisk.includes(m[1])) {
    declaredHeadings.add(m[1]);
}
const missingFromDoc = agentsOnDisk.filter((a) => !declaredHeadings.has(a));
```

Two-stage filter:
1. **Regex limits to lowercase-kebab heading names** — excludes prose words like "Built-in Agents" (mixed case, multi-word).
2. **Bidirectional intersection** — only headings matching actual agent filenames count toward the "declared" set. A heading like `### \`fake-agent\`` is silently filtered because no `agents/fake-agent.md` exists.

The check then verifies: every actual agent file → has a corresponding heading. Missing headings = fail.

### Migration table

| Retired (v0.5.x) | Current (v0.6.x) |
|---|---|
| code-reviewer / planner / architect / ceo-advisor / evaluator / security-auditor | planner-reviewer (multi-mode: 6 modes) |
| designer | frontend-designer |
| debugger | explorer |
| test-writer | (folded into test-driven-development skill) |

## Mid-build observations (recorded for retro)

1. **VERSION_DOCS firing at Step 5 was expected but slightly confusing first run** — the `**Last updated:** v0.6.8` was written into AGENTS.md at Step 2, but package.json was still 0.6.7 until Step 9. So Step 5's run of `check:plugin-sync` correctly fired on Invariant 4 (version mismatch). This is the right behavior; it just creates a "yellow" interim state during the sprint. Worth noting for future sprints that touch VERSION_DOCS-tracked files: bump version BEFORE writing the new doc version string, or accept the yellow interim.
2. **REVIEW caught a real bug in Step 7 design** — Amendment A was a meaningful correction. Original Step 7 was "add fake heading → observe linter doesn't fail (filter works)" — but that's not testing the gate, it's testing the false-positive avoidance. The correct test is: real agent's heading is missing → gate fails. Step 6 already does this. Step 7 was redundant. REVIEW caught the redundancy.
3. **Doc rewrite was 244 lines vs original 265** — slightly shorter despite adding the Migration table. Source: original had repeated boilerplate per agent ("Use when:" + "Iron Law:" + "Output:" formatted differently). Rewrite consolidated structure.

## Step 11 — Regression Gate

| Invariant | Pre-sprint (v0.6.7) | Post-sprint | Status |
|---|---|---|---|
| Skills count | 28 | 28 | ✓ |
| Agents count | 5 | 5 | ✓ |
| EnterPlanMode mentions in CLAUDE.md | 5 | 5 | ✓ |
| Flat reference.md files | 0 | 0 | ✓ |
| `${CLAUDE_SKILL_DIR}` literal token refs | 15 | 15 | ✓ |
| `frontend-design/reference/design-md-library/` entries | 9 | 9 | ✓ |
| `.approved-spec-*` markers | 0 | 0 | ✓ (G7 invariant) |
| Total `wc -l skills/*/SKILL.md` | 6,245 | 6,245 | ✓ (no skill content touched) |
| `verify:skill-docs` (umbrella: gen + check-skill-docs + verify:fixture-parity + test:generators + check:plugin-sync + check:plan-content) | green (6 sub-checks) | green (6 sub-checks; check:plugin-sync now runs 5 invariants internally) | ✓ |
| `check:workflow-contract` | exit 0 | exit 0 | ✓ |
| `validate-skills.sh` | 1 warning (workflow stub) | 1 warning (workflow stub) | ✓ |
| Version 0.6.8 across 5 manifests + README + 3 docs | n/a | confirmed | ✓ |
| `docs/AGENTS.md` agent-name heading set | mismatched (0/5 current) | matches 5/5 | ✓ |

**Overall execution status: DONE.** P0 user-facing doc bug fixed. New CI invariant (Invariant 5) prevents future drift. Sprint touched only doc + checker; no skill / agent / command churn.
