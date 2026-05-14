# Implementation Plan: Anthropic Field Alignment + Retro Cleanup (v0.6.2)

**Spec:** `docs/superomni/specs/spec-main-anthropic-field-alignment-20260514.md`
**Branch:** `feat/skill-layering-anthropic` (continuing from v0.6.1's branch since v0.6.1 was not merged to main)
**Session:** `anthropic-field-alignment`  **Date:** 20260514
**Approval marker:** `docs/superomni/specs/.approved-spec-main-anthropic-field-alignment-20260514`

## Overview

Two-phase, single-commit-per-phase patch sprint. Phase 1 ships frontmatter additions to 5 skills + dynamic context injection in `vibe`. Phase 2 ships 3 tooling cleanups. Each phase gates on green CI before the next.

## Prerequisites

- [x] Spec v0.6.2 approved
- [x] On branch `feat/skill-layering-anthropic` (v0.6.1 commit 5810cff is HEAD, working tree clean)
- [ ] Baseline frontmatter snapshot captured (Step 1)

## Scope Completeness Checklist

**What must be built:**
- [ ] `disable-model-invocation: true` in 3 skills' tmpls (release, finishing-branch, framework-management)
- [ ] `user-invocable: false` in `skills/using-skills/SKILL.md` (no .tmpl — direct edit)
- [ ] `argument-hint` field in 3+ skills (vibe, brainstorm, release; verify others in Step 4)
- [ ] `!`<command>`` dynamic context injection in `vibe/SKILL.md.tmpl` Phase 1 (replaces text-block bash)
- [ ] `lib/test-generators.js` (or .sh) — first-occurrence + multi-occurrence test for js/sh/ps1
- [ ] `lib/check-skill-docs.js` — 3rd advisory for CRLF in committed SKILL.md
- [ ] `lib/validate-skills.sh` — examples check upgraded to recognize `reference/` subdir
- [ ] Version bump 0.6.1 → 0.6.2 across all 4 config files + CHANGELOG entry

**What is explicitly out of scope (per spec § Non-Goals):**
- `context: fork` migration; `$ARGUMENTS` substitution; per-skill `model:` / `effort:`; dynamic context in non-vibe skills; trimming 280-295-line skills

## Steps

### Step 1: Baseline + branch state

**What:** Confirm on right branch with clean tree; snapshot current frontmatter for diff later.
**Files:** None (read-only).
**How:**
  1. `git status` — confirm clean.
  2. `git branch --show-current` — confirm `feat/skill-layering-anthropic`.
  3. `for f in skills/release/SKILL.md skills/finishing-branch/SKILL.md skills/framework-management/SKILL.md skills/using-skills/SKILL.md; do echo "=== $f ==="; head -20 "$f"; done` — record baseline frontmatter.
  4. `npm run verify:skill-docs` — confirm green (all checks should pass from v0.6.1 state).
**Verification:** Branch correct, tree clean, CI green, baseline frontmatters logged in execution doc.
**Effort:** S

### Step 2: Add `disable-model-invocation: true` to 3 side-effect skills

**What:** Lock 3 skills against LLM auto-invocation; user-typed `/release` etc. still works (Anthropic spec).
**Files:**
  - `skills/release/SKILL.md.tmpl`
  - `skills/finishing-branch/SKILL.md.tmpl`
  - `skills/framework-management/SKILL.md.tmpl`
**How:** In each tmpl, insert `disable-model-invocation: true` between `allowed-tools:` and `when_to_use:` lines (canonical position per Anthropic field order).
**Verification:**
  1. `grep -c "^disable-model-invocation: true" skills/release/SKILL.md.tmpl skills/finishing-branch/SKILL.md.tmpl skills/framework-management/SKILL.md.tmpl` returns 3 lines of "1".
  2. After `npm run gen-skills`, same grep on generated files returns 3.
  3. Frontmatter still parses as valid YAML (`node -e "require('js-yaml').load(...)"` on each).
**Effort:** S

### Step 3: Add `user-invocable: false` to `using-skills`

**What:** Hide `using-skills` from `/` menu; LLM still loads it as meta-skill.
**Files:** `skills/using-skills/SKILL.md` (no `.tmpl` — `using-skills` is direct-edit per project convention).
**How:** Insert `user-invocable: false` into the frontmatter block, between `allowed-tools:` and any closing `---`.
**Verification:**
  1. `grep -c "^user-invocable: false" skills/using-skills/SKILL.md` returns 1.
  2. `node -e "require('js-yaml').load(fs.readFileSync('skills/using-skills/SKILL.md','utf8').split('---')[1])"` — no error.
**Effort:** S

### Step 4: Add `argument-hint` to skills with positional args

**What:** Improve `/skill <args>` autocomplete UX.
**Files:**
  - `skills/vibe/SKILL.md.tmpl` — args: `[idea-or-status-or-reset|auto]`
  - `skills/brainstorm/SKILL.md.tmpl` — args: `[idea]`
  - `skills/release/SKILL.md.tmpl` — args: `[version]` (optional)
  - Any other skill discovered to accept positional args (grep `commands/*.md` for arg patterns).
**How:**
  1. `grep -E "\\\$ARGUMENTS|\\[args" commands/*.md skills/*/SKILL.md.tmpl 2>/dev/null` — discover any I missed.
  2. For each skill confirmed, add `argument-hint: "<hint>"` line in frontmatter (between `disable-model-invocation:` if present and `when_to_use:`).
  3. Hint format: bracketed string, e.g., `[idea]`, `[skill-name]`, `[version]`.
**Verification:**
  1. `grep -l "^argument-hint:" skills/*/SKILL.md.tmpl | wc -l` ≥ 3.
  2. Each hint syntactically matches Anthropic's spec (`[name]` or `[name] [name]`).
**Effort:** S

### Step 5: Migrate `vibe` Phase 1 detection to `!`<command>`` injection

**What:** Convert `vibe`'s Phase 1 from "here's bash you should run" to Anthropic native pre-injected output. Skill content lifecycle: the command runs at skill load time; the LLM sees already-resolved output instead of an instruction to run.
**Files:** `skills/vibe/SKILL.md.tmpl`
**How:**
  1. Read current Phase 1 prose: it links to `${CLAUDE_SKILL_DIR}/reference/stage-detection.md`. The full bash is in the reference file (good — keep it there for documentation), but the *primary* signals (current branch, recent artifacts, git status) should pre-inject.
  2. After the existing Phase 1 paragraph, add a `## Current State (auto-injected)` block with `!`<command>`` lines:
     ```
     ## Current State (auto-injected)
     - Branch: !`git branch --show-current`
     - Recent commits: !`git log --oneline -5`
     - Working tree: !`git status -s`
     - Latest spec: !`ls -t docs/superomni/specs/spec-*.md 2>/dev/null | head -1`
     - Latest plan: !`ls -t docs/superomni/plans/plan-*.md 2>/dev/null | head -1`
     - Latest evaluation: !`ls -t docs/superomni/evaluations/evaluation-*.md 2>/dev/null | head -1`
     ```
  3. Confirm the generators don't strip backtick-bang patterns. The 3 generators only handle `{{PREAMBLE_CORE}}`, `{{PREAMBLE_REF_LINK}}`, `{{PREAMBLE}}`, `${CLAUDE_SKILL_DIR}`. The `!`<cmd>`` pattern is plain markdown until Anthropic's runtime parses it — generators must leave it untouched.
  4. `npm run gen-skills` — verify the generated `vibe/SKILL.md` contains the literal `` !` `` characters in the new section.
  5. Verify body line count: `vibe` was 275 (v0.6.1); after additions should still be ≤ 280 (the new section is ~10 lines).
**Verification:**
  1. `grep -c '!\`' skills/vibe/SKILL.md` ≥ 6 (one per command in the auto-inject block).
  2. `wc -l skills/vibe/SKILL.md` ≤ 285 (slight allowance over 280 informational).
  3. Generators preserve the backtick-bang pattern verbatim — confirmed by `grep -c '!\`git branch' skills/vibe/SKILL.md` returns 1.
**Effort:** M

### Step 6: Phase 1 gate

**What:** All Phase 1 ACs from spec.
**Files:** `docs/superomni/executions/execution-main-anthropic-field-alignment-20260514.md` (append).
**How:**
  1. `npm run gen-skills && npm run verify:skill-docs` — exit 0.
  2. `npm run check:workflow-contract` — exit 0 (legacy advisories OK).
  3. Run all spec § Phase 1 ACs; record results.
  4. Skill count: `ls -d skills/*/ | wc -l` = 28. Agent count: `ls agents/*.md | wc -l` = 5.
**Verification:** All 7 Phase 1 ACs PASS.
**Effort:** S

### Step 7: Add `lib/test-generators.js` — first-occurrence regression test

**What:** Catch the v0.6.1 PowerShell `count`-arg silent failure (and any future variants) via a dedicated multi-occurrence test, separate from the cross-generator parity check.
**Files:** `lib/test-generators.js` (new), `lib/templates/multi-occurrence-fixture.md.tmpl` (new), `package.json`.
**How:**
  1. Create `lib/templates/multi-occurrence-fixture.md.tmpl` with `{{PREAMBLE_CORE}}` appearing 2× — once at canonical position, once in a code-fenced documentation block.
  2. Create `lib/test-generators.js`:
     - For each of 3 generators (js / sh / ps1 if available): run on the fixture.
     - Read generated output; assert exactly 1 expansion of `{{PREAMBLE_CORE}}` (the first); assert the second occurrence remains as the literal token in the code-fenced block.
     - Skip ps1 gracefully if `pwsh` not available.
  3. Add `package.json` script: `"test:generators": "node lib/test-generators.js"`.
  4. Wire into `verify:skill-docs` umbrella: `"verify:skill-docs": "npm run gen-skills && npm run check:skill-docs && npm run verify:fixture-parity && npm run test:generators"`.
**Verification:**
  1. `npm run test:generators` exits 0 on current `main`.
  2. Inject a temporary regression (revert ps1's `Expand-Token` to multi-occurrence behavior) → `npm run test:generators` exits 1. Restore.
**Effort:** M

### Step 8: Add CRLF advisory in `lib/check-skill-docs.js`

**What:** Detect any `skills/**/SKILL.md` containing `\r\n` (would mean someone bypassed `.gitattributes` LF-pin or didn't run `gen-skills` after manual edit).
**Files:** `lib/check-skill-docs.js`.
**How:** In the existing advisory section (after Step 14/15 from v0.6.1), add a 3rd advisory loop:
```js
for (const file of skillFiles) {
    const raw = fs.readFileSync(file, "utf8");
    if (raw.includes("\r\n")) {
        advisories.push(`${rel(file)} contains CRLF line endings. Run \`npm run gen-skills\` to normalize, or check .gitattributes LF pin.`);
    }
}
```
**Verification:**
  1. Demo: write a temporary `skills/<existing>/SKILL.md` with CRLF (`unix2dos` or `sed 's/$/\r/'`); run checker; observe advisory; restore.
  2. On clean state, no advisory fires.
**Effort:** S

### Step 9: Upgrade `validate-skills.sh` examples check

**What:** Recognize `reference/` extraction as valid alternative to inline example fences. Today `test-driven-development` warns falsely because we extracted Iron Law examples to `reference/red-green-refactor.md`.
**Files:** `lib/validate-skills.sh`.
**How:**
  1. Locate the existing check that warns "Iron Law present but no example blocks found".
  2. Wrap it: only warn if BOTH conditions are true: (a) no inline `\`\`\`` fence pair found in body AND (b) no `<skill-dir>/reference/` directory exists with at least one `.md` file.
  3. Add a brief comment explaining the post-v0.6.1 extraction-aware behavior.
**Verification:**
  1. `bash lib/validate-skills.sh 2>&1 | grep -c "test-driven-development.*example blocks"` returns 0.
  2. The remaining 1 warning ("workflow stub no structural flow headings") still appears — that's correct, workflow.md is intentionally minimal.
  3. Add a temp test: a hypothetical skill with Iron Law but no examples and no `reference/` → still warns.
**Effort:** S

### Step 10: Phase 2 gate

**What:** All Phase 2 ACs from spec.
**Files:** Execution doc (append).
**How:**
  1. `npm run test:generators` — exit 0.
  2. `npm run verify:skill-docs` — exit 0 (umbrella now also runs test:generators).
  3. CRLF advisory demo trigger and restore.
  4. `bash lib/validate-skills.sh` — TDD warning gone.
**Verification:** All 5 Phase 2 ACs PASS.
**Effort:** S

### Step 11: Version bump + CHANGELOG

**What:** 0.6.1 → 0.6.2.
**Files:** `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json`, `CHANGELOG.md`.
**How:** sed across 4 config files; new CHANGELOG entry above v0.6.1.
**Verification:**
  1. `grep -rn '"version": "0.6.2"' package.json .claude-plugin/ claude-skill.json` returns 5 lines.
  2. `head -15 CHANGELOG.md | grep "## \[0.6.2\]"` returns 1.
**Effort:** S

### Step 12: Final regression gate

**What:** All global regression gates from spec.
**Files:** Execution doc (final checklist).
**How:**
  1. `npm run gen-skills && npm run verify:skill-docs && npm run check:workflow-contract` all exit 0.
  2. Skill count = 28; agent count = 5.
  3. `grep -c "EnterPlanMode" CLAUDE.md` ≥ 5.
  4. `${CLAUDE_SKILL_DIR}` literal token count in 5 v0.6.1-trimmed skills' generated `SKILL.md` ≥ 15.
  5. No flat `reference.md` at any skill root.
  6. `frontend-design/reference/design-md-library/` count = 9 (8 brand subdirs + README).
  7. Per-skill body line counts: no skill grew by > 20 lines.
**Verification:** All gates PASS.
**Effort:** S

### Step 13: Commit + write evaluation + release artifacts

**What:** Single squashed commit; evaluation + release artifacts; user-gated push/PR.
**Files:**
  - `docs/superomni/evaluations/evaluation-main-anthropic-field-alignment-20260514.md` (new)
  - `docs/superomni/releases/release-main-anthropic-field-alignment-20260514.md` (new)
  - `docs/superomni/executions/execution-main-anthropic-field-alignment-20260514.md` (final state)
**How:**
  1. Write evaluation + release artifacts (per code-review / verification / release skill protocols).
  2. `git add -A && git commit -m "feat: Anthropic frontmatter alignment + 3 retro cleanups (v0.6.2)"` with HEREDOC + Co-Authored-By line.
  3. ASK USER before `git push` / `gh pr create` — same protocol as v0.6.1.
**Verification:** Commit lands; CI green; user decides next action.
**Effort:** S

## Testing Strategy

- **Unit-level:** `grep`, `wc -l`, `node js-yaml parse` in Steps 2-5, 11-12.
- **Integration:** `npm run gen-skills && verify:skill-docs && check:workflow-contract && test:generators` at gates 6, 10, 12.
- **Regression test for advisory** (Step 7): inject ps1 multi-occurrence behavior, confirm test fails; restore, confirm passes.
- **Regression test for CRLF advisory** (Step 8): write CRLF fixture file, confirm advisory; remove.
- **End-to-end:** Step 5 — verify `vibe`'s `!`<command>`` literal markers reach generated `SKILL.md` (Anthropic runtime parses, but generators must NOT touch).

## Rollback Plan

- Each phase = 1 commit on top of v0.6.1's HEAD (5810cff). To undo:
  - **Phase 1**: `git revert <phase1 commit>` — frontmatters revert; vibe Phase 1 prose restores.
  - **Phase 2**: `git revert <phase2 commit>` — generators / checker / validator revert.
- Hard escape: `git reset --hard 5810cff`.

## Dependencies

- No new npm deps. `js-yaml` already available from v0.6.0.
- Optional: `pwsh` for ps1 test (gracefully skipped if missing).

## Design Direction (if UI work)

N/A — no UI.

## Success Criteria

- [ ] Phase 1 ACs (per spec): 3 disable-locks + 1 hide + 3+ argument-hints + vibe `!`<command>`` injection + skill/agent counts unchanged.
- [ ] Phase 2 ACs: test:generators exists & exits 0; CRLF advisory demonstrable; TDD false-positive removed.
- [ ] Global regression: all 4 CI commands green; ${CLAUDE_SKILL_DIR} preserved; design-md-library intact; EnterPlanMode rule preserved.
- [ ] Version bump landed across 5 files + CHANGELOG.
- [ ] Single clean commit on top of 5810cff.

## Milestones (≤ 7)

1. **M1** — Baseline + scope locked (Step 1)
2. **M2** — Phase 1 frontmatter complete (Steps 2-5)
3. **M3** — Phase 1 gate green (Step 6)
4. **M4** — Phase 2 tooling complete (Steps 7-9)
5. **M5** — Phase 2 gate green (Step 10)
6. **M6** — Version bump + final regression gate (Steps 11-12)
7. **M7** — Commit + artifacts + user-gated push (Step 13)

P0 risks: **none**. Highest impact risk = generators silently mangling the `!`<command>`` pattern (Step 5); mitigated by Step 5 verification grep.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Generators silently transform `!`<cmd>`` | L | M | Step 5 verification grep on generated output |
| `disable-model-invocation` breaks an existing automated workflow | L | M | The 3 locked skills are user-gated by design (release/finishing-branch/framework-management); no documented automation invokes them |
| `user-invocable: false` on `using-skills` removes useful menu entry | L | L | `using-skills` was always meta-only; users have no documented workflow typing `/using-skills` |
| Step 9's wrapper false-negatives a real missing-examples skill | L | L | Test fixture in Step 9 verification asserts negative case still fires |
| Step 7 ps1 test fails on missing pwsh | M | L | Graceful skip already coded in `verify:fixture-parity`; mirror in `test:generators` |
| Phase 1 forgets a skill that takes args | M | L | Step 4 sub-step 1 grep discovers any missed |

## Next Stage

On DONE → auto-advance to **REVIEW** via `plan-review`, producing `plan-review-main-anthropic-field-alignment-20260514.md`.
