# /freeze

Restrict file edits to a specific directory for this session.

## Usage

```
/freeze                — set freeze boundary (prompts for directory)
/freeze src/           — freeze to src/ directory
/unfreeze              — remove the freeze boundary
```

## What Happens

Loads `skills/freeze/SKILL.md` and sets a scope boundary. Any attempt to edit files outside the boundary will be flagged and blocked.

## When to Use

- Debugging a specific module — prevent accidental "fixes" elsewhere
- Reviewing a PR — stay scoped to changed files
- Risky refactoring — guardrail against blast radius

## Pair With

- `/careful` — adds warnings for destructive commands
- Together (`/careful` + `/freeze`) = maximum safety for production work
