---
name: self-improvement
description: |
  Post-task performance evaluation. Applies first-principles reflection to evaluate
  how well the current session's workflow, agents, and skills performed.
  Produces a structured improvement report saved to docs/superomni/improvements/.
  Triggers: "self-improve", "evaluate performance", "reflect on execution",
  "how did we do", "what could be better", "evaluate this sprint",
  "improve process", "first principles review".
allowed-tools: [Bash, Read, Write, Glob]
---

## Preamble

### Environment Detection
```bash
mkdir -p ~/.omni-skills/sessions
_PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_TEL_START=$(date +%s)
echo "Branch: ---
name: self-improvement
description: |
  Post-task performance evaluation. Applies first-principles reflection to evaluate
  how well the current session's workflow, agents, and skills performed.
  Produces a structured improvement report saved to docs/superomni/improvements/.
  Triggers: "self-improve", "evaluate performance", "reflect on execution",
  "how did we do", "what could be better", "evaluate this sprint",
  "improve process", "first principles review".
allowed-tools: [Bash, Read, Write, Glob]
---

{{PREAMBLE}}

# Self-Improvement — First-Principles Performance Review

**Goal:** Close the feedback loop on every sprint by systematically evaluating process adherence, agent behavior, and skill effectiveness — then produce concrete improvement actions for the next session.

## Iron Law

**A FRAMEWORK THAT CANNOT MEASURE ITS OWN PERFORMANCE CANNOT IMPROVE.**

Every sprint cycle must end with a self-evaluation. A session without reflection is a missed learning opportunity.

## First-Principles Foundation

Performance problems in AI-assisted development reduce to three root causes:

1. **Process drift** — the right process was available but not followed
2. **Evidence gaps** — claims were made without verification
3. **Scope creep** — work expanded beyond what was planned

Every metric in this skill traces back to one of these three root causes.

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
BRANCH | PROACTIVE: ---
name: self-improvement
description: |
  Post-task performance evaluation. Applies first-principles reflection to evaluate
  how well the current session's workflow, agents, and skills performed.
  Produces a structured improvement report saved to docs/superomni/improvements/.
  Triggers: "self-improve", "evaluate performance", "reflect on execution",
  "how did we do", "what could be better", "evaluate this sprint",
  "improve process", "first principles review".
allowed-tools: [Bash, Read, Write, Glob]
---

{{PREAMBLE}}

# Self-Improvement — First-Principles Performance Review

**Goal:** Close the feedback loop on every sprint by systematically evaluating process adherence, agent behavior, and skill effectiveness — then produce concrete improvement actions for the next session.

## Iron Law

**A FRAMEWORK THAT CANNOT MEASURE ITS OWN PERFORMANCE CANNOT IMPROVE.**

Every sprint cycle must end with a self-evaluation. A session without reflection is a missed learning opportunity.

## First-Principles Foundation

Performance problems in AI-assisted development reduce to three root causes:

1. **Process drift** — the right process was available but not followed
2. **Evidence gaps** — claims were made without verification
3. **Scope creep** — work expanded beyond what was planned

Every metric in this skill traces back to one of these three root causes.

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
PROACTIVE"
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

**THINK is the only human gate.** After the brainstorm skill generates a spec document, STOP and present the spec for user review. Once the user approves, all subsequent stages (PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT) auto-advance on DONE without asking the user.

| Status | At THINK stage (after spec generation) | At all other stages |
|--------|----------------------------------------|-------------------|
| **DONE** | STOP — present spec document for user review. Wait for user approval before advancing to PLAN. | Auto-advance — print `[STAGE] DONE → advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP — present concerns, wait for user decision | STOP — present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP — present blocker, wait for user | STOP — present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

**Note:** The REVIEW stage (plan-review) runs fully automatically — all decisions (mechanical and taste) are auto-resolved using the 6 Decision Principles. No user input is requested during REVIEW.

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
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "---
name: self-improvement
description: |
  Post-task performance evaluation. Applies first-principles reflection to evaluate
  how well the current session's workflow, agents, and skills performed.
  Produces a structured improvement report saved to docs/superomni/improvements/.
  Triggers: "self-improve", "evaluate performance", "reflect on execution",
  "how did we do", "what could be better", "evaluate this sprint",
  "improve process", "first principles review".
allowed-tools: [Bash, Read, Write, Glob]
---

{{PREAMBLE}}

# Self-Improvement — First-Principles Performance Review

**Goal:** Close the feedback loop on every sprint by systematically evaluating process adherence, agent behavior, and skill effectiveness — then produce concrete improvement actions for the next session.

## Iron Law

**A FRAMEWORK THAT CANNOT MEASURE ITS OWN PERFORMANCE CANNOT IMPROVE.**

Every sprint cycle must end with a self-evaluation. A session without reflection is a missed learning opportunity.

## First-Principles Foundation

Performance problems in AI-assisted development reduce to three root causes:

1. **Process drift** — the right process was available but not followed
2. **Evidence gaps** — claims were made without verification
3. **Scope creep** — work expanded beyond what was planned

Every metric in this skill traces back to one of these three root causes.

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
TEL_DUR" "OUTCOME" 2>/dev/null || true
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


# Self-Improvement — First-Principles Performance Review

**Goal:** Close the feedback loop on every sprint by systematically evaluating process adherence, agent behavior, and skill effectiveness — then produce concrete improvement actions for the next session.

## Iron Law

**A FRAMEWORK THAT CANNOT MEASURE ITS OWN PERFORMANCE CANNOT IMPROVE.**

Every sprint cycle must end with a self-evaluation. A session without reflection is a missed learning opportunity.

## First-Principles Foundation

Performance problems in AI-assisted development reduce to three root causes:

1. **Process drift** — the right process was available but not followed
2. **Evidence gaps** — claims were made without verification
3. **Scope creep** — work expanded beyond what was planned

Every metric in this skill traces back to one of these three root causes.

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
