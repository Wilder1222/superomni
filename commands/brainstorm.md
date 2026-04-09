# /brainstorm

Trigger the **brainstorm** skill.

Use this command when you want to:
- Design a new feature from scratch
- Think through a technical problem
- Create a specification document
- Explore multiple approaches to a problem

## How to Use

```
/brainstorm [topic]
```

Examples:
- `/brainstorm a user authentication system`
- `/brainstorm how to handle rate limiting in our API`
- `/brainstorm redesigning the checkout flow`

## What Happens

1. The brainstorm skill activates
2. The agent asks ONE clarifying question at a time
3. Multiple options are generated and evaluated
4. A visual diagram is created if helpful
5. A `docs/superomni/specs/spec-[branch]-[session]-[date].md` document is written
6. The spec is reviewed for quality
7. The flow stops for user spec approval (the only THINK gate)

## Output

A reviewed `docs/superomni/specs/spec-[branch]-[session]-[date].md` file ready for approval.

After approval, the workflow auto-advances in wave mode to PLAN and subsequent stages.

## Skill Reference

See `skills/brainstorm/SKILL.md` for the full protocol.
