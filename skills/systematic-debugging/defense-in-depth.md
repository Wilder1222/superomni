# Defense in Depth — Multi-Layer Validation After Finding Root Cause

Once you've identified and fixed a root cause, apply defense-in-depth to prevent the same class of bug from occurring again.

## The Three Layers

### Layer 1: Input Validation (Prevent bad data entering)

Add validation at the boundary where bad data was introduced:

```javascript
// Before (no validation)
function processUser(user) {
  return user.name.toUpperCase();
}

// After (with guard)
function processUser(user) {
  if (!user || typeof user.name !== 'string') {
    throw new TypeError(`processUser: expected user with string name, got ${JSON.stringify(user)}`);
  }
  return user.name.toUpperCase();
}
```

### Layer 2: Defensive Coding (Handle bad data gracefully)

Add defensive handling at the point where the error occurred:

```javascript
// Before (assumed valid data)
const result = data.items.map(item => item.value);

// After (defensive)
const result = (data?.items ?? []).map(item => item?.value ?? null).filter(Boolean);
```

### Layer 3: Monitoring/Logging (Detect when it happens again)

Add logging that would have caught this earlier:

```javascript
// Log anomalies at the boundary
if (!expectedCondition) {
  console.error('[ANOMALY] processUser: unexpected input', {
    expected: 'user with string name',
    received: typeof user?.name,
    timestamp: new Date().toISOString()
  });
  // then handle gracefully or throw
}
```

## When to Apply Which Layer

| Scenario | Layer 1 | Layer 2 | Layer 3 |
|----------|---------|---------|---------|
| External data (API, user input) | Always | Sometimes | Recommended |
| Internal data (function calls) | If critical path | If null-prone | Optional |
| Configuration values | Always | N/A | If startup-critical |
| Third-party library output | Sometimes | Always | Optional |

## The "What Went Wrong" Checklist

After fixing, ask:

- [ ] Could this have been caught at input validation?
- [ ] Could a type system have prevented this?
- [ ] Is there a test that would have caught this regression?
- [ ] Could a code review have caught this?
- [ ] Should this be a documented assumption/contract?

## Don't Overengineer

Defense in depth ≠ defensive programming everywhere. Apply it where:
1. Data crosses a boundary (external to internal)
2. The bug caused real user impact
3. The assumption is non-obvious to future developers

Don't add guards to every internal function call — that's noise.
