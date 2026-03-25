# /investigate

Trigger the **investigate** skill.

Use for open-ended exploration of unfamiliar codebases, systems, or problem
spaces. For known bugs or errors, use `/debug` instead.

## How to Use

```
/investigate                — start a guided investigation of the current project
/investigate [topic]        — investigate a specific area or question
/investigate --map          — produce a system map of the codebase
```

Examples:
- `/investigate how authentication works`
- `/investigate the data pipeline`
- `/investigate --map`

## What Happens

1. Orient — understand the big picture (README, structure, stack)
2. Map entry points — find where users or callers interact with the system
3. Trace a representative path end to end
4. Identify key modules and their responsibilities
5. Find hotspots and risk areas
6. Document findings in an Investigation Report

## Output

An **Investigation Report** with overview, key findings, hotspots/risks,
unknowns, and recommended next steps.

## Skill Reference

See `skills/investigate/SKILL.md` for the full protocol.
