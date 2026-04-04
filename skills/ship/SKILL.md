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

### Auto-Advance Rule

Pipeline stage order: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT

**REVIEW is the only human gate.** All other stages auto-advance on DONE.

| Status | At REVIEW stage | At all other stages |
|--------|----------------|-------------------|
| **DONE** | STOP — present review summary, wait for user input (Y / N / revision notes) | Auto-advance — print `[STAGE] DONE → advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP — present concerns, wait for user decision | STOP — present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP — present blocker, wait for user | STOP — present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md docs/superomni/ .superomni/ 2>/dev/null | head -20
   git log --oneline -3 2>/dev/null
   ```
   To find the latest spec or plan:
   ```bash
   _LATEST_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
   _LATEST_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Question Confirmation Protocol

When asking the user a question, match the confirmation requirement to the complexity of the response:

| Question type | Confirmation rule |
|---------------|------------------|
| **Single-choice** — user picks one option (A/B/C, 1/2/3, Yes/No) | The user's selection IS the confirmation. Do NOT ask "Are you sure?" or require a second submission. |
| **Free-text input** — user types a value and presses Enter | The submitted text IS the confirmation. No secondary prompt needed. |
| **Multi-choice** — user selects multiple items from a list | After the user lists their selections, ask once: "Confirm these selections? (Y to proceed)" before acting. |
| **Complex / open-ended discussion** — back-and-forth clarification | Collect all input, then present a summary and ask: "Ready to proceed with the above? (Y/N)" before acting. |

**Rule: never add a redundant confirmation layer on top of a single-choice or text-input answer.**

**Custom Input Option Rule:** Whenever you present a predefined list of choices (A/B/C, numbered options, etc.), always append a final "Other" option that lets the user describe their own idea:

```
  [last letter/number + 1]) Other — describe your own idea: ___________
```

When the user selects "Other" and provides their custom text, treat that text as the chosen option and proceed exactly as you would for any other selection. If the custom text is ambiguous, ask one clarifying question before proceeding.

### Context Window Management
Load context progressively — only what is needed for the current phase:

| Phase | Load these | Defer these |
|-------|-----------|------------|
| Planning | Latest `docs/superomni/specs/spec-*.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | Latest `docs/superomni/plans/plan-*.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

### Output Directory
All skill artifacts are written to `docs/superomni/` (relative to project root).
See the Document Output Convention in CLAUDE.md for the full directory map.

### Feedback Signal Protocol
Agent failures are harness signals — not reasons to retry the same approach:

- **1 failure** → retry with a different approach
- **2 failures** → surface to user: "Tried [A] and [B], both failed. Recommend [C]."
- **3 consecutive failures** → STOP. Report BLOCKED. Treat as a harness deficiency signal.
  Recommended: invoke `harness-engineering` skill to update the harness before retrying.
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

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
npm run gen-skills 2>&1 | tail -10
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
