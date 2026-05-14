---
name: release
description: |
  Combined RELEASE stage (ship + retrospective) in a single artifact. Triggers: "/release", "end sprint", "ship and reflect". Replaces the retired ship skill.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use to close a sprint: version bump, changelog, tag, push, publish, and retrospective — all in one artifact.
argument-hint: "[version]"
disable-model-invocation: true
produces: "docs/superomni/releases/release-[branch]-[session]-[date].md"
consumes:
  - "docs/superomni/evaluations/evaluation-[branch]-[session]-[date].md"
  - "docs/superomni/production-readiness/production-readiness-[branch]-[session]-[date].md"
---


<!-- Inlined into every SKILL.md via {{PREAMBLE_CORE}}. Keep ≤30 lines. -->

## Preamble (Core)

**Status protocol** — end every session with one of: `DONE` (evidence provided) · `DONE_WITH_CONCERNS` (list each) · `BLOCKED` (state what blocks you) · `NEEDS_CONTEXT` (state what you need).

**Auto-advance** — pipeline: `THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE`. Only human gate is spec approval at THINK. On `DONE` at other stages, print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and invoke the next skill. On any non-DONE status at any stage, STOP.

**Output directory** — all artifacts go in `docs/superomni/<kind>/<kind>-[branch]-[session]-[date].md`. See `CLAUDE.md` for the full directory map.

**TACIT-DENSE** — before high-tacit decisions, classify D1 (domain expertise) · D2 (user-facing UX) · D3 (team culture) · D4 (novel pattern). On hit, output `TACIT-DENSE [D#]: [question] — My default: [recommendation]`. See reference for actions.

**Anti-sycophancy** — take a position on every significant question. Name flaws directly. No filler ("that's interesting", "you might consider", "that could work").

**Telemetry (local only)** — at session end, log `bin/analytics-log`. Nothing leaves the machine.

_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._

# /release — Release & Retrospective

**Goal:** Close the sprint by shipping the software and capturing what was learned — in one combined step.

## Iron Law: Release Evidence Required

Never mark RELEASE as DONE without both sections populated in the artifact.
`## Release` without `## Retrospective` is incomplete. Both are required.

## Phase 1: Pre-Release Assessment

```bash
git status --short
git log origin/main..HEAD --oneline
git stash list
```

Confirm:
- [ ] On correct branch, no uncommitted changes
- [ ] All tests pass (check CI or run locally)
- [ ] No open P0 blockers

## Phase 2: Release Section

### Version Bump

```bash
# Check current version
cat package.json 2>/dev/null | grep '"version"'
cat VERSION 2>/dev/null
```

Determine next version (semver: MAJOR.MINOR.PATCH).

### Changelog

Update `CHANGELOG.md`:

```markdown
## [vX.Y.Z] — YYYY-MM-DD

### Added
- [New features]

### Fixed
- [Bug fixes]

### Changed
- [Behavior changes]
```

```bash
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
[ -n "$LAST_TAG" ] && git log "${LAST_TAG}..HEAD" --oneline
```

### Tag & Publish

```bash
VERSION="v$(cat package.json | grep '"version"' | cut -d'"' -f4)"
git tag -a "${VERSION}" -m "Release ${VERSION}"
git push origin HEAD && git push origin "${VERSION}"
gh release create "${VERSION}" --title "Release ${VERSION}" --latest 2>/dev/null || true
```

### Verify Deployment

```bash
gh release view "${VERSION}" 2>/dev/null || echo "No GitHub release (OK if not using gh)"
```

## Phase 3: Retrospective Section

### Tacit Gap Mining

```bash
# Recurring review comments
for review in docs/superomni/reviews/review-*.md; do
  [ -f "$review" ] && grep -h "^- " "$review" 2>/dev/null
done | sort | uniq -c | sort -rn | head -10

# Session deviations
for exec in docs/superomni/executions/execution-*.md; do
  [ -f "$exec" ] && grep -h -A1 "CONCERN\|DEVIATION\|override" "$exec" 2>/dev/null
done | head -10
```

### Sprint Evidence

```bash
SINCE="7 days ago"
git log --oneline --since="${SINCE}" 2>/dev/null | head -20
find docs/superomni -name "*.md" -newer docs/superomni/plans/plan-*.md 2>/dev/null | head -10
```

### Retrospective Analysis

Answer these with evidence:
- What went well? (cite specific steps or artifacts)
- What slowed us down? (cite blockers or deviations)
- What process rule should change? (cite root cause)
- What tacit knowledge was surfaced? (D1-D4 categories)

## Phase 4: Write Combined Artifact

```bash
_REL_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_REL_SESSION="<kebab-case-from-context>"
_REL_DATE=$(date +%Y%m%d)
mkdir -p docs/superomni/releases
_REL_FILE="docs/superomni/releases/release-${_REL_BRANCH}-${_REL_SESSION}-${_REL_DATE}.md"
```

Write `$_REL_FILE` with this structure:

```markdown
# Release: [session] — [version]

**Date:** [date]
**Branch:** [branch]

## Release

### Version
[vX.Y.Z]

### What Shipped
[bullet points from changelog]

### Deployment Evidence
[tag created, release URL, health check result]

### Rollback Plan
[how to revert if needed]

## Retrospective

### What Went Well
- [item with evidence]

### What Slowed Us Down
- [item with evidence]

### Process Changes
- [proposed rule change or Iron Law update]

### Tacit Knowledge Captured
- [D1/D2/D3/D4 gap → proposed rule]

### Next Sprint Suggestions
- [actionable item]
```

## Phase 5: Report

```
RELEASE COMPLETE
════════════════════════════════════════
Version:      [vX.Y.Z]
Artifact:     [release file path]
## Release:   [populated ✓]
## Retro:     [populated ✓]

Status: DONE | DONE_WITH_CONCERNS
Concerns:
  - [any post-release concerns]
════════════════════════════════════════
```