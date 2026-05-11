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

## Brand-Style Guided Example

Use brand-style references in a controlled way so users can choose UI direction without cloning brand assets.

Example flow:

1. Offer style choices from the whitelist (for example: `Linear`, `Notion`, `Stripe`)
2. User picks one style direction
3. Load:
   - `skills/frontend-design/reference/design-md-adaptation.md`
   - one brand from `skills/frontend-design/reference/design-md-whitelist.md`
   - 1-2 principle references (typography/color/layout/etc.)
4. Identify impact scope before implementation:
   - **High impact:** color roles, typography hierarchy, spacing rhythm, motion tone
   - **Medium impact:** component styling defaults, interaction micro-patterns
   - **Low impact / protected:** branding assets, legal identity elements, proprietary copy
5. Execute deep adaptation fusion:
   - Keep transferable style language
   - Preserve existing engineering/accessibility constraints
   - Pass the existing 10-dimension quality gate

## Output

A focused frontend improvement result chosen automatically from your context, with one or more targeted enhancements applied.

## Skill Reference

See `skills/frontend-design/SKILL.md` for the full protocol.
