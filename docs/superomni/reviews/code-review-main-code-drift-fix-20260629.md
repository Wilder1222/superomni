# Code Review — code-drift-fix

- **Branch:** main
- **Session:** code-drift-fix
- **Date:** 2026-06-29
- **Reviewer:** planner-reviewer (code-review mode)
- **Diff:** 8 modified + 1 deleted (see execution artifact `docs/superomni/executions/execution-main-code-drift-fix-20260629.md`)

## CODE REVIEW
════════════════════════════════════════
PR/Branch: main (code-drift-fix)
Files changed: 8 modified + 1 deleted
Blast radius: LOW (1 dev-time CI script + docs; no runtime code)

P0 ISSUES (must fix before merge):
  None.

P1 ISSUES (should fix):
  1. lib/check-workflow-contract.js:271 — `startsWith(prefix)` fragile to Windows backslash in produces: paths.
     **FIXED this session:** added `p.pattern.replace(/\\/g, "/")` normalizer before startsWith. Re-verified: contract check exit 0, negative test exit 1, file LF-only.
  2. lib/check-workflow-contract.js:265 — DECLARATION_ALLOWLIST reject-path tested (negative test fires), but allowlist-exempt path has no test. Empty-array case trivially correct; defer a `test:contract` smoke test to a follow-up.

P2 SUGGESTIONS (optional):
  - Section 3 only checks dir→produces (one direction). Symmetric produces→dir check is a follow-up.
  - Convention item 3 ("forbidden-token = drifted expression") is advisory, not linter-enforced. Consider marking "advisory" in the doc.

SECURITY: CLEAN
  No external input, no eval, no path traversal (paths from readdirSync, not user input), no new deps.

TESTS: ADEQUATE (manual)
  No automated suite for check-workflow-contract.js (pre-existing gap). Manual: clean tree exit 0, un-declared dir exit 1, all 9 declared subdirs pass.

DECISION QUESTIONS:
  - Symmetric produces→dir coverage check (follow-up, out of scope).
  - Mechanize forbidden-token-as-drifted-expression in check-skill-docs.js? (advisory for now.)

VERDICT: APPROVED_WITH_NOTES
  Section 3 correctness verified (startsWith handles style-profiles edge; allowlist empty-case correct; error aggregation + exit code preserved; no shadowing; no frontmatter re-load; no Section 1/2 regression). P1#1 hardened. Doc changes factually accurate. Safe to merge.
══════════════════════════

## Correctness Audit (Section 3)
- `startsWith(prefix)` matches dir portion of all produces: patterns incl. non-templated `style-profiles/<scope>.md` ✓
- `DECLARATION_ALLOWLIST = []` → `!includes(name)` always true → never exempts (correct empty case) ✓
- Section 3 pushes to existing `errors[]` (declared line 169); insertion after improvements loop preserves accumulation order; `totalErrors` (line ~295) + `process.exit(1)` (line ~303) fire ✓ (negative test returned exit 1)
- No variable shadowing (`subdirs`/`name`/`prefix`/`covered`/`DECLARATION_ALLOWLIST` all new const, loop-scoped `name`) ✓
- Reuses `allProducePatterns` (built once Section 1), no frontmatter re-load ✓
- `docsRoot` existence checked at main() entry → `fs.readdirSync` cannot throw ENOENT ✓
- `git diff` shows only +22-line Section 3 insertion, no modification to existing lines (no Section 1/2 regression) ✓

## Post-Review Hardening Applied
- **P1#1 FIXED:** added backslash→forward-slash normalization (`p.pattern.replace(/\\/g, "/")`) before `startsWith`, so a Windows-authored `produces:` path with backslashes still matches the POSIX prefix. Re-verified all 3 CI gates green + negative test fires + file LF-only.

Status: DONE
