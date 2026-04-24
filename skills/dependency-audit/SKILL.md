---
name: dependency-audit
description: |
  Dependency security, license, and freshness audit.
  Dispatches dependency-auditor agent to scan all package managers.
  Triggers: "dependency audit", "check dependencies", "npm audit", "security scan",
  "check for vulnerabilities", "outdated packages", "license check".
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

# Dependency Audit

**Goal:** Systematically audit all project dependencies for security vulnerabilities, license compliance, and staleness — then produce an actionable remediation plan.

## Iron Law: No P0 CVEs Before Deploy

A dependency with a known critical CVE and an available fix is a P0 blocker. No exceptions. The deployment gate is `VERDICT: APPROVED` from the dependency-auditor report.

### Good Example (Proper Audit Gate)

```
Production Readiness check includes dependency audit
dependency-auditor finds: express@4.17.1 — CVE-2022-24999 (critical) — fix: express@4.18.2
Action: npm update express@4.18.2 → re-audit → APPROVED
Deploy proceeds
```

### Bad Example (AVOID)

```
"Audit passed last month, skip for now"
[VIOLATED: CVEs are disclosed daily — audit must happen before every deploy]
```

---

## Phase 1: Package Manager Discovery

Identify all dependency manifests in the project:

```bash
# Find all package manifests
echo "=== npm/node ==="
find . -name "package.json" -not -path "*/node_modules/*" | head -5

echo "=== python ==="
find . \( -name "requirements*.txt" -o -name "Pipfile" -o -name "pyproject.toml" \) \
  -not -path "*/.git/*" | head -5

echo "=== go ==="
find . -name "go.mod" -not -path "*/.git/*" | head -3

echo "=== ruby ==="
find . -name "Gemfile" -not -path "*/.git/*" | head -3

echo "=== rust ==="
find . -name "Cargo.toml" -not -path "*/.git/*" | head -3

echo "=== java ==="
find . \( -name "pom.xml" -o -name "build.gradle" \) -not -path "*/.git/*" | head -3
```

Record what was found:
```
PACKAGE MANAGERS FOUND
────────────────────────────────────────
npm:    [manifest files found | none]
pip:    [manifest files found | none]
go:     [manifest files found | none]
ruby:   [manifest files found | none]
rust:   [manifest files found | none]
java:   [manifest files found | none]
────────────────────────────────────────
```

## Phase 2: Dispatch `dependency-auditor` Agent

**Dispatch the `dependency-auditor` agent** with:
- The list of all package manifests found in Phase 1
- The production context (are we pre-deploy or routine audit?)
- Any known false positives to skip (if documented)

The agent will:
1. Run security scans across all package managers
2. Run license audit on all dependencies
3. Check freshness (major versions behind)
4. Produce a DEPENDENCY AUDIT REPORT with verdict `APPROVED` / `APPROVED_WITH_NOTES` / `CHANGES_REQUIRED`

**Handoff:**
- `APPROVED` → proceed to Phase 3 summary
- `APPROVED_WITH_NOTES` → note P1/P2 findings for next sprint backlog
- `CHANGES_REQUIRED` → P0 CVEs found; apply remediation commands before re-auditing
- `BLOCKED` → package manager tools not available; install tools and retry

## Phase 3: Triage Findings

For each finding returned by the agent:

### Security Triage

| Severity | Action | Timeline |
|----------|--------|----------|
| P0 Critical (CVSS ≥ 9.0) | Block deploy; fix immediately | Before any deployment |
| P1 High (CVSS 7-8.9) | Fix before next release | Within current sprint |
| P2 Medium (CVSS 4-6.9) | Fix if easy; backlog if not | Within next 2 sprints |
| P3 Low (CVSS < 4) | Backlog | Opportunistic |

### License Triage

| License type | Action |
|-------------|--------|
| GPL/AGPL in production | Legal review required before deploy |
| Unknown license | Legal review required |
| LGPL (dynamic link only) | Usually OK — confirm with legal |
| MIT/Apache/BSD/ISC | No action needed |

## Phase 4: Apply P0 Remediation

For each P0 finding, apply the exact remediation command from the agent's report:

```bash
# Example npm remediations (agent will provide actual commands)
# npm update vulnerable-package@safe-version
# npm audit fix --force  (only if agent recommends)

# Verify fix applied
npm audit 2>&1 | grep -E "critical|high" | head -10
```

After applying remediations, re-run the test suite:
```bash
npm test 2>&1 | tail -10
```

If tests fail after upgrade → the dependency has a breaking change. Escalate to user.

## Phase 5: Audit Report

```
DEPENDENCY AUDIT COMPLETE
════════════════════════════════════════
Scope:          [package managers audited]
Date:           [YYYY-MM-DD]

Security:
  P0 Critical: [N] — [fixed | outstanding]
  P1 High:     [N]
  P2 Medium:   [N]
  P3 Low:      [N]

License:
  Copyleft risk:   [N packages — names]
  Unknown:         [N packages — names]

Freshness:
  Major versions behind: [N packages]

Verdict:        APPROVED | APPROVED_WITH_NOTES | CHANGES_REQUIRED

Remediation applied:
  [package@version] — [CVE fixed]

Backlog items (P1/P2):
  [package] — [finding] — fix by [sprint/date]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

## Save Audit Artifact

```bash
mkdir -p docs/superomni/evaluations
_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_DATE=$(date +%Y%m%d)
_AUDIT_FILE="docs/superomni/evaluations/dependency-audit-${_BRANCH}-${_DATE}.md"
echo "Dependency audit saved to ${_AUDIT_FILE}"
```

Write the full DEPENDENCY AUDIT COMPLETE report block to `$_AUDIT_FILE`.
