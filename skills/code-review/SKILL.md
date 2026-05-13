---
name: code-review
description: |
  Structured P0/P1/P2 code review of WRITTEN CODE (not plans). Three modes: giving / receiving / security. Triggers: "review this code", "ready for PR", "address review", "security audit". NOT for reviewing plans — use plan-review for that.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use after code is written to review changes, address review feedback, or audit for security. NOT for reviewing implementation plans before build — that is plan-review's job.
produces: "docs/superomni/reviews/review-[branch]-[session]-[date].md"
consumes:
  - "docs/superomni/executions/execution-[branch]-[session]-[date].md"
dispatch-agent: planner-reviewer
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

# Code Review

**Goal:** Provide structured, actionable code review feedback that improves quality without blocking momentum.

## Consolidated Modes

`code-review` is the canonical review skill. Similar flows are handled by mode:

- `giving` (default): standard code/PR review.
- `receiving`: apply and respond to review feedback.
- `security`: run security-prioritized review with OWASP/STRIDE depth.

## Review Principles

Grounded in the 6 Decision Principles:
1. **Completeness** — are edge cases covered?
2. **Blast radius** — does this change break more than it fixes?
3. **Pragmatic** — is there a simpler approach that achieves the same goal?
4. **DRY** — does this duplicate existing functionality?
5. **Explicit** — is the code readable without comments explaining "what"?
6. **Bias toward action** — flag concerns but don't block needlessly

## Before Reviewing: Understand Context

```bash
# See what changed
git diff main...HEAD --stat
git diff main...HEAD

# Understand the scope
git log main...HEAD --oneline
```

Questions to answer before reviewing:
- What was the intent of this change?
- What spec/ticket does this implement?
- What is the blast radius of this change?

**Dispatch the `planner-reviewer` agent** with the diff and relevant source files as input. The agent will perform a full P0/P1/P2 layered review (correctness, security, tests, quality, blast radius, architecture) applying the 6 Decision Principles. Incorporate the CODE REVIEW block it returns as the primary review output.

### Auto-Dispatch: `planner-reviewer` (security mode) on Security-Sensitive Diffs

Before or alongside the main code review dispatch, detect security-sensitive changes:

```bash
git diff main...HEAD -- . | grep -iE \
  "password|secret|token|api[_-]?key|credential|auth|permission|role|privilege|\
  sql|query|exec\(|eval\(|req\.|request\.|sanitize|validate|escape|\
  cookie|session|jwt|oauth|hash|encrypt|decrypt|cipher|cors|crypt" \
  | grep -v "^Binary\|^---\|^+++" | head -20
```

**If any security-sensitive patterns are found**, also dispatch the `planner-reviewer` agent in **security audit mode** with the diff and relevant source files. Do NOT require an explicit `security` mode request — trigger it automatically. (Security audit content was consolidated from the retired `security-auditor` agent into `planner-reviewer`.)

**Auto-trigger the security-mode dispatch when the diff touches:**
- Authentication or authorization logic
- Input validation, parsing, or sanitization
- Cryptographic operations (hashing, encryption, tokens, keys)
- Database queries or raw SQL
- External API calls or network requests
- Session or cookie management

## Review Layers (in priority order)

### Layer 1: Correctness (P0 — blocks merge)

- [ ] Does it do what the spec says?
- [ ] Are all acceptance criteria met?
- [ ] Are error paths handled?
- [ ] Are there any obvious bugs?
- [ ] Are edge cases handled?

### Layer 2: Security (P0 — blocks merge)

- [ ] No hardcoded secrets or credentials?
- [ ] Input validation on external data?
- [ ] SQL/command injection prevented?
- [ ] Authentication/authorization enforced?
- [ ] No sensitive data in logs?

See `requesting-review.md` for security-specific review checklist.

### Layer 3: Tests (P0 — blocks merge if missing)

- [ ] Tests are present
- [ ] Tests verify behavior, not implementation
- [ ] Tests are independent
- [ ] New edge cases have tests
- [ ] No anti-patterns (see `testing-anti-patterns.md`)

### Layer 4: Code Quality (P1 — should fix)

- [ ] Code is readable without comments explaining "what"
- [ ] Names are descriptive and accurate
- [ ] No unnecessary complexity
- [ ] DRY — no unneeded duplication
- [ ] Follows existing codebase patterns

### Layer 5: Blast Radius (P1 — flag if high)

- [ ] How many files are changed?
- [ ] Does any change affect shared utilities or core modules?
- [ ] Are any behavior changes unintended?
- [ ] Would this break any callers not in the diff?

```bash
# Check blast radius
git diff main...HEAD --stat | tail -1
# Find all files that import a changed module
grep -r "from './changedModule'" . --include="*.ts" --include="*.js" -l
```

### UI Change Detection

