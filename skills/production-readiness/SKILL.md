---
name: production-readiness
description: |
  Use before deploying any code to production.
  Verifies observability, reliability, operability, and goal alignment.
  The gate between "tests pass" and "safe to deploy".
  Triggers: "production ready", "ready to deploy", "pre-deploy check", before using ship skill.
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
   ls spec.md plan.md .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

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

# Production Readiness Gate

**Goal:** Verify that code is ready for production deployment — beyond just passing tests.

The distinction between "code works" and "production ready":
- **Code works** = tests pass, acceptance criteria met (handled by `verification`)
- **Production ready** = code can be deployed safely, operated reliably, and debugged when it fails

## Iron Law: Never Deploy Without This Checklist

"CI is green" is necessary but not sufficient for production. A broken deployment with no runbook, no alerts, and no rollback plan is worse than not deploying at all.

---

## Phase 1: Goal Alignment

Before checking operational concerns, confirm the output actually achieves what the user originally asked for.

```bash
# Read acceptance criteria from spec
cat spec.md 2>/dev/null | grep -A 30 "Acceptance Criteria" | head -40 || \
  cat plan.md 2>/dev/null | grep -A 20 "Success Criteria" | head -30 || \
  echo "No spec.md or plan.md found — document what you are verifying against"
```

For **each acceptance criterion** found in spec.md:

| Criterion | Status | Evidence |
|-----------|--------|----------|
| [criterion 1] | ✓/✗ | [proof: test output, screenshot, or code reference] |
| [criterion 2] | ✓/✗ | [proof] |

**Gate:** ALL P0 acceptance criteria must be ✓ before proceeding.

If no spec.md exists:
- Document what user goal this change fulfills
- List the observable outcomes that prove the goal is met

---

## Phase 2: Observability Check

Can you tell when it's broken in production?

- [ ] **Logging** — are key operations logged with appropriate level (info/warn/error)?
- [ ] **No sensitive data in logs** — no passwords, tokens, PII in log output?
- [ ] **Error logging** — are all caught exceptions logged with context?
- [ ] **Metrics** — are key performance indicators tracked (if applicable)?
- [ ] **Distributed tracing** — if microservices, are trace IDs propagated?

```bash
# Check for logging in changed files
git diff main...HEAD --name-only 2>/dev/null | while read f; do
  echo "=== $f ==="
  grep -n "log\.\|logger\.\|console\.\|print\(" "$f" 2>/dev/null | head -5
done | head -40

# Check for secrets in logs
git diff main...HEAD 2>/dev/null | grep "+" | \
  grep -iE "password|secret|token|api_key|credential" | \
  grep -v "^---\|^+++\|test\|spec\|mock" | head -10
```

---

## Phase 3: Reliability Check

Does it fail gracefully?

- [ ] **Health endpoint** — is there a `/health` or equivalent endpoint that returns 200 when healthy?
- [ ] **Graceful degradation** — if a dependency is down, does the system degrade gracefully (not crash)?
- [ ] **Timeouts** — are all external calls wrapped with timeouts?
- [ ] **Retry logic** — are transient failures retried with backoff (if appropriate)?
- [ ] **Circuit breaker** — is there protection against cascading failures (if applicable)?
- [ ] **Resource bounds** — are there limits on memory, connections, queue depth?

```bash
# Check for timeout handling in changed files
git diff main...HEAD --name-only 2>/dev/null | while read f; do
  grep -n "timeout\|Timeout\|TIMEOUT" "$f" 2>/dev/null | head -3
done | head -20
```

**For non-service changes (scripts, CLI tools, libraries):** mark N/A for inapplicable items.

---

## Phase 4: Operability Check

Can someone else run and fix this without the author?

- [ ] **Rollback plan documented** — how do you undo this deployment if it breaks something?
- [ ] **Runbook exists** — is there documentation on how to operate this feature (if new)?
- [ ] **Alerts configured** — will someone be paged if this breaks?
- [ ] **On-call aware** — does the on-call team know this is deploying today?
- [ ] **Feature flag** — if high risk, is this behind a feature flag that can be toggled off?
- [ ] **Deployment window** — is this being deployed at a safe time (not Friday afternoon)?

```bash
# Check for feature flag patterns
git diff main...HEAD 2>/dev/null | grep "+" | \
  grep -iE "feature_flag|feature\.enabled|flag\.|toggle\." | head -10

# Check for rollback instructions in docs
grep -r "rollback\|revert\|undo" . --include="*.md" -l 2>/dev/null | head -5
```

**For low-risk changes (config, docs, tests):** mark operability items N/A where not applicable.

---

## Phase 5: Security Gate

Confirm security review has been done (or is not required).

- [ ] **Security audit** run? (use `security-audit` skill if not done)
- [ ] **No new attack surface** — no new endpoints, inputs, or permissions without review?
- [ ] **Dependencies clean** — no new CVEs in added dependencies?
- [ ] **Secrets management** — no hardcoded credentials, all secrets via env/vault?

```bash
# Quick secrets scan
git diff main...HEAD 2>/dev/null | grep "+" | \
  grep -vE "^---|\+\+\+|test|spec|mock|example" | \
  grep -iE "(password|secret|api_key|private_key)\s*[=:]\s*['\"][^'\"]{8,}" | head -10
```

---

## Production Readiness Report

```
PRODUCTION READINESS REPORT
════════════════════════════════════════
Feature/Change:    [what is being deployed]
Branch/PR:         [identifier]
Date:              [YYYY-MM-DD]

GOAL ALIGNMENT
  Acceptance criteria:
    ✓/✗ [criterion 1] — [evidence]
    ✓/✗ [criterion 2] — [evidence]
  User goal achieved: YES | NO | PARTIAL

OBSERVABILITY
  Logging:          PASS | FAIL | N/A
  Error tracking:   PASS | FAIL | N/A
  Metrics:          PASS | FAIL | N/A
  Notes: [any gaps or concerns]

RELIABILITY
  Health check:     PASS | FAIL | N/A
  Graceful degrade: PASS | FAIL | N/A
  Timeouts:         PASS | FAIL | N/A
  Notes: [any gaps or concerns]

OPERABILITY
  Rollback plan:    DOCUMENTED | MISSING | N/A
  Runbook:          EXISTS | MISSING | N/A
  Alerts:           CONFIGURED | MISSING | N/A
  Feature flag:     YES | NO | N/A
  Notes: [any gaps or concerns]

SECURITY
  Audit status:     CLEAN | CONCERNS | SKIPPED
  Notes: [any concerns]

BLOCKERS (must resolve before deploy):
  - [blocker 1]

CONCERNS (deploy with awareness):
  - [concern 1]

VERDICT: READY | READY_WITH_CONCERNS | NOT_READY

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

## When NOT_READY

If verdict is NOT_READY:

1. List all blockers with specific remediation steps
2. Assign an owner to each blocker
3. Re-run this checklist after blockers are resolved
4. Do NOT proceed to `ship` until verdict is READY or READY_WITH_CONCERNS

## Save Production Readiness Document

```bash
_PR_DATE=$(date +%Y%m%d-%H%M%S)
_PR_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_PR_FILE="production-readiness-${_PR_BRANCH}-${_PR_DATE}.md"
mkdir -p .superomni/production-readiness
echo "Production readiness report saved to .superomni/production-readiness/${_PR_FILE}"
```

Write the full PRODUCTION READINESS REPORT block to `.superomni/production-readiness/production-readiness-[branch]-[date].md`.
