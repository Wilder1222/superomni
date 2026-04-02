---
name: dispatching-parallel
description: |
  Use when a task can be broken into independent parallel workstreams.
  Coordinates multiple sub-agents working concurrently on different parts of a problem.
  Triggers: "do these in parallel", "independent tasks", "dispatch agents".
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

When a skill reports **DONE** (no concerns, no blockers):
1. Write the session artifact to `docs/superomni/`
2. Print a single-line transition: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill without waiting for user input

When a skill reports **DONE_WITH_CONCERNS**, **BLOCKED**, or **NEEDS_CONTEXT**:
1. Write the session artifact
2. STOP and present the status to the user
3. Wait for user decision before proceeding

Pipeline stage order: THINK → PLAN → BUILD → REVIEW → VERIFY → SHIP → IMPROVE → REFLECT

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/specs/spec.md docs/superomni/plans/plan.md docs/superomni/ .superomni/ 2>/dev/null
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
| Planning | `docs/superomni/specs/spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `docs/superomni/plans/plan.md`, relevant source files | Unrelated modules, docs |
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


# Dispatching Parallel Work

**Goal:** Decompose a task into truly independent units and coordinate parallel execution across sub-agents — maximizing concurrency to minimize elapsed time.

## Iron Law: Independence Required

Parallel dispatch only works for TRULY independent tasks.
If Task B requires the output of Task A, they are sequential, not parallel.

## Iron Law: Maximize Concurrency

**Default concurrency target: 5–10 agents per wave.**
Never dispatch only 2–3 agents when more independent tasks exist.
Each wave should saturate available parallelism before waiting for results.

## Step 1: Decompose into Independent Units

List ALL tasks to be done. Then classify each:

```
Task A: [description]
Task B: [description]
Task C: [description]
Task D: [description]
...

Dependency analysis:
  A → B?  NO (independent)
  A → C?  YES (C needs A's output)
  B → D?  NO (independent)
  C → D?  NO (independent)

Wave plan:
  Wave 1 (PARALLEL): A, B, D    ← all tasks with no unmet dependencies
  Wave 2 (PARALLEL): C, E, F    ← tasks unblocked after Wave 1 completes
  Wave 3 (sequential if needed): G
```

Rule: If you're not sure whether tasks are independent, assume they're sequential.
Rule: Always fit as many tasks as possible into each wave — aim for 5–10 per wave.

## Step 2: Wave Planning for Large Task Sets

For task lists with 6+ items, create a formal wave plan:

```
WAVE EXECUTION PLAN
════════════════════════════════════════
Total tasks:     [N]
Total waves:     [W]
Max wave size:   [target: 5-10 agents]
Est. time saved: [sequential time] → [parallel time with waves]

Wave 1 ([N] agents in parallel):
  Agent 1 → [Task A]
  Agent 2 → [Task B]
  Agent 3 → [Task C]
  ...

Wave 2 ([M] agents in parallel, after Wave 1 complete):
  Agent 1 → [Task D]
  Agent 2 → [Task E]
  ...
════════════════════════════════════════
```

## Step 3: Define Output Contracts

Before dispatching each wave, each agent needs a clear output contract:

```
Agent 1 — Task A
  Input:  [what it reads]
  Output: [exactly what it produces, file name, format]
  Scope:  [files it may touch]
  NOT allowed: [what to avoid]

Agent 2 — Task B
  Input:  [what it reads]
  Output: [exactly what it produces, file name, format]
  Scope:  [files it may touch]
  NOT allowed: [what to avoid]
```

## Step 4: Dispatch Wave

```
DISPATCHING WAVE [N] — [N] PARALLEL AGENTS
════════════════════════════════════════
Wave:            [N of W]
Agents in wave:  [N]   ← should be 5-10 for large task sets
Sync point:      After all agents in this wave report DONE

Agent assignments:
  Agent 1 → [Task A] → Output: [file/result]
  Agent 2 → [Task B] → Output: [file/result]
  Agent 3 → [Task C] → Output: [file/result]
  ...

Conflict zones (check for overlap):
  [list any files that could be touched by multiple agents]
════════════════════════════════════════
```

## Step 5: Monitor and Handle Conflicts

### Conflict Detection

Before integrating parallel outputs:
1. Check if any agents modified the same files
2. If conflict exists → do NOT auto-merge; bring to user

```bash
# Check for conflicts in parallel outputs
git diff agent-1/feature agent-2/feature -- shared-file.js
```

### Agent Failure Handling

If an agent reports BLOCKED:
1. Check if the block affects other agents
2. If independent: let others continue, fix the blocked one separately
3. If dependent: pause the dependent agents, resolve the block

## Step 6: Integration

After all agents in a wave report DONE:

1. **Review each output independently** — don't integrate until you've reviewed
2. **Integrate in dependency order** — sequential dependencies first
3. **Run tests after each integration** — catch conflicts early
4. **Proceed to next wave** — unblock agents waiting on this wave's output
5. **Final integration test** — run full test suite after all waves complete

```bash
# Integration verification after each wave
npm test 2>&1 | tail -10
git diff HEAD --stat
```

## Dispatch Summary Report

```
PARALLEL DISPATCH COMPLETE
════════════════════════════════════════
Total tasks:          [N]
Waves executed:       [W]
Agents dispatched:    [N]
Agents completed:     [N]
Agents blocked:       [N]
Elapsed time:         [actual] vs [sequential estimate]

Wave results:
  Wave 1: [N] agents — DONE in [duration]
  Wave 2: [N] agents — DONE in [duration]

Task results:
  Agent 1 (Task A): DONE — [evidence summary]
  Agent 2 (Task B): DONE — [evidence summary]
  Agent 3 (Task C): BLOCKED — [blocker description]

Integration status:  [DONE/PARTIAL/BLOCKED]
Tests passing:       [N/N]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

## Worktree Integration

For larger parallel workstreams, combine with `git-worktrees` skill:
- Each agent works in its own worktree
- No shared working directory = no file conflicts
- See `git-worktrees` skill for setup
