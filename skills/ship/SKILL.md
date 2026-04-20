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

On session start, read: branch from `git branch --show-current`, proactive config from `bin/config get proactive` (default `true`), session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### PROACTIVE Mode

**Legacy mode (single value):**
If `proactive=true`: auto-invoke skills. If `proactive=false`: ask first.

If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

**5-Level Trust Matrix (when configured):**

Before executing any decision, classify its tacit knowledge intensity:

| Decision Type | Config Key | Default | When to Use |
|--------------|------------|---------|-------------|
| Mechanical | proactive.mechanical | true | Iron Law applies, Gate Check is deterministic |
| Structural | proactive.structural | true | Architecture, interface, module boundaries |
| Stylistic | proactive.stylistic | ask | Naming, formatting, UI layout, comment style |
| Strategic | proactive.strategic | ask | Approach selection, architecture trade-offs |
| Destructive | proactive.destructive | false | Delete, overwrite, irreversible operations |

Classification rules:
- If a style profile exists (`docs/superomni/style-profiles/`), stylistic decisions
  that match the profile can be treated as mechanical
- Strategic decisions ALWAYS surface to user unless `proactive.strategic=true`
- Destructive decisions ALWAYS confirm (integrates with `careful` Skill) regardless of config

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Auto-Advance Rule

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE) auto-advance on DONE.

| Status | At THINK stage (after spec generation) | At all other stages |
|--------|----------------------------------------|-------------------|
| **DONE** | STOP - present spec document for user review. Wait for user approval before advancing to PLAN. | Auto-advance - print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP - present concerns, wait for user decision | STOP - present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP - present blocker, wait for user | STOP - present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE -> advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

**Note:** The REVIEW stage (plan-review) runs fully automatically — all decisions (mechanical and taste) are auto-resolved using the 6 Decision Principles. No user input is requested during REVIEW.

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Read `~/.omni-skills/sessions/current-session-ts` to get session start timestamp. Find artifacts in `docs/superomni/specs/`, `docs/superomni/plans/` newer than that timestamp using `find -newer`. Check `git log --oneline -3`.
2. If current-session context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no current-session context → treat as a fresh session and offer the relevant skill from the
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

**Custom Input Option Rule:** Always append `Other — describe your own idea: ___` to predefined choice lists. Treat custom text as the chosen option; ask one clarifying question only if ambiguous.

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
Before reporting final status, answer: (1) **Process** — all phases followed? (2) **Evidence** — every claim backed by output or file reference? (3) **Scope** — stayed within task boundary? If any NO, address it or report DONE_WITH_CONCERNS. For full sprint evaluation, use `self-improvement`.

### TACIT-DENSE Detection (Tacit Knowledge Density Check)

Before executing substantive decisions, check if any falls into these high-tacit-density categories.
These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
has enough tacit knowledge to judge correctly.

| Category | Trigger | Action |
|----------|---------|--------|
| **D1** Domain Expertise | Security, compliance, legal, financial judgment | State `TACIT-DENSE [D1]`, present trade-offs, wait for user |
| **D2** User-Facing UX | UI copy, interaction flow, error messaging | Draft with explicit review markers |
| **D3** Team Culture | Workflow, naming conventions, file organization | Check `style-profiles/` first; ask if none |
| **D4** Novel Pattern | Fewer than 3 precedents in project history | Reduce autonomy, add checkpoints before executing |

When TACIT-DENSE detected, output: `TACIT-DENSE [D#]: [category] — [question] — My default: [recommendation]`

**Relationship with careful skill:** careful = "can we undo this?" (operational). TACIT-DENSE = "can we judge this correctly?" (knowledge). Complementary.

### Telemetry (Local Only)

At session end, log skill name, duration, and outcome to `~/.omni-skills/analytics/` via `bin/analytics-log`. Nothing is sent to external servers.

### Plan Mode Fallback

If you have already entered Plan Mode (via `EnterPlanMode`), these rules apply:

1. **Skills take precedence over plan mode.** Treat loaded skill instructions as executable steps, not reference material. Follow them exactly — do not summarize, skip, or reorder.
2. **STOP points in skills must be respected.** Do NOT call `ExitPlanMode` prematurely to bypass a skill's STOP/gate.
3. **Safe operations in plan mode** — these are always allowed because they inform the plan, not produce code:
   - Reading files, searching code, running `git log`/`git status`
   - Writing to `docs/superomni/` (specs, plans, reviews)
   - Writing to `~/.omni-skills/` (sessions, analytics)
4. **Route planning through vibe workflow.** Even inside plan mode, follow the pipeline: brainstorm → writing-plans → plan-review → executing-plans. Write the plan to `docs/superomni/plans/`, not to Claude's built-in plan file.
5. **ExitPlanMode timing:** Only call `ExitPlanMode` after the current skill workflow is complete and has reported a status (DONE/BLOCKED/etc).


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
