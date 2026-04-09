# /style-capture

Trigger the **style-capture** skill.

Use this command when you want to:
- Teach the agent your code style preferences through examples
- Create a style profile for consistent code generation
- Update style preferences based on new reference examples

## How to Use

```
/style-capture [scope]
```

Examples:
- `/style-capture` — capture project-wide style
- `/style-capture frontend` — capture frontend-specific style
- `/style-capture api` — capture API-specific style

## What Happens

1. Agent asks for 3-5 examples of code you consider "good"
2. Optionally asks for 1-2 "bad" examples for contrast
3. Analyzes examples across 6 style dimensions
4. Generates `docs/superomni/style-profiles/<scope>.md`
5. Creates prompt fragment for downstream skill reference

## Output

- `docs/superomni/style-profiles/<scope>.md` — full style profile
- `docs/superomni/style-profiles/prompt-<scope>.md` — distilled prompt fragment

## Skill Reference

See `skills/style-capture/SKILL.md` for the full protocol.
