<!-- Reference: TDD anti-patterns to avoid + what-to-test heuristics + test-organization examples. -->

# Test-Driven Development — Anti-Patterns & Test Organization

## Anti-Patterns to Avoid

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

```python
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