If the diff includes files matching `*.html`, `*.jsx`, `*.tsx`, `*.vue`, `*.svelte`, `*.css`, `*.scss`, or `*.less`:
- Invoke the **frontend-designer agent** for a full design review
- Include all 10 dimension scores in the review output
- Flag any dimension scoring < 7 as a P1 issue
- Apply the AI Slop detection checklist

### Layer 6: Architecture (P2 — consider)

- [ ] Is this in the right layer/module?
- [ ] Are dependencies appropriate?
- [ ] Does this introduce tech debt?

### Post-Review: Refactoring Opportunity Detection

If Layer 4 or Layer 6 finds significant structural issues (≥ 3 P1/P2 code quality findings, duplicate code, God objects, or functions > 50 lines), **dispatch the `refactoring-agent`** alongside the review to produce a concrete refactoring plan. This allows the developer to address structural debt in a safe, separate refactoring pass without mixing cleanup into the feature branch.

## Review Output Format

```
CODE REVIEW
════════════════════════════════════════
PR/Branch: [name]
Files changed: [N]
Blast radius: [LOW/MEDIUM/HIGH]

P0 ISSUES (must fix before merge):
  [file:line] — [Issue description]

P1 ISSUES (should fix):
  [file:line] — [Recommendation]

P2 SUGGESTIONS (optional improvement):
  [file:line] — [Suggestion]

SECURITY: CLEAN | REVIEW_NEEDED
  [Any security notes]

TESTS: ADEQUATE | NEEDS_COVERAGE
  [Test coverage assessment]

DECISION QUESTIONS:
  - [Taste decision requiring owner input]

VERDICT: APPROVED | APPROVED_WITH_NOTES | CHANGES_REQUESTED
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
[1-sentence summary]
════════════════════════════════════════
```

## Preparing Code for Review

Before requesting a review, self-check:

```bash
# Clean up before submitting
git diff HEAD | grep -E "console\.log|debugger|TODO|FIXME|print\(" | head -10

# Verify tests pass
npm test 2>&1 | tail -5

# Check diff is clean
git diff main...HEAD --stat
```

See `requesting-review.md` for how to request and respond to reviews.

## Mode: Receiving (Merged)

When review feedback arrives, run this receiving workflow inside `code-review`:

1. Triage comments into `P0`/`P1`/`P2`.
2. Fix all `P0` first, then `P1`.
3. For disagreements, restate reviewer intent and provide a concrete alternative.
4. Re-run tests and summarize changes by comment.

Receiving output block:

```
REVIEW RESPONSE
════════════════════════════════════════
P0 fixed:
  [file:line] — [change]

P1 fixed:
  [file:line] — [change]

P2 discussed:
  [file:line] — [decision + rationale]

Retest: PASS | FAIL
Ready for re-review: YES | NO
════════════════════════════════════════
```

## Mode: Security (Merged)

For security-focused reviews, **dispatch the `planner-reviewer` agent** in **security audit mode** with the diff and relevant source files as input. The agent will run the full OWASP Top 10 / STRIDE audit process and return a SECURITY AUDIT REPORT block. Incorporate its findings directly into the review output.

The planner-reviewer security audit mode covers:
1. Attack surface map (entry points, auth boundaries, sensitive data paths).
2. OWASP Top 10 checklist pass.
3. STRIDE-oriented threat notes for high-risk flows.
4. Explicit exploitability statement for each finding.

Security finding format (from agent output):

```
SECURITY FINDING [ID]
Severity: P0 | P1 | P2
Category: [OWASP/STRIDE]
Location: [file:line]
Exploit scenario: [how it can be abused]
Recommended fix: [specific remediation]
Evidence: [code/path/output]
```

## Save Review Document

After completing the review, save the full review output as a Markdown document:

```bash
_REVIEW_DATE=$(date +%Y%m%d-%H%M%S)
_REVIEW_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")

# Extract session from the matching plan file (mirrors plan-review convention)
_PLAN_FILE=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
if [ -n "$_PLAN_FILE" ]; then
  _PLAN_BASE=$(basename "$_PLAN_FILE" .md)
  _REVIEW_SESSION=$(echo "$_PLAN_BASE" | sed -E "s/^plan-${_REVIEW_BRANCH}-//" | sed -E 's/-[0-9]{8}$//')
fi
[ -z "$_REVIEW_SESSION" ] && _REVIEW_SESSION="code-review"

_REVIEW_FILE="code-review-${_REVIEW_BRANCH}-${_REVIEW_SESSION}-${_REVIEW_DATE}.md"
mkdir -p docs/superomni/reviews
```

Write the full CODE REVIEW block (formatted as Markdown) to `docs/superomni/reviews/${_REVIEW_FILE}`. This file serves as the permanent record of the review for the user to revisit.
