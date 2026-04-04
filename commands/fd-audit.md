# /fd-audit

Trigger the **frontend-design** skill in **audit mode**.

Use this command when you want to:
- Check WCAG compliance and color contrast ratios
- Verify keyboard navigation and screen reader support
- Identify performance bottlenecks in your UI
- Ensure accessibility standards are met before release

## How to Use

```
/fd-audit
```

Examples:
- `/fd-audit` on a login form to check contrast and tab order
- `/fd-audit` before launch to catch accessibility regressions

## What Happens

1. The frontend-design skill activates in audit mode
2. Interaction-design and responsive-design references are loaded
3. Current code is audited for WCAG compliance, color contrast, and keyboard navigation
4. Performance bottlenecks are identified and profiled
5. A report of issues is generated with specific fixes for each
6. Changes are applied and verified

## Output

An audit report listing accessibility and performance issues with actionable fixes applied to the codebase.

## Skill Reference

See `skills/frontend-design/SKILL.md` for the full protocol.
