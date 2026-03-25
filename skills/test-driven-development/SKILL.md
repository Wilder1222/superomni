---
name: test-driven-development
description: |
  Use when writing any new code, fixing bugs, or refactoring.
  Enforces Red-Green-Refactor cycle.
  Triggers: any code writing task, "implement", "add feature", "fix bug".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection
```bash
mkdir -p ~/.omni-skills/sessions
_PROACTIVE=$(~/.claude/skills/super-omni/bin/config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_TEL_START=$(date +%s)
echo "Branch: $_BRANCH | PROACTIVE: $_PROACTIVE"
```

### PROACTIVE Mode
If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/super-omni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# Test-Driven Development

**Goal:** Write code that is correct by construction, with tests as the specification.

## Iron Law: Test First

If you can write the code, you can write the test first.
Exceptions are rare: pure UI layout, one-off scripts, throwaway prototypes.
If you're not sure — write the test first anyway.

## The Red-Green-Refactor Cycle

```
RED   → Write a failing test for the behavior you want
GREEN → Write the minimum code to make the test pass
REFACTOR → Clean up without changing behavior
```

Then repeat.

## Phase 1: Red — Write the Failing Test

Before writing any implementation code:

1. **Identify the behavior** — not the implementation, the behavior
   - Good: "When `calculateTotal()` is called with an empty cart, it returns 0"
   - Bad: "Test the `calculateTotal` function"

2. **Write the test** — one behavior per test

3. **Run the test** — verify it FAILS with the right error (not "test not found")

```bash
# Run just the new test to confirm it fails
npm test -- --testNamePattern="specific test name"
# or
pytest -k "test_name" -v
# or
go test -run TestName ./...
```

4. **Read the failure message** — does it fail for the right reason?

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

## Phase 3: Refactor — Clean Without Changing Behavior

Now that tests are green, clean up:
- Remove duplication
- Improve naming
- Extract functions if they improve readability
- Apply DRY where genuine duplication exists

Rule: Run tests after every refactoring step. If tests break, the refactor changed behavior.

## Anti-Patterns to Avoid

See `testing-anti-patterns.md` for the full list. Key ones:

| Anti-pattern | Problem |
|--------------|---------|
| Testing implementation (not behavior) | Tests break on refactor even when behavior is correct |
| Mocking the thing you're testing | Test proves nothing |
| Tests that always pass | Worse than no tests — gives false confidence |
| No assertions | Syntactically a test, semantically useless |
| Order-dependent tests | Hides bugs, hard to debug |
| Testing private methods directly | Brittle, couples to internals |

## What to Test

**Test these:**
- Public API and behavior contracts
- Edge cases (empty input, max values, null/nil)
- Error conditions and error messages
- State transitions
- Integration points (with real or contract-verified doubles)

**Don't test these:**
- Framework code (assume it works)
- Private implementation details
- Third-party libraries
- One-line delegations

## Test Organization

```
# Unit test: one function/class in isolation
def test_calculate_total_with_empty_cart():
    cart = Cart()
    assert cart.calculate_total() == 0

# Integration test: multiple real components
def test_checkout_flow_persists_order():
    cart = Cart()
    cart.add_item(Item(id=1, price=9.99))
    order = checkout(cart, user=test_user)
    assert Order.find(order.id).total == 9.99
```

## When Tests Already Exist

Before adding tests, check what exists:

```bash
# Find existing test files
find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*.py" | head -20

# Check test coverage (if configured)
npm run test:coverage 2>/dev/null || coverage run -m pytest 2>/dev/null || true
```

Extend existing tests rather than creating parallel test files.
