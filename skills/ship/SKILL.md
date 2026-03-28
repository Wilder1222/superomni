---
name: ship
description: |
  Complete release workflow: verify → build → test → deploy → announce.
  Use when releasing software to production or any public environment.
  Triggers: "/ship", "deploy", "release", "ship this", "publish".
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

### Session Continuity
After reporting any terminal status (DONE / DONE_WITH_CONCERNS), **always** close with a
"What's next?" line that names the next logical superomni skill:

```
What's next → [skill-name]: [one-sentence reason]
```

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls spec.md plan.md .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

### Performance Checkpoint
After completing any skill session, run a 3-question self-check before writing the final status:

1. **Process** — Did I follow all defined phases? If any were skipped, state why.
2. **Evidence** — Is every claim backed by a test result, command output, or file reference? If not, gather the missing evidence now.
3. **Scope** — Did I stay within the task boundary? If I touched files outside the original scope, flag them explicitly.

If any answer is NO, address it before reporting DONE. If it cannot be addressed, report DONE_WITH_CONCERNS and name the gap.

For a full performance evaluation spanning the entire sprint, use the `self-improvement` skill.

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# /ship — Release Workflow

**Goal:** Safely release software through a structured, verifiable process.

## Iron Law: Never Skip Verification

Every step that can fail will fail. The release checklist exists because "it looked fine" is not acceptable for production.

## Pre-Ship Assessment

Before running the release workflow, assess:

```bash
# Current state
git status --short         # any uncommitted changes?
git log origin/main..HEAD --oneline  # commits ahead of main?
git stash list             # any stashed work?
```

Confirm:
- [ ] On the correct branch (or tag)
- [ ] No uncommitted changes
- [ ] All tests pass on CI (check CI status)
- [ ] No open P0 issues blocking this release

## Step 1: Version Bump

```bash
# Check current version
cat package.json 2>/dev/null | grep '"version"'
# or
cat VERSION 2>/dev/null
# or
grep "^version" pyproject.toml 2>/dev/null

# Determine next version (semantic versioning)
# MAJOR: breaking changes
# MINOR: new features, backward compatible
# PATCH: bug fixes, backward compatible
```

```bash
# Bump version (example for npm)
npm version patch  # or minor, major
# or manually edit the version file
```

## Step 2: Changelog

Update `CHANGELOG.md` (or equivalent):

```markdown
## [vX.Y.Z] — YYYY-MM-DD

### Added
- [New features]

### Fixed
- [Bug fixes]

### Changed
- [Behavior changes]

### Removed
- [Deprecated items removed]
```

```bash
# Generate from commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "${LAST_TAG}" ]; then
  echo "Changes since ${LAST_TAG}:"
  git log "${LAST_TAG}..HEAD" --oneline --author="$(git config user.email)"
fi
```

## Step 3: Final Verification

Run the full verification checklist:

```bash
# Full test suite
npm test 2>&1 | tail -20
# or: pytest -v && or: go test ./...

# Build verification (if applicable)
npm run build 2>&1 | tail -10
# or: go build ./... or: python -m build
```

Confirm:
- [ ] All tests pass
- [ ] Build succeeds (if applicable)
- [ ] No security vulnerabilities in dependencies
- [ ] No breaking changes without major version bump

## Step 4: Tag the Release

```bash
VERSION="v$(cat package.json | grep '"version"' | cut -d'"' -f4 2>/dev/null || echo "0.1.0")"

# Create annotated tag
git tag -a "${VERSION}" -m "Release ${VERSION}

$(cat CHANGELOG.md | head -20)"

echo "Tagged: ${VERSION}"
git tag -l | tail -5  # verify
```

## Step 5: Push and Publish

```bash
# Push commits and tag
git push origin HEAD
git push origin "${VERSION}"

# Publish to package registry (if applicable)
# npm publish
# or: pip publish (twine)
# or: gh release create ${VERSION}

# Create GitHub release (if using GitHub)
gh release create "${VERSION}" \
  --title "Release ${VERSION}" \
  --notes "$(cat CHANGELOG.md | awk '/^## \[/{count++; if(count==2)exit} count==1{print}')" \
  --latest
```

## Step 6: Verify Deployment

After release:

```bash
# For web deployments: health check
# curl -f https://your-app.com/health || echo "HEALTH CHECK FAILED"

# For npm: verify published
# npm view <package> version

# For GitHub: verify release page
gh release view "${VERSION}"
```

## Step 7: Announce (if applicable)

Prepare release announcement:

```
RELEASE ANNOUNCEMENT: ${VERSION}
════════════════════════════════════════
What's new:
  [bullet points from changelog]

Upgrade instructions:
  npm install <package>@${VERSION}
  # or pip install <package>==${VERSION}

Breaking changes:
  [list or "none"]
════════════════════════════════════════
```

## Rollback Plan

If something goes wrong after release:

```bash
# Rollback to previous version
PREV_TAG=$(git tag -l 'v*' | sort -V | tail -2 | head -1)
echo "Rolling back to: ${PREV_TAG}"

# Revert the release tag
git tag -d "${VERSION}"
git push origin --delete "${VERSION}"

# Deploy previous version
# [deployment-specific command]
```

## Ship Report

```
SHIP REPORT
════════════════════════════════════════
Version:     [vX.Y.Z]
Branch:      [branch name]
Commits:     [N since last release]
Tests:       [all passing]
Build:       [success | N/A]
Tagged:      [tag name]
Published:   [where]
Health:      [checked | N/A]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Concerns:
  - [any post-ship concerns]
════════════════════════════════════════
```
