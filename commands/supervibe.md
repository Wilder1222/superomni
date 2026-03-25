# /supervibe

Activate the full **super-omni** skill framework and launch the default guided workflow.

## Usage

```
/supervibe              — activate all skills and show the guided workflow
/supervibe status       — show which skills are active and pipeline position
/supervibe reset        — restart the guided workflow from the beginning
```

## What Happens

1. Loads `skills/using-skills/SKILL.md` — the meta-skill that governs all others
2. Prints a welcome banner with the full sprint pipeline
3. Lists every available command with a one-line description
4. Prompts you for what you want to work on today

## Default Sprint Pipeline

```
brainstorm → write-plan → execute-plan → review → ship
     ↑                                      |
     └───── retro ◄─────────────────────────┘
```

Supporting skills available at any stage:
- `/investigate` — explore unfamiliar code
- `/qa`          — quality assurance pass
- `/security`    — security audit
- `/workflow`    — full sprint status and next-step recommendation

## All Available Commands

| Command | What it does |
|---------|-------------|
| `/brainstorm` | Design a feature — produces `spec.md` |
| `/write-plan` | Turn a spec into an executable plan |
| `/execute-plan` | Run the plan step by step |
| `/review` | Structured code review |
| `/ship` | Release workflow with semantic versioning + changelog |
| `/retro` | Weekly engineering retrospective |
| `/investigate` | Explore unfamiliar code or a codebase |
| `/workflow` | Sprint pipeline status and next-step guidance |
| `/qa` | Quality assurance pass |
| `/security` | Security audit (OWASP-aware) |
| `/list-skills` | List all built-in and installed marketplace skills |
| `/install-skill` | Install a skill from a URL or local path |
| `/list-agents` | List all available agents |
| `/install-agent` | Install an agent from GitHub or local file |
| `/create-agent` | Scaffold a new custom agent |
| `/plugin add marketplace` | Install the full super-omni framework or a marketplace skill |

## First-Time Setup

If super-omni is not yet installed, run one of these in your terminal:

```bash
npm install -g super-omni        # recommended — installs globally from npm
# or
npx super-omni                   # one-time run without permanent install
# or
git clone https://github.com/Wilder1222/super-omni.git ~/.claude/skills/super-omni && cd ~/.claude/skills/super-omni && ./setup
```

Or from within Claude Code:

```text
/plugin add marketplace super-omni
```

## Skill Reference

See `skills/using-skills/SKILL.md` for the full framework protocol.
