---
name: security-audit
description: |
  Use when auditing code or systems for security vulnerabilities.
  Combines OWASP Top 10 checklist with STRIDE threat modeling.
  Triggers: "security audit", "security review", "threat model", "vulnerability scan".
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

Check proactive configuration:
```bash
_PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
```

**Legacy mode (single value):**
If `proactive=true`: auto-invoke skills. If `proactive=false`: ask first.

If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

**5-Level Trust Matrix (when configured):**

Before executing any decision, classify its tacit knowledge intensity:

| Decision Type | Config Key | Default | When to Use |
|--------------|------------|---------|-------------|
| Mechanical | proactive.mechanical | true | Iron Law applies, Gate Check is deterministic |
| Structural | proactive.structural | true | Architecture, interface, module boundaries |
| Stylistic | proactive.stylistic | ask | Naming, formatting, UI layout, comment style |
| Strategic | proactive.strategic | ask | Approach selection, architecture trade-offs |
| Destructive | proactive.destructive | false | Delete, overwrite, irreversible operations |

Classification rules:
- If a style profile exists (`docs/superomni/style-profiles/`), stylistic decisions
  that match the profile can be treated as mechanical
- Strategic decisions ALWAYS surface to user unless `proactive.strategic=true`
- Destructive decisions ALWAYS confirm (integrates with `careful` Skill) regardless of config

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Auto-Advance Rule

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT) auto-advance on DONE.

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
1. Scan for **current-session** context (only artifacts modified after session start):
   ```bash
   _SESSION_TS=$(cat ~/.omni-skills/sessions/current-session-ts 2>/dev/null || echo "0")
   # List recent artifacts, filtering by session timestamp
   for f in docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md; do
     [ -f "$f" ] || continue
     fts=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo "0")
     [ "$fts" -ge "$_SESSION_TS" ] 2>/dev/null && echo "$f"
   done
   git log --oneline -3 2>/dev/null
   ```
   To find the latest current-session spec or plan:
   ```bash
   _SESSION_TS=$(cat ~/.omni-skills/sessions/current-session-ts 2>/dev/null || echo "0")
   _LATEST_SPEC=""
   _LATEST_PLAN=""
   for f in $(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort); do
     fts=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo "0")
     [ "$fts" -ge "$_SESSION_TS" ] 2>/dev/null && _LATEST_SPEC="$f"
   done
   for f in $(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort); do
     fts=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo "0")
     [ "$fts" -ge "$_SESSION_TS" ] 2>/dev/null && _LATEST_PLAN="$f"
   done
   ```
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

### TACIT-DENSE Detection (Tacit Knowledge Density Check)

Before executing substantive decisions, check if any falls into these high-tacit-density categories.
These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
has enough tacit knowledge to judge correctly.

**D1 - Domain Expertise Decision**
  Trigger: Requires judgment in a specialized domain (security, compliance, legal, medical, financial)
  Examples: choosing encryption algorithm, deciding data retention policy, HIPAA compliance choice
  Action: State "TACIT-DENSE [D1]", present options with trade-offs, wait for user selection

**D2 - User-Facing Experience Decision**
  Trigger: Substantive choices about UI copy, interaction flow, error messaging, onboarding
  Examples: writing onboarding guidance text, choosing error message tone, designing empty states
  Action: Provide draft with explicit markers on parts needing user review

**D3 - Team Culture & Convention Decision**
  Trigger: Major choices about team workflow, naming conventions, documentation style, file organization
  Examples: naming convention for new module, choosing between monorepo approaches, doc format
  Action: Check docs/superomni/style-profiles/ first; if no profile, ask user

**D4 - Novel Pattern Decision**
  Trigger: Task type has fewer than 3 precedents in project execution history
  Examples: first-time integration of a new framework, first use of a new deployment target
  Action: Reduce autonomy — add intermediate checkpoints, present approach before executing

**Output format when TACIT-DENSE detected:**
```
TACIT-DENSE [D1/D2/D3/D4]: This is a [category] decision requiring your judgment.
Question: [single most important question]
My default recommendation: [recommendation + rationale]
Please confirm or share your preference.
```

**Relationship with careful skill:** careful handles "can we undo this?" (operational risk).
TACIT-DENSE handles "can we judge this correctly?" (knowledge risk). They are complementary.

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

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

# Security Audit

**Goal:** Systematically identify security vulnerabilities using OWASP Top 10 and STRIDE threat modeling, then produce an actionable report with severity ratings.

