---
name: test-driven-development
description: |
  Globally enforced Red-Green-Refactor for WRITING NEW CODE. Triggers on: "implement", "add feature", "fix bug", any code-writing step. NOT for task decomposition — use subagent-development for that.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use whenever new code is being written. Mandatory — this skill is a gate on all code-writing activities.
produces: ~
consumes: ~
---


<!-- Inlined into every SKILL.md via {{PREAMBLE_CORE}}. Keep ≤30 lines. -->

## Preamble (Core)

**Status protocol** — end every session with one of: `DONE` (evidence provided) · `DONE_WITH_CONCERNS` (list each) · `BLOCKED` (state what blocks you) · `NEEDS_CONTEXT` (state what you need).

**Auto-advance** — pipeline: `THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE`. Only human gate is spec approval at THINK. On `DONE` at other stages, print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and invoke the next skill. On any non-DONE status at any stage, STOP.

**Output directory** — all artifacts go in `docs/superomni/<kind>/<kind>-[branch]-[session]-[date].md`. See `CLAUDE.md` for the full directory map.

**TACIT-DENSE** — before high-tacit decisions, classify D1 (domain expertise) · D2 (user-facing UX) · D3 (team culture) · D4 (novel pattern). On hit, output `TACIT-DENSE [D#]: [question] — My default: [recommendation]`. See reference for actions.

**Anti-sycophancy** — take a position on every significant question. Name flaws directly. No filler ("that's interesting", "you might consider", "that could work").

**Telemetry (local only)** — at session end, log `bin/analytics-log`. Nothing leaves the machine.

_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._

# Test-Driven Development

**Goal:** Write code that is correct by construction, with tests as the specification.

## Iron Laws (Non-Negotiable)

### Iron Law 1: Test First

If you can write the code, you can write the test first. Exceptions are rare: pure UI layout, one-off scripts, throwaway prototypes. If you're not sure — write the test first anyway.

### Iron Law 2: Delete Untested Code

Code written before its test MUST be deleted. Delete → write failing test → rewrite implementation to pass. No exceptions; this rule prevents gradual test-last erosion.

### Iron Law 3: Red Before Green

A test that was never red proves nothing. Before implementing, run the test and confirm it FAILS for the right reason. A test that passes without implementation is either testing the wrong thing or the behavior is already implemented.

**Reference:** see [reference/red-green-refactor.md](${CLAUDE_SKILL_DIR}/reference/red-green-refactor.md) for the canonical Good/Bad worked examples for all 3 Iron Laws.

## The Red-Green-Refactor Cycle

```
RED   → Write a failing test for the behavior you want
         ↓ confirm it fails for the RIGHT reason
GREEN → Write the MINIMUM code to make the test pass
         ↓ confirm it now passes
REFACTOR → Clean up without changing behavior
         ↓ confirm tests still pass after every change
```

Repeat for each behavior unit.

## Phase 0: Pre-Flight Check

Before starting, verify the test environment is working:

```bash
# Confirm tests can run at all
npm test 2>&1 | head -10 ||
pytest --collect-only 2>&1 | head -10 ||
go test ./... -list '.*' 2>&1 | head -10 ||
bash lib/validate-skills.sh 2>&1 | head -5 ||
echo "No test runner found — document test approach before proceeding"

# Find existing tests for the area you're about to change
find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*.py" -o \
       -name "*_test.go" 2>/dev/null | head -20
```

## Phase 1: Red — Write the Failing Test

Before writing any implementation code:

1. **Identify the behavior** — not the implementation, the behavior
   - Good: "When `calculateTotal()` is called with an empty cart, it returns 0"
   - Bad: "Test the `calculateTotal` function"

2. **Write the test** — one behavior per test, AAA pattern (Arrange / Act / Assert)

3. **Run the test** — verify it FAILS with the right error (not "test not found")

```bash
# Run just the new test to confirm it fails
npm test -- --testNamePattern="specific test name"
# or
pytest -k "test_name" -v
# or
go test -run TestName ./...
# or (for skill/markdown tests)
bash lib/validate-skills.sh skills/<name>/SKILL.md.tmpl
```

4. **Read the failure message** — does it fail for the right reason?
   - If test passes without implementation: **STOP** — the test is wrong, rewrite it
   - If test errors (not fails): **STOP** — the test has a syntax/setup bug, fix that first

## Phase 2: Green — Write Minimum Code

Write the MINIMUM code to make the test pass. Nothing more.

Rules:
- No speculative abstractions
- No "I'll need this later" code
- No "while I'm here" refactoring
- If it makes the test pass, it's enough for now

```bash
# Run the test to confirm it passes
npm test -- --testNamePattern="specific test name"
```

**If you cannot make the test pass in 3 attempts**, stop and escalate — report BLOCKED with the 3 hypothesis trace from `systematic-debugging`.

## Phase 3: Refactor — Clean Without Changing Behavior

Now that tests are green, clean up:
- Remove duplication
- Improve naming
- Extract functions if they improve readability
- Apply DRY where genuine duplication exists

**Rule:** Run the full test suite after every refactoring step. If tests break, the refactor changed behavior — revert and try again.

```bash
# Run full suite after each refactoring step
npm test 2>&1 | tail -5
```

## Phase 4: Test Inventory

After completing the feature/fix, document what was tested:

```bash
# Count new tests added
git diff HEAD --name-only | grep -E "\.(test|spec)\." | head -20 || \
git diff HEAD --name-only | grep -E "(test_|_test\.)" | head -20

# Verify all new tests pass
npm test 2>&1 | tail -10
```

Produce a brief inventory:

```
TDD INVENTORY
────────────────────────────────
Feature/fix:  [what was built]
Tests written: [N new tests]
  - test_[name]: [what behavior it covers]
  - test_[name]: [what behavior it covers]
Tests passing: N/N
Iron Law 2 (Delete Untested Code): OBSERVED | N/A [if no untested code was written]
────────────────────────────────
```

## Anti-Patterns, What to Test, Test Organization

**Reference:** see [reference/anti-patterns.md](${CLAUDE_SKILL_DIR}/reference/anti-patterns.md) for the canonical anti-patterns table, what-to-test/what-not-to-test heuristics, and unit-vs-integration test examples.

## When Tests Already Exist

Before adding tests, check what exists:

```bash
# Find existing test files
find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*.py" | head -20

# Check test coverage (if configured)
npm run test:coverage 2>/dev/null || coverage run -m pytest 2>/dev/null || true
```

Extend existing tests rather than creating parallel test files.

## TDD Report

```
TDD REPORT
════════════════════════════════════════
Feature/fix:    [description]
Tests written:  [N]
Tests passing:  [N/N]

Iron Laws:
  Law 1 (Test First):         FOLLOWED | VIOLATED (explain)
  Law 2 (Delete Untested):    FOLLOWED | N/A
  Law 3 (Red Before Green):   FOLLOWED | VIOLATED (explain)

Test inventory:
  [test name] — [behavior covered]

Regressions:    [none | list]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```