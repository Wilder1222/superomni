---
name: subagent-development
description: |
  Use when a task is too large or complex for a single context window.
  Spawns specialized sub-agents for implementation, spec review, and code quality review.
  Triggers: "use subagents", "parallel implementation", "too complex for one pass".
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

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# Sub-Agent Development

**Goal:** Decompose complex work across specialized sub-agents, each with a focused context and clear output contract.

## When to Use Sub-Agents

Use sub-agents when:
- The task requires more context than fits in one window
- Different parts of the task require different expertise (spec review vs implementation)
- Parallel execution would significantly reduce elapsed time
- You want independent verification of your own work

## Sub-Agent Types

### 1. Implementer Agent
See `implementer-prompt.md` — implements a specific, well-scoped feature.

### 2. Spec Reviewer Agent
See `spec-reviewer-prompt.md` — reviews specifications before implementation.

### 3. Code Quality Reviewer Agent
See `code-quality-reviewer-prompt.md` — reviews code after implementation.

## Protocol: Spawning a Sub-Agent

### Step 1: Define the Task Boundary

Before spawning, define:
- **Input:** What the sub-agent receives (files, spec, context)
- **Output:** What the sub-agent must produce (format, location)
- **Scope:** Exactly what files/modules the sub-agent may touch
- **Constraints:** What the sub-agent must NOT do

### Step 2: Prepare the Sub-Agent Prompt

Use the relevant prompt template from this directory.
Fill in:
- `[TASK]` — specific task description
- `[CONTEXT]` — relevant background
- `[INPUT FILES]` — files to read
- `[OUTPUT CONTRACT]` — exact output format required
- `[CONSTRAINTS]` — what to avoid

### Step 3: Launch and Monitor

```
SPAWNING SUB-AGENT: [type] — [task name]
Input: [what it receives]
Output: [what it must produce]
Scope: [allowed files]
```

### Step 4: Validate Output

When the sub-agent reports back:
- [ ] Output matches the defined contract
- [ ] No out-of-scope changes were made
- [ ] Reported status is DONE or DONE_WITH_CONCERNS (not BLOCKED)
- [ ] Evidence is provided for all claims

### Step 5: Integrate Results

Merge sub-agent outputs carefully:
1. Review each change before accepting
2. Run tests after integration
3. Resolve any conflicts between parallel agents

## Parallel Execution Pattern

When using multiple sub-agents simultaneously:

```
PARALLEL EXECUTION
═══════════════════════════════════════
Agent 1: [implementer] — [task A]
Agent 2: [spec-reviewer] — [spec for task B]
Agent 3: [implementer] — [task C] (independent of A)

Synchronization point: After all agents report DONE
Integration plan: [how to merge their outputs]
═══════════════════════════════════════
```

Rule: Only run truly independent tasks in parallel.
If task B depends on task A's output, run them sequentially.

## Consensus Protocol (Optional)

For critical decisions, run two agents with the same task and compare outputs:
- If they agree → proceed
- If they disagree → surface disagreement to user as TASTE decision
