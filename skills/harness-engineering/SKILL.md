---
name: harness-engineering
description: |
  Design, audit, and improve the agent harness — the environment, constraints, context management,
  evaluation gates, and feedback loops that surround and guide AI agents.
  Inspired by OpenAI and Anthropic harness engineering best practices.
  Triggers: "harness", "harness audit", "improve harness", "agent environment",
  "context management", "evaluation gates", "feedback loop", "harness engineering".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection

On session start, read: branch from `git branch --show-current`, proactive config from `bin/config get proactive` (default `true`), session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### PROACTIVE Mode

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


# Harness Engineering

**Goal:** Design and maintain the agent harness — the scaffolding of environment, context, tools, constraints, evaluation gates, and feedback loops that determine how well agents perform.

> "Engineers design the system. Agents execute." — OpenAI Harness Engineering

## Iron Law

**THE HARNESS IS THE PRODUCT. CODE IS ITS OUTPUT.**

A well-designed harness produces reliable, high-quality agent output without requiring manual intervention on every task. When agents fail repeatedly, the correct response is to improve the harness — not to keep retrying the same prompt.

## Core Principles (From OpenAI + Anthropic)

| Principle | What it means in superomni |
|-----------|---------------------------|
| **Context is everything** | Agents can only work with what they can see — keep docs, specs, and constraints in-repo and up-to-date |
| **Fewer, more expressive tools** | Prefer composable skills over sprawling tool menus |
| **Evaluate relentlessly** | Judgment gates must exist at every major transition point |
| **Signal-driven iteration** | Agent failures are design signals — update the harness, not just the prompt |
| **Boring > clever** | Prefer simple, composable patterns over novel abstractions |
| **Garbage collection** | Periodically audit for drift, stale docs, and architectural decay |

---

## Phase 1: Harness Inventory

Take stock of the current harness state:

```bash
# Skill count + structure
ls skills/ | wc -l
ls skills/

# Agent count
ls agents/

# Command count
ls commands/

# Preamble size (context overhead)
wc -l lib/preamble.md

# Skill template sizes (larger = more context pressure)
wc -l skills/*/SKILL.md.tmpl | sort -n | tail -10

# Validation status
npm test 2>/dev/null || bash lib/validate-skills.sh 2>/dev/null

# Recent harness changes
git log --oneline -10 -- lib/ skills/ agents/ commands/

# Any stale/out-of-date docs
find docs/ -name "*.md" -older /tmp 2>/dev/null | head -10
```

Document findings:
- Total skills: ___
- Total agents: ___
- Total commands: ___
- Preamble size (lines): ___
- Validation status: PASS / FAIL
- Largest skill (lines): ___

## Phase 2: Context Window Audit

Context window pressure is one of the most common causes of agent degradation. Audit the harness context load:

### 2a. Preamble Efficiency Analysis
Review `lib/preamble.md`:
- [ ] Every section earns its inclusion — remove dead protocols
- [ ] No repetition with individual skill instructions
- [ ] Status protocol is concise and actionable
- [ ] Performance checkpoint is lightweight (3 questions max)
- [ ] Telemetry block is at the end (lowest priority)

**Target preamble size:** < 150 lines. Flag if > 200 lines.

### 2b. Skill Bloat Detection
For each skill > 200 lines, ask:
- Are all phases strictly necessary?
- Are examples too verbose? (truncate to headers only)
- Can any phase be replaced with a reference to another skill?
- Is this skill actually used? (check telemetry)

### 2c. Progressive Disclosure Check
Does the framework expose only necessary context at each stage?

| Stage | Context needed | Currently loaded |
|-------|---------------|-----------------|
| Planning | spec, constraints | |
| Implementation | plan, code context | |
| Review | diff, standards | |
| Debug | error, minimal repro | |

Good harnesses load context on demand, not all at once.

## Phase 3: Tool Action Space Audit

Per Anthropic's principle: *fewer, more expressive tools outperform large menus of narrow ones.*

Review the agent's tool access:

```bash
# Check allowed-tools across all skills
grep "allowed-tools" skills/*/SKILL.md.tmpl
```

For each skill, evaluate:
- [ ] Are the allowed tools the minimum needed for that skill?
- [ ] Are any rarely-used tools creating confusion or unnecessary options?
- [ ] Do composable skill combinations cover the same ground as single complex tools?

**Recommended tool sets by role:**

