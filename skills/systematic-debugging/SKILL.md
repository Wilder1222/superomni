---
name: systematic-debugging
description: |
  Use when encountering any bug, test failure, or unexpected behavior.
  Iron Law: no fixes without root cause investigation first.
  Four phases: Investigate → Analyze → Hypothesize → Implement.
  Triggers: any error, test failure, "it's broken", "why isn't X working".
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

### Auto-Advance Rule

Pipeline stage order: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT

**REVIEW is the only human gate.** All other stages auto-advance on DONE.

| Status | At REVIEW stage | At all other stages |
|--------|----------------|-------------------|
| **DONE** | STOP — present review summary, wait for user input (Y / N / revision notes) | Auto-advance — print `[STAGE] DONE → advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP — present concerns, wait for user decision | STOP — present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP — present blocker, wait for user | STOP — present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md docs/superomni/ .superomni/ 2>/dev/null | head -20
   git log --oneline -3 2>/dev/null
   ```
   To find the latest spec or plan:
   ```bash
   _LATEST_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
   _LATEST_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
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

# Systematic Debugging

## Iron Law

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

If you haven't completed Phase 1, you cannot propose fixes. "I think it might be X" is not a root cause. A root cause is a specific, testable claim about what is wrong.

## Phase 1: Root Cause Investigation

### Scope Lock (built-in freeze)

Before investigating, lock the edit scope to the affected area to prevent accidental changes elsewhere:

```bash
FREEZE_DIR=$(cd "<affected-directory>" 2>/dev/null && pwd || echo "")
if [ -n "$FREEZE_DIR" ]; then
  mkdir -p "${HOME}/.omni-skills"
  echo "${FREEZE_DIR%/}/" > "${HOME}/.omni-skills/debug-scope.txt"
  echo "Debug scope locked to: ${FREEZE_DIR%/}/"
fi
```

While scope lock is active, do NOT edit files outside the locked directory. Flag out-of-scope fixes as follow-up tasks. Say "unfreeze" or remove `~/.omni-skills/debug-scope.txt` when done debugging.

### Investigation Steps

1. **Read error messages carefully** — read the full stack trace; note exact file names and line numbers
2. **Reproduce consistently** — can you reproduce the error every time? If not, gather more data first
3. **Check recent changes** — `git log --oneline -20 -- <affected-files>`
4. **Gather evidence in multi-component systems** — add logging at each boundary; don't guess
5. **Trace data flow** — see `root-cause-tracing.md` for backward tracing technique

```bash
# Check recent changes to affected area
git log --oneline -20 -- <file-or-directory>

# Search for related error patterns
grep -r "<error-string>" . --include="*.log" -l 2>/dev/null | head -5

# Check for recent changes across the codebase
git diff HEAD~5 HEAD -- <affected-area>
```

Required output: **"Root cause hypothesis: ..."** — a specific, testable claim.
Example: "Root cause hypothesis: The `authenticate()` function returns `null` when the JWT is expired, but the caller doesn't handle `null` and passes it directly to `getUserData()`, causing a NullPointerException at line 47."

## Scope Lock

After forming a hypothesis, lock edits to the affected module to prevent scope creep:

```bash
STATE_DIR="${HOME}/.omni-skills"
mkdir -p "$STATE_DIR"
AFFECTED_DIR="<detected-directory>"
echo "${AFFECTED_DIR}/" > "$STATE_DIR/debug-scope.txt"
echo "Debug scope locked to: ${AFFECTED_DIR}/"
echo "Run 'rm ~/.omni-skills/debug-scope.txt' to unlock scope."
```

**You may only edit files within the locked scope during debugging.**
If the fix requires touching files outside scope → flag to user and unlock explicitly.

## Phase 2: Pattern Analysis

Match the symptom to known patterns:

| Pattern | Signature | Where to look |
|---------|-----------|---------------|
| Race condition | Intermittent, timing-dependent failures | Shared mutable state, async code |
| Nil/null propagation | NullPointerError, TypeError on access | Missing null guards, unexpected returns |
| State corruption | Inconsistent data after operations | DB transactions, event hooks, caches |
| Integration failure | Timeout, unexpected response format | Service boundaries, API contracts |
| Configuration drift | Works locally, fails in CI/staging | Env vars, feature flags, secrets |
| Stale cache | Old data returned, fixes on cache clear | Redis, CDN, browser cache, memoize |
| Off-by-one | Wrong count, missing last element | Loop bounds, array indexing |

Also: **Find a working example** → compare with broken case → list every difference.

See `root-cause-tracing.md` for systematic backward tracing techniques.

## Phase 3: Hypothesis Testing

1. **State your hypothesis:** "I think X is happening because Y"
2. **Write it down** — if you can't write it, you don't understand it yet
3. **Test minimally** — make the SMALLEST possible change to test the hypothesis
4. **One variable at a time** — change exactly one thing per test; never two
5. **Verify** — did the change fix it?
   - Yes → proceed to Phase 4
   - No → form a new hypothesis (go back to step 1)

### 3-Strike Rule

After 3 failed hypotheses, **STOP**. Do not guess further. Choose:

**A)** Form a completely different hypothesis (change your mental model, not just the details)
**B)** Add more logging/instrumentation and gather more data before hypothesizing
**C)** Escalate: report BLOCKED with your 3 hypotheses and evidence gathered
**D)** Other — describe your own next step: ___________

## Phase 4: Implementation

1. **Create failing test first** — see `test-driven-development` skill
2. **Single fix** — fix the root cause only; ONE change; no "while I'm here" modifications
3. **Verify** — test passes, no regressions
4. **Check blast radius** — if the fix touches >5 files, flag to user before applying
5. **If 3+ different fixes failed** — question the architecture, not just the code

See `defense-in-depth.md` for multi-layer validation after finding root cause.
See `condition-based-waiting.md` for async/timing issues.

## Phase 5: Debug Report

```
DEBUG REPORT
════════════════════════════════════════
Symptom:         [what the user observed]
Root cause:      [what was actually wrong — specific, verified]
Fix:             [what changed, with file:line references]
Evidence:        [test output or command + result proving fix works]
Regression test: [file:line of new test added]
Scope unlocked:  [yes/no — was debug-scope.txt removed?]
Status:          DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

## Supporting Techniques

- `root-cause-tracing.md` — backward tracing through call stack
- `defense-in-depth.md` — multi-layer validation after finding root cause
- `condition-based-waiting.md` — replace fragile timeouts with condition polling
