# /document-release

Update all project documentation after shipping.

## Usage

```
/document-release              — update docs to match what shipped
/document-release --dry-run    — show what would be updated (no writes)
```

## What Happens

Loads `skills/document-release/SKILL.md` and:
1. Reads the git diff since last tag/release
2. Audits all documentation files (README, CHANGELOG, ARCHITECTURE, etc.)
3. Updates docs to match what was actually shipped
4. Polishes CHANGELOG voice
5. Cleans up resolved TODOs
6. Optionally bumps VERSION

## When to Use

After any merge or release. Automatically invoked by the `release` skill as part of the RELEASE stage, or run standalone when docs need a targeted update without a full release cycle.

## Files Updated

- `README.md` — feature list, installation, usage examples
- `CHANGELOG.md` — new entry for this version
- `ARCHITECTURE.md` / `DESIGN.md` — if architecture changed
- `CONTRIBUTING.md` — if dev workflow changed
- `CLAUDE.md` / `AGENTS.md` — if agents or skills changed
