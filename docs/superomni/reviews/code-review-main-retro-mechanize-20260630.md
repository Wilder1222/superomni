# Code Review — retro-mechanize

- **Branch:** main
- **Session:** retro-mechanize
- **Date:** 2026-06-30
- **Reviewer:** planner-reviewer (code-review mode)
- **Diff:** 3 modified + 1 new (see execution artifact `docs/superomni/executions/execution-main-retro-mechanize-20260630.md`)

## CODE REVIEW
════════════════════════════════════════
PR/Branch: main (retro-mechanize)
Files changed: 4 (lib/test-contract.js NEW, lib/check-workflow-contract.js, lib/check-plan-content.js, package.json)
Blast radius: LOW (dev-time CI checks + test; no runtime code)

P0 ISSUES (must fix before merge):
  None.

P1 ISSUES (should fix):
  1. test-contract.js — Test C SIGKILL dirty-state window (writeFileSync patched allowlist → finally-restore).
     **FIXED this session:** added top-of-testAllowlistExempt guard asserting `original.includes("const DECLARATION_ALLOWLIST = [];")` BEFORE any mutation — detects prior-crash residue loudly instead of silent Test B false-pass. Matches R1 philosophy. Re-verified: 4/4 PASS, LF, all entrypoints exit 0.
  2. check-workflow-contract.js Section 4 — case-sensitive `subdirs.includes(dir)` on case-insensitive FS (latent; no current produces has mismatched casing). Defer.

P2 SUGGESTIONS (optional):
  - runContract discards stderr on success by design (matches test-generators.js); document if extended.
  - Section 4 "checked N" over-reports (counts null produces). Optional separate counter.
  - Test B's two asserts share label prefix. Cosmetic.

SECURITY: CLEAN
  No command injection (hardcoded CONTRACT_SCRIPT), no path traversal (fixed TEST_DIR literal), no new deps, no network. Section 4 regex linear (no ReDoS).

TESTS: ADEQUATE
  Section 3 fully locked down (Test A/B/C + R1 guard + P1.1 crash-residue guard + try/finally self-cleanup). Section 4 + 0-steps advisory implicitly verified by live repo state (advisory-only, non-blocking — acceptable scope boundary). Follow-up: optional Test D for Section 4 advisory injection.

DECISION QUESTIONS:
  - P1.1 SIGKILL guard: ADD (done — cheap, matches R1).
  - P1.2 case-fold: DEFER (no current mismatch).
  - Test D for Section 4: DEFER (advisory paths don't need Section-3-grade lockdown).

VERDICT: APPROVED_WITH_NOTES
  All P0 correctness claims verified (R1 guard, try/finally, Test A ordering, Test B stderr capture, Section 4 advisory-only, 0-steps exempt-check placement). P1.1 hardened. Safe to merge.
════════════════════════════════════════

## Correctness Audit (verified against live source + execution)
- R1 marker-drift guard (test-contract.js:76): `!original.includes(marker) || patched===original` → throw BEFORE writeFileSync; finally-restore is safe no-op on throw path ✓
- try/finally restore (test-contract.js:85-88): assert() never throws; finally unconditionally restores CONTRACT_FILE + rmSync TEST_DIR ✓
- Test A ordering (test-contract.js:93): runs first on pristine repo ✓
- Test B stderr capture: exit-1 path → err.stderr has dir name (console.error at contract:321-323) ✓; runContract leaves stderr="" on success ✓
- Section 4 advisory-only (contract:287-300): pushes warnings[] not errors[]; totalErrors (contract:319) = errors+frontmatterErrors only → exit code unaffected ✓
- 0-steps warn placement (plan-content:172-176): after parsePlan, before for-loop; exempt check (165-168) precedes it → pre-cutoff plans don't warn ✓; console.warn stderr, no exit-code change ✓

## Post-Review Hardening Applied
- **P1.1 FIXED:** added crash-residue guard at top of testAllowlistExempt — asserts source has empty DECLARATION_ALLOWLIST before mutating, converting a silent SIGKILL leak into a loud failure with recovery instruction. Re-verified 4/4 PASS + LF + all entrypoints exit 0.

Status: DONE
