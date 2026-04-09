# Workflow Automation Remediation Plan

- Branch: `main`
- Session: `workflow-automation-remediation`
- Date: `2026-04-09`
- Objective: Close all identified workflow-automation gaps and establish a stable, repeatable, cross-platform pipeline for policy-consistent skill generation.

## Scope Baseline (All Issues Must Progress)

1. Policy drift across generated `skills/**/SKILL.md` files.
2. Repeated/duplicated content blocks inside generated skill docs.
3. Windows generation instability (`bash` + CRLF/WSL mismatch).
4. Incomplete automation contract propagation outside core `vibe/workflow` entry.
5. Lack of CI guardrails for drift, duplication, and outdated policy strings.

## Execution Strategy

- Strategy: `P0 stabilize source and generator -> P1 regenerate and normalize -> P2 enforce in CI and governance`.
- Rule: No stage closes without artifact evidence and acceptance checks.
- Delivery mode: Wave-based execution, but each wave has explicit stop conditions.

## Stage Plan

### Stage A - P0 Source-of-Truth Stabilization

Goal: Ensure future generation cannot reintroduce old policy.

Tasks:
- [x] A1. Freeze canonical policy text in `lib/preamble.md` (spec-only gate, brainstorm ungated, wave auto-advance semantics).
- [x] A2. Align all high-impact templates with canonical wording:
  - `skills/vibe/SKILL.md.tmpl`
  - `skills/workflow/SKILL.md.tmpl`
  - any template currently embedding old gate language.
- [x] A3. Define explicit source hierarchy in docs: `SKILL.md.tmpl + lib/preamble.md` is authoritative, generated `SKILL.md` is derived.
- [x] A4. Add a short maintainer note in `README.md` or contributor docs: do not hand-edit generated skill files.

Acceptance criteria:
- Canonical policy phrase appears exactly as expected in source templates/preamble.
- No contradictory gate wording remains in template sources.
- Source hierarchy documented in repository docs.

Artifact output:
- `docs/superomni/executions/execution-main-workflow-automation-remediation-20260409.md` (append Stage A result section).

### Stage B - P0 Cross-Platform Generator Reliability

Goal: Make generation deterministic on Windows/Linux/macOS.

Tasks:
- [x] B1. Add PowerShell generator script (official fallback) to expand `{{PREAMBLE}}` safely.
- [x] B2. Update existing bash generator or add line-ending normalization to avoid CRLF parse failures.
- [x] B3. Add one-command wrapper (npm script) for regeneration.
- [x] B4. Add generator smoke test command and expected output contract (`generated <path>` lines).

Acceptance criteria:
- Regeneration succeeds in Windows PowerShell and bash environments.
- Generated outputs are byte-stable between two consecutive runs (no unexpected diff).
- Failure mode prints actionable error messages.

Artifact output:
- `docs/superomni/executions/execution-main-workflow-automation-remediation-20260409.md` (append Stage B logs).

### Stage C - P1 Repository-Wide Regeneration and Dedup Cleanup

Goal: Eliminate duplicated blocks and stale policy across all generated skills.

Tasks:
- [x] C1. Regenerate all `skills/**/SKILL.md` from templates in one batch.
- [x] C2. Scan generated docs for duplicated frontmatter and repeated title sections.
- [x] C3. If duplicates remain, fix template origin first, then regenerate (never manual mass edits in generated outputs unless emergency patch).
- [x] C4. Run targeted policy-string scans for old wording patterns.

Acceptance criteria:
- Zero files with repeated frontmatter markers.
- Zero occurrences of deprecated gate wording in generated files.
- `git diff` shows consistent, explainable normalization changes.

Artifact output:
- `docs/superomni/executions/execution-main-workflow-automation-remediation-20260409.md` (append Stage C inventory + scan results).

### Stage D - P1 Workflow Contract Propagation

Goal: Ensure non-vibe entry points still respect unified automation semantics.

Tasks:
- [x] D1. Audit command docs for stage contract consistency:
  - `commands/execute-plan.md`
  - `commands/review.md`
  - `commands/write-plan.md`
  - `commands/brainstorm.md`
- [x] D2. Add or align references to artifact gates and wave auto-advance behavior where appropriate.
- [x] D3. Verify no command page reintroduces brainstorm manual gate.

Acceptance criteria:
- Command docs do not conflict with `vibe/workflow` policy.
- Stage artifact expectations are explicit where execution transitions are described.

Artifact output:
- `docs/superomni/reviews/review-main-workflow-automation-remediation-20260409.md` (contract consistency review notes).

### Stage E - P2 CI Guardrails and Governance

Goal: Prevent regressions automatically.

Tasks:
- [x] E1. Add CI check: reject duplicate frontmatter in `skills/**/SKILL.md`.
- [x] E2. Add CI check: reject deprecated policy phrases.
- [x] E3. Add CI check: ensure generated files are up to date (template-to-output drift check).
- [x] E4. Add a maintenance runbook section: “How to regenerate safely on each OS”.

Acceptance criteria:
- CI fails fast on drift/duplication/deprecated wording.
- Contributors can reproduce generation with a single documented command.

Artifact output:
- `docs/superomni/evaluations/evaluation-main-workflow-automation-remediation-20260409.md`.

## Issue-to-Action Mapping (No Gap Left Behind)

| Issue | Action package | Priority | Exit condition |
|---|---|---|---|
| Policy drift | A1-A4 + C4 + E2 | P0 | No conflicting wording in template/generated/commands |
| Duplication in SKILL docs | C1-C3 + E1 | P0/P1 | No repeated frontmatter/redundant header blocks |
| Windows generation failure | B1-B3 + E4 | P0 | Generation command works in PowerShell and bash |
| Contract mismatch across command docs | D1-D3 | P1 | All command docs align with single-gate + wave mode |
| Future regression risk | E1-E4 | P2 | CI and docs enforce policy permanently |

## Execution Order and Gates

1. `A` must complete before `C`.
2. `B` must complete before full-batch regeneration in `C`.
3. `C` and `D` can run in parallel after `A+B`.
4. `E` finalizes and locks in the result.

Stop conditions:
- If generator output is unstable between runs, do not proceed to C.
- If template source still has old wording, do not proceed to C/D.

## Risk Register

- Risk: Hidden stale templates outside current scan scope.
  - Mitigation: full template grep sweep before regeneration.
- Risk: Large normalization diff obscures meaningful changes.
  - Mitigation: execute in phased commits and attach scan reports.
- Risk: OS-specific encoding/newline behavior creates noisy diffs.
  - Mitigation: enforce consistent newline policy and script normalization.

## Verification Checklist

- [x] All stage artifacts created under `docs/superomni/`.
- [x] Old policy phrases fully removed from generated outputs.
- [x] Duplicate sections removed repo-wide.
- [x] PowerShell + bash generation validated.
- [x] CI checks active and passing.

## Definition of Done

Done means all five initial problem categories are advanced to closure with:
1. Code/document change evidence,
2. Scan evidence,
3. CI enforcement,
4. Cross-platform reproducibility.
