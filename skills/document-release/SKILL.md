---
name: document-release
description: |
  Post-ship documentation update. Cross-references the diff, updates README,
  ARCHITECTURE, CONTRIBUTING, CLAUDE.md to match what shipped. Polishes
  CHANGELOG voice, cleans up TODOs, optionally bumps VERSION.
  Triggers: "update docs", "sync documentation", "post-ship docs",
  "update the readme", "document what shipped".
  Proactively suggest after a PR is merged or code is shipped.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection
```bash
mkdir -p ~/.omni-skills/sessions
_PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_TEL_START=$(date +%s)
echo "Branch: $_BRANCH | PROACTIVE: $_PROACTIVE"
```

### PROACTIVE Mode
If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# /document-release — Post-Ship Documentation Update

**Goal:** After shipping, ensure all documentation matches what was actually built. Catch stale READMEs, outdated architecture docs, and missing CHANGELOG entries.

## Iron Law: Never Mark Docs Done Without Diff Cross-Reference

Always read the actual diff before updating docs. Docs written from memory drift from reality.

## Phase 1: Gather What Shipped

```bash
# What changed since last release/tag
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~20")..HEAD 2>/dev/null | head -30
git diff $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~20")..HEAD --stat 2>/dev/null | tail -20

# Or last N commits
git log --oneline -20
```

Build a mental model of what actually shipped:
- New features added
- APIs changed (added, removed, modified)
- Configuration changes
- Dependencies added/removed
- Breaking changes

## Phase 2: Audit Existing Docs

Find all documentation files:
```bash
find . -name "README.md" -o -name "CHANGELOG.md" -o -name "ARCHITECTURE.md" \
       -o -name "CONTRIBUTING.md" -o -name "CLAUDE.md" -o -name "AGENTS.md" \
       -o -name "docs/*.md" 2>/dev/null | grep -v node_modules | grep -v .git
```

For each doc, check:
- [ ] Does it reflect what shipped?
- [ ] Are installation instructions current?
- [ ] Are API examples accurate?
- [ ] Are feature lists complete?
- [ ] Are any sections obviously stale?

## Phase 3: Update README

Check the README for:
1. **Feature list** — add new features, remove removed ones
2. **Installation** — verify all install commands still work
3. **Usage examples** — update for any API changes
4. **Configuration** — new config options documented?
5. **Quick start** — still accurate end-to-end?

Edit directly: do not add "Updated on [date]" noise.

## Phase 4: Update CHANGELOG

If a CHANGELOG exists, add an entry for the current version:

```markdown
## [VERSION] — YYYY-MM-DD

### Added
- [Feature] — [one-line description]

### Changed
- [What changed] — [why]

### Fixed
- [Bug fixed] — [impact]

### Removed
- [What was removed] — [migration path if breaking]
```

Voice guidelines:
- Past tense ("Added X", not "Adds X")
- Lead with the user value, not the technical change
- Breaking changes get their own callout: `⚠️ BREAKING:`

## Phase 5: Update Architecture/Design Docs

If ARCHITECTURE.md, DESIGN.md, or docs/ exist:
1. Update component/module descriptions for anything that changed
2. Update data flow diagrams if data flows changed
3. Flag sections that are now stale but need more research to update

## Phase 6: Clean Up TODOs

```bash
# Find all TODOs in docs
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.md" . | grep -v node_modules | grep -v .git
```

For each TODO:
- If the thing was shipped → remove the TODO
- If still valid → leave it
- If no longer relevant → remove it

## Phase 7: VERSION Bump (Optional)

Ask the user if they want to bump the version:

```bash
# Check current version
cat package.json 2>/dev/null | grep '"version"' | head -1
cat VERSION 2>/dev/null
```

If yes, bump according to what shipped:
- New features, backward compatible → MINOR
- Bug fixes only → PATCH
- Breaking changes → MAJOR

## Output Format

```
DOCUMENT RELEASE COMPLETE
════════════════════════════════════════
Files updated:   [N]
  ✓ README.md       [summary of changes]
  ✓ CHANGELOG.md    [entry added for vX.Y.Z]
  ✓ [other files]
TODOs cleared:   [N]
VERSION:         [old] → [new] (or: unchanged)

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```
