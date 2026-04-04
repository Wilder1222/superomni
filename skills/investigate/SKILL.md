---
name: investigate
description: |
  Use for open-ended exploration and investigation of unfamiliar codebases,
  systems, or problems. Complements systematic-debugging (which is for known errors).
  Use investigate when: "how does X work", "understand this codebase", "map this system".
  Triggers: "investigate", "explore", "understand how", "map the codebase".
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

# Investigate

**Goal:** Build a shared, accurate mental model of an unfamiliar system, codebase, or problem space.

**Distinction from systematic-debugging:**
- `investigate` → you don't have a specific error; you're building understanding
- `systematic-debugging` → you have a specific error and need to find root cause

## Phase 1: Orient

Start by understanding the big picture before any details.

```bash
# Project structure overview
find . -type f -name "*.md" | head -20  # documentation
ls -la                                   # top-level files
cat README.md 2>/dev/null | head -50     # quick overview
cat package.json 2>/dev/null             # or Makefile, go.mod, etc.

# Technology stack
ls -la *.json *.yaml *.toml *.rb *.py *.go 2>/dev/null | head -20

# Size estimate
find . -type f | grep -v ".git\|node_modules\|dist\|build" | wc -l
```

Output: **"System overview: ..."** — 3-5 sentence description of what this system is.

## Phase 2: Map Entry Points

Find where the system starts and where users/callers interact with it:

```bash
# Find main entry points
grep -rn "main()\|app.listen\|server.listen\|createApp\|bootstrap" . \
  --include="*.js" --include="*.ts" --include="*.py" --include="*.go" \
  -l | head -10

# Find API routes
grep -rn "router\.\|app\.get\|app\.post\|@route\|@app\.route" . \
  --include="*.js" --include="*.ts" --include="*.py" -l | head -10

# Find CLI commands
grep -rn "commander\|yargs\|argparse\|click\|cobra" . \
  --include="*.js" --include="*.ts" --include="*.py" --include="*.go" \
  -l | head -10
```

## Phase 3: Trace a Representative Path

Pick ONE representative flow (the most common user action) and trace it end to end:

1. **Input** — where does it enter the system?
2. **Processing** — what transforms it?
3. **Storage/Side effects** — what does it change?
4. **Output** — what does the user/caller receive back?

```bash
# Trace a specific function through the codebase
FUNCTION_NAME="handleRequest"
grep -rn "${FUNCTION_NAME}" . --include="*.js" --include="*.ts" -A 3 | head -30
```

## Phase 4: Identify Key Modules

Map the key components and their responsibilities:

```
SYSTEM MAP
════════════════════════════════════════
Entry points:    [list]
Core modules:    [list with 1-line descriptions]
Data stores:     [DBs, caches, files]
External deps:   [APIs, services, libraries]
Test coverage:   [rough %]
════════════════════════════════════════
```

## Phase 5: Find Hotspots and Risk Areas

```bash
# Most-changed files (hotspots)
git log --oneline | wc -l  # commit count
git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20

# Largest files (complexity hotspots)
find . -name "*.js" -o -name "*.ts" -o -name "*.py" | \
  xargs wc -l 2>/dev/null | sort -rn | head -10

# Files with most TODOs
grep -rn "TODO\|FIXME\|HACK\|XXX" . \
  --include="*.js" --include="*.ts" --include="*.py" | wc -l
```

## Phase 6: Document Findings

Write a brief investigation summary:

```
INVESTIGATION REPORT
════════════════════════════════════════
Subject:     [what was investigated]
Time spent:  [~N minutes]

Overview:
  [3-5 sentences describing the system]

Key findings:
  - [finding 1]
  - [finding 2]
  - [finding 3]

Hotspots/risks:
  - [file/area]: [why it's risky]

Unknown/unclear:
  - [thing that wasn't resolved]

Recommended next steps:
  1. [action based on findings]
  2. [action based on findings]

Status: DONE | NEEDS_CONTEXT
════════════════════════════════════════
```

## Useful Investigation Commands

```bash
# Count lines of code by file type
find . -name "*.js" | xargs wc -l | tail -1  # JavaScript
find . -name "*.py" | xargs wc -l | tail -1  # Python

# Find all configuration files
find . -name "*.env*" -o -name "*.config.*" -o -name "*.yaml" -o -name "*.toml" | \
  grep -v "node_modules\|.git" | head -20

# Find database schema
find . -name "*.sql" -o -name "schema.*" -o -name "*migration*" | \
  grep -v "node_modules\|.git" | head -10

# Understand test coverage
find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*.py" | \
  grep -v "node_modules" | wc -l
```
