# /list-agents

List all available AI agents in your super-omni setup.

## Usage

```
/list-agents
```

No arguments required.

## What Happens

1. The `agent-management` skill activates
2. All built-in agents are listed with their specialties
3. All user-installed agents (`~/.omni-skills/agents/`) are listed
4. The total count is shown

## Output Example

```
super-omni Agents
═════════════════════════════════════

Built-in agents:
  code-reviewer          Code Reviewer Agent
  planner                Planner Agent
  debugger               Debugger Agent
  test-writer            Test Writer Agent
  security-auditor       Security Auditor Agent
  architect              Architect Agent

Installed agents (~/.omni-skills/agents):
  data-analyst           Data Analyst Agent

Total: 7 agent(s)
```

## Inspect an Agent

To see the full details of any agent:

```bash
bin/agent-manager info <name>
```

## Skill Reference

See `skills/agent-management/SKILL.md` for the full protocol.
