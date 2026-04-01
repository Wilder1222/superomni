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
   ls docs/superomni/spec.md docs/superomni/plan.md docs/superomni/ .superomni/ 2>/dev/null
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

### Context Window Management
Load context progressively — only what is needed for the current phase:

| Phase | Load these | Defer these |
|-------|-----------|------------|
| Planning | `docs/superomni/spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `docs/superomni/plan.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

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
