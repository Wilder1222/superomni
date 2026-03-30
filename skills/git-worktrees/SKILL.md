---
name: git-worktrees
description: |
  Use when working on multiple features or branches simultaneously.
  Git worktrees allow multiple branches to be checked out at the same time.
  Triggers: "work on multiple features", "parallel branches", "worktree".
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

# Git Worktrees

**Goal:** Set up and manage Git worktrees to enable parallel development on multiple branches without stashing or switching.

## When to Use Worktrees

- Working on multiple features at the same time
- Reviewing a colleague's branch while your own is in progress
- Running tests on one branch while developing on another
- Maintaining a hotfix branch alongside feature development

## Core Commands

### Create a Worktree

```bash
# Create worktree for an existing branch
git worktree add ../project-feature-name feature/branch-name

# Create worktree AND a new branch
git worktree add -b feature/new-feature ../project-new-feature main

# List all worktrees
git worktree list
```

### Navigate Between Worktrees

```bash
# Worktrees are separate directories — just cd
cd ../project-feature-name    # switch to feature worktree
cd ../project-main             # switch back to main worktree

# Or use absolute paths
ls ~/work/project-*/           # see all worktrees
```

### Clean Up Worktrees

```bash
# Remove a worktree directory AND deregister it
git worktree remove ../project-feature-name

# If the worktree directory was manually deleted
git worktree prune

# List with details to find stale entries
git worktree list --porcelain
```

## Worktree Naming Convention

Use a consistent naming pattern:
```
<project-root>-<branch-slug>
```

Examples:
```
/work/myapp               ← main worktree (default)
/work/myapp-feat-auth     ← feature/authentication
/work/myapp-fix-login     ← fix/login-bug
/work/myapp-review-123    ← PR #123 review
```

## Standard Workflow

### Step 1: Create the Worktree

```bash
BRANCH_SLUG=$(echo "feature/my-feature" | tr '/' '-' | tr '_' '-')
git worktree add -b "feature/my-feature" "../$(basename $(pwd))-${BRANCH_SLUG}" main
echo "Worktree created at: ../$(basename $(pwd))-${BRANCH_SLUG}"
```

### Step 2: Set Up the Worktree Environment

```bash
cd "../$(basename $(pwd))-${BRANCH_SLUG}"

# Install dependencies if needed (for Node.js projects)
[ -f package.json ] && npm install

# Copy any local env files
[ -f ../<main-project>/.env.local ] && cp ../<main-project>/.env.local .env.local
```

### Step 3: Develop in the Worktree

Work normally. The worktree is a fully independent checkout.

```bash
git status              # shows branch: feature/my-feature
git log --oneline -5    # shows branch history
```

### Step 4: Sync with Main

```bash
# From within the worktree
git fetch origin
git rebase origin/main
# or
git merge origin/main
```

### Step 5: Clean Up When Done

```bash
# From the MAIN worktree (not the feature worktree)
git worktree remove ../myapp-feature-my-feature
git branch -d feature/my-feature  # if merged
```

## Caveats

- Each worktree uses disk space (full working directory)
- Some tools (IDEs, file watchers) may need to be opened per-worktree
- Git hooks run independently per worktree
- Cannot checkout the same branch in two worktrees simultaneously

## Integration with Sub-Agents

When using worktrees with sub-agents, assign each agent to a worktree:

```
Sub-Agent 1 → worktree: ../project-feat-auth
Sub-Agent 2 → worktree: ../project-feat-payments
Main Agent  → worktree: ../project (main, for integration)
```

See `dispatching-parallel` skill for coordinating parallel sub-agents.
