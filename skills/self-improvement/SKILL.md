---
name: self-improvement
description: |
  Canonical reflection skill for post-task and post-sprint review.
  Applies first-principles reflection across process quality and delivery history.
  Produces improvement reports in docs/superomni/improvements/ and can generate retrospective evidence.
  Triggers: "self-improve", "evaluate performance", "reflect on execution",
  "how did we do", "what could be better", "evaluate this sprint",
  "improve process", "first principles review",
  "/retro", "weekly retro", "what did we ship", "engineering retrospective".
allowed-tools: [Bash, Read, Write, Glob]
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

# Self-Improvement — First-Principles Performance Review

**Goal:** Close the feedback loop on every sprint by systematically evaluating process adherence, agent behavior, and skill effectiveness — then produce concrete improvement actions for the next session.

## Consolidated Modes

`self-improvement` is the canonical reflection skill with three scopes:

- `process` (default): workflow/skill/agent execution quality.
- `retro`: delivery-focused retrospective based on commits and output artifacts.
- `harness`: harness and gate effectiveness quality.

## Retro Scope (Merged from retro)

When running with `retro` scope, include these delivery metrics before Phase 1 analysis:

```bash
# Default retrospective window
SINCE="7 days ago"

AUTHOR_EMAIL=$(git config user.email)
git log --oneline --since="${SINCE}" --author="${AUTHOR_EMAIL}" 2>/dev/null | head -100
git log --since="${SINCE}" --author="${AUTHOR_EMAIL}" --pretty=tformat: --numstat 2>/dev/null | head -200
```

Generate an additional artifact:

- `docs/superomni/retros/retro-[branch]-[session]-[date].md`

Retro output must include:

1. Commit count and active-day cadence.
2. Net LOC and major files touched.
3. Ship-of-period highlight and a delivery risk note.

## Iron Law

**A FRAMEWORK THAT CANNOT MEASURE ITS OWN PERFORMANCE CANNOT IMPROVE.**

Every sprint cycle must end with a self-evaluation. A session without reflection is a missed learning opportunity.

## First-Principles Foundation

Performance problems in AI-assisted development reduce to three root causes:

1. **Process drift** — the right process was available but not followed
2. **Evidence gaps** — claims were made without verification
3. **Scope creep** — work expanded beyond what was planned

Every metric in this skill traces back to one of these three root causes.

## Phase 0: Tacit Gap Mining

Before evaluating the current session, mine execution history for tacit knowledge gaps.

### Signal Sources
```bash
# 1. Recurring review comments (3+ occurrences = uncodified standard)
echo "=== Review comment patterns ==="
for review in docs/superomni/reviews/review-*.md; do
  [ -f "$review" ] && grep -h "^- " "$review" 2>/dev/null
done | sort | uniq -c | sort -rn | head -10

# 2. Execution deviation records (manual overrides = unmatched preferences)
echo "=== Execution deviations ==="
for exec in docs/superomni/executions/execution-*.md; do
  [ -f "$exec" ] && grep -h -A1 "CONCERN\|DEVIATION\|override\|manual" "$exec" 2>/dev/null
done | head -10

# 3. Skill override frequency
echo "=== Skill overrides ==="
grep "override\|rejected\|skipped" ~/.omni-skills/analytics/usage.jsonl 2>/dev/null | tail -5
```

### Mining Questions
Answer each with evidence from the sources above:
- [ ] In the last 5 executions, which Agent suggestions were rejected by the user?
- [ ] In code reviews, which comment types appeared 3+ times?
- [ ] In which scenarios did the user manually modify Agent output?

### Analysis Logic
- User rejects Agent suggestion = Agent lacks a tacit preference at this point
- Recurring review comment = Standard not yet captured by an Iron Law
- Manual output modification = Style mismatch between Agent and user

### Tacit Gap Output
If any gaps are found, generate `docs/superomni/improvements/tacit-gaps-[date].md`:

```markdown
# Tacit Knowledge Gaps — [date]

| Scenario | Agent Behavior | User Expected Behavior | Proposed Rule |
|----------|---------------|----------------------|---------------|
| [context] | [what Agent did] | [what user wanted] | [candidate rule to add] |

## Recommendations
- If a gap maps to a style preference: update docs/superomni/style-profiles/
- If a gap maps to a process rule: propose new Iron Law or Gate Check
- If a gap maps to domain knowledge: flag as permanent TACIT-DENSE category
```

If no gaps found, note: "No tacit gaps detected in available history — continue to Phase 1."

