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

On session start, read: branch from `git branch --show-current`, session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Auto-Advance Rule

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE) auto-advance on DONE.

| Status | At THINK stage (after spec generation) | At all other stages |
|--------|----------------------------------------|-------------------|
| **DONE** | STOP - present spec document for user review. Wait for user approval before advancing to PLAN. | Auto-advance - print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP - present concerns, wait for user decision | STOP - present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP - present blocker, wait for user | STOP - present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE -> advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

**Note:** The REVIEW stage (plan-review) runs fully automatically — all decisions (mechanical and taste) are auto-resolved using the 6 Decision Principles. No user input is requested during REVIEW.

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Read `~/.omni-skills/sessions/current-session-ts` to get session start timestamp. Find artifacts in `docs/superomni/specs/`, `docs/superomni/plans/` newer than that timestamp using `find -newer`. Check `git log --oneline -3`.
2. If current-session context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no current-session context → treat as a fresh session and offer the relevant skill from the
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

**Custom Input Option Rule:** Always append `Other — describe your own idea: ___` to predefined choice lists. Treat custom text as the chosen option; ask one clarifying question only if ambiguous.

### Context Window Management
Load context progressively — only what is needed for the current phase:

| Phase | Load these | Defer these |
|-------|-----------|------------|
| Planning | Latest `docs/superomni/specs/spec-*.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | Latest `docs/superomni/plans/plan-*.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

### Output Directory
All skill artifacts are written to `docs/superomni/` (relative to project root).
See the Document Output Convention in CLAUDE.md for the full directory map.

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
Before reporting final status, answer: (1) **Process** — all phases followed? (2) **Evidence** — every claim backed by output or file reference? (3) **Scope** — stayed within task boundary? If any NO, address it or report DONE_WITH_CONCERNS. For full sprint evaluation, use `self-improvement`.

### Anti-Sycophancy Rules

Never say these — they are sycophantic filler that delays real analysis:
- "That's an interesting approach" → Take a position instead
- "There are many ways to think about this" → Pick one, state what evidence would change your mind
- "You might want to consider..." → Say "This is wrong because..." or "This works because..."
- "That could work" → Say whether it WILL work based on evidence
- "I can see why you'd think that" → If they're wrong, say so and why

Always do:
- Take a position on every significant question. State the position AND what evidence would change it.
- If the user's approach has a flaw, name the flaw directly before suggesting alternatives.
- Calibrated acknowledgment only: if an answer is specific and evidence-based, name what was good and pivot to the next hard question.

### TACIT-DENSE Detection (Tacit Knowledge Density Check)

Before executing substantive decisions, check if any falls into these high-tacit-density categories.
These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
has enough tacit knowledge to judge correctly.

| Category | Trigger | Action |
|----------|---------|--------|
| **D1** Domain Expertise | Security, compliance, legal, financial judgment | State `TACIT-DENSE [D1]`, present trade-offs, wait for user |
| **D2** User-Facing UX | UI copy, interaction flow, error messaging | Draft with explicit review markers |
| **D3** Team Culture | Workflow, naming conventions, file organization | Check `style-profiles/` first; ask if none |
| **D4** Novel Pattern | Fewer than 3 precedents in project history | Reduce autonomy, add checkpoints before executing |

When TACIT-DENSE detected, output: `TACIT-DENSE [D#]: [category] — [question] — My default: [recommendation]`

**Relationship with careful skill:** careful = "can we undo this?" (operational). TACIT-DENSE = "can we judge this correctly?" (knowledge). Complementary.

### Telemetry (Local Only)

At session end, log skill name, duration, and outcome to `~/.omni-skills/analytics/` via `bin/analytics-log`. Nothing is sent to external servers.

### Plan Mode Fallback

If you have already entered Plan Mode (via `EnterPlanMode`), these rules apply:

1. **Skills take precedence over plan mode.** Treat loaded skill instructions as executable steps, not reference material. Follow them exactly — do not summarize, skip, or reorder.
2. **STOP points in skills must be respected.** Do NOT call `ExitPlanMode` prematurely to bypass a skill's STOP/gate.
3. **Safe operations in plan mode** — these are always allowed because they inform the plan, not produce code:
   - Reading files, searching code, running `git log`/`git status`
   - Writing to `docs/superomni/` (specs, plans, reviews)
   - Writing to `~/.omni-skills/` (sessions, analytics)
4. **Route planning through vibe workflow.** Even inside plan mode, follow the pipeline: brainstorm → writing-plans → plan-review → executing-plans. Write the plan to `docs/superomni/plans/`, not to Claude's built-in plan file.
5. **ExitPlanMode timing:** Only call `ExitPlanMode` after the current skill workflow is complete and has reported a status (DONE/BLOCKED/etc).

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
_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
cat "$_SPEC" 2>/dev/null | grep -A 30 "Acceptance Criteria" | head -40 || \
  cat "$_PLAN" 2>/dev/null | grep -A 20 "Success Criteria" | head -30 || \
  echo "No docs/superomni/specs/spec-*.md or docs/superomni/plans/plan-*.md found — document what you are verifying against"
```

For **each acceptance criterion** found in docs/superomni/specs/spec-*.md:

| Criterion | Status | Evidence |
|-----------|--------|----------|
| [criterion 1] | ✓/✗ | [proof: test output, screenshot, or code reference] |
| [criterion 2] | ✓/✗ | [proof] |

**Gate:** ALL P0 acceptance criteria must be ✓ before proceeding.

If no docs/superomni/specs/spec-*.md exists:
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

- [ ] **Security review** run? (use `code-review` in `security` mode if not done)
- [ ] **No new attack surface** — no new endpoints, inputs, or permissions without review?
- [ ] **Dependencies clean** — no new CVEs in added dependencies?
- [ ] **Secrets management** — no hardcoded credentials, all secrets via env/vault?

**Dispatch the `security-auditor` agent** in **dependency audit mode** (Phase 4: OWASP A06) to scan all package manifests for CVEs, license issues, and stale packages. The agent returns a SECURITY AUDIT REPORT with the `DEPENDENCIES` section and an overall verdict. Any `CHANGES_REQUIRED` verdict is a deploy blocker.

```bash
# Quick secrets scan (dependency-auditor handles the full vulnerability scan)
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
4. Do NOT proceed to `release` until verdict is READY or READY_WITH_CONCERNS

## Save Production Readiness Document

```bash
_PR_DATE=$(date +%Y%m%d-%H%M%S)
_PR_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_PR_FILE="production-readiness-${_PR_BRANCH}-${_PR_DATE}.md"
mkdir -p docs/superomni/production-readiness
echo "Production readiness report saved to docs/superomni/production-readiness/${_PR_FILE}"
```

Write the full PRODUCTION READINESS REPORT block to `docs/superomni/production-readiness/production-readiness-[branch]-[session]-[date].md`.
