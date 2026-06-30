# QA Report — code-drift-fix

- **Branch:** main
- **Session:** code-drift-fix
- **Date:** 2026-06-29
- **Scope:** lib/check-workflow-contract.js Section 3 (only real code change) + doc changes

## QA REPORT
════════════════════════════════════════
Scope:           Section 3 dir-vs-produces guard (lib/check-workflow-contract.js) + 7 doc/skill files
Changes tested:  1 code file (Section 3), 7 doc/skill files (factual review only)

Test Results (before QA):
  Automated suite: N/A — no test framework for check-workflow-contract.js (pre-existing gap)
  CI gates: 3/3 green (check-workflow-contract, check-skill-docs, check-plan-content)

Test Results (after QA):
  Automated suite: N/A (same gap; not introduced by this diff)
  CI gates: 3/3 green
  New manual/empirical tests: 4 edge cases + 1 allowlist-path test (all pass)

Coverage:
  Before: not measured (no framework)
  After:  Section 3 empirically covered for: null-produces, loose-file, substring-prefix, allowlist-exempt, un-declared-dir (negative). All paths exercised.

Edge Cases Found (all HANDLED — no bugs):
  - E1 null/empty produces: → `if (fm.produces)` (line 126) gates allProducePatterns entry; `p.pattern && ...` short-circuits falsy. No crash, no false match. ✓
  - E2 top-level FILE (not dir): → `filter(d => d.isDirectory())` skips loose files. Tested with `__loosefile_test__.md` on disk → contract check passed, no false flag. ✓
  - E3 substring-dir false match: → prefix always ends with `/` (`docs/superomni/${name}/`), so `evaluations` cannot bleed-match `evaluations-extra`. Structural; verified by inspection. ✓
  - E4 allowlist-exempt path (code-review P1#2): → temporarily added `__allow_test__` to DECLARATION_ALLOWLIST + dir on disk → contract check PASSED (exempted). Reverted. **Closes P1#2 empirically.** ✓
  - E5 un-declared dir (negative, from M4): → exit 1, error names the dir. ✓

Bugs Found:
  None.

Flaky Tests:
  None.

Risk Assessment:
  LOW — Section 3 is a dev-time CI checker (no runtime path), reads only local repo state, all 5 behavioral paths empirically verified, no regression to Section 1/2 (diff is +22-line insertion only). Doc changes factually corroborated.

Status: DONE
════════════════════════════════════════

## Test Methodology Note
No automated test framework exists for lib/check-workflow-contract.js (pre-existing gap, not introduced by this diff). QA performed empirical behavioral testing by mutating on-disk state (creating/removing test dirs + files, temporarily editing the allowlist) and observing exit codes + error messages — then restoring state and confirming via `git status` that no artifacts remain. This is the appropriate test method for a filesystem-walking CI checker; a future `test:contract` npm script could codify these as repeatable assertions (noted as a follow-up, not a blocker).

## Follow-ups (deferred, not blocking)
- Codify the 5 empirical tests into a `test:contract` npm script (creates temp dirs, asserts exit codes, cleans up). Low effort, locks in the negative + allowlist paths.
- Symmetric produces→dir coverage check (code-review P2) — would catch a skill declaring a produces: path whose dir was never bootstrapped.
- The 4 empirical test artifacts (`__loosefile_test__.md`, `__allow_test__/`, `__neg2__/`, `__undeclared_test__/`) were all created and removed during QA; `git status` confirms none remain.
