---
name: git-worktrees
description: |
  Use when working on multiple features or branches simultaneously.
  Git worktrees allow multiple branches to be checked out at the same time.
  Triggers: "work on multiple features", "parallel branches", "worktree".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use when working on multiple branches in parallel. Sets up isolated worktrees so concurrent sub-agents can work without stepping on each other.
produces: ~
consumes: ~
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

See `subagent-development` skill for coordinating parallel sub-agents (includes wave planning).

## Completion Status

When the requested worktree setup or cleanup is complete, report:

```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Concern:
  - [path conflict, missing branch, or follow-up needed]
```