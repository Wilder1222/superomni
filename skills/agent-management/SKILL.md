---
name: agent-management
description: |
  Use when you need to find, install, create, or manage AI agents.
  Supports installing agents from local paths or GitHub URLs, scaffolding custom agents,
  and assigning skills to agents.
  Triggers: "install agent", "create agent", "manage agents", "list agents", "new agent", "add agent".
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

# Agent Management

**Goal:** Find, install, create, and manage AI agents within the superomni framework.

## What Is an Agent?

An agent is a specialized AI persona defined in `agents/<name>.md`. Each agent:
- Has a **specific expertise** (e.g., planning, debugging, testing, security)
- Follows a **structured process** tailored to its domain
- Produces a **defined output format** with status reporting
- Can be **assigned to tasks** by the main agent or invoked directly

## Built-in Agents

```bash
# List all available agents
bin/agent-manager list
```

| Agent | Specialty |
|-------|-----------|
| `code-reviewer` | Structured code review (P0/P1/P2 framework) |
| `planner` | Strategic task decomposition and plan writing |
| `debugger` | Root-cause analysis and bug resolution |
| `test-writer` | Behavior-verifying test suites |
| `security-auditor` | OWASP-aware vulnerability identification |
| `architect` | System design and architecture review |
| `ceo-advisor` | Product strategy, scope decisions, demand validation |
| `designer` | UX design, missing states, AI slop detection |

## Phase 0: Search Online (When Built-ins Don't Fit)

If none of the built-in agents match your need, search for one before creating from scratch:

```bash
# Search GitHub for matching agents
bin/agent-manager search <your-query>
```

This searches GitHub for agent markdown files matching your query and shows raw URLs you can install directly.

**Search strategy:**
1. Search with your domain term: `bin/agent-manager search "data-analyst"`
2. Check known registries:
   - obra/superpowers: `https://github.com/obra/superpowers/tree/main/agents`
   - garrytan/gstack: `https://github.com/garrytan/gstack/tree/main/agents`
3. If found → install via URL (Phase 2)
4. If nothing suitable → create from scratch (Phase 3)

## Phase 1: Find an Agent

Before installing or creating, check if an agent already exists:

```bash
# List all agents (built-in + user-installed)
bin/agent-manager list

# Get details about a specific agent
bin/agent-manager info <name>
```

If a built-in agent fits your need → use it directly.
If none fits → proceed to Phase 2 (install) or Phase 3 (create).

## Phase 2: Install an Agent

### From a Local File

```bash
bin/agent-manager install ./path/to/my-agent.md
```

The agent is copied to `~/.omni-skills/agents/` and available immediately.

### From GitHub (or any URL)

```bash
# Install from a raw GitHub URL
bin/agent-manager install https://raw.githubusercontent.com/user/repo/main/agents/my-agent.md

# Install from obra/superpowers
bin/agent-manager install https://raw.githubusercontent.com/obra/superpowers/main/agents/<agent-name>.md
```

### Verify Installation

```bash
bin/agent-manager list
bin/agent-manager info <agent-name>
```

## Phase 3: Create a Custom Agent

### Step 1: Scaffold

```bash
bin/agent-manager create <agent-name>
```

This creates a template at either:
- `agents/<name>.md` — project agents (tracked in git, shared with team)
- `~/.omni-skills/agents/<name>.md` — user agents (personal, not in git)

### Step 2: Define the Agent

Edit the scaffolded file and fill in:

1. **Identity** — who is this agent and what is their specialty?
2. **Iron Law** — the one rule this agent must never violate
3. **Process** — phase-by-phase protocol (3–5 phases)
4. **Output format** — structured report with status

### Step 3: Assign Skills (Optional)

To give an agent access to specific skills, reference them in its process:

```markdown
## Available Skills
- Follow `skills/systematic-debugging/SKILL.md` for debugging protocol
- Follow `skills/test-driven-development/SKILL.md` when writing tests
```

### Step 4: Test the Agent

Invoke the agent with a sample task:
1. Provide a clear task description
2. Verify the agent follows its defined process
3. Check the output matches the defined format

## Phase 4: Remove an Agent

Only user-installed agents can be removed (built-ins are part of the framework):

```bash
bin/agent-manager remove <agent-name>
```

## Agent Design Principles

### Do
- Give agents a single, focused specialty
- Define explicit output formats with status reporting
- Include at least one "Iron Law" — a non-negotiable rule
- Use phase-based protocols that are easy to follow
- Reference relevant skills rather than duplicating them

### Don't
- Create an agent whose purpose overlaps significantly with an existing one
- Make agents that do everything (use `subagent-development` skill instead)
- Skip the output format — it enables verification
- Forget to test before deploying to the team

## Agent Management Report

```
AGENT MANAGEMENT REPORT
════════════════════════════════════════
Operation:   [list/install/create/remove]
Agent:       [name]
Location:    [path]
Source:      [local/url — if installed]

Built-in agents:   [N]
User agents:       [N]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```
