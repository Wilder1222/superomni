---
name: retro
description: |
  Engineering retrospective. Analyzes commit history, work patterns,
  code quality metrics, session detection, streak tracking.
  Triggers: "/retro", "weekly retro", "what did we ship", "engineering retrospective".
allowed-tools: [Bash, Read, Write, Glob]
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

# /retro — Engineering Retrospective

**Goal:** Understand what was shipped, patterns in how you work, and trends over time.

## Arguments

- `/retro` — last 7 days (default)
- `/retro 24h` — last 24 hours
- `/retro 14d` — last 14 days
- `/retro 30d` — last 30 days
- `/retro compare` — compare this period vs prior period

## Step 1: Setup

```bash
# Ensure we're up to date
DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | grep "HEAD branch" | cut -d: -f2 | tr -d ' ' || echo "main")
git fetch origin "${DEFAULT_BRANCH}" --quiet 2>/dev/null || true

# Get author identity
AUTHOR_NAME=$(git config user.name)
AUTHOR_EMAIL=$(git config user.email)
echo "Retrospective for: ${AUTHOR_NAME} <${AUTHOR_EMAIL}>"
```

## Step 2: Gather Commit Data

```bash
# Set period (adjust SINCE based on argument)
SINCE="7 days ago"  # change based on /retro argument

# Commit log for the period
git log --oneline --since="${SINCE}" --author="${AUTHOR_EMAIL}" 2>/dev/null | head -100

# Detailed stats
git log --since="${SINCE}" --author="${AUTHOR_EMAIL}" \
  --pretty=format:"%h|%ad|%s" --date=short \
  --numstat 2>/dev/null | head -200
```

## Step 3: Core Metrics

Calculate and display:

```
METRICS
════════════════════════════════════════
Period:          [date range]
Commits:         [N]
Net LOC:         +[N] added / -[N] deleted
Files changed:   [N unique files]
Active days:     [N out of N days in period]
```

```bash
# Commit count
git log --oneline --since="${SINCE}" --author="${AUTHOR_EMAIL}" | wc -l

# LOC stats
git log --since="${SINCE}" --author="${AUTHOR_EMAIL}" \
  --pretty=tformat: --numstat | \
  awk '{ add += $1; del += $2 } END { printf "+%s / -%s\n", add, del }'

# Active days
git log --since="${SINCE}" --author="${AUTHOR_EMAIL}" \
  --pretty=format:"%ad" --date=short | sort -u | wc -l
```

## Step 4: Session Detection

Identify work sessions (gap threshold: 45 minutes between commits = new session):

```bash
# Get commit timestamps in epoch seconds
git log --since="${SINCE}" --author="${AUTHOR_EMAIL}" \
  --pretty=format:"%at" | sort -n
```

From timestamps, calculate:
- Number of sessions (commits >45 min apart = new session)
- Average session length
- Longest session
- Most productive session (most commits)

## Step 5: Time Distribution

Show when work happens (hourly histogram):

```bash
git log --since="${SINCE}" --author="${AUTHOR_EMAIL}" \
  --pretty=format:"%ad" --date=format:"%H" | \
  sort | uniq -c | sort -k2 -n
```

Display as a simple bar chart:
```
00  ██ (2)
09  ████████ (8)
10  ██████████████ (14)
...
```

## Step 6: Commit Type Breakdown

Classify commits by conventional commit type:

```bash
git log --oneline --since="${SINCE}" --author="${AUTHOR_EMAIL}" | \
  grep -oE "^[a-f0-9]+ (feat|fix|refactor|test|docs|chore|build|ci)" | \
  awk '{print $2}' | sort | uniq -c | sort -rn
```

```
Commit types:
  feat:     [N] ([%])
  fix:      [N] ([%])
  refactor: [N] ([%])
  test:     [N] ([%])
  other:    [N] ([%])
```

## Step 7: Hotspot Analysis

Top most-changed files in the period:

```bash
git log --since="${SINCE}" --author="${AUTHOR_EMAIL}" \
  --pretty=tformat: --name-only | \
  sort | uniq -c | sort -rn | head -10
```

## Step 8: Streak Tracking

Calculate consecutive active days:

```bash
# Get all active dates in the last 90 days
git log --since="90 days ago" --author="${AUTHOR_EMAIL}" \
  --pretty=format:"%ad" --date=short | sort -u
```

Report:
```
Streak:     [N] consecutive active days
Best streak: [N days] (dates)
```

## Step 9: Ship of the Week

Identify the most significant commit (by diff size or PR merge):

```bash
git log --since="${SINCE}" --author="${AUTHOR_EMAIL}" \
  --pretty=format:"%h %s" --shortstat | head -30
```

## Step 10: Save Report

```bash
RETRO_DIR=".context/retros"
mkdir -p "${RETRO_DIR}"
RETRO_FILE="${RETRO_DIR}/$(date +%Y-%m-%d).md"
```

Write the full report to the file and print a summary.

## Optional: Period Comparison

If `/retro compare` was invoked:

```bash
# Current period vs prior period
# Current: last 7 days
# Prior: 7-14 days ago
git log --since="14 days ago" --until="7 days ago" \
  --author="${AUTHOR_EMAIL}" --oneline | wc -l
```

Show delta for each metric: `↑ 23% commits`, `↓ 10% LOC`, etc.

## Final Report Format

```
RETRO REPORT — [period]
════════════════════════════════════════
Commits:      [N]
Net LOC:      +[N] / -[N]
Active days:  [N/7]
Sessions:     [N] (~[avg]h each)
Streak:       [N] days

Commit types: feat [N] | fix [N] | refactor [N] | test [N]

Ship of the week:
  [commit message and impact]

Hottest files:
  [file 1] — [N changes]
  [file 2] — [N changes]

Peak hours:  [hour range]

[if compare]
vs last period: commits [+/-N%] | LOC [+/-N%] | sessions [+/-N]

Saved to: [retro file path]
════════════════════════════════════════
```
