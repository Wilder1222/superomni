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

On session start, read: branch from `git branch --show-current`, session timestamp from `~/.omni-skills/sessions/current-session-ts`.

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

### Anti-Sycophancy Rules

Never say these — they are sycophantic filler that delays real analysis:
- "That's an interesting approach" → Take a position instead
- "There are many ways to think about this" → Pick one, state what evidence would change your mind
- "You might want to consider..." → Say "This is wrong because..." or "This works because..."
- "That could work" → Say whether it WILL work based on evidence
- "I can see why you'd think that" → If they're wrong, say so and why

Always do:
- Take a position on every significant question. State the position AND what evidence would change it.
- If the user's approach has a flaw, name the flaw directly before suggesting alternatives.
- Calibrated acknowledgment only: if an answer is specific and evidence-based, name what was good and pivot to the next hard question.

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
