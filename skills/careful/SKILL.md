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
