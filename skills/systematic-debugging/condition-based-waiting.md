# Condition-Based Waiting — Replace Timeouts with Condition Polling

Use this technique when debugging async/timing-related issues, or when writing tests that need to wait for async operations.

## The Problem with Timeouts

Timeouts are fragile:
- Too short → flaky tests on slow machines
- Too long → slow test suites
- Wrong in CI environments with different performance characteristics

```javascript
// Bad: fixed timeout
await new Promise(resolve => setTimeout(resolve, 2000)); // flaky!
```

## The Solution: Wait for a Condition

Instead of waiting a fixed time, poll until a condition is true or a deadline is reached:

### JavaScript/TypeScript

```javascript
/**
 * Wait until a condition function returns true, or timeout.
 * @param {() => boolean | Promise<boolean>} condition - Returns true when ready
 * @param {object} options
 * @param {number} options.timeout - Max wait in ms (default: 5000)
 * @param {number} options.interval - Poll interval in ms (default: 100)
 * @param {string} options.message - Error message on timeout
 */
async function waitFor(condition, { timeout = 5000, interval = 100, message = 'Condition not met' } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout after ${timeout}ms: ${message}`);
}

// Usage
await waitFor(() => document.querySelector('.loaded'), {
  timeout: 5000,
  message: 'Expected .loaded element to appear'
});

await waitFor(async () => {
  const res = await fetch('/api/status');
  const data = await res.json();
  return data.status === 'ready';
}, { timeout: 10000, message: 'API not ready' });
```

### Python

```python
import time

def wait_for(condition, timeout=5.0, interval=0.1, message="Condition not met"):
    """
    Poll condition() until it returns True or timeout is reached.
    """
    deadline = time.time() + timeout
    while time.time() < deadline:
        if condition():
            return
        time.sleep(interval)
    raise TimeoutError(f"Timeout after {timeout}s: {message}")

# Usage
wait_for(lambda: os.path.exists('/tmp/result.json'),
         timeout=10.0,
         message="Expected result.json to be created")
```

### Bash

```bash
wait_for() {
  local condition="$1"
  local timeout="${2:-10}"
  local interval="${3:-0.5}"
  local message="${4:-Condition not met}"
  local deadline=$(( $(date +%s) + timeout ))

  while [ "$(date +%s)" -lt "$deadline" ]; do
    if eval "$condition" > /dev/null 2>&1; then
      return 0
    fi
    sleep "$interval"
  done

  echo "Timeout after ${timeout}s: ${message}" >&2
  return 1
}

# Usage
wait_for "[ -f /tmp/server.pid ]" 15 0.5 "Server PID file not created"
wait_for "curl -sf http://localhost:3000/health" 30 1 "Server not healthy"
```

## When to Use This Pattern

Use condition-based waiting when:
- Waiting for a server to start
- Waiting for a file to be created
- Waiting for an async operation to complete
- Waiting for an element to appear in UI tests
- Waiting for a background job to finish

Don't use it as a workaround for race conditions — fix the race condition first.
