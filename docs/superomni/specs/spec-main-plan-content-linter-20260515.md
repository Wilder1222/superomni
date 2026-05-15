# superomni Plan-Content Auto-Linter (v0.6.7)

**Branch:** `feat/plan-content-linter` (off feat/ci-completeness at eb363d0 = v0.6.6 local)
**Session:** `plan-content-linter`  **Date:** 20260515

## Why this spec

v0.6.3 added the **Pre-Destructive Gate** to `writing-plans/SKILL.md.tmpl` — template guidance saying any plan step containing `git rm`, `rm -rf`, mass `mv`, etc., MUST be preceded by a step invoking the `careful` skill. v0.6.3 spec explicitly said *"Plan-content auto-linter (CI hard-gate for v0.6.3 Pre-Destructive Gate)"* is a separate substantial feature, deferred.

**Now is the right time** because:
1. v0.6.5 + v0.6.6 demonstrated the lib/check-*.js + CI-wired pattern is robust
2. v0.6.4 token-literal advisory already showed how to do markdown-aware code-fence + inline-backtick detection — directly reusable here
3. The 7 existing plan files give us clean fixture data: v0.6.0 plan has the canonical "real destructive step preceded by careful" case (Step 14 preceded by Step 14.5)
4. The next sprint with destructive ops will benefit from this gate; doing it now is preemptive

This is the architectural-level item the user asked for, sliced to patch size: **one new lib/check-*.js file, one CI step, no skill body changes**.

## Problem

| # | Problem | Severity |
|---|---|---|
| 1 | v0.6.3 Pre-Destructive Gate is template guidance only — no automated enforcement. A plan author who skips the careful step in their plan won't be caught until human reviews the plan, or until they actually execute the destructive op | **P1** (architecturally) |
| 2 | Even with conscientious authors, v0.6.0's Step 14 was caught reactively (Step 14.5 amendment) — that's exactly the case the gate aims to prevent. With CI enforcement, future Step-14-shape plans break CI before reaching execution | **P1** |

## Goals

