---
name: test-driven-development
description: |
  Use when writing any new code, fixing bugs, or refactoring.
  Globally enforced: this skill is MANDATORY whenever code is written.
  Enforces Red-Green-Refactor cycle and the Delete Untested Code rule.
  Triggers: any code writing task, "implement", "add feature", "fix bug",
  any step in executing-plans that touches source code.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection
```bash
mkdir -p ~/.omni-skills/sessions
_PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
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

### Session Continuity
After reporting any terminal status (DONE / DONE_WITH_CONCERNS), **always** close with a
"What's next?" line that names the next logical superomni skill:

```
What's next → [skill-name]: [one-sentence reason]
```

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/spec.md docs/superomni/plan.md docs/superomni/ .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Question Confirmation Protocol

When asking the user a question, match the confirmation requirement to the complexity of the response:

| Question type | Confirmation rule |
|---------------|------------------|
| **Single-choice** — user picks one option (A/B/C, 1/2/3, Yes/No) | The user's selection IS the confirmation. Do NOT ask "Are you sure?" or require a second submission. |
| **Free-text input** — user types a value and presses Enter | The submitted text IS the confirmation. No secondary prompt needed. |
| **Multi-choice** — user selects multiple items from a list | After the user lists their selections, ask once: "Confirm these selections? (Y to proceed)" before acting. |
| **Complex / open-ended discussion** — back-and-forth clarification | Collect all input, then present a summary and ask: "Ready to proceed with the above? (Y/N)" before acting. |

**Rule: never add a redundant confirmation layer on top of a single-choice or text-input answer.**

**Custom Input Option Rule:** Whenever you present a predefined list of choices (A/B/C, numbered options, etc.), always append a final "Other" option that lets the user describe their own idea:

```
  [last letter/number + 1]) Other — describe your own idea: ___________
```

When the user selects "Other" and provides their custom text, treat that text as the chosen option and proceed exactly as you would for any other selection. If the custom text is ambiguous, ask one clarifying question before proceeding.

### Context Window Management
Load context progressively — only what is needed for the current phase:

| Phase | Load these | Defer these |
|-------|-----------|------------|
| Planning | `docs/superomni/spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `docs/superomni/plan.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

### Feedback Signal Protocol
Agent failures are harness signals — not reasons to retry the same approach:

- **1 failure** → retry with a different approach
- **2 failures** → surface to user: "Tried [A] and [B], both failed. Recommend [C]."
- **3 consecutive failures** → STOP. Report BLOCKED. Treat as a harness deficiency signal.
  Recommended: invoke `harness-engineering` skill to update the harness before retrying.
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

### Performance Checkpoint
After completing any skill session, run a 3-question self-check before writing the final status:

1. **Process** — Did I follow all defined phases? If any were skipped, state why.
2. **Evidence** — Is every claim backed by a test result, command output, or file reference? If not, gather the missing evidence now.
3. **Scope** — Did I stay within the task boundary? If I touched files outside the original scope, flag them explicitly.

If any answer is NO, address it before reporting DONE. If it cannot be addressed, report DONE_WITH_CONCERNS and name the gap.

For a full performance evaluation spanning the entire sprint, use the `self-improvement` skill.

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.


# Test-Driven Development

**Goal:** Write code that is correct by construction, with tests as the specification.

## Iron Laws (Non-Negotiable)

### Iron Law 1: Test First

If you can write the code, you can write the test first.
Exceptions are rare: pure UI layout, one-off scripts, throwaway prototypes.
If you're not sure — write the test first anyway.

### Iron Law 2: Delete Untested Code

**Code written before its test MUST be deleted.**

If you wrote implementation code before writing a test for it:
1. Delete the implementation code
2. Write the failing test
3. Rewrite the implementation to pass the test

There are no exceptions. This rule prevents gradual test-last erosion.

### Iron Law 3: Red Before Green

A test that was never red proves nothing. Before implementing, run the test and
confirm it FAILS for the right reason. A test that passes without implementation
is either testing the wrong thing or the behavior is already implemented.

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
| Writing code before the test | Violates Iron Law 2 — delete and rewrite |

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
