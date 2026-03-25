# Testing Anti-Patterns

These patterns make tests worse than no tests. Avoid them.

## Anti-Pattern 1: Testing Implementation, Not Behavior

**Problem:** Tests break when you refactor, even though behavior is unchanged. Forces you to update tests every time you touch implementation details.

```javascript
// BAD: testing that a specific private method is called
it('should call _validateEmail', () => {
  const spy = jest.spyOn(user, '_validateEmail');
  user.setEmail('test@example.com');
  expect(spy).toHaveBeenCalled(); // breaks if you rename the method
});

// GOOD: testing the observable behavior
it('should reject invalid email', () => {
  expect(() => user.setEmail('not-an-email')).toThrow('Invalid email format');
});
```

## Anti-Pattern 2: Mocking the Thing You're Testing

**Problem:** The test proves the mock works, not your code.

```javascript
// BAD
jest.mock('./userService');
const mockUser = { id: 1, name: 'Test' };
UserService.prototype.find.mockResolvedValue(mockUser);
const result = await UserService.find(1);
expect(result).toEqual(mockUser); // this always passes, proves nothing
```

## Anti-Pattern 3: Tests That Always Pass

**Problem:** Gives false confidence; hides real behavior.

```javascript
// BAD
it('should handle errors', () => {
  try {
    riskyOperation();
  } catch (e) {
    // swallowed silently — test always passes
  }
});

// GOOD
it('should throw on invalid input', () => {
  expect(() => riskyOperation(null)).toThrow('Invalid input');
});
```

## Anti-Pattern 4: No Assertions

**Problem:** Tests pass regardless of behavior change.

```javascript
// BAD
it('should process the order', async () => {
  const result = await processOrder(order); // no assertions!
});

// GOOD
it('should return order ID after processing', async () => {
  const result = await processOrder(order);
  expect(result.id).toBeDefined();
  expect(result.status).toBe('confirmed');
});
```

## Anti-Pattern 5: Order-Dependent Tests

**Problem:** Tests pass when run in a specific order, fail otherwise. Hides state management bugs.

```javascript
// BAD: second test depends on state from first test
let sharedState;
it('test 1: set state', () => { sharedState = 'value'; });
it('test 2: use state', () => { expect(sharedState).toBe('value'); });

// GOOD: each test is independent
it('test 2: uses fresh state', () => {
  const state = setupFreshState();
  expect(processState(state)).toBe('expected');
});
```

## Anti-Pattern 6: Sleeping Instead of Waiting

**Problem:** Makes tests slow and still flaky.

```javascript
// BAD
await new Promise(resolve => setTimeout(resolve, 2000)); // slow + flaky

// GOOD: use waitFor from condition-based-waiting
await waitFor(() => screen.queryByText('Loaded'), { timeout: 5000 });
```

## Anti-Pattern 7: Testing Third-Party Libraries

**Problem:** Wastes time, proves nothing about your code.

```javascript
// BAD: testing lodash
it('should sort the array', () => {
  expect(_.sortBy([3,1,2])).toEqual([1,2,3]); // testing lodash, not your code
});
```

## Anti-Pattern 8: Giant Test Files

**Problem:** Hard to read, hard to debug, encourages anti-patterns above.

Rule: If a test file is over 500 lines, it's testing too many things.
Break it up by behavior domain, not by technical layer.

## The Positive Test: What Good Tests Look Like

```javascript
// GOOD TEST: AAA pattern (Arrange, Act, Assert)
it('should calculate 10% discount for premium users', () => {
  // Arrange
  const user = createPremiumUser();
  const cart = createCart([{ price: 100, quantity: 1 }]);

  // Act
  const total = calculateTotal(cart, user);

  // Assert
  expect(total).toBe(90); // 100 - 10% discount
});
```

Good tests have:
- A descriptive name that explains the scenario
- One reason to fail
- Minimal setup
- Clear assertion that matches the test name