- **G1.** New `lib/check-plan-content.js` (~150-200 LOC). Scans every `docs/superomni/plans/plan-*.md`. For each step containing a destructive pattern in its `**How:**` sub-section (markdown-aware: outside code fences AND outside inline-backtick spans), the **immediately preceding step** must contain the keyword `careful` (case-insensitive, in any visible position — title, body, or `**What:**`).
- **G2.** Detection is markdown-aware (reuses v0.6.4 token-literal-advisory's fence + inline-backtick stripping pattern). Reduces false positives.
- **G3.** Wire as `npm run check:plan-content` standalone + into `verify:skill-docs` umbrella + into `.github/workflows/validate.yml` (both ubuntu + windows jobs, mirroring v0.6.6).
- **G4.** Demo with existing plan fixtures:
  - **Positive (clean) demo**: v0.6.0 plan (Step 14 preceded by Step 14.5 named "careful pre-destructive assessment") → linter passes
  - **Negative (caught) demo**: temporarily edit v0.6.0 plan to remove "careful" from Step 14.5 → linter fails with specific diagnostic; restore
  - **Demo of false-positive avoidance**: plans that mention `git rm` only in prose/backtick (e.g., v0.6.3 plan documenting the destructive pattern list) → linter passes
- **G5.** Document the linter in `writing-plans/SKILL.md.tmpl` Pre-Destructive Gate section: "This is now CI-enforced via `npm run check:plan-content`."

## Non-Goals (YAGNI)

- **NOT** retroactively rewriting historical plans to satisfy the linter. v0.6.0 plan already passes (Step 14.5 was inserted reactively but is now in place); other plans don't have real destructive steps.
- **NOT** auto-suggesting careful step insertion. Linter is detect-only; author writes the careful step.
- **NOT** scoring plan quality, complexity, or other heuristics. Single invariant: destructive step → preceding careful step.
- **NOT** linting historical pre-20260513 plans (apply the contract checker's existing cutoff convention).
- **NOT** touching skill / agent / command counts.
- **NOT** changing existing CI gates' behavior.

## Proposed Solution

**Selected approach: J — "Single new linter, mirrors v0.6.4-v0.6.6 pattern."**

One phase. Touch surface = `lib/check-plan-content.js` (new) + `package.json` + `.github/workflows/validate.yml` + `writing-plans/SKILL.md.tmpl` 1-line note + version bump.

### Phase 1 — Linter implementation (LOW risk)

1. Author `lib/check-plan-content.js`:
   - Read every `docs/superomni/plans/plan-*.md` (skip pre-20260513 dates per contract-checker convention).
   - Parse plan into steps: split on `^### Step \d+(\.\d+)?:` headers.
   - For each step, locate its `**How:**` sub-section (everything between `**How:**` and the next `**Verification:**` / `**Effort:**` / next step header).
   - Inside each `**How:**` block, strip code fences and inline-backtick spans (verbatim copy from v0.6.4 token-literal advisory's logic).
   - Pattern set: `git rm`, `git filter-branch`, `git reset --hard`, `git push --force` / `--force-with-lease`, `rm -rf`, `gh repo delete`, `gh release delete`, `DROP TABLE`, `DROP DATABASE`, `DELETE FROM`, `TRUNCATE`, `npm publish`, `npm unpublish`. Configurable `DESTRUCTIVE_PATTERNS` array at top of file.
   - If a destructive pattern matches in the stripped How block: check the immediately preceding step's body (heading + What + How combined) contains `careful` (case-insensitive). If not → push to failures.
2. Output format: same shape as `check-plugin-sync.js` — exit 0 with summary on green; exit 1 with file:step + which pattern + which preceding step on red.
3. Standalone npm script `check:plan-content`; wire into `verify:skill-docs` umbrella as the 6th sub-check.
4. CI workflow: add 1 new step in both ubuntu + windows jobs.
5. `writing-plans/SKILL.md.tmpl` Pre-Destructive Gate section: append 1 line "This gate is CI-enforced via `npm run check:plan-content`."

### Phase 2 — Demos + ship

1. Run linter on current main (v0.6.0 plan + 6 v0.6.x plans). Expected: all pass (v0.6.0 has Step 14.5 named "careful"; others have no real destructive steps).
2. Inject negative demo: temporarily rewrite v0.6.0 Step 14.5 title from "careful pre-destructive assessment" → "agent remap"; re-run; observe failure with line + pattern + preceding step. Restore.
3. Inject false-positive avoidance demo: confirm v0.6.3 plan mentioning `git rm` in prose (line 183 destructive-pattern list) does NOT fire.
4. Version bump 0.6.6 → 0.6.7 across 5 manifest files + README + 2 docs files (COMPARISON + DESIGN).
5. CHANGELOG entry.

## Key Design Decisions

| Decision | Choice | Rationale | Principle |
|----------|--------|-----------|-----------|
| Detection scope | Plan steps' `**How:**` subsection only | Other sections (`**What:**`, `**Verification:**`) describe intent, not action; only `**How:**` enumerates concrete commands | Explicit |
| Markdown awareness | Strip code fences + inline backticks before pattern match | Reuse v0.6.4 logic; avoid false positives on prose mentions | DRY, Pragmatic |
| "Preceding step" definition | The step with `Step N-1` numerically; for `Step 14.5`, the preceding step is `Step 14` (alphabetic-order lookback) | Plan authors use `.5` to mean "inserted before"; the canonical case is "destructive Step N preceded by careful Step N-1 or Step N.5". Both should pass. | Pragmatic, Explicit |
| `careful` keyword detection | Case-insensitive match in title or body | Plan authors use varied phrasing ("careful pre-destructive", "Careful skill assessment") | Pragmatic |
| Pattern list | Hard-coded array at top of file; ~12 patterns | YAGNI on config-file split; can add as discovered | YAGNI |
| Pre-cutoff plans | Skip plans with date < 20260513 | Same convention as workflow-contract checker; respects historical reality | Pragmatic |
| Hard error vs advisory | Hard error (exit 1) | This is a correctness invariant, not a taste suggestion; matches v0.6.5 check-plugin-sync severity | Correctness |
| No retroactive plan rewrites | Existing plans pass as-is (verified during Phase 2) | Historical plans are immutable audit trail; linter targets future plans | Explicit |

## Acceptance Criteria

### Phase 1

- [ ] `lib/check-plan-content.js` exists; ~150-200 LOC; mirrors check-plugin-sync.js shape
- [ ] `npm run check:plan-content` exits 0 on current main (all 7 plans pass)
- [ ] Code-fence + inline-backtick stripping reuses logic shape from `lib/check-skill-docs.js` (DRY)
- [ ] DESTRUCTIVE_PATTERNS array at top of file (configurable)
- [ ] Pre-20260513 cutoff respected
- [ ] Standalone npm script `check:plan-content` added
- [ ] `verify:skill-docs` umbrella wires it in (now 6 sub-checks)
- [ ] `.github/workflows/validate.yml` adds the step in both ubuntu + windows jobs

### Phase 2 demos

- [ ] Positive demo: v0.6.0 plan (real destructive Step 14 preceded by careful Step 14.5) passes
- [ ] Negative demo: rewrite Step 14.5 title to remove "careful" → linter fails with specific diagnostic; restore
- [ ] False-positive avoidance: v0.6.3 plan's prose mention of `git rm` in destructive-pattern list (inside backtick or fence) does NOT trigger
- [ ] `writing-plans/SKILL.md.tmpl` Pre-Destructive Gate section has the 1-line CI-enforcement note

### Global regression gates

- [ ] All 7 CI commands locally green (verify:skill-docs umbrella now includes check:plan-content)
- [ ] `${CLAUDE_SKILL_DIR}` literal token preserved (15 occurrences)
- [ ] `EnterPlanMode → brainstorm` rule preserved (5 mentions in CLAUDE.md)
- [ ] `frontend-design/reference/design-md-library/*` unchanged (9 entries)
- [ ] No flat `reference.md` files (0)
- [ ] Skill / agent counts unchanged (28 / 5)
- [ ] No marker files anywhere (0; v0.6.6 invariant preserved)
- [ ] Total skill body lines delta ≤ +5 (writing-plans gains 1 line; that's it)

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` show `0.6.7`
- [ ] `README.md` `Current stable version: 0.6.7`
- [ ] `docs/COMPARISON.md` header + footer → 0.6.7
- [ ] `docs/DESIGN.md` Status: Implemented (v0.6.7)
- [ ] `CHANGELOG.md` has new `[0.6.7] — 2026-05-15` entry

## Open Questions

None. All design choices are resolvable mechanically against existing patterns (v0.6.4 fence-awareness, v0.6.5 lib/check-*.js shape, v0.6.6 CI-wiring).

## Frontend Design Note

N/A — no UI work.

## Deferred to v0.7.0+ Backlog (unchanged)

1. `context: fork` migration (architectural; needs runtime evidence first).
2. `model:` / `effort:` per-skill overrides.
3. `$ARGUMENTS` substitution adoption.
4. `paths` glob auto-trigger (likely never).
5. Live `/vibe` E2E test (sandbox required).
6. CHANGELOG auto-generation from commits.
7. Windows job fixture-parity.
8. `bin/audit-repo-invariants` data-driven exclude list.

## Next Stage

On approval → auto-advance to **PLAN**.

---

**Status: DONE — spec ready for user approval.**

This sprint slices the v0.6.3-deferred "plan-content auto-linter" into a single-purpose patch that ships in one CI cycle. Architectural-level (CI hard-gate for a previously-template-only invariant) but patch-sized.
