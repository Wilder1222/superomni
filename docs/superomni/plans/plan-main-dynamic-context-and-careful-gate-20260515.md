# Implementation Plan: Dynamic Context Extension + Pre-Destructive Gate (v0.6.3)

**Spec:** `docs/superomni/specs/spec-main-dynamic-context-and-careful-gate-20260515.md`
**Branch:** `feat/skill-layering-anthropic` (continuing from v0.6.2 commit 6361a59)
**Session:** `dynamic-context-and-careful-gate`  **Date:** 20260515
**Approval marker:** `docs/superomni/specs/.approved-spec-main-dynamic-context-and-careful-gate-20260515`

## Overview

Three small phases on top of v0.6.2's HEAD. Phase 1 extends `!`<command>`` injection to `verification` + `release`. Phase 2 ships `bin/audit-repo-invariants`. Phase 3 adds the pre-destructive gate to `writing-plans`. All 3 phases are LOW risk; touch surfaces don't overlap, so a single CI cycle covers them.

## Prerequisites

- [x] Spec v0.6.3 approved
- [x] On branch `feat/skill-layering-anthropic` at HEAD = 6361a59 (v0.6.2)
- [x] Working tree clean (only the new spec/plan untracked)
- [x] CI green from v0.6.2 state

## Scope Completeness Checklist

**What must be built:**
- [ ] `verification/SKILL.md.tmpl` `## Current State (auto-injected)` block with ≥ 4 `!`<command>`` lines
- [ ] `release/SKILL.md.tmpl` `## Current State (auto-injected)` block in Phase 1 with ≥ 5 commands
- [ ] `bin/audit-repo-invariants` (new bash script) + executable bit
- [ ] `package.json` adds `audit:invariants` script
- [ ] `framework-management/SKILL.md.tmpl` Supporting Files: 1-line audit-tool pointer
- [ ] `writing-plans/SKILL.md.tmpl` Pre-Destructive Gate sub-section (≥ 15 lines, with v0.6.0 worked example)
- [ ] `careful/SKILL.md.tmpl` 1-line note linking back to writing-plans
- [ ] Version bump 0.6.2 → 0.6.3 across 4 config files + CHANGELOG entry

**What is explicitly out of scope (per spec):**
- `!`<cmd>`` extension to other skills; `context: fork`; `$ARGUMENTS` substitution; per-skill `model:`; `paths` auto-trigger; plan-content auto-linter for the destructive gate

## Steps

### Step 1: Baseline + branch state

**What:** Confirm clean tree, snapshot starting line counts.
**Files:** none (read-only).
**How:**
  1. `git status` → only new spec/plan/.approved untracked.
  2. `git branch --show-current` = `feat/skill-layering-anthropic`.
  3. `wc -l skills/{verification,release,writing-plans,careful,framework-management}/SKILL.md` — record starting counts.
  4. `npm run verify:skill-docs && npm run check:workflow-contract && bash lib/validate-skills.sh` — confirm CI green.
**Verification:** All checks green; baseline lines logged.
**Effort:** S

### Step 2: `verification` Phase 1 dynamic context

**What:** Add `## Current State (auto-injected)` block to `verification/SKILL.md.tmpl` after the Iron Law section.
**Files:** `skills/verification/SKILL.md.tmpl`
**How:**
  1. Read current `## Iron Law: Evidence Required` section position.
  2. Insert after it (and before `## The Verification Checklist`):
     ```
     ## Current State (auto-injected)

     The `!`<command>`` syntax is Anthropic's dynamic context injection — runtime resolves each command before the skill body reaches the LLM.

     - Branch / status: !`git branch --show-current && git status -s`
     - Diff stat (since main): !`git diff --stat main...HEAD 2>/dev/null | tail -10`
     - Latest plan + open items: !`ls -t docs/superomni/plans/plan-*.md 2>/dev/null | head -1`
     - Plan unchecked count: !`grep -c '^- \[ \]' $(ls -t docs/superomni/plans/plan-*.md 2>/dev/null | head -1) 2>/dev/null || echo "0"`
     - Latest evaluation: !`ls -t docs/superomni/evaluations/evaluation-*.md 2>/dev/null | head -1`
     ```
  3. `npm run gen-skills && npm run verify:skill-docs`.
**Verification:**
  1. `grep -c '!\`' skills/verification/SKILL.md` ≥ 5 (5 commands).
  2. `wc -l skills/verification/SKILL.md` ≤ 300.
  3. `npm run test:generators` exit 0 (multi-occurrence regression test still green).
**Effort:** S

### Step 3: `release` Phase 1 dynamic context

