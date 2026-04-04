# /vibe

Activate the full **superomni** skill framework and launch the default guided workflow.

## Usage

```
/vibe              — activate all skills and show the guided workflow
/vibe status       — show which skills are active and pipeline position
/vibe reset        — restart the guided workflow from the beginning
```

## What Happens

1. Loads `skills/using-skills/SKILL.md` — the meta-skill that governs all others
2. Prints a welcome banner with the full sprint pipeline
3. Lists every available command with a one-line description
4. Prompts you for what you want to work on today

## Core Workflow Pipeline

```
brainstorm → write-plan → execute-plan → review
     ↑                                      |
     └──────────────────────────────────────┘
```

## All Available Commands

| Command | What it does |
|---------|-------------|
| `/vibe` | Activate the framework and launch the guided workflow |
| `/brainstorm` | Design a feature — produces `docs/superomni/specs/spec-[branch]-[session]-[date].md` |
| `/write-plan` | Turn a spec into an executable plan |
| `/execute-plan` | Run the plan step by step |
| `/review` | Structured code review |

## First-Time Setup

If superomni is not yet installed, run one of these in your terminal:

```bash
npm install -g github:Wilder1222/superomni   # recommended — installs globally from GitHub
# or
npx github:Wilder1222/superomni              # one-time run without permanent install
# or
git clone https://github.com/Wilder1222/superomni.git && cd superomni && ./setup
```

## Skill Reference

See `skills/using-skills/SKILL.md` for the full framework protocol.
