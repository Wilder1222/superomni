---
name: finishing-branch
description: |
  Use when a feature branch is complete and ready to merge.
  Performs final cleanup, verification, and merge preparation.
  Triggers: "finish branch", "ready to merge", "branch complete", "merge this".
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

### CRITICAL: No EnterPlanMode
When this skill is active, NEVER use Claude Code's built-in `EnterPlanMode` tool.
Use the superomni pipeline skills (`brainstorm`, `writing-plans`, `executing-plans`) instead.

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
