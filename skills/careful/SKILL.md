---
name: careful
description: |
  Safety guardrails that activate before high-risk operations.
  Prevents destructive, irreversible, or security-sensitive changes without explicit confirmation.
  Triggers: destructive operations, production configs, database migrations, security-sensitive files, "be careful", "careful mode".
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

### Planning Route
If you feel the impulse to call `EnterPlanMode`, invoke `brainstorm` (for design) or `writing-plans` (for plans) instead. All planning flows through superomni skills.

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

# Careful — Safety Guardrails

**Goal:** Prevent costly mistakes by enforcing risk assessment, blast radius calculation, and user confirmation before any high-risk operation.

## Iron Law

**ALWAYS CONFIRM BEFORE DESTRUCTIVE OPERATIONS.**

Never execute a destructive, irreversible, or security-sensitive operation without explicit user approval. "I assumed it was fine" is never an acceptable justification for data loss or a security incident.

## Trigger Conditions

This skill activates automatically when any of the following are detected:

### Destructive Operations
- `rm -rf`, `DROP TABLE`, `DELETE FROM` without `WHERE`
- `git push --force`, `git reset --hard`, branch deletion
- Overwriting files without backup
- Truncating logs or databases

### Production-Touching Changes
- Editing files matching `*prod*`, `*production*`, `*.env.prod*`
- Modifying deployment configs (`Dockerfile`, `docker-compose.yml`, `k8s/*.yaml`)
- Changing CI/CD pipelines (`.github/workflows/*`, `Jenkinsfile`, `.gitlab-ci.yml`)
- Updating infrastructure-as-code (`*.tf`, `*.tfvars`, `cloudformation*`)

### Security-Sensitive Files
- Anything containing secrets, keys, tokens, or credentials
- Auth/authorization logic
- Encryption configuration
- CORS or CSP policies
- `.env` files, certificate files, key stores

### Database Migrations
- Schema changes (`ALTER TABLE`, `ADD COLUMN`, `DROP COLUMN`)
- Data migrations that transform existing records
- Index changes on large tables
- Any migration that cannot be rolled back

## Phase 1: Risk Assessment

When a trigger condition is detected, STOP and assess:

```
⚠️  HIGH-RISK OPERATION DETECTED
─────────────────────────────────
Operation:   [what you're about to do]
Trigger:     [which trigger condition matched]
Files:       [files that will be affected]
```

Answer these questions:
1. **What could go wrong?** — list specific failure modes
2. **What is the worst-case outcome?** — data loss? downtime? security breach?
3. **Has this been done before?** — is there precedent in the project?

## Phase 2: Blast Radius Calculation

Determine how much of the system this change affects.

```bash
# For code changes: who depends on this?
grep -rl "$(basename <changed-file> | sed 's/\..*//')" . \
  --include="*.js" --include="*.ts" --include="*.py" --include="*.go" \
  2>/dev/null | grep -v "node_modules\|.git" | wc -l

# For config changes: what environments are affected?
grep -l "<config-key>" . -r --include="*.env*" --include="*.yaml" --include="*.json" \
  2>/dev/null | head -10

# For database changes: how many rows affected?
# (estimate or query with EXPLAIN before executing)
```

```
BLAST RADIUS
─────────────────────────────────
Scope:           [LOCAL/MODULE/SERVICE/GLOBAL]
Files affected:  [N direct, N indirect]
Users affected:  [none/some/all]
Environments:    [dev/staging/production]
Estimated impact: [LOW/MEDIUM/HIGH/CRITICAL]
─────────────────────────────────
```

### Blast Radius Scale

| Level | Meaning | Approval needed |
|-------|---------|----------------|
| **LOCAL** | Only the changed file is affected | Proceed with caution |
| **MODULE** | Other files in the same module are affected | Review before proceeding |
| **SERVICE** | Other services or APIs could be affected | User confirmation required |
| **GLOBAL** | Production, all users, or infrastructure affected | Explicit user approval + rollback plan |

## Phase 3: Reversibility Check

Before proceeding, confirm the operation can be undone.

| Question | Answer |
|----------|--------|
| Can this be reverted with `git revert`? | [yes/no] |
| Is there a database backup? | [yes/no/N/A] |
| Can the deployment be rolled back? | [yes/no/N/A] |
| Is there a feature flag to disable this? | [yes/no/N/A] |
| What is the recovery time if this goes wrong? | [minutes/hours/days/never] |

```
REVERSIBILITY
─────────────────────────────────
Reversible:       [YES/PARTIAL/NO]
Rollback method:  [git revert / backup restore / feature flag / manual]
Recovery time:    [estimate]
Data loss risk:   [NONE/POSSIBLE/CERTAIN]
─────────────────────────────────
```

If **Reversible = NO** and **Blast Radius = SERVICE or GLOBAL**:
→ **STOP. Do not proceed without explicit user approval AND a mitigation plan.**

## Phase 4: User Confirmation Gate

Present the risk summary and wait for explicit approval.

```
╔══════════════════════════════════════╗
║  ⚠️  CONFIRMATION REQUIRED           ║
╠══════════════════════════════════════╣
║                                      ║
║  Operation:   [description]          ║
║  Blast radius: [level]               ║
║  Reversible:  [yes/partial/no]       ║
║  Risk:        [LOW/MEDIUM/HIGH/CRIT] ║
║                                      ║
║  Worst case:  [what could happen]    ║
║  Mitigation:  [how to recover]       ║
║                                      ║
║  Proceed? (yes/no)                   ║
║                                      ║
╚══════════════════════════════════════╝
```

**Do not proceed until the user explicitly confirms.**

If the user confirms:
1. Create a backup or snapshot if possible
2. Execute the operation
3. Verify the outcome immediately
4. Report the result

If the user declines:
1. Propose a safer alternative
2. Or report BLOCKED with explanation

## Automatic Safe Defaults

When in doubt, apply these defaults:

| Situation | Safe default |
|-----------|-------------|
| Delete file vs. rename/move | Rename to `.bak` first |
| Force push vs. regular push | Regular push (fail if rejected) |
| Drop column vs. deprecate | Deprecate first, drop later |
| Edit production config | Edit staging first, verify, then production |
| Run migration | Run on dev/staging first, verify, then production |
| Overwrite file | Create backup copy first |

## Report

```
CAREFUL ASSESSMENT
════════════════════════════════════════
Operation:        [what was requested]
Trigger:          [what activated this skill]
Blast radius:     [LOCAL/MODULE/SERVICE/GLOBAL]
Reversibility:    [YES/PARTIAL/NO]
Risk level:       [LOW/MEDIUM/HIGH/CRITICAL]
User confirmed:   [yes/no/not yet]
Outcome:          [executed successfully / blocked / alternative proposed]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
════════════════════════════════════════
```
