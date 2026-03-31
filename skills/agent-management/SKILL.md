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
| Planning | `spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `plan.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

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


# Agent Management

**Goal:** Find, install, create, and manage AI agents within the superomni framework.

## What Is an Agent?

An agent is a specialized AI persona defined in `agents/<name>.md`. Each agent:
- Has a **specific expertise** (e.g., planning, debugging, testing, security)
- Follows a **structured process** tailored to its domain
- Produces a **defined output format** with status reporting
- Can be **assigned to tasks** by the main agent or invoked directly

## Selection Flow

**Always follow this order before creating anything from scratch:**

```
1. Check project built-ins  →  bin/agent-manager list
2. Search the network       →  bin/agent-manager search <query>
3. Install from URL         →  bin/agent-manager install <url>
4. Create from scratch      →  bin/agent-manager create <name>
```

Never jump to Phase 4 (create) without first completing Phases 1–3.

## Phase 1: Check Project Built-ins

Before anything else, check if a built-in or previously-installed agent already covers your need:

```bash
# List all agents (built-in + user-installed)
bin/agent-manager list

# Get details about a specific agent
bin/agent-manager info <name>
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

**Gate:** If a built-in agent fits your need → use it directly. Stop here.
If none fits → proceed to Phase 2.

## Phase 2: Search the Network

If no built-in agent covers your need, search GitHub and known registries before creating from scratch:

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
3. If found → install via URL (Phase 3)
4. If nothing suitable → create from scratch (Phase 4)

**Gate:** If a suitable agent is found online → install it (Phase 3). Stop here.
If nothing suitable → proceed to Phase 4.

## Phase 3: Install an Agent

### From GitHub (or any URL)

```bash
# Install from a raw GitHub URL
bin/agent-manager install https://raw.githubusercontent.com/user/repo/main/agents/my-agent.md

# Install from obra/superpowers
bin/agent-manager install https://raw.githubusercontent.com/obra/superpowers/main/agents/<agent-name>.md
```

### From a Local File

```bash
bin/agent-manager install ./path/to/my-agent.md
```

The agent is copied to `~/.omni-skills/agents/` and available immediately.

### Verify Installation

```bash
bin/agent-manager list
bin/agent-manager info <agent-name>
```

## Phase 4: Create a Custom Agent

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

## Phase 5: Remove an Agent

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
Flow used:   [built-in | network search | created from scratch]

Built-in agents:   [N]
User agents:       [N]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```
