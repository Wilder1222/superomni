# superomni Agents Doc Rewrite + Sync Invariant (v0.6.8)

**Branch:** `feat/agents-doc-sync` (off feat/plan-content-linter at 257ecec = v0.6.7 local)
**Session:** `agents-doc-sync`  **Date:** 20260515

## Why this spec

Implementation audit of post-v0.6.7 main found a **P0 user-facing documentation bug**:

`docs/AGENTS.md` (265 lines, linked from README lines 234 and 390 as the canonical "Agent library reference") still describes the **v0.5.x 9-agent** layout that was retired during v0.6.0 agent consolidation:

- Doc lists 9 agents: `code-reviewer`, `planner`, `debugger`, `test-writer`, `security-auditor`, `architect`, `evaluator`, `ceo-advisor`, `designer`
- Repo actually has 5 agents: `doc-writer`, `explorer`, `frontend-designer`, `planner-reviewer`, `refactoring-agent`
- **Zero overlap.** The 5 current agents have **0 mentions** in `docs/AGENTS.md`

A new contributor reading the README → docs/AGENTS.md path comes away with a completely wrong mental model of the agent architecture.

This is exactly the same bug class as v0.6.5 (README version stale) and v0.6.6 (docs/COMPARISON.md and docs/DESIGN.md version drift) — but for **agent inventory** instead of version strings. Fix + add CI invariant to prevent recurrence.

## Problem

| # | Bug | Severity | Evidence |
|---|-----|----------|----------|
| 1 | `docs/AGENTS.md` lists 9 retired agents (v0.5.x); 0 mentions of 5 current agents | **P0** | grep verification: 9 retired = 1 mention each; 5 current = 0 mentions. README lines 234, 390 link to it. |
| 2 | No CI invariant ensures `docs/AGENTS.md` agent names match `agents/*.md` files | **P1** | After v0.6.0 consolidation, the doc was simply not updated; same drift class as v0.6.5/v0.6.6 doc version drifts |

## Goals

- **G1.** Rewrite `docs/AGENTS.md` to accurately reflect current agent reality:
  - 5 sections, one per current agent (`doc-writer`, `explorer`, `frontend-designer`, `planner-reviewer`, `refactoring-agent`)
  - Each section contains: identity (what the agent does), iron law, when_to_invoke (which skills dispatch), tools whitelist, output format / report block shape
  - Source content from each agent's actual `agents/<name>.md` file (DRY — single source of truth is the agent file itself)
- **G2.** Add a "Migration from v0.5.x" section documenting the agent consolidation:
  - 9 retired agents → 5 current agents mapping
  - Helps readers who landed on v0.5.x docs / older PRs understand the new layout
  - Brief — 1 mapping table + 1-2 paragraphs of rationale
- **G3.** Extend `lib/check-plugin-sync.js` with a 5th invariant: agent names mentioned as headings in `docs/AGENTS.md` (e.g., `### \`doc-writer\``, `## doc-writer`) must equal the set of `agents/*.md` filenames. Same pattern as the existing commands-sync invariant (Invariant 2).
- **G4.** Wire the 5th invariant into `verify:skill-docs` umbrella (already auto-included since check-plugin-sync is in the umbrella) + verify CI workflow already runs it (it does, via v0.6.6 wiring).

## Non-Goals (YAGNI)

- **NOT** rewriting `README.md` lines 234/390 — they correctly link to `docs/AGENTS.md`; only the linked content was stale.
- **NOT** rewriting `docs/IMPLEMENTATION.md` (still says "Version: 0.3.0"). That's a separate doc with a different drift profile (roadmap history); deferred to a future audit.
- **NOT** adding agent-template content to `framework-management/SKILL.md.tmpl` (already has skill-template; agent-creation is its own future patch).
- **NOT** re-doing the v0.6.0 agent consolidation (that work is already in main; this sprint just makes the doc reflect it).
- **NOT** changing skill / agent / command counts.
- **NOT** changing `agents/*.md` content — they are source of truth, this sprint reads from them.

## Proposed Solution

**Selected approach: K — "Rewrite + sync invariant in single patch."**

One phase. Touch surface = `docs/AGENTS.md` (full rewrite) + `lib/check-plugin-sync.js` (one new invariant) + version bump.

### Phase 1 — Doc rewrite + invariant

1. **Read each `agents/<name>.md`** for source content (frontmatter + identity + iron law + when_to_invoke + report shape).
2. **Rewrite `docs/AGENTS.md`** with 5 agent sections, one Migration table, and front matter intro that matches superomni's current architecture.
3. **Extend `lib/check-plugin-sync.js`** with Invariant 5:
   ```js
   // Invariant 5: docs/AGENTS.md agent-section headings match agents/*.md filenames.
   // Pattern: lines like `### \`doc-writer\`` or `## doc-writer`.
   ```
   - Read `docs/AGENTS.md`; extract agent names from headings matching `^#{2,3}\s+\`?([a-z][a-z0-9-]+)\`?\s*$`
   - Read `agents/*.md`; extract filenames (strip `.md`)
   - Set equality (no missing, no extras), excluding generic words like "agents", "agent", "code", etc. (heuristic: only count names that match `agents/*.md` filename — bidirectional intersection check)
4. **Run** `npm run check:plugin-sync` after rewrite — must exit 0 with 5 invariants validated.
5. Verify CI workflow already runs it (yes, via v0.6.6).
6. Version bump 0.6.7 → 0.6.8 across 5 manifests + README + 2 docs (COMPARISON, DESIGN) + CHANGELOG.

## Key Design Decisions

