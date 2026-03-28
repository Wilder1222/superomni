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

# Dispatching Parallel Work

**Goal:** Decompose a task into truly independent units and coordinate parallel execution across sub-agents.

## Iron Law: Independence Required

Parallel dispatch only works for TRULY independent tasks.
If Task B requires the output of Task A, they are sequential, not parallel.

## Step 1: Decompose into Independent Units

List all tasks to be done. Then classify:

```
Task A: [description]
Task B: [description]
Task C: [description]

Dependency analysis:
  A → B?  NO (independent)
  A → C?  YES (C needs A's output)
  B → C?  NO (independent)

Execution plan:
  PARALLEL: A, B
  THEN: C
```

Rule: If you're not sure whether tasks are independent, assume they're sequential.

## Step 2: Define Output Contracts

Before dispatching, each parallel agent needs a clear output contract:

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

## Step 3: Dispatch

```
DISPATCHING PARALLEL AGENTS
════════════════════════════════════════
Total agents:    [N]
Total tasks:     [N]
Sync point:      After all agents report DONE

Agent assignments:
  Agent 1 → [Task A] → Output: [file/result]
  Agent 2 → [Task B] → Output: [file/result]

Conflict zones (check for overlap):
  [list any files that could be touched by multiple agents]
════════════════════════════════════════
```

## Step 4: Monitor and Handle Conflicts

### Conflict Detection

Before integrating parallel outputs:
1. Check if any agents modified the same files
2. If conflict exists → do NOT auto-merge; bring to user

```bash
# Check for conflicts in parallel outputs
# (assuming agents write to separate branches)
git diff agent-1/feature agent-2/feature -- shared-file.js
```

### Agent Failure Handling

If an agent reports BLOCKED:
1. Check if the block affects other agents
2. If independent: let others continue, fix the blocked one separately
3. If dependent: pause the dependent agents, resolve the block

## Step 5: Integration

After all parallel agents report DONE:

1. **Review each output independently** — don't integrate until you've reviewed
2. **Integrate in dependency order** — sequential dependencies first
3. **Run tests after each integration** — catch conflicts early
4. **Final integration test** — run full test suite after all integrations

```bash
# Integration verification
npm test 2>&1 | tail -10
git diff HEAD --stat
```

## Dispatch Summary Report

```
PARALLEL DISPATCH COMPLETE
════════════════════════════════════════
Agents dispatched:    [N]
Agents completed:     [N]
Agents blocked:       [N]

Results:
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
