# /brainstorm

Trigger the **brainstorming** skill.

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

1. The brainstorming skill activates
2. The agent asks ONE clarifying question at a time
3. Multiple options are generated and evaluated
4. A visual diagram is created if helpful
5. A `spec.md` document is written
6. The spec is reviewed for quality

## Output

A reviewed `spec.md` file ready to feed into `/write-plan`.

## Skill Reference

See `skills/brainstorming/SKILL.md` for the full protocol.
