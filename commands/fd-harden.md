# /fd-harden

Trigger the **frontend-design** skill in **harden mode**.

Use this command when you want to:
- Add error boundaries and graceful failure states
- Implement loading skeletons and empty states
- Prepare text for internationalization and RTL layouts
- Add fallback fonts and defensive UI patterns

## How to Use

```
/fd-harden
```

Examples:
- `/fd-harden` before shipping a feature that lacks error handling
- `/fd-harden` on a component that breaks silently when data is missing

## What Happens

1. The frontend-design skill activates in harden mode
2. Error boundaries are added around failure-prone components
3. Loading states and skeleton screens are implemented
4. Empty states are designed with helpful guidance
5. Text is made i18n-ready with externalized strings
6. RTL layout support and fallback fonts are added
7. Changes are applied and verified

## Output

A hardened UI with error boundaries, loading states, empty states, i18n-ready text, RTL support, and fallback fonts.

## Skill Reference

See `skills/frontend-design/SKILL.md` for the full protocol.
