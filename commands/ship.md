# /ship

Trigger the **ship** skill.

Use when releasing software to production or publishing a package.

## How to Use

```
/ship              — start release workflow
/ship patch        — release as patch version
/ship minor        — release as minor version
/ship major        — release as major version
```

## What Happens

1. Pre-ship assessment (branch, uncommitted changes, CI status)
2. Version bump (semantic versioning)
3. Changelog update
4. Final verification (tests, build, security)
5. Tag the release
6. Push and publish
7. Verify deployment
8. Announce (if applicable)

## Output

Version bump, changelog, tag, and deployment. A **Ship Report** summarizing
version, branch, test status, build result, and any post-ship concerns.

## Skill Reference

See `skills/ship/SKILL.md` for the full protocol.