| Decision | Choice | Rationale | Principle |
|----------|--------|-----------|-----------|
| Source of truth for agent content | `agents/<name>.md` files (DRY) | These are the live agent definitions; docs should reflect them, not duplicate | DRY |
| Migration table — how many columns? | 3 (retired agent name → current agent → mode/note) | Explicit mapping serves readers landing from v0.5.x docs | Explicit |
| Section heading format | `### \`<agent-name>\`` (3-level + backticks) | Matches existing `docs/AGENTS.md` style + grep-friendly for invariant 5 | DRY (preserve style) |
| Invariant 5 heading regex | `^#{2,3}\s+\`?([a-z][a-z0-9-]+)\`?\s*$` | Matches both `### \`name\`` and `## name`; restricts to lowercase-kebab to avoid false-matches on prose words | Explicit |
| False-match avoidance | Bidirectional intersection (heading name ∩ agents/*.md set) | Some headings will be prose (e.g., "Built-in Agents"); only match heading names that ALSO appear as a file under agents/ | Pragmatic |
| Migration section placement | After current 5-agent sections, before "Installing Agents" | Flow: present state → migration history → operational instructions | Pragmatic |
| Doc version anchor | Add `**Last updated:** vX.Y.Z` in AGENTS.md header | Mirrors `docs/COMPARISON.md` + `docs/DESIGN.md` pattern. Lets v0.6.6's check-plugin-sync VERSION_DOCS pick it up via Invariant 4. | DRY with v0.6.6 |
| Update VERSION_DOCS to include AGENTS.md | Yes | Once a version anchor exists, leverage existing infrastructure | DRY |
| Sprint version target | 0.6.8 patch | Bug-fix + defensive CI gate; matches v0.6.5/v0.6.6/v0.6.7 cadence | Explicit |

## Acceptance Criteria

### Phase 1 — Doc rewrite

- [ ] `docs/AGENTS.md` rewritten:
  - [ ] 5 agent sections, one per `agents/*.md` file
  - [ ] Each section has identity / iron law / when_to_invoke / tools / output format
  - [ ] "Migration from v0.5.x" section with retired→current mapping table
  - [ ] No mentions of 9 retired agents in operational text (only in migration table)
  - [ ] `**Last updated:** v0.6.8` line in header
- [ ] `grep -c "doc-writer\|explorer\|frontend-designer\|planner-reviewer\|refactoring-agent" docs/AGENTS.md` ≥ 15 (3+ mentions of each across heading + body)
- [ ] `grep -E "^### \`(code-reviewer|architect|debugger|evaluator|test-writer|security-auditor|ceo-advisor|designer|planner)\`" docs/AGENTS.md` returns 0 (retired names not used as section headings)

### Phase 1 — Invariant 5

- [ ] `lib/check-plugin-sync.js` has new invariant 5 (agent-name heading-set equality)
- [ ] On post-rewrite repo: `npm run check:plugin-sync` exits 0 with "5 invariants validated"
- [ ] Demonstrated: temporarily edit `docs/AGENTS.md` to add `### \`fake-agent\`` heading → checker fails with diagnostic; restore → passes
- [ ] Demonstrated: temporarily delete `### \`explorer\`` heading from `docs/AGENTS.md` → checker fails; restore → passes
- [ ] False-positive avoidance: prose mentions of agent names in body text (not as headings) don't trigger heading-set check

### Phase 1 — VERSION_DOCS extension

- [ ] `docs/AGENTS.md` has `**Last updated:** v0.6.8` line
- [ ] `lib/check-plugin-sync.js` VERSION_DOCS array includes a 4th entry for `docs/AGENTS.md`
- [ ] Demonstrated: inject mismatch in AGENTS.md `**Last updated:**` → checker fails; restore → passes

### Global regression gates

- [ ] All 8 CI gates locally green (verify:skill-docs umbrella + check:workflow-contract + validate-skills)
- [ ] `${CLAUDE_SKILL_DIR}` literal token preserved (15 occurrences)
- [ ] `EnterPlanMode → brainstorm` rule preserved (5 mentions in CLAUDE.md)
- [ ] `frontend-design/reference/design-md-library/*` unchanged (9 entries)
- [ ] No flat `reference.md` files (0)
- [ ] Skill / agent counts unchanged (28 / 5)
- [ ] No `.approved-spec-*` markers (0; v0.6.6 G7 invariant preserved)
- [ ] Total skill body lines unchanged (this sprint adds no skill body content)

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` show `0.6.8`
- [ ] `README.md` `Current stable version: 0.6.8`
- [ ] `docs/COMPARISON.md` header + footer → 0.6.8
- [ ] `docs/DESIGN.md` Status: Implemented (v0.6.8)
- [ ] `docs/AGENTS.md` `**Last updated:** v0.6.8` line
- [ ] `CHANGELOG.md` has new `[0.6.8] — 2026-05-15` entry

## Open Questions

None. All design choices match existing v0.6.5-v0.6.7 patterns.

## Frontend Design Note

N/A — no UI work.

## Deferred to v0.7.0+ Backlog (unchanged)

1. `context: fork` migration (architectural; runtime evidence required).
2. `model:` / `effort:` per-skill overrides.
3. `$ARGUMENTS` substitution adoption.
4. `paths` glob auto-trigger (likely never).
5. Live `/vibe` E2E test (sandbox required).
6. CHANGELOG auto-generation from commits.
7. Windows job fixture-parity.
8. `bin/audit-repo-invariants` data-driven exclude list.
9. `docs/IMPLEMENTATION.md` version stale (deferred — different drift profile, separate audit).

## Next Stage

On approval → auto-advance to **PLAN**.

---

**Status: DONE — spec ready for user approval.**

This continues the v0.6.5-v0.6.7 pattern: bug-driven sprint selection + patch-sized scope + new CI invariant prevents recurrence + leverages existing verify:skill-docs umbrella.
