---
name: finishing-branch
description: |
  Use when a feature branch is complete and ready to merge.
  Performs final cleanup, verification, and merge preparation.
  Triggers: "finish branch", "ready to merge", "branch complete", "merge this".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use when a feature branch is complete and ready to merge: final cleanup, sync with main, squash, and PR creation. NOT for authoring the full release — use release for that.
produces: ~
consumes:
  - "docs/superomni/evaluations/evaluation-[branch]-[session]-[date].md"
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

# Finishing a Branch

**Goal:** Safely and cleanly finish a feature branch and prepare it for merge.

## The Finishing Checklist

Before merging any branch, complete all items:

### 1. Verify Work is Complete

- [ ] All acceptance criteria from the spec/plan are met
- [ ] Run verification skill: all checks pass
- [ ] No TODOs left that block the feature

```bash
git diff HEAD | grep -E "TODO|FIXME|HACK|XXX" | grep -v "test\|spec" | head -10
```

### 2. Clean Up the Branch

- [ ] Remove debug code

```bash
# Check for debug artifacts
git diff main...HEAD | grep -E "console\.log|debugger|print\(|pry\|binding.pry|byebug" | head -10
```

- [ ] Clean up temporary files
```bash
git status --short | grep "^?" | head -10  # untracked files
```

### 3. Tests Pass

```bash
# Run full test suite
npm test 2>&1 | tail -10
# or
pytest -v 2>&1 | tail -10
# or
go test ./... 2>&1 | tail -10
```

### 4. Sync with Main/Target Branch

```bash
# Fetch latest
git fetch origin

# Rebase (preferred for clean history)
git rebase origin/main
# or merge if rebase is too complex
git merge origin/main

# Resolve any conflicts using systematic-debugging skill if needed
```

### 5. Final Diff Review

```bash
# Review everything you're about to merge
git diff main...HEAD --stat
git diff main...HEAD | head -100
git log main...HEAD --oneline
```

Checklist:
- [ ] All changed files are intentional
- [ ] No unintended changes to unrelated files
- [ ] Commit messages are descriptive

### 6. Squash/Clean Commits (if needed)

```bash
# Interactive rebase to squash messy commits
git rebase -i origin/main

# Clean commit message format:
# <type>(<scope>): <description>
# feat(auth): add JWT refresh token rotation
# fix(api): handle null user in /profile endpoint
# test(auth): add token expiry edge case tests
```

Commit types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

### 7. Create/Update PR

```bash
# Push to remote
git push origin HEAD

# If PR doesn't exist yet, create it:
gh pr create --title "feat: [description]" --body "$(cat <<'EOF'
## What
[What this PR does]

## Why
[Why this change is needed]

## Testing
[How it was tested]

## Blast Radius
[What this could affect]
EOF
)"

# If PR exists, update it:
gh pr view --web  # review in browser
```

### 8. Request Review (if needed)

See `code-review` skill for how to prepare code for review.
See `requesting-review.md` for how to write the review request.

## Merge Strategy Guide

| Situation | Strategy | Why |
|-----------|----------|-----|
| Clean history desired | Squash merge | One commit per feature |
| Full history matters | Merge commit | Preserves all commits |
| Rebased, fast-forward OK | Rebase + fast-forward | Cleanest linear history |
| Hotfix | Merge commit | Clear in history |

## Post-Merge Cleanup

After merge:

```bash
# Delete local branch
git branch -d feature/branch-name

# Delete remote branch
git push origin --delete feature/branch-name

# Clean up any worktrees
git worktree prune
git worktree list  # confirm clean
```

## Status Report

```
BRANCH COMPLETE
════════════════════════════════════════
Branch:     [branch name]
Commits:    [N commits]
Files:      [N files changed]
Tests:      [N passing, 0 failing]
PR:         [URL or N/A]
Status:     DONE | DONE_WITH_CONCERNS
Concerns:
  - [any notes]
════════════════════════════════════════
```