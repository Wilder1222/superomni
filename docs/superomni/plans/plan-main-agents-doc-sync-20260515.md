# Implementation Plan: docs/AGENTS.md Rewrite + Sync Invariant (v0.6.8)

**Spec:** `docs/superomni/specs/spec-main-agents-doc-sync-20260515.md`
**Branch:** `feat/agents-doc-sync` (off feat/plan-content-linter at 257ecec = v0.6.7 local)
**Session:** `agents-doc-sync`  **Date:** 20260515

## Overview

Single-phase patch. Two work surfaces:
1. Replace `docs/AGENTS.md` (265 lines, all stale) with a fresh ~250-line rewrite.
2. Extend `lib/check-plugin-sync.js` with a 5th invariant (agent-name set parity) + VERSION_DOCS entry for AGENTS.md.

## Prerequisites

- [x] Spec approved (user "A" reply)
- [x] Branch `feat/agents-doc-sync` off feat/plan-content-linter HEAD (257ecec = v0.6.7 local)
- [x] CI green from v0.6.7 state

## Steps

### Step 1: Baseline

`git status` clean (only sprint artifacts untracked); all 8 CI gates green.

### Step 2: Rewrite `docs/AGENTS.md`

Read the 5 source files (`agents/<name>.md`) and synthesize. Structure:

1. **Header** — title, intro, `**Last updated:** v0.6.8`
2. **What Are Agents?** — high-level intro (skills vs agents, dispatch model, output protocol). Update from v0.5.x prose to current architecture (`Task` tool, `dispatch-agent:` frontmatter, fork via skill body).
3. **Built-in Agents (5)** — one section per agent in alphabetical order:
   - `### \`doc-writer\``
   - `### \`explorer\``
   - `### \`frontend-designer\``
   - `### \`planner-reviewer\`` (with mode selector subsection — 6 modes)
   - `### \`refactoring-agent\``

   Each section: Identity → Iron Law → Tools → When to Invoke (which skills dispatch) → Do NOT dispatch for → Report Format.
4. **Migration from v0.5.x** — retired→current mapping table:
   ```
   | Retired (v0.5.x) | Current (v0.6.x) | Notes |
   |---|---|---|
   | code-reviewer | planner-reviewer (code-review mode) | merged |
   | planner | planner-reviewer (planning mode) | merged |
   | architect | planner-reviewer (engineering mode) | merged |
   | ceo-advisor | planner-reviewer (strategy mode) | merged |
   | evaluator | planner-reviewer (evaluation mode) | merged |
   | security-auditor | planner-reviewer (security mode) | merged |
   | designer | frontend-designer | renamed |
   | debugger | explorer | renamed (Phase 2 evidence-gathering role) |
   | test-writer | (folded into test-driven-development skill) | absorbed by skill |
   ```
5. **Installing Agents** — keep the existing brief on installation paths (URL, local file, `bin/agent-manager` CLI).
6. **Creating Custom Agents** — keep brief; reference `framework-management` skill.

### Step 3: Extend `lib/check-plugin-sync.js` with Invariant 5

After Invariant 4 (the multi-file VERSION_DOCS check), add:

```js
// --- Invariant 5: docs/AGENTS.md agent-section headings == agents/*.md filenames --
// Heading pattern: `^#{2,3}\s+`?<name>`?\s*$` where <name> matches agents/*.md set.
// Bidirectional intersection avoids false-matching prose words like "Built-in Agents".

const agentsDocPath = path.join(repoRoot, "docs", "AGENTS.md");
const agentsDir = path.join(repoRoot, "agents");
const agentsOnDisk = fs.readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();

