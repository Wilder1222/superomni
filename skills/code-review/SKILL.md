---
name: code-review
description: |
  Canonical review skill for code quality workflows.
  Modes: giving (review code), receiving (address review feedback), security (security-focused review).
  Triggers: "review this", "code review", "ready for PR", "check this code",
  "address review", "fix review comments", "respond to feedback",
  "security audit", "security review", "threat model", "vulnerability scan".
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

**Dispatch the `code-reviewer` agent** with the diff and relevant source files as input. The agent will perform a full P0/P1/P2 layered review (correctness, security, tests, quality, blast radius, architecture) applying the 6 Decision Principles. Incorporate the CODE REVIEW block it returns as the primary review output.

### Auto-Dispatch: `security-auditor` on Security-Sensitive Diffs

Before or alongside `code-reviewer`, detect security-sensitive changes:

```bash
git diff main...HEAD -- . | grep -iE \
  "password|secret|token|api[_-]?key|credential|auth|permission|role|privilege|\
  sql|query|exec\(|eval\(|req\.|request\.|sanitize|validate|escape|\
  cookie|session|jwt|oauth|hash|encrypt|decrypt|cipher|cors|crypt" \
  | grep -v "^Binary\|^---\|^+++" | head -20
```

**If any security-sensitive patterns are found**, also dispatch the `security-auditor` agent with the diff and relevant source files. Do NOT require an explicit `security` mode request — trigger it automatically.

**Auto-trigger `security-auditor` when the diff touches:**
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
- Invoke the **designer agent** for a full design review
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

For security-focused reviews, **dispatch the `security-auditor` agent** with the diff and relevant source files as input. The agent will run its full OWASP Top 10 / STRIDE audit process and return a SECURITY AUDIT REPORT block. Incorporate its findings directly into the review output.

The security-auditor agent covers:
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
