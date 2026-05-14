<!-- Reference: TDD Iron Law worked examples (Good vs Bad) for the Red-Green-Refactor cycle. -->

# Test-Driven Development — Iron Law Worked Examples

The three Iron Laws (Test First / Delete Untested Code / Red Before Green) are stated in the skill body. This file collects the canonical Good/Bad worked examples that illustrate them.

## Iron Law 1: Test First

### Good Example (Test First)

```
Need: calculateTotal() for empty cart returns 0
Agent:
  1. Write test: assert Cart().calculate_total() == 0
  2. Run test -> RED (Cart class doesn't exist yet)
  3. Implement Cart with calculate_total()
  4. Run test -> GREEN
```

### Bad Example (AVOID)

```
Need: calculateTotal() for empty cart returns 0
Agent:
  1. Write Cart class with calculate_total() method
  2. Then write test that calls it
  3. Test passes immediately
  [VIOLATED: Code written before test — test was never RED]
```

## Iron Law 2: Delete Untested Code

### Good Example (Delete Untested Code)

```
Accidentally wrote validateEmail() before its test.
Agent:
  1. Recognize violation — code exists without a preceding test
  2. Delete validateEmail() implementation
  3. Write failing test: assert validate_email("bad") == False
  4. Run test -> RED (function doesn't exist)
  5. Rewrite validateEmail() to pass test
  6. Run test -> GREEN
```

### Bad Example (AVOID)

```
Wrote validateEmail() before its test.
Agent:
  1. Write test after the fact
  2. Test passes immediately
  3. Move on
  [VIOLATED: Code was never deleted and rewritten — test was never RED]
```

## Iron Law 3: Red Before Green

### Good Example (Red Before Green)

```
Agent:
  1. Write test for new parseCurrency("$1,234.56") -> 1234.56
  2. Run test -> RED: "parseCurrency is not defined"
  3. Confirm: failing for the RIGHT reason (function missing, not test broken)
  4. Implement parseCurrency
  5. Run test -> GREEN
```

### Bad Example (AVOID)

```
Agent:
  1. Write test for existing utility function
  2. Run test -> GREEN immediately
  3. Assume test is correct and move on
  [VIOLATED: Test was never red — it may be testing the wrong thing or behavior already exists]
```
