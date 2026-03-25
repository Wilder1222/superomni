# Root Cause Tracing — Backward Tracing Technique

Use this technique when you need to trace backwards from an error to find the true source.

## The Backward Tracing Method

**Principle:** Always move from effect to cause, never from hypothesis to proof.

### Step 1: Start at the Error

Read the exact error message and stack trace. Note:
- The exact exception/error type
- The exact file and line number where it occurs
- The call stack (what called what)

### Step 2: Read the Failing Code

Open the file at the line number. Ask:
- What is this line trying to do?
- What value is it receiving that causes the error?
- Where does that value come from?

### Step 3: Trace One Level Up

Go to the function that called the failing function. Ask:
- What value is it passing?
- Is that value being validated before passing?
- Where does THAT value come from?

### Step 4: Continue Until You Find the Source

Keep tracing backwards until you find:
- The point where a bad value is **created** (not just passed)
- OR the point where a **missing validation** allows bad data through
- OR the point where an **assumption is violated** (expected X, got Y)

### Step 5: Form the Root Cause Statement

A proper root cause statement answers all three:
1. **Where** exactly in the code is the bug?
2. **What** is the incorrect behavior?
3. **Why** is it incorrect (assumption violated, missing check, wrong logic)?

**Example (bad):** "The authentication is broken"
**Example (good):** "In `auth/middleware.js:47`, `verifyToken()` returns `null` on expiry instead of throwing, but `router.js:23` passes the return value directly to `getUserById()` without null checking, causing TypeError at line 31"

## Useful Commands

```bash
# Find where a function is defined
grep -rn "function functionName\|const functionName\|def function_name" . --include="*.js" --include="*.ts" --include="*.py"

# Trace where a value is set
grep -rn "variableName\s*=" . --include="*.js" -A 2

# Find all callers of a function
grep -rn "functionName(" . --include="*.js" --include="*.ts"

# Check git blame for when a line was last changed
git blame <file> -L <start_line>,<end_line>

# See what changed in a file recently
git log --oneline -10 -- <file>
git show HEAD~3:<file> | grep -A5 -B5 "functionName"
```

## Boundary Logging Pattern

When you can't trace statically, add temporary logging at each boundary:

```javascript
// Add at each step in the call chain
console.log('[DEBUG boundary-name] input:', JSON.stringify(input, null, 2));
// ... existing code ...
console.log('[DEBUG boundary-name] output:', JSON.stringify(output, null, 2));
```

Remove all `[DEBUG]` lines after finding the root cause.

## Common Root Cause Locations

1. **Where data enters the system** — API endpoints, file reads, user input
2. **Where data is transformed** — parsing, mapping, type conversion
3. **Where assumptions are made** — "this will always be set", "this will always be a string"
4. **Where state transitions happen** — state machines, event handlers, lifecycle hooks
5. **Where concurrency meets shared state** — async callbacks, race conditions
