# /loop

Trigger the **loop** skill.

Use this command when you want the agent to iteratively optimize toward a
user-defined goal across multiple cycles.

## How to Use

```
/loop
/loop [goal]
/loop [iterations] [goal]
```

Examples:
- `/loop` (asks for goal, defaults to 3 iterations)
- `/loop improve CI reliability`
- `/loop 5 improve test coverage to 85%`

## Iteration Rules

- Default iterations: **3**
- Maximum iterations: **5**
- If user input is greater than 5, cap to 5 and continue
- Each iteration must read the previous loop state/result before planning next actions
- Stop early when the goal is effectively complete

## Trigger Paths

1. **Manual trigger** via `/loop`
2. **Post-vibe trigger** after a full workflow run (RELEASE complete), when vibe asks whether to start self-iteration

## Output

The loop skill writes artifacts to:

- `docs/superomni/loops/loop-state-[branch]-[session]-iter-[n]-[date].md`
- `docs/superomni/loops/loop-summary-[branch]-[session]-[date].md`

The summary includes completed iterations, stop reason, achieved progress, and next recommendations.

## Skill Reference

See `skills/loop/SKILL.md` for the full loop protocol.
