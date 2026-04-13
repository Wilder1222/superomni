# /front-design

Trigger the **frontend-design** skill with **automatic mode detection**.

Use this command when you want to:
- Keep a single UI optimization entrypoint
- Let the skill detect which design dimensions need attention
- Apply one or multiple frontend improvements in a single pass
- Optionally force a specific mode when needed

## How to Use

```
/front-design
```

Optional explicit mode hint:

```
/front-design mode:audit
/front-design mode:polish
/front-design mode:distill
```

Supported modes: `audit`, `critique`, `polish`, `distill`, `clarify`, `animate`, `colorize`, `harden`, `arrange`, `typeset`.

## What Happens

1. The frontend-design skill activates from one unified command
2. Current UI implementation is scanned across all 10 frontend dimensions
3. The system auto-detects highest-impact mode(s) for the current state
4. Relevant reference files and protocols are loaded
5. Improvements are applied in a priority sequence, not a fixed single-mode path
6. A quality gate verifies affected dimensions before completion

## Output

A focused frontend improvement result chosen automatically from your context, with one or more targeted enhancements applied.

## Skill Reference

See `skills/frontend-design/SKILL.md` for the full protocol.