# QA Report — retro-mechanize

- **Branch:** main
- **Session:** retro-mechanize
- **Date:** 2026-06-30
- **Scope:** lib/test-contract.js + check-workflow-contract.js Section 4 + check-plan-content.js 0-steps warn + package.json

## QA REPORT
════════════════════════════════════════
Scope:           3 code changes (test-contract.js new, Section 4 advisory, 0-steps warn) + 1 package.json line
Changes tested:  4 files, ~5 functions (testAllowlistExempt/runContract/Section4 loop/0-steps warn/parsePlan)

Test Results (before QA):
  Automated: N/A (no framework; test-contract.js IS the new test — 4/4 PASS)
  CI gates: 4/4 green (test-contract, check-workflow-contract, check-plan-content, check-skill-docs)

Test Results (after QA):
  Automated: test-contract 4/4 PASS (unchanged)
  CI gates: 4/4 green
  New empirical edge-case tests: 5 (all verified, 0 bugs)

Coverage:
  Section 3 (dir→produces + allowlist): fully locked (Test A/B/C + R1 + P1.1)
  Section 4 (produces→dir advisory): implicit + edge-verified
  0-steps warn: implicit + edge-verified (garbage markdown doesn't crash)

Edge Cases Found (all HANDLED — 0 bugs):
  - E1 pre-existing TEST_DIR (prior crash residue): Test A clean-tree assertion FAILS loudly (3 passed, 1 failed, exit 1) — self-detecting, no false-pass ✓
  - E2 contract crash exit 2: `err.status != null ? err.status : 1` → status=2; Test B `status===1` fails correctly (not false-pass) ✓
  - E3a produces with no docs/superomni/ prefix: regex `if (!m) continue` skips safely ✓
  - E3b array produces (YAML `[a,b]`): LATENT pre-existing risk — `.replace`/`.startsWith` would throw on array. Verified no current skill uses array produces (all strings/null). Section 4 inherits this from Section 3 (not introduced by this diff). Follow-up: guard `typeof p.pattern === "string"`.
  - E4 multiple producers into same dir: 0 false warnings for existing dirs (specs/ has 2 producers, 0 warns). Latent: multiple producers into a MISSING dir → N duplicate warnings (advisory, no current case).
  - E5 garbage markdown (null bytes/braces): parsePlan returns [] (no throw), 0-steps warn fires, linter exits clean ✓

Bugs Found:
  None.

Flaky Tests:
  None.

Risk Assessment:
  LOW — all 5 edge cases handled or correctly self-failing; 0 bugs; the 2 latent risks (array produces, dup-warning on missing multi-producer dir) are pre-existing/advisory/non-active. Section 3 lockdown is robust (R1 + P1.1 + try/finally + self-detecting residue).

Status: DONE
════════════════════════════════════════

## Test Methodology
No automated framework; QA performed empirical edge-case testing by mutating on-disk state (pre-existing test dir, garbage plan file) and observing exit codes + output, then cleaning up. `git status` confirms no artifacts remain.

## Follow-ups (deferred, non-blocking)
- **Array-produces guard** (E3b): add `typeof p.pattern === "string"` check before `.replace`/`.startsWith` in Section 3+4. Pre-existing latent risk (a future skill with `produces: [a, b]` would crash both sections). Not introduced by this diff.
- **Test D for Section 4 advisory** (code-review P2): inject a produces declaration with no disk dir, assert warning + exit 0. Advisory paths don't need Section-3-grade lockdown but would close the implicit-coverage gap.
- **Test D for 0-steps warn**: already empirically covered (E5); could codify into test-contract.js as a 5th test.
- **P1.2 case-fold** (code-review): Section 4 `subdirs.includes(dir)` is case-sensitive on case-insensitive FS (latent; no current mismatch).
