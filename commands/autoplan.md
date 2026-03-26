# /autoplan

One command, fully reviewed plan out.

## Usage

```
/autoplan              — auto-review current plan.md
/autoplan <file>       — auto-review a specific plan file
```

## What Happens

Loads `skills/autoplan/SKILL.md` and runs the full review pipeline:
1. **Strategy review** — CEO lens: premises, scope, alternatives, risks
2. **Design review** — if UI changes: missing states, hierarchy, accessibility
3. **Engineering review** — data model, tests, error paths, security, performance

**Auto-decides** all mechanical questions using the 6 Decision Principles.
**Surfaces only taste decisions** at a final approval gate.

## When to Use

- After `/write-plan` — before starting to code
- When you want a rigorous plan review without answering 20+ questions
- Before handing off a plan to another developer or agent

## Compared to `/review`

`/review` reviews code. `/autoplan` reviews plans. Run autoplan before writing code, review after.
