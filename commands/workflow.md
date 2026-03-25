# /workflow

Show the full sprint pipeline and suggest what to do next.

## How to Use

```
/workflow              — show the full sprint pipeline
/workflow next         — suggest next skill to use based on current state
/workflow status       — show progress through the pipeline
```

## The Sprint Pipeline

```
brainstorm → write-plan → execute-plan → review → ship
     ↑                                      |
     └───── retro ◄─────────────────────────┘
```

Supporting skills available at any stage:
- `/investigate` — explore unfamiliar code
- `/debug` — fix a specific bug
- `/qa` — run quality checks
- `/security` — audit for vulnerabilities

## What Happens

- **`/workflow`** — prints the pipeline and highlights your current stage
- **`/workflow next`** — inspects branch state, recent commits, and open
  plans to recommend the most useful next skill
- **`/workflow status`** — summarizes what has been completed and what remains

## Output

A visual pipeline with your current position and a recommended next action.

## Skill Reference

See `skills/workflow/SKILL.md` (when available) for the full protocol.
