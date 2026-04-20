# /release

Combined **RELEASE** stage — ship the software and capture retrospective in one step.

## Usage

```
/release    — run full release + retrospective workflow
```

## What Happens

1. Pre-release assessment (branch, tests, blockers)
2. Version bump, changelog, tag & publish
3. Retrospective: tacit gap mining, sprint analysis, process improvements
4. Writes a single artifact: `docs/superomni/releases/release-[branch]-[session]-[date].md`
   - `## Release` section: version, changelog, deployment evidence, rollback plan
   - `## Retrospective` section: what went well, slowdowns, process changes, next sprint

## Pipeline Position

```
THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE
                                              ^^^^^^
                                           (this command)
```

RELEASE is the final stage. It replaces the former SHIP + REFLECT two-step sequence.

## Stage Artifact

`docs/superomni/releases/release-[branch]-[session]-[date].md`

Both `## Release` and `## Retrospective` sections must be populated before DONE is reported.

## Skill Reference

See `skills/release/SKILL.md` for the full protocol.
