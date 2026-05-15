# Evaluation: docs/AGENTS.md Rewrite + Sync Invariant (v0.6.8)

**Branch:** `feat/agents-doc-sync`  **Date:** 20260515

## Code Review (Self)

| File | Change | Verdict |
|---|---|---|
| `docs/AGENTS.md` | Full rewrite: 265 stale lines → 244 accurate lines (5 agent sections + Migration + Installing + Creating + CI Enforcement note) | ✓ |
| `lib/check-plugin-sync.js` | + Invariant 5 (~25 LOC) + VERSION_DOCS entry for AGENTS.md (+5 LOC) + success-message count update | ✓ |
| `package.json` | Bumped 0.6.7 → 0.6.8 | ✓ |
| `.claude-plugin/marketplace.json` (×2) | Bumped 0.6.7 → 0.6.8 | ✓ |
| `.claude-plugin/plugin.json` | Bumped 0.6.7 → 0.6.8 | ✓ |
| `claude-skill.json` | Bumped 0.6.7 → 0.6.8 | ✓ |
| `README.md` | Current stable version 0.6.7 → 0.6.8 | ✓ |
| `docs/COMPARISON.md` | Header + footer 0.6.7 → 0.6.8 (historical 0.3.0 references unchanged) | ✓ |
| `docs/DESIGN.md` | Version + Status 0.6.7 → 0.6.8 | ✓ |
| `CHANGELOG.md` | + [0.6.8] entry with rationale + verified demos | ✓ |

**P0/P1/P2 issues:** none.

## QA — Test Coverage

| Test surface | Mechanism | Result |
|---|---|---|
| Doc accuracy: 5 agent sections present | `grep "^### \`<name>\`"` for each of 5 agents | 5/5 match |
| Doc accuracy: 9 retired agents NOT used as section headings | `grep -cE "^### \`(code-reviewer\|...)\`"` | 0 match |
| Doc rewrite line count | `wc -l docs/AGENTS.md` | 244 (was 265; minus boilerplate, plus Migration table) |
| Invariant 5 positive (all agents present) | `npm run check:plugin-sync` | exit 0 with "5 invariants validated" |
| Invariant 5 negative (rename heading) | sed rename `### \`explorer\`` → `### explorer-renamed`; run linter | exit 1: "agents-doc sync: 1 agent(s) ... missing: explorer"; restore → pass |
| Invariant 4 on AGENTS.md (version drift) | sed `**Last updated:** v0.6.8` → `v9.9.9`; run linter | exit 1: "doc version: docs/AGENTS.md ... = 9.9.9, expected 0.6.8"; restore → pass |
| False-positive avoidance | Step 5's clean pass with full doc body containing many prose mentions of agent names | implicit ✓ (would have failed if regex too loose) |
| All 8 CI gates green | `verify:skill-docs` umbrella + `check:workflow-contract` + `validate-skills` | all exit 0 |
| Skill / agent counts | `ls -d skills/*/`; `ls agents/*.md` | 28 / 5 unchanged |

## Acceptance Criteria

### Phase 1 — Doc rewrite

- [x] `docs/AGENTS.md` rewritten with 5 agent sections (one per agents/*.md file)
- [x] Each section has identity / iron law / tools / when_to_invoke / output format
- [x] "Migration from v0.5.x" section with retired→current mapping table
- [x] No retired-agent section headings (operational text only references current 5)
- [x] `**Last updated:** v0.6.8` line in header

### Phase 1 — Invariant 5

- [x] `lib/check-plugin-sync.js` has new invariant 5
- [x] Post-rewrite `npm run check:plugin-sync` exits 0 with "5 invariants validated"
- [x] Negative demo (heading rename) verified
- [x] False-positive avoidance verified (prose mentions don't trigger; bidirectional filter)

### Phase 1 — VERSION_DOCS extension

- [x] AGENTS.md `**Last updated:** v0.6.8` line present
- [x] VERSION_DOCS includes 4th entry for AGENTS.md
- [x] Negative demo verified

### Global regression gates

- [x] All 8 CI commands locally green
- [x] `${CLAUDE_SKILL_DIR}` 15 / `EnterPlanMode` 5 / design-md-library 9 / flat reference.md 0 / skills 28 / agents 5
- [x] `.approved-spec-*` markers: 0 (v0.6.6 G7 invariant preserved)
- [x] Total `wc -l skills/*/SKILL.md`: unchanged (this sprint adds no skill body content)

### Version

- [x] All 5 manifest files + README + 3 docs at 0.6.8
- [x] CHANGELOG `[0.6.8] — 2026-05-15` with full rationale

## Plan Amendments correctly applied

- [x] Amendment A (E1): Step 7 reframed (no synthetic injection)
- [x] Amendment B (E2): success message updated to "5 invariants validated" + code comment

## Status: DONE

**Status:** DONE

P0 user-facing documentation bug fixed. Five-invariant CI gate now prevents agent-inventory drift recurrence. v0.6.x bug-driven sprint pattern continues — fourth consecutive sprint where audit-driven selection found higher-value items than backlog inertia would suggest.

**Architectural-level via patch cadence demonstrated again** (4th time): full doc rewrite + new CI invariant + version bump = single-purpose patch, single CI cycle, single PR.

**Next stage:** RELEASE.
