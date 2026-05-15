# Implementation Plan: Token-Literal Advisory (v0.6.4)

**Spec:** `docs/superomni/specs/spec-main-token-literal-advisory-20260515.md`
**Branch:** `feat/skill-layering-anthropic` (HEAD = fda1cb1, v0.6.3)
**Session:** `token-literal-advisory`  **Date:** 20260515
**Approval marker:** `docs/superomni/specs/.approved-spec-main-token-literal-advisory-20260515`

## Overview

Single-purpose patch. One file change in `lib/check-skill-docs.js`, version bump, CHANGELOG. Compact plan; no phase gates needed.

## Prerequisites

- [x] Spec approved
- [x] On v0.6.3 (clean tree)

## Scope

**Build:**
- `lib/check-skill-docs.js`: add 4th advisory loop (token-literal detection w/ code-fence tracking + first-occurrence allowance)
- Version bump 0.6.3 → 0.6.4 across 4 config files
- CHANGELOG `[0.6.4]` entry

**Out of scope:** all v0.7.0+ backlog items; auto-fix; hard-error mode.

## Steps

### Step 1: Baseline

`git status` clean; `npm run verify:skill-docs && check:workflow-contract && validate-skills` all green.

### Step 2: Implement advisory

Edit `lib/check-skill-docs.js`. Append a 4th advisory loop:

```js
// Token-literal advisory: a SKILL.md.tmpl that uses {{PREAMBLE*}} in prose
// (outside code fences, after the first canonical occurrence) will trigger silent
// expansion by the generators' deprecated-alias / preamble-core path. Caught
// reactively in v0.6.3's framework-management bug; this advisory makes it proactive.
const TOKEN_PATTERNS = ["{{PREAMBLE}}", "{{PREAMBLE_CORE}}", "{{PREAMBLE_REF_LINK}}"];
for (const tmpl of templateFiles) {
    const lines = fs.readFileSync(tmpl, "utf8").replace(/\r\n/g, "\n").split("\n");
    let inFence = false;
    const seenFirst = new Set(); // track which tokens have had their canonical occurrence
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("```")) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;
        for (const tok of TOKEN_PATTERNS) {
            if (line.includes(tok)) {
                if (!seenFirst.has(tok)) {
                    seenFirst.add(tok);
                    continue; // first non-fenced occurrence is canonical (allowed)
                }
                advisories.push(
                    `${rel(tmpl)}:${i + 1}: literal '${tok}' in prose (outside code fence) ` +
                    `will be expanded by the generator. Use prose phrasing or wrap in a code fence.`
                );
            }
        }
    }
}
```

### Step 3: Verify clean state

`npm run check:skill-docs` — no token-literal advisories on current 27 `.tmpl` files.

### Step 4: Positive demo

Edit `skills/brainstorm/SKILL.md.tmpl`: append a line with literal `{{PREAMBLE_CORE}}` after canonical position, in prose (not in code fence). Run checker; observe advisory fires with file:line + token. Restore.

### Step 5: Negative demo

Edit `skills/brainstorm/SKILL.md.tmpl`: append a fenced code block containing `{{PREAMBLE_CORE}}`. Run checker; advisory should NOT fire (inside fence). Restore.

### Step 6: Final regression gate

All 5 CI commands exit 0; invariants unchanged (skill/agent counts, EnterPlanMode rule, design-md-library, ${CLAUDE_SKILL_DIR} preserved, no flat reference.md, total skill body lines unchanged).

### Step 7: Version bump

0.6.3 → 0.6.4 in `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json`. CHANGELOG `[0.6.4] — 2026-05-15` entry.

### Step 8: Commit + write evaluation + release artifacts

Single commit on top of fda1cb1. Evaluation + release artifacts. ASK before push (continuing v0.6.1+ practice).

## Testing Strategy

- Per-step `grep`/`wc -l`/CI checks.
- Step 4/5 = positive + negative demonstration.
- Step 6 = full regression invariants.

## Rollback

`git revert <commit>` or `git reset --hard fda1cb1`.

## Success Criteria

- [ ] 4th advisory present in check-skill-docs.js with code-fence tracking.
- [ ] Clean state: 0 token-literal advisories on current 27 tmpls.
- [ ] Positive demo verified.
- [ ] Negative demo verified (code fence respected).
- [ ] All 5 CI commands exit 0.
- [ ] All global invariants preserved.
- [ ] Version bump landed.

## Milestones (3, single-purpose)

1. **M1** — Advisory implemented + clean state verified (Steps 1-3)
2. **M2** — Positive + negative demos pass (Steps 4-6)
3. **M3** — Version bump + commit (Steps 7-8)

P0 risks: **none**. Highest = false-positive on code-fence tracking edge cases (e.g., 4-tick fences, nested) — mitigated by Step 5 negative demo.

## Next Stage

On DONE → REVIEW.
