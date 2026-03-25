# /install-agent

Install an AI agent from a local file or remote URL into your super-omni setup.

## Usage

```
/install-agent <source>
```

Where `<source>` is:
- A local file path: `./my-agent.md` or `/path/to/agent.md`
- A GitHub raw URL: `https://raw.githubusercontent.com/user/repo/main/agents/agent.md`
- Any direct HTTP(S) URL to a `.md` agent definition

## Examples

```
/install-agent ./agents/custom/data-analyst.md
/install-agent https://raw.githubusercontent.com/obra/superpowers/main/agents/planner.md
/install-agent https://raw.githubusercontent.com/user/my-agents/main/specialized-agent.md
```

## What Happens

1. The `agent-management` skill activates
2. The agent file is validated and downloaded/copied
3. It is installed to `~/.omni-skills/agents/`
4. The agent is immediately available for use

## After Installing

List all agents (including your new one):
```
/list-agents
```

View the installed agent:
```bash
bin/agent-manager info <agent-name>
```

## Skill Reference

See `skills/agent-management/SKILL.md` for the full protocol.