## Phase 1: Gather Session Evidence

Collect objective data about what happened in this session:

```bash
# What was built/changed
git log --oneline -10
git diff --stat HEAD~3 2>/dev/null | tail -5

# What artifacts were produced
ls docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md 2>/dev/null
ls docs/superomni/ .superomni/ 2>/dev/null

# Read the latest evaluation report (from verification skill)
LATEST_EVAL=$(find docs/superomni/evaluations -name "*.md" -type f 2>/dev/null | sort | tail -1)
if [ -n "$LATEST_EVAL" ]; then
  echo "Latest verification evaluation:"
  cat "$LATEST_EVAL" | head -40
fi

# Skill telemetry for this session
tail -10 ~/.omni-skills/analytics/usage.jsonl 2>/dev/null || echo "(no telemetry)"

# Current test status
npm test 2>/dev/null || bash lib/validate-skills.sh 2>/dev/null || echo "(no test suite found)"
```

Document the raw facts:
- Which skills were invoked?
- What artifacts were produced?
- What tests ran, and what was the outcome?
- What did the latest evaluation report say?

## Phase 2: Process Adherence Evaluation

Answer each question with **YES / PARTIAL / NO + reason**:

### Workflow Adherence
| Question | Answer | Evidence |
|----------|--------|----------|
| Did each major task follow the THINK→PLAN→REVIEW→BUILD→VERIFY→SHIP→REFLECT cycle? | | |
| Was a spec or plan artifact created before implementation? | | |
| Were skills invoked for their intended triggers (not bypassed)? | | |
| Did the session end with a status report (DONE/BLOCKED/etc.)? | | |

### Iron Law Compliance
| Law | Followed? | Notes |
|-----|-----------|-------|
| No fixes without root cause investigation | | |
| One change at a time during debugging | | |
| 3-strike escalation rule respected | | |
| Blast radius flagged when >5 files touched | | |
| Tests written before claiming done | | |

### Evidence Quality
- Was every "it works" claim backed by test output or command results? **YES / NO**
- Were all PR review comments addressed with commit hashes? **YES / NO**
- Was the final status report (DONE/BLOCKED/etc.) accurate? **YES / NO**

## Phase 3: Agent Behavior Evaluation

Evaluate the AI agent's performance on three dimensions:

### Scope Management (1-5 scale)
- **5**: Stayed strictly within task scope; zero unasked-for changes
- **3**: Minor out-of-scope suggestions flagged, deferred
- **1**: Significant scope creep; made changes beyond what was asked

**Score: __ / 5** — Evidence: ___

### Instruction Following (1-5 scale)
- **5**: Followed every protocol exactly; no skipped phases
- **3**: Mostly followed protocols; minor deviations with justification
- **1**: Skipped phases or ignored Iron Laws without explanation

**Score: __ / 5** — Evidence: ___

### Escalation Behavior (1-5 scale)
- **5**: Escalated correctly when hitting 3-strike limit; never guessed past uncertainty
- **3**: Escalated once but only after extra attempts
- **1**: Kept guessing past 3 failures; never escalated

**Score: __ / 5** — Evidence: ___

**Agent Performance Score: __ / 15**

## Phase 4: Skill Effectiveness Evaluation

For each skill invoked in this session, rate its effectiveness:

| Skill | Was it the right skill? | Phases completed? | Output quality | Score (1-5) |
|-------|------------------------|-------------------|---------------|-------------|
| [skill-1] | YES/NO | 100% / 80% / <50% | clear/partial/missing | |
| [skill-2] | YES/NO | 100% / 80% / <50% | clear/partial/missing | |

**Questions to answer for each skill:**
1. Was this the right skill for the situation, or should a different one have been used?
2. Were all defined phases completed, or were some skipped?
3. Was the output complete: report block, status, "What's next" line?
4. Did the skill produce value, or was it ceremonial?

## Phase 5: First-Principles Gap Analysis

Trace every deviation found back to a root cause category:

| Deviation observed | Root cause | Principle violated |
|--------------------|-----------|-------------------|
| [example: skipped plan review] | Process drift — time pressure | "Plan Lean" — even lean plans need review |
| [example: claimed done without tests] | Evidence gap | "Evidence over Claims" |

**The 6 Decision Principles check:**
- [ ] Choose completeness — were edge cases covered?
- [ ] Boil lakes — were related issues in blast radius fixed?
- [ ] Pragmatic — were choices clean and minimal?
- [ ] DRY — was any code/logic duplicated?
- [ ] Explicit over clever — was anything unnecessarily abstract?
- [ ] Bias toward action — did concerns block progress unnecessarily?

