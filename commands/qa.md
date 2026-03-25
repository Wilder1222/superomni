# /qa

Trigger the **qa** skill.

Use when you want a thorough quality check of the current project or a specific
area — tests, lint, coverage, and manual spot-checks.

## How to Use

```
/qa                    — run the full quality audit
/qa tests              — focus on test health
/qa coverage           — check and report test coverage
/qa lint               — run linters and formatters
```

Examples:
- `/qa`
- `/qa tests`
- `/qa coverage`

## What Happens

1. Discover test runner, linter, and formatter for the project
2. Run the test suite and report pass/fail summary
3. Run linters and report violations
4. Check test coverage (if tooling exists)
5. Spot-check critical paths for missing tests
6. Produce a QA Report

## Output

A **QA Report** with test results, lint status, coverage percentage,
and a list of recommended improvements.

## Skill Reference

See `skills/qa/SKILL.md` (when available) for the full protocol.
