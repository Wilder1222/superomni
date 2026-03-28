# TDD Enforcement Guide

This document specifies how TDD is enforced globally across the superomni skill framework.

## Global Enforcement Policy

TDD is **mandatory** whenever source code is written or modified. It is not optional.

The enforcement chain:

```
executing-plans (any code step)
  → test-driven-development skill (Red → Green → Refactor)
      → testing-anti-patterns.md (don't do these)
      → tdd-enforcement.md (this file — know the rules)
  → verification skill (hard gate: new code needs tests before DONE)
  → qa skill (test gap detection and filling)
```

## Where TDD Applies

| Situation | TDD Required? | Notes |
|-----------|:------------:|-------|
| New function/class/module | ✅ YES | Hard requirement |
| Bug fix | ✅ YES | Write regression test first |
| Refactoring | ✅ YES | Tests must pass at every step |
| New skill (`.tmpl`) | ✅ YES | Use `validate-skills.sh` as test |
| Pure UI layout (no logic) | ⚠️ PARTIAL | Test behavior, not pixels |
| One-off migration script (run-once) | ⚠️ PARTIAL | At minimum, dry-run test |
| Throw-away prototype (will be deleted) | ❌ EXEMPT | Must be deleted, not shipped |

## The Three Iron Laws

**Law 1 — Test First:** Write the test before the implementation.
- Violation: writing implementation before thinking about the test
- Consequence: the test becomes an afterthought that tests what was built, not what was needed

**Law 2 — Delete Untested Code:** Code written before its test must be deleted and rewritten TDD-style.
- This rule exists because "I'll add tests later" becomes "there are no tests"
- Checking compliance: `git diff --staged` before committing — does any new code lack a test?

**Law 3 — Red Before Green:** A test that was never failing proves nothing.
- Before implementing, run the test and confirm it fails for the right reason
- A green test without implementation means either the test is wrong, or the feature already existed

## Enforcement in the Skill Pipeline

### In `executing-plans`

Every step that touches source code must include:
1. "Involves code changes: YES/NO" in the step header
2. If YES: TDD protocol applied (Red → Green → Refactor) before step completion
3. Step not marked complete until tests pass

### In `verification`

Section 2 (Test Verification) is a **hard gate**:
- New code without tests → BLOCKED (cannot report DONE)
- Tests must verify behavior (not just implementation)
- The only accepted exception requires written justification

### In `qa`

Phase 3 (Write Missing Tests) targets any code that slipped through without tests:
- Any function with no test file → gap to fill
- Any behavior not covered by existing tests → add tests in Phase 3

### In `code-review`

Test coverage is a first-class review criterion:
- No tests for new code → P0 comment (blocking)
- Tests for wrong thing (implementation vs behavior) → P1 comment
- Tests present but not meaningful → P1 comment

## What "Evidence" Looks Like for TDD

At the end of any code-writing task, acceptable TDD evidence is:

```
TDD EVIDENCE
─────────────────
Test written:   skills/test-driven-development/SKILL.md.tmpl (or test file)
Test ran RED:   [output showing failure before implementation]
Test ran GREEN: [output showing pass after implementation]
Command used:   bash lib/validate-skills.sh skills/test-driven-development/SKILL.md.tmpl
─────────────────
```

## Why This Matters

superpowers enforces TDD with the rule: *"If you cannot delete the code and rewrite it test-first, you don't understand it yet."*

superomni adopts this principle with a practical adaptation:

1. **The test is the spec** — if you can't write the test, the requirement is ambiguous
2. **Delete untested code** — because "tests later" never happens
3. **Evidence beats claims** — "it works" is not evidence; a passing test is

This matches the overall superomni philosophy: **Plan Lean, Execute Complete** — complete execution requires verifiable correctness, and tests are the verification.
