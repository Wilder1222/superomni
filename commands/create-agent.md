# /create-agent

Scaffold a new custom AI agent and define its behavior.

## Usage

```
/create-agent <name>
```

The name should be lowercase with hyphens (e.g., `data-analyst`, `api-tester`, `migration-helper`).

## Examples

```
/create-agent data-analyst
/create-agent api-integration-tester
/create-agent database-migration-helper
```

## What Happens

1. The `agent-management` skill activates
2. You are prompted to choose project or personal agent location
3. A template is scaffolded at `agents/<name>.md` or `~/.omni-skills/agents/<name>.md`
4. The template includes all required sections: identity, iron law, process, output format
5. You edit the agent definition to match your use case

## Agent Template Structure

Your new agent will contain:
- **Identity section** — who this agent is and their specialty
- **Iron Law** — the one rule this agent never violates
- **Phase-based process** — step-by-step protocol (3–5 phases)
- **Output format** — structured report with DONE/BLOCKED status

## Assigning Skills

After creating your agent, you can assign existing skills to it:
- Reference skill files directly: `Follow skills/systematic-debugging/SKILL.md`
- Layer multiple skills for complex agents

## Skill Reference

See `skills/agent-management/SKILL.md` for the full protocol.