if (!fs.existsSync(agentsDocPath)) {
    console.warn(`[plugin-sync] note: docs/AGENTS.md not found; skipping agent-name heading check`);
} else {
    const agentsDocText = readText("docs/AGENTS.md");
    const headingRe = /^#{2,3}\s+`?([a-z][a-z0-9-]+)`?\s*$/gm;
    const declaredHeadings = new Set();
    let m;
    while ((m = headingRe.exec(agentsDocText)) !== null) {
        if (agentsOnDisk.includes(m[1])) declaredHeadings.add(m[1]);
    }
    const declared = [...declaredHeadings].sort();
    const missingFromDoc = agentsOnDisk.filter((a) => !declared.includes(a));
    const extraInDoc = declared.filter((a) => !agentsOnDisk.includes(a));
    // extraInDoc is unreachable due to filter above, but kept for completeness
    if (missingFromDoc.length > 0) {
        fail(
            `agents-doc sync: ${missingFromDoc.length} agent(s) in agents/ but missing from docs/AGENTS.md as a section heading: ${missingFromDoc.join(", ")}`
        );
    }
}
```

Note: heading-only check; prose mentions don't trigger. The bidirectional intersection (`agentsOnDisk.includes`) means: the heading must contain a name that is **also** an agent file. Prose mentions of "agent" (lowercase word) don't match because "agent" isn't an agents/*.md file.

### Step 4: Extend VERSION_DOCS to include AGENTS.md

In `lib/check-plugin-sync.js` Invariant 4, add a 4th entry to the `VERSION_DOCS` array:

```js
{
    file: "docs/AGENTS.md",
    regex: /\*\*Last updated:\*\* v(\d+\.\d+\.\d+)/,
    label: "docs/AGENTS.md `**Last updated:** vX.Y.Z`",
},
```

### Step 5: Run linter — verify pass post-rewrite

`npm run check:plugin-sync` → exit 0 with "5 invariants validated" (or rather, the existing 4 + new agent-name check = effectively 5 logical invariants).

Note: the spec calls it "5 invariants validated" but the success message in the existing code says "4 invariants validated". Update the success message to "5 invariants validated."

### Step 6: Negative demo — missing-from-doc

- Backup `docs/AGENTS.md`
- Use `sed` to remove `### \`explorer\`` heading line
- `npm run check:plugin-sync` → expect exit 1 with `agents-doc sync: 1 agent(s) ... missing from docs/AGENTS.md`
- Restore

### Step 7: Negative demo — fake heading

- Backup `docs/AGENTS.md`
- Add a fake `### \`fake-agent\`` heading
- `npm run check:plugin-sync` → expect: linter does NOT fail because `fake-agent` isn't in agents/*.md (bidirectional filter — heading is dropped from declared set since it doesn't match a file). This is the **intended false-positive avoidance** behavior.
- The other 5 agents should still all be present, so this case actually still passes — confirms our bidirectional filter is correct.
- Restore

### Step 8: Negative demo — VERSION_DOCS for AGENTS.md

- Backup `docs/AGENTS.md`
- Change `**Last updated:** v0.6.8` → `**Last updated:** v9.9.9`
- `npm run check:plugin-sync` → expect exit 1 with `doc version: docs/AGENTS.md ... = 9.9.9, expected 0.6.8`
- Restore

### Step 9: Version bump (0.6.7 → 0.6.8)

Bump in:
- `package.json`
- `.claude-plugin/marketplace.json` (×2)
- `.claude-plugin/plugin.json`
- `claude-skill.json`
- `README.md` `Current stable version`
- `docs/COMPARISON.md` (header + footer)
- `docs/DESIGN.md` (Version + Status)
- `docs/AGENTS.md` `**Last updated:**` (already done in Step 2; just verify here)

### Step 10: CHANGELOG entry

`[0.6.8] — 2026-05-15` above 0.6.7. Document under Fixed (docs/AGENTS.md rewrite) + Added (Invariant 5 + AGENTS.md in VERSION_DOCS).

### Step 11: Final regression gate

All 8 CI gates locally green:
- `verify:skill-docs` umbrella (now includes the 5-invariant check-plugin-sync)
- `check:workflow-contract`
- `validate-skills`

All global invariants preserved.

### Step 12: Commit + write evaluation + release artifacts

Single commit on top of 257ecec (v0.6.7). Evaluation + release artifacts. ASK before push.

## Testing Strategy

- Step 5: positive run on rewritten doc
- Step 6: missing-agent negative demo
- Step 7: false-match avoidance demo (fake heading silently filtered)
- Step 8: VERSION_DOCS-for-AGENTS demo
- Step 11: full umbrella + standalone gate green

## Rollback

`git revert <commit>` or `git reset --hard 257ecec`.

## Success Criteria

- [ ] `docs/AGENTS.md` accurately describes 5 current agents + Migration table
- [ ] 5 invariants validated by check-plugin-sync (4 existing + 1 new)
- [ ] All 4 demos verify expected behavior (1 positive + 3 negative)
- [ ] VERSION_DOCS extended to include AGENTS.md
- [ ] All 8 CI gates green
- [ ] Version 0.6.8 across 5 manifests + README + 3 docs (COMPARISON, DESIGN, AGENTS) + CHANGELOG

## Milestones (3)

1. **M1** — `docs/AGENTS.md` rewritten + 5 agents accurately described (Steps 1-2)
2. **M2** — Invariant 5 + VERSION_DOCS extension + all 4 demos pass (Steps 3-8)
3. **M3** — Version bump + final gate + commit (Steps 9-12)

P0 risks: **none**. Highest = false-positive avoidance fragile if agent names overlap prose words; mitigated by bidirectional intersection (filename ∩ heading match).

## Next Stage

On DONE → REVIEW.