## Phase 6: Improvement Actions

Generate exactly **3 concrete improvement actions** for the next sprint:

**Format for each action:**
```
ACTION [N]: [TITLE]
Problem:  [what went wrong or what was missing]
Root cause: [which of the 3 root causes — process drift / evidence gap / scope creep]
Fix:      [specific, actionable change to process or behavior]
Verify:   [how to confirm this improvement was applied in the next session]
```

**Example:**
```
ACTION 1: WRITE SPEC BEFORE IMPLEMENTATION
Problem:  Started coding directly from the issue title without a spec
Root cause: Process drift — skipped THINK stage under time pressure
Fix:      Before any implementation task, spend 5 minutes writing docs/superomni/specs/spec-[branch]-[session]-[date].md with problem, goals, non-goals, acceptance criteria
Verify:   Next session starts with `ls docs/superomni/specs/spec-*.md` — must exist before first code change
```

## Phase 7: Save Improvement Report

```bash
IMPROVE_DIR="docs/superomni/improvements"
mkdir -p "$IMPROVE_DIR"
BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "main")
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
REPORT_FILE="$IMPROVE_DIR/improvement-${BRANCH}-${TIMESTAMP}.md"
```

Save the **full** evaluation report to `$REPORT_FILE` using the following structure. All scores and tables from Phases 1–6 must be included — not just the action items:

```markdown
# Improvement Report: [branch]

**Date:** [date]
**Branch:** [branch]
**Task description:** [what was worked on this session]

## Tacit Gaps (Phase 0)

| Scenario | Agent Behavior | User Expected | Proposed Rule |
|----------|---------------|--------------|---------------|
| [from Phase 0 output, or "None detected"] | | | |

Tacit gaps file: [path or "not generated"]

## Session Evidence (Phase 1)

- Skills invoked: [list]
- Artifacts produced: [list of files in .superomni/ and project root]
- Tests outcome: [pass/fail counts]
- Evaluation report referenced: [path or "none"]

## Process Adherence (Phase 2)

| Question | Answer | Evidence |
|----------|--------|----------|
| THINK→PLAN→REVIEW→BUILD→VERIFY→SHIP→REFLECT followed | YES/PARTIAL/NO | |
| Spec/plan created before implementation | YES/PARTIAL/NO | |
| Skills used for intended triggers | YES/PARTIAL/NO | |
| Session ended with status report | YES/PARTIAL/NO | |

**Iron Law compliance:** [N/5 laws followed]

## Agent Evaluation (Phase 3)

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Scope management | [N]/5 | |
| Instruction following | [N]/5 | |
| Escalation behavior | [N]/5 | |

**Agent total: [N]/15**

## Skill Effectiveness (Phase 4)

| Skill | Right skill? | Phases done | Output quality | Score |
|-------|-------------|-------------|---------------|-------|
| [skill-1] | YES/NO | 100%/80%/<50% | clear/partial/missing | [N]/5 |

**Skills avg: [N]/5**

## Gap Analysis (Phase 5)

| Deviation | Root cause | Principle violated |
|-----------|-----------|-------------------|
| [deviation] | [root cause] | [principle] |

## Action Items (Phase 6)

### ACTION 1: [TITLE]
Problem: ...
Root cause: ...
Fix: ...
Verify: ...

### ACTION 2: [TITLE]
Problem: ...
Root cause: ...
Fix: ...
Verify: ...

### ACTION 3: [TITLE]
Problem: ...
Root cause: ...
Fix: ...
Verify: ...
```

```bash
echo "Improvement report saved to $REPORT_FILE"
```

This report is the canonical record of agent and skill performance for this session. The `workflow` skill reads it at the next sprint start to apply the action items.

## Report

```
SELF-IMPROVEMENT REPORT
════════════════════════════════════════
Session:            [branch / date / task description]
Tacit gaps found:   [N gaps | none]
Process adherence:  [N/N checks passed]
Agent score:        [N/15] (scope: N/5 | instructions: N/5 | escalation: N/5)
Skills evaluated:   [N skills] — avg [N]/5
Top gap:            [single most important finding]
Action 1:           [title]
Action 2:           [title]
Action 3:           [title]
Report saved:       [docs/superomni/improvements/...]
Status: DONE | DONE_WITH_CONCERNS
════════════════════════════════════════
```
