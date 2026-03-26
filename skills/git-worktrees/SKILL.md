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
