# /execute-plan

Trigger the **executing-plans** skill.

Use this command when you want to:
- Execute an existing implementation plan step by step
- Follow a plan with verification at each step
- Track progress through a complex implementation

## How to Use

```
/execute-plan [plan file path]
```

Examples:
- `/execute-plan` (looks for docs/superomni/plans/plan-*.md automatically)
- `/execute-plan docs/superomni/plans/plan-*.md`

## What Happens

1. The executing-plans skill activates
2. The plan file is loaded and verified
3. Prerequisites are confirmed
4. Steps are executed ONE AT A TIME
5. Each step is verified before moving to the next
6. Any deviations from the plan are surfaced immediately
7. Progress is reported after every 3 steps
8. Verification skill is triggered on completion

## Output

- All steps completed with evidence
- Execution report artifact in `docs/superomni/executions/execution-[branch]-[session]-[date].md` (steps completed, files changed, deviations)
- Triggers verification skill automatically

If BUILD artifact evidence is missing, do not auto-advance.

## Handling Deviations

If the plan is wrong or needs changes, the agent will STOP and explain:
- What the plan said
- What reality requires
- Options for proceeding

You decide, then execution continues.

## Skill Reference

See `skills/executing-plans/SKILL.md` for the full protocol.
