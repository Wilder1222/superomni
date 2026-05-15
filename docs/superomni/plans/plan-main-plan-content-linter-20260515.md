# Implementation Plan: Plan-Content Auto-Linter (v0.6.7)

**Spec:** `docs/superomni/specs/spec-main-plan-content-linter-20260515.md`
**Branch:** `feat/plan-content-linter` (off feat/ci-completeness at eb363d0 = v0.6.6 local)
**Session:** `plan-content-linter`  **Date:** 20260515

## Overview

Single-phase patch that ships the CI hard-gate for v0.6.3's Pre-Destructive Gate. Mirrors v0.6.4 (token-literal advisory's fence-awareness) + v0.6.5 (lib/check-*.js shape) + v0.6.6 (CI wiring on both jobs).

## Prerequisites

- [x] Spec approved (user "继续" reply, no marker file)
- [x] On `feat/plan-content-linter` branched off feat/ci-completeness HEAD (eb363d0 = v0.6.6 local)
- [x] CI green from v0.6.6 state

## Scope

**Build:**
- `lib/check-plan-content.js` (~150-200 LOC)
- `package.json` += `check:plan-content` script + extend `verify:skill-docs` umbrella
- `.github/workflows/validate.yml` += 1 step in each of ubuntu + windows jobs
- `skills/writing-plans/SKILL.md.tmpl` += 1 line CI-enforcement note in Pre-Destructive Gate section
- Version bump 0.6.6 → 0.6.7 across 5 manifest files + README + 2 docs files
- CHANGELOG entry

**Out of scope:** v0.7.0+ backlog items.

## Steps

### Step 1: Baseline

`git status` clean (only sprint artifacts untracked); `npm run verify:skill-docs && check:workflow-contract && validate-skills` all green.

### Step 2: Author `lib/check-plan-content.js` skeleton

Mirror `lib/check-plugin-sync.js` shape. Top of file:
- shebang + strict mode
- DESTRUCTIVE_PATTERNS array (12 entries per spec)
- CUTOFF_DATE = 20260513 (skip historical plans)
- Helpers: `readText`, `stripInlineBackticks` (verbatim from check-skill-docs.js v0.6.4 token-literal advisory)

### Step 3: Plan parsing

Function `parsePlan(text)` returning array of step objects:
- Split on `^### Step \d+(\.\d+)?:` headers
- For each step: extract step number (e.g., "14", "14.5"), title, full body
- Within body, extract `**How:**` sub-section (between `**How:**` and the next `**Verification:**` / `**Effort:**` / EOF)

### Step 4: Markdown-aware destructive detection

Function `findDestructiveInHow(howText)` → array of `{pattern, lineOffset}`:
- Split into lines
- Track code-fence state (` ``` ` toggle)
- For each non-fenced line: strip inline backticks → check for any pattern from DESTRUCTIVE_PATTERNS
- Skip if line is fence-bounded or pattern only appears in stripped backtick

### Step 5: Preceding-step lookup + careful detection

For each destructive step:
- `precedingStep` = the step with the closest lower number. For `14.5` → `14` (numerical ordering: 14 < 14.5). For `14` → `13`.
- Search the preceding step's full body (title + What + How combined) for `careful` keyword (case-insensitive, whole-word boundary preferred but flexible).
- If absent: push to failures with `file:step-number, pattern, preceding-step-number, "missing 'careful' invocation in preceding step"`.

### Step 6: Output formatting

Mirror `check-plugin-sync.js`:
- On all-green: `Plan-content check passed: scanned N plans, M destructive steps, all preceded by careful step.`
- On failures: stderr each `- ` line; exit 1.

### Step 7: Wire `check:plan-content` npm script

Edit `package.json`:
- Add `"check:plan-content": "node lib/check-plan-content.js"` after `"check:plugin-sync"`
- Extend `verify:skill-docs`: append ` && npm run check:plan-content`

### Step 8: Wire CI workflow

Edit `.github/workflows/validate.yml`:
- ubuntu `validate` job: add `Check plan content` step after `Check plugin sync`
- windows `validate-windows` job: add same step after `Check plugin sync`

### Step 9: Run on current main — verify all 7 plans pass

`npm run check:plan-content` → expected exit 0.

If any unexpected failure on existing plans (false positive on prose mention or wrong preceding-step lookup): refine logic in Step 4/5; re-run.

### Step 10: Negative demo (caught case)

- Backup `docs/superomni/plans/plan-main-framework-optimization-v2-20260513.md`
- Edit Step 14.5 title from "careful pre-destructive assessment" → "agent remap" (and remove `careful` from its body if present)
- `npm run check:plan-content` → expect exit 1 with diagnostic naming Step 14, the `git rm` pattern, and the failed lookback to Step 14.5
- Restore plan file
- Re-run → expect exit 0

### Step 11: False-positive avoidance demo

- Verify plan `plan-main-dynamic-context-and-careful-gate-20260515.md` (which mentions `git rm` in prose at line 183) does NOT fire — the mentions are inside backticks or in the prose-discussion section, not in any step's `**How:**`.

### Step 12: writing-plans note

Add to `skills/writing-plans/SKILL.md.tmpl` Pre-Destructive Gate section:

```
> This gate is **CI-enforced** since v0.6.7 via `npm run check:plan-content`. Plans that violate it fail CI before reaching execution.
```

### Step 13: Version bump

0.6.6 → 0.6.7 in:
- `package.json`
- `.claude-plugin/marketplace.json` (×2)
- `.claude-plugin/plugin.json`
- `claude-skill.json`
- `README.md` `Current stable version`
- `docs/COMPARISON.md` (header + footer)
- `docs/DESIGN.md` (Version + Status)

### Step 14: CHANGELOG entry

`[0.6.7] — 2026-05-15` above 0.6.6. Document under Added (linter) + Changed (writing-plans note).

### Step 15: Final regression gate

All 7 CI commands locally green:
- `verify:skill-docs` (now 6 sub-checks)
- `check:workflow-contract`
- `validate-skills`
- standalone `check:plan-content` exit 0
- standalone `check:plugin-sync` exit 0

All global invariants preserved (28/5/5/0/15/9/0).

### Step 16: Commit + write evaluation + release artifacts

Single commit on top of eb363d0 (v0.6.6). Evaluation + release artifacts. ASK before push.

## Testing Strategy

- Step 9: positive run on real fixtures (7 existing plans)
- Step 10: inject + restore on a real fixture (canonical destructive case)
- Step 11: confirm prose mention doesn't fire
- Step 15: full umbrella + standalone gate green

## Rollback

`git revert <commit>` or `git reset --hard eb363d0`.

## Success Criteria

- [ ] `lib/check-plan-content.js` exists and exits 0 on all 7 current plans
- [ ] Negative demo exit 1 with specific diagnostic; positive demo restored
- [ ] False-positive avoidance verified (prose mentions ignored)
- [ ] CI workflow has the new step in both jobs
- [ ] writing-plans note added
- [ ] Version 0.6.7 across 5 manifests + README + 2 docs + CHANGELOG
- [ ] All global invariants preserved

## Milestones (3)

1. **M1** — Linter implemented + passes on all 7 current plans (Steps 1-9)
2. **M2** — Demos + writing-plans note + CI wired (Steps 10-12)
3. **M3** — Version bump + final gate + commit (Steps 13-16)

P0 risks: **none**. Highest = "preceding step" lookback semantics for `Step N.5` decimals; mitigated by treating step numbers as floats (14.5 < 15) and the canonical case (Step 14 + Step 14.5) being the dispatch ordering test.

## Next Stage

On DONE → REVIEW.
