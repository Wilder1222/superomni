# /review

Trigger the **code-review** skill.

Use when reviewing code changes, pull requests, or preparing your code for
someone else's review.

## How to Use

```
/review                — review current branch changes against main
/review [file]         — review a specific file
/review --prepare      — self-check before requesting a review
```

Examples:
- `/review`
- `/review src/auth/login.ts`
- `/review --prepare`

## What Happens

1. Understand context — what changed and why
2. Layer 1: Correctness (P0)
3. Layer 2: Security (P0)
4. Layer 3: Tests (P0)
5. Layer 4: Code Quality (P1)
6. Layer 5: Blast Radius (P1)
7. Layer 6: Architecture (P2)
8. Produce a structured Code Review report with verdict

## Output

A **Code Review** report listing P0 issues (must fix), P1 issues (should fix),
P2 suggestions, security status, test adequacy, and a verdict:
`APPROVED`, `APPROVED_WITH_NOTES`, or `CHANGES_REQUESTED`.

## Skill Reference

See `skills/code-review/SKILL.md` for the full protocol.
See `skills/code-review/checklist.md` for the detailed checklist.