## Iron Law

**NEVER CLEAR A FINDING WITHOUT EVIDENCE.**

"I don't think this is exploitable" is not evidence. Evidence is: a specific test showing the input is sanitized, a configuration proving the feature is disabled, or a code path demonstrating the guard clause exists.

## Phase 1: Scope the Audit Surface

Before looking for vulnerabilities, map what you're protecting.

```bash
# Identify entry points (APIs, CLI, UI)
grep -rn "app\.get\|app\.post\|app\.put\|app\.delete\|router\." . \
  --include="*.js" --include="*.ts" --include="*.py" -l 2>/dev/null | head -20

# Find authentication/authorization code
grep -rn "auth\|login\|session\|token\|jwt\|password\|credential" . \
  --include="*.js" --include="*.ts" --include="*.py" --include="*.go" \
  -l 2>/dev/null | head -20

# Find data stores and connections
grep -rn "database\|mongoose\|sequelize\|prisma\|redis\|sql\|connect" . \
  --include="*.js" --include="*.ts" --include="*.py" --include="*.go" \
  -l 2>/dev/null | head -20

# Find configuration and secrets
find . -name "*.env*" -o -name "*.pem" -o -name "*.key" -o -name "*secret*" \
  2>/dev/null | grep -v "node_modules\|.git" | head -20
```

Document the attack surface:

```
AUDIT SURFACE
─────────────────────────────────
Entry points:       [list APIs, CLI, UI routes]
Auth boundaries:    [where auth is checked]
Data flows:         [input → processing → storage → output]
Trust boundaries:   [internal vs. external, user vs. admin]
Sensitive data:     [PII, credentials, tokens, financial]
─────────────────────────────────
```

## Phase 2: OWASP Top 10 Checklist

Work through each category. For each, check the codebase and record findings.

### A01: Broken Access Control

- [ ] Are all endpoints protected with authorization checks?
- [ ] Is there path traversal protection on file access?
- [ ] Are CORS policies correctly configured?
- [ ] Can users access other users' data by changing IDs?

```bash
# Check for missing auth middleware
grep -rn "app\.get\|app\.post\|router\." . --include="*.js" --include="*.ts" \
  -A 2 | grep -v "auth\|protect\|middleware\|guard" | head -20
```

### A02: Cryptographic Failures

- [ ] Is sensitive data encrypted at rest?
- [ ] Is TLS enforced for data in transit?
- [ ] Are passwords hashed with strong algorithms (bcrypt, argon2)?
- [ ] Are any weak algorithms used (MD5, SHA1 for security purposes)?

```bash
grep -rn "md5\|sha1\|DES\|RC4\|ECB" . \
  --include="*.js" --include="*.ts" --include="*.py" --include="*.go" \
  2>/dev/null | head -10
```

### A03: Injection

- [ ] SQL injection: are queries parameterized?
- [ ] Command injection: is user input passed to shell commands?
- [ ] XSS: is user output HTML-escaped?
- [ ] Template injection: are templates safe from user-controlled input?

```bash
# SQL injection risk
grep -rn "exec\|raw\|query.*+" . --include="*.js" --include="*.ts" --include="*.py" \
  | grep -v "node_modules" | head -20

# Command injection risk
grep -rn "exec(\|spawn(\|system(\|popen\|subprocess" . \
  --include="*.js" --include="*.ts" --include="*.py" \
  | grep -v "node_modules" | head -20
```

### A04: Insecure Design

- [ ] Is there rate limiting on authentication endpoints?
- [ ] Are business logic flows protected against abuse?
- [ ] Is there input validation beyond just type checking?

### A05: Security Misconfiguration

- [ ] Are debug modes disabled in production configs?
- [ ] Are default credentials changed?
- [ ] Are unnecessary features/ports/services disabled?
- [ ] Are security headers set (CSP, X-Frame-Options, etc.)?

```bash
# Check for debug/dev flags in production configs
grep -rn "debug.*true\|DEBUG=1\|NODE_ENV.*development" . \
  --include="*.env*" --include="*.yaml" --include="*.json" \
  | grep -v "node_modules\|.git" | head -10
```

### A06: Vulnerable and Outdated Components

Covered in Phase 4 (Dependency Audit).

### A07: Identification and Authentication Failures

- [ ] Are passwords enforced with minimum complexity?
- [ ] Is MFA available for sensitive operations?
- [ ] Are sessions invalidated on logout?
- [ ] Are session tokens rotated after authentication?