**What:** Add `## Current State (auto-injected)` block to `release/SKILL.md.tmpl` Phase 1 (Pre-Release Assessment).
**Files:** `skills/release/SKILL.md.tmpl`
**How:**
  1. Locate `## Phase 1: Pre-Release Assessment` section.
  2. Insert immediately after the section header (before any prose):
     ```
     ### Current State (auto-injected)

     The `!`<command>`` syntax is Anthropic's dynamic context injection — runtime resolves each command before the skill body reaches the LLM.

     - Current version: !`grep '"version"' package.json | head -1`
     - Recent commits since last tag: !`git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~10)..HEAD 2>/dev/null | head -10`
     - Unpushed commits: !`git log --oneline @{u}..HEAD 2>/dev/null | wc -l`
     - CHANGELOG top entry: !`head -15 CHANGELOG.md 2>/dev/null | tail -10`
     - Latest evaluation: !`ls -t docs/superomni/evaluations/evaluation-*.md 2>/dev/null | head -1`
     - Latest production-readiness (if any): !`ls -t docs/superomni/production-readiness/*.md 2>/dev/null | head -1`
     ```
  3. `npm run gen-skills && npm run verify:skill-docs`.
**Verification:**
  1. `grep -c '!\`' skills/release/SKILL.md` ≥ 6.
  2. `wc -l skills/release/SKILL.md` ≤ 220.
  3. `npm run test:generators` exit 0.
**Effort:** S

### Step 4: Phase 1 gate

**What:** Verify Phase 1 ACs.
**Files:** `docs/superomni/executions/execution-main-dynamic-context-and-careful-gate-20260515.md` (append).
**How:**
  1. Run all Phase 1 ACs from spec.
  2. Run `npm run verify:skill-docs && npm run check:workflow-contract` — exit 0.
  3. Record line counts before/after.
**Verification:** All Phase 1 ACs PASS.
**Effort:** S

### Step 5: Author `bin/audit-repo-invariants`

**What:** Bash script that takes a pattern and lists all matching files grouped by top-level directory, with per-file occurrence count.
**Files:** `bin/audit-repo-invariants` (new, executable)
**How:**
  1. Bash script with shebang `#!/usr/bin/env bash`, `set -euo pipefail`.
  2. Args: `$1` = pattern (required); empty/no-args → usage + exit 1.
  3. Use `grep -rn --include='*' --exclude-dir={node_modules,.git,docs/superomni/specs,docs/superomni/plans,docs/superomni/reviews,docs/superomni/evaluations,docs/superomni/executions,docs/superomni/releases,docs/superomni/improvements,docs/superomni/subagents,docs/superomni/production-readiness,docs/superomni/harness-audits} "$1" .`.
  4. Group output by top-level dir of each file. Print:
     ```
     audit-repo-invariants: pattern '<pat>'
     scanned <N> files; <M> matches in <K> files

     ── lib/ ─────────────────────────────
     lib/gen-skill-docs.js (3)
     lib/check-skill-docs.js (1)
     ── skills/ ──────────────────────────
     skills/framework-management/SKILL.md.tmpl (2)
     ...
     ```
  5. If 0 matches: print `audit-repo-invariants: pattern '<pat>' — no matches`. Exit 0.
  6. Hint header: "USAGE SITE = file uses the pattern operationally; SISTER-TOOL = file reads/parses the pattern. Read each match to classify."
  7. `chmod +x bin/audit-repo-invariants`.
**Verification:**
  1. `bin/audit-repo-invariants '{{PREAMBLE}}'` outputs ≥ 1 group with ≥ 1 file (the legacy alias mention in framework-management's teaching content + lib/ checker references).
  2. `bin/audit-repo-invariants 'no-such-string-xyzzy123'` outputs "no matches", exit 0.
  3. `bin/audit-repo-invariants` (no args) → usage message, exit 1.
**Effort:** M

### Step 6: Wire `audit:invariants` npm script

**What:** Add `npm run audit:invariants -- <pattern>` for discoverability.
**Files:** `package.json`
**How:**
  1. Add `"audit:invariants": "bash bin/audit-repo-invariants"` to scripts.
  2. Verify by running `npm run audit:invariants -- '{{PREAMBLE}}' 2>&1 | head -5`.
**Verification:** Script runs, outputs grouped list.
**Effort:** S

### Step 7: Document audit tool in `framework-management`

**What:** 1-line pointer in Supporting Files section.
**Files:** `skills/framework-management/SKILL.md.tmpl`
**How:** In the existing Supporting Files section (after the "Single project-wide rule" bullets), add:
```
**Migration audit tool:** when migrating a repo-wide invariant (e.g., a token rename), run `bin/audit-repo-invariants <pattern>` first. It lists all files referencing the pattern grouped by directory so you can classify usage sites vs sister-tools before editing.
```
**Verification:** `grep -c "audit-repo-invariants" skills/framework-management/SKILL.md` ≥ 1.
**Effort:** S

### Step 8: Phase 2 gate

**What:** Verify Phase 2 ACs.
**Files:** Execution doc (append).
**How:**
  1. Run all Phase 2 ACs.
  2. `npm run verify:skill-docs` exit 0.
**Verification:** All Phase 2 ACs PASS.
**Effort:** S

### Step 9: Add Pre-Destructive Gate to `writing-plans`

**What:** New sub-section under Phase 3 documenting the gate, with worked example from v0.6.0.
**Files:** `skills/writing-plans/SKILL.md.tmpl`
**How:**
  1. Locate Phase 3 section.
  2. After the existing Phase 3 content (and before Phase 4), insert:
     ```
     ### Pre-Destructive Gate

     **If any plan step contains a destructive operation, the immediately-prior step MUST invoke the `careful` skill with explicit blast-radius enumeration.**

     Destructive patterns that trigger the gate:
     - `git rm`, `git filter-branch`, `git reset --hard` on remote-tracked branches
     - `rm -rf`, mass `mv` (renaming N>3 files), directory delete
     - `gh repo delete`, `gh release delete`, force-push to protected branches
     - Database / migration drops, `DROP TABLE`, `DELETE FROM`
     - `npm publish` to a registry the user did not explicitly authorize

     **Required structure:**

     ```
     ### Step N: careful pre-destructive assessment
     **What:** Enumerate every file/branch/resource the next step will modify or remove, identify rollback path, confirm no in-progress work would be lost.
     **Files:** <list every target>
     **How:** Invoke `careful` skill with the explicit blast-radius list.
     **Verification:** User has approved the destructive scope OR `careful` returns DONE with no concerns.

     ### Step N+1: <the destructive operation>
     ...
     ```

     **Worked example (v0.6.0 Step 14.5):** During v0.6.0's agent consolidation, Step 14 originally specified `git rm agents/{ceo-advisor,...}.md`. A reactive `careful` invocation discovered 78 references to the retired agent names across 13 skill files including the core pipeline routing table. Step 14.5 was inserted to remap all references BEFORE the deletes; otherwise the `git rm` would have left dead links. The pre-destructive gate makes this proactive instead of reactive.
     ```
  3. `npm run gen-skills && npm run verify:skill-docs`.
**Verification:**
  1. `grep -c "Pre-Destructive Gate" skills/writing-plans/SKILL.md` ≥ 1.
  2. `wc -l skills/writing-plans/SKILL.md` ≤ 200 (was 155 + ~30 = 185).
  3. Section length ≥ 15 lines: `awk '/^### Pre-Destructive Gate/,/^## /{print}' skills/writing-plans/SKILL.md | wc -l` ≥ 15.
**Effort:** M

### Step 10: Add link-back note in `careful`

**What:** 1-line note that careful is invoked by writing-plans pre-destructive gate.
**Files:** `skills/careful/SKILL.md.tmpl`
**How:** Find a natural place near the top of the body (after the Iron Law section if any). Add:
```
**Auto-invocation:** the `writing-plans` skill's Pre-Destructive Gate requires authors to invoke `careful` immediately before any plan step containing destructive operations. See `writing-plans/SKILL.md` § Pre-Destructive Gate for the pattern.
```
**Verification:** `grep -c "Pre-Destructive Gate" skills/careful/SKILL.md` ≥ 1.
**Effort:** S

### Step 11: Phase 3 gate + final regression

**What:** Verify Phase 3 ACs + global regression.
**Files:** Execution doc (final checklist).
**How:**
  1. All 5 CI commands exit 0: `verify:skill-docs` (gen + check + fixture-parity + test:generators), `check:workflow-contract`, `validate-skills`.
  2. Skill count = 28; agent count = 5.
  3. `${CLAUDE_SKILL_DIR}` literal token count = 15 (preserved).
  4. `EnterPlanMode` mentions in CLAUDE.md ≥ 5.
  5. No flat `reference.md` files at any skill root.
  6. `frontend-design/reference/design-md-library/` count = 9 (unchanged).
  7. Total `wc -l skills/*/SKILL.md` grew by ≤ 50 lines vs v0.6.2 baseline (6,196 → ≤ 6,246).
**Verification:** All gates PASS.
**Effort:** S

### Step 12: Version bump + CHANGELOG

**What:** 0.6.2 → 0.6.3 across 4 config files + CHANGELOG entry.
**Files:** `package.json`, `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`, `claude-skill.json`, `CHANGELOG.md`.
**How:** sed across 4 config files; new `[0.6.3] — 2026-05-15` entry above 0.6.2.
**Verification:** `grep '"version"' package.json .claude-plugin/marketplace.json .claude-plugin/plugin.json claude-skill.json` returns 5 lines of `"0.6.3"`. CHANGELOG has new entry.
**Effort:** S

### Step 13: Commit + write evaluation + release artifacts

**What:** Single commit on top of 6361a59; evaluation + release artifacts; user-gated push/PR.
**Files:**
  - `docs/superomni/evaluations/evaluation-main-dynamic-context-and-careful-gate-20260515.md`
  - `docs/superomni/releases/release-main-dynamic-context-and-careful-gate-20260515.md`
  - `docs/superomni/executions/execution-main-dynamic-context-and-careful-gate-20260515.md` (final state)
**How:**
  1. Write evaluation + release artifacts.
  2. `git add -A && git commit` with HEREDOC + Co-Authored-By line.
  3. ASK USER before push/PR (same protocol as v0.6.1, v0.6.2).
**Verification:** Commit lands; CI green; user decides next action.
**Effort:** S

## Testing Strategy

- **Unit-level:** `grep`, `wc -l`, `find`, `chmod` checks at each step.
- **Integration:** `npm run verify:skill-docs && check:workflow-contract && validate-skills` at gates 4, 8, 11.
- **Regression for `!`<cmd>`` preservation:** `npm run test:generators` (from v0.6.2) at every gate — guards the multi-occurrence semantics across all 3 generators.
- **Audit tool functional:** Step 5 verification covers positive (matches found), negative (no matches), and error (no args) cases.
- **End-to-end:** Step 9 verification — section length grep + line-count grep ensures the gate is real prose, not a stub.

## Rollback Plan

- Each phase = 1 commit on top of 6361a59. To undo:
  - **Phase 1**: `git revert <phase1>` — verification + release frontmatter / body restore.
  - **Phase 2**: `git revert <phase2>` — bin/audit-repo-invariants removed; npm script reverted; framework-management pointer reverted.
  - **Phase 3**: `git revert <phase3>` — writing-plans + careful templates reverted.
- Hard escape: `git reset --hard 6361a59`.

## Dependencies

- No new npm or system deps. Bash + grep available everywhere.

## Design Direction (if UI work)

N/A.

## Success Criteria

- [ ] **Phase 1 AC** (per spec): verification + release each have `!`<command>`` blocks; line counts within ceilings.
- [ ] **Phase 2 AC**: `bin/audit-repo-invariants` exists, executable, handles 3 cases (matches / no matches / no args); npm script wired; framework-management pointer added.
- [ ] **Phase 3 AC**: Pre-Destructive Gate ≥ 15 lines under Phase 3 of writing-plans with v0.6.0 worked example; careful skill has 1-line link-back.
- [ ] **Global regression**: 28/5 counts, EnterPlanMode rule preserved, design-md-library intact, ${CLAUDE_SKILL_DIR} preserved at 15, all CI green.
- [ ] **Version bump landed**: 5 files at 0.6.3 + CHANGELOG entry.

## Milestones (≤ 7)

1. **M1** — Baseline (Step 1)
2. **M2** — Phase 1 dynamic context done (Steps 2-3)
3. **M3** — Phase 1 gate green (Step 4)
4. **M4** — Phase 2 audit tool done (Steps 5-7)
5. **M5** — Phase 2 gate green (Step 8)
6. **M6** — Phase 3 gate teaching done + final regression green (Steps 9-12)
7. **M7** — Commit + artifacts (Step 13)

P0 risks: **none**. Highest impact = generators silently mangling new `!`<cmd>`` blocks (mitigated by Step 2/3 verification grep + Step 4 test:generators).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Generators silently transform new `!`<cmd>`` patterns | L | M | Step 2/3 verification grep + Step 4 `test:generators` |
| `release` Phase 1 dynamic-context block breaks the existing Phase 1 prose flow | L | L | Block placed at top of Phase 1 as info-dump; existing prose unchanged |
| `bin/audit-repo-invariants` over-matches noisy patterns | M | L | Exclude-dir list excludes docs/superomni runtime artifacts; user reads + classifies output |
| `writing-plans` body grows past 200 | L | L | Pre-emptive `wc -l` budget in Step 9 verification |
| pre-destructive worked example confuses reader (v0.6.0 reference) | L | L | Link to spec? — v0.6.0 plan references in repo are accessible; the example is self-contained prose anyway |
| Pattern `careful` skill expects to receive blast-radius arguments — but spec doesn't mandate the format | L | L | Plan only documents that careful must be invoked; format details deferred to careful skill body |

## Next Stage

On DONE → auto-advance to **REVIEW** via `plan-review`.
