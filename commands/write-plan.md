# /write-plan

Trigger the **writing-plans** skill.

Use this command when you want to:
- Turn a spec or idea into an executable implementation plan
- Plan a complex feature before coding
- Create a step-by-step guide for implementation

## How to Use

```
/write-plan [description or spec file path]
```

Examples:
- `/write-plan` (when a spec.md already exists)
- `/write-plan the authentication feature from spec.md`
- `/write-plan add rate limiting to the API`

## What Happens

1. The writing-plans skill activates
2. Scope and constraints are identified
3. Completeness check is applied
4. A structured `plan.md` is written with steps, files, and verification criteria
5. The 6 Decision Principles are applied
6. The plan is reviewed by the plan-document-reviewer

## Output

A reviewed `plan.md` file with:
- Numbered steps
- Exact files to touch
- Verification criteria per step
- Test strategy
- Rollback plan
- Success criteria

Ready to feed into `/execute-plan`.

## Skill Reference

See `skills/writing-plans/SKILL.md` for the full protocol.