### A08: Software and Data Integrity Failures

- [ ] Are CI/CD pipelines protected from unauthorized changes?
- [ ] Are dependencies verified (lock files, checksums)?
- [ ] Is deserialization of untrusted data avoided?

```bash
# Check for unsafe deserialization
grep -rn "pickle\.load\|yaml\.load\|eval(\|JSON\.parse.*unvalidated" . \
  --include="*.py" --include="*.js" --include="*.ts" \
  | grep -v "node_modules" | head -10
```

### A09: Security Logging and Monitoring Failures

- [ ] Are authentication events logged?
- [ ] Are access control failures logged?
- [ ] Are logs protected from injection?
- [ ] Is there alerting on suspicious patterns?

### A10: Server-Side Request Forgery (SSRF)

- [ ] Are user-supplied URLs validated before fetching?
- [ ] Are internal network addresses blocked from user requests?
- [ ] Is URL scheme restricted (no file://, gopher://, etc.)?

```bash
# Check for SSRF risk
grep -rn "fetch(\|axios\|request(\|urllib\|http\.get" . \
  --include="*.js" --include="*.ts" --include="*.py" \
  | grep -v "node_modules" | head -10
```

## Phase 3: STRIDE Threat Model

For each trust boundary identified in Phase 1, evaluate all six STRIDE categories:

| Threat | Question | Example |
|--------|----------|---------|
| **S**poofing | Can an attacker pretend to be someone else? | Forged auth tokens, session hijacking |
| **T**ampering | Can an attacker modify data they shouldn't? | Unsigned API payloads, unprotected DB writes |
| **R**epudiation | Can an attacker deny their actions? | Missing audit logs, no transaction records |
| **I**nfo Disclosure | Can an attacker access data they shouldn't? | Verbose errors, exposed stack traces, directory listing |
| **D**enial of Service | Can an attacker make the system unavailable? | Unbound queries, no rate limiting, resource exhaustion |
| **E**levation of Privilege | Can an attacker gain higher access? | IDOR, privilege escalation, admin bypass |

For each finding:

```
STRIDE FINDING
─────────────────────────────────
Category:    [S/T/R/I/D/E]
Location:    [file:line or component]
Description: [what the threat is]
Exploitability: [how an attacker could use this]
Evidence:    [code snippet or configuration proving the issue]
─────────────────────────────────
```

## Phase 4: Dependency Audit

```bash
# Check for known CVEs in dependencies
npm audit 2>/dev/null || true
pip-audit 2>/dev/null || pip install pip-audit && pip-audit 2>/dev/null || true
go list -m -json all 2>/dev/null | head -50 || true

# Check dependency age and maintenance
npm outdated 2>/dev/null || pip list --outdated 2>/dev/null || true

# Verify lock files exist
ls -la package-lock.json yarn.lock pnpm-lock.yaml Pipfile.lock go.sum 2>/dev/null
```

For each vulnerable dependency:

```
DEPENDENCY FINDING
─────────────────────────────────
Package:     [name@version]
CVE:         [CVE-XXXX-XXXXX]
Severity:    [CRITICAL/HIGH/MEDIUM/LOW]
Fix:         [upgrade to version X.Y.Z | no fix available]
Exploitable: [yes — explain how | no — explain why not]
─────────────────────────────────
```

## Phase 5: Audit Report

```
SECURITY AUDIT REPORT
════════════════════════════════════════
Scope:           [what was audited]
Date:            [YYYY-MM-DD]
Method:          OWASP Top 10 + STRIDE + Dependency Audit

FINDINGS SUMMARY
────────────────────────────────────────
Critical:  [N]  — must fix before deploy
High:      [N]  — fix within 1 sprint
Medium:    [N]  — fix within 1 month
Low:       [N]  — track and address opportunistically
Info:      [N]  — no action required

CRITICAL FINDINGS
────────────────────────────────────────
[C1] [Title]
  Location:    [file:line]
  Category:    [OWASP/STRIDE category]
  Description: [what is wrong]
  Impact:      [what could happen]
  Remediation: [how to fix]
  Evidence:    [proof this is real]

HIGH FINDINGS
────────────────────────────────────────
[H1] [Title]
  [same format as critical]

DEPENDENCY VULNERABILITIES
────────────────────────────────────────
[list from Phase 4]

AREAS NOT COVERED
────────────────────────────────────────
[any areas that were out of scope or inaccessible]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
════════════════════════════════════════
```