| Role | Minimal tool set |
|------|----------------|
| Planning / Brainstorming | Read, Write, Glob |
| Implementation | Bash, Read, Write, Edit, Grep, Glob |
| Review / Audit | Read, Grep, Glob |
| Debug | Bash, Read, Grep, Glob |

Flag any skill whose tool set exceeds its role's minimum.

## Phase 4: Evaluation Gate Audit

*"Evaluation is the load-bearing part of agent harness design."* — OpenAI/Anthropic harness engineering principles

Map every major workflow transition and verify an evaluation gate exists:

| Transition | Evaluation gate | Present? |
|-----------|----------------|---------|
| Spec → Plan | plan-review skill or planner agent | |
| Plan → Execution | dependency analysis wave plan | |
| Execution Wave → Next Wave | wave verification step | |
| Implementation → Review | code-review skill or code-reviewer agent | |
| Review → Ship | production-readiness skill | |
| Ship → Done | verification skill | |
| Sprint → Next Sprint | self-improvement skill | |

**Any gap = harness deficiency.** Add missing gates.

## Phase 5: Feedback Loop Audit

A healthy harness converts agent failures into harness improvements:

```
Agent fails → Signal captured → Harness updated → Agent retries → Improvement
     ↑                                                                   |
     └───────────────────────────────────────────────────────────────────┘
```

Check the current feedback paths:

### 5a. Error → Harness Signal
When an agent fails a task repeatedly (3+ attempts), is there a defined process to:
- [ ] Record the failure pattern (systematic-debugging skill)?
- [ ] Identify the harness gap causing the failure?
- [ ] Update the relevant skill, doc, or constraint?

### 5b. Performance → Improvement
Does the self-improvement skill output get consumed?
```bash
ls docs/superomni/improvements/ 2>/dev/null | head -5
```
- [ ] Improvement reports exist?
- [ ] Action items from last report applied to current sprint?
- [ ] workflow skill reads improvement reports at sprint start?

### 5c. Documentation Garbage Collection
Is there a regular cadence for cleaning up:
- [ ] Stale skill instructions that no longer match agent behavior?
- [ ] Outdated docs that contradict current implementation?
- [ ] Dead commands that are registered but never invoked?
- [ ] Agent definitions whose Iron Laws conflict with updated skills?

**Recommended:** Schedule a harness GC pass after every 5 sprints.

## Phase 6: Harness Health Score

Score the harness on each dimension (1-5):

| Dimension | Score | Key Finding |
|-----------|-------|------------|
| Context efficiency | /5 | |
| Tool space minimalism | /5 | |
| Evaluation gate coverage | /5 | |
| Feedback loop completeness | /5 | |
| Documentation freshness | /5 | |

**Total: __ / 25**

Scoring guide:
- **21-25** — World-class harness. Focus on new capabilities.
- **16-20** — Good harness. Address identified gaps.
- **11-15** — Fair harness. Significant drift or missing gates.
- **< 11** — Harness needs major refactor before next sprint.

## Phase 7: Harness Improvement Plan

For each finding from Phases 2-5 with a score < 4:

```
HARNESS IMPROVEMENT [N]: [TITLE]
Dimension:   [context | tools | evaluation | feedback | docs]
Finding:     [specific issue identified]
Impact:      [how this degrades agent performance]
Fix:         [concrete change to harness — specific file, section, or process]
Priority:    [P0 — blocks agent / P1 — degrades quality / P2 — nice to have]
```

Generate a prioritized backlog. P0 items must be fixed before the next sprint.

## Phase 8: Save Harness Audit Report

```bash
HARNESS_DIR="docs/superomni/harness-audits"
mkdir -p "$HARNESS_DIR"
BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "main")
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
REPORT_FILE="$HARNESS_DIR/harness-audit-${BRANCH}-${TIMESTAMP}.md"
echo "Saving harness audit to $REPORT_FILE"
```

Save the full audit report including all scores, findings, and improvement backlog.

## Report

```
HARNESS AUDIT REPORT
════════════════════════════════════════
Branch:             [branch]
Date:               [date]
Skills / Agents:    [N] skills, [N] agents, [N] commands
Preamble size:      [N] lines ([OK / BLOATED])
Validation:         [PASS / FAIL]
Health score:       [N]/25 ([rating])
Top finding:        [single most important issue]
P0 improvements:    [N]
P1 improvements:    [N]
P2 improvements:    [N]
Report saved:       [docs/superomni/harness-audits/...]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```
