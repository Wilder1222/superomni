---
name: subagent-development
description: |
  Default working mode for all non-trivial tasks.
  Decompose any task that benefits from specialization, parallelism, or independent verification into sub-agents.
  Use sub-agents by default unless the task is trivially small (< 5 min, single file).
  Triggers: any implementation, review, or analysis task; "use subagents", "parallel implementation", "too complex for one pass".
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

# Sub-Agent Development

**Goal:** Decompose work across specialized sub-agents, each with a focused context and clear output contract. **This is the default working mode for all non-trivial tasks.**

## Default Mode: Always Consider Sub-Agents First

Before executing any task directly, ask:
- Is this task complex enough to benefit from specialization? (multiple files, multiple concerns)
- Would parallel execution reduce elapsed time?
- Would independent verification improve quality?

If yes to any → **use sub-agents by default**. Only skip sub-agents for trivially small tasks (< 5 min, single file, single concern).

## Maximum Parallelism Principle

**Default concurrency target: 5–10 agents per wave.**

When breaking down a task:
1. List ALL sub-tasks first — resist the urge to start with just 2–3
2. Analyze dependencies to find the maximum set that can run in parallel
3. Group into waves, filling each wave to capacity (5–10 agents)
4. Only after a wave completes, dispatch the next wave

For tasks with sufficient parallelizable work, this is the difference between a 3-hour task and a 30-minute task.

```
Anti-pattern (slow):          Correct pattern (fast):
  Wave 1: 2 agents            Wave 1: 8 agents in parallel
  Wave 2: 2 agents      vs    Wave 2: 6 agents in parallel
  Wave 3: 2 agents            Wave 3: 2 agents
  Wave 4: 2 agents
  Wave 5: 2 agents
```

## When to Use Sub-Agents

Use sub-agents when:
- The task requires more context than fits in one window
- Different parts of the task require different expertise (spec review vs implementation)
- Parallel execution would significantly reduce elapsed time
- You want independent verification of your own work

## Sub-Agent Types

### 1. Implementer Agent
See `implementer-prompt.md` — implements a specific, well-scoped feature.

### 2. Spec Reviewer Agent
See `spec-reviewer-prompt.md` — reviews specifications before implementation.

### 3. Code Quality Reviewer Agent
See `code-quality-reviewer-prompt.md` — reviews code after implementation.

## Protocol: Spawning a Sub-Agent

### Step 1: Build the Full Task List First

Before spawning any agent, list ALL sub-tasks needed to complete the work:

```
Full task inventory:
  1. [task A] — depends on: none
  2. [task B] — depends on: none
  3. [task C] — depends on: none
  4. [task D] — depends on: A
  5. [task E] — depends on: B, C
  6. [task F] — depends on: none
  ...

Wave 1 (parallel): tasks 1, 2, 3, 6  ← all with no dependencies
Wave 2 (parallel): tasks 4, 5        ← unblocked after Wave 1
```

### Step 2: Define the Task Boundary for Each Agent

Before spawning, define:
- **Input:** What the sub-agent receives (files, spec, context)
- **Output:** What the sub-agent must produce (format, location)
- **Scope:** Exactly what files/modules the sub-agent may touch
- **Constraints:** What the sub-agent must NOT do

### Step 3: Prepare the Sub-Agent Prompt

Use the relevant prompt template from this directory.
Fill in:
- `[TASK]` — specific task description
- `[CONTEXT]` — relevant background
- `[INPUT FILES]` — files to read
- `[OUTPUT CONTRACT]` — exact output format required
- `[CONSTRAINTS]` — what to avoid

### Step 4: Launch and Monitor

```
SPAWNING WAVE [N] — [N] PARALLEL SUB-AGENTS
════════════════════════════════════════
Wave:   [N of W]
Agents: [N]   ← target 5-10 for large task sets

Agent 1 ([type]) — [task name]
  Input: [what it receives]
  Output: [what it must produce]
  Scope: [allowed files]

Agent 2 ([type]) — [task name]
  ...
════════════════════════════════════════
```

### Step 5: Validate Output

When the sub-agent reports back, handle each status as follows:

- **DONE** → proceed to the Per-Task Review Protocol (see below)
- **DONE_WITH_CONCERNS** → read concerns first:
  - Correctness or scope concerns → address before entering review
  - Observational concerns only → record them, proceed to review
- **NEEDS_CONTEXT** → provide the missing information and re-dispatch (keep same model)
- **BLOCKED** → diagnose the cause before retrying:
  - Context gap → supplement context and re-dispatch (same model)
  - Reasoning limit → upgrade to a stronger model and re-dispatch
  - Task too large → split into smaller sub-tasks and re-dispatch
  - Plan is wrong → escalate to user
  - ⛔ Do NOT retry with the same model and same inputs unchanged

Structural checks (apply regardless of status):
- [ ] Output matches the defined contract
- [ ] No out-of-scope changes were made
- [ ] Evidence is provided for all claims

## Per-Task Review Protocol

Apply this two-phase gate **after every Implementer sub-agent** reports DONE (or DONE_WITH_CONCERNS cleared):

### Phase 1 — Spec Compliance Review (required first)

Use `spec-reviewer-prompt.md` to verify the implementation matches the spec — no over-implementation, no under-implementation.

```
SPEC COMPLIANCE CHECK
  Pass criteria: Spec APPROVED or APPROVED_WITH_NOTES (no P0 blockers)
  If APPROVED → proceed to Phase 2
  If NEEDS_REVISION → return to the same Implementer agent with the specific P0 issues; re-review after fix
```

⛔ Do NOT start Phase 2 until Phase 1 reaches APPROVED status.

### Phase 2 — Code Quality Review (only after Phase 1 passes)

Use `code-quality-reviewer-prompt.md` to assess code quality, test coverage, and security.

```
CODE QUALITY CHECK
  Pass criteria: APPROVED or APPROVED_WITH_NOTES (no P0 issues)
  If APPROVED → mark task complete, proceed to next wave or integration
  If CHANGES_REQUESTED → return to the same Implementer agent with P0 items; re-review after fix
```

### Step 6: Integrate Results and Proceed to Next Wave

Merge sub-agent outputs carefully:
1. Review each change before accepting
2. Run tests after integration
3. Resolve any conflicts between parallel agents
4. Dispatch next wave with all newly unblocked tasks

## Parallel Execution Pattern

When using multiple sub-agents simultaneously:

```
PARALLEL WAVE EXECUTION
═══════════════════════════════════════
Wave 1 (8 agents):
  Agent 1: [implementer] — [task A]
  Agent 2: [implementer] — [task B]
  Agent 3: [spec-reviewer] — [spec for task C]
  Agent 4: [implementer] — [task D] (independent of A, B)
  Agent 5: [implementer] — [task E]
  Agent 6: [code-reviewer] — [review module X]
  Agent 7: [implementer] — [task F]
  Agent 8: [test-writer] — [tests for module Y]

Synchronization point: After all Wave 1 agents report DONE
Wave 2 tasks (unblocked by Wave 1): [list]
═══════════════════════════════════════
```

Rule: Only run truly independent tasks in parallel.
If task B depends on task A's output, run them sequentially (in different waves).

## Wave Planning for Large Task Sets

For task lists with 6+ items, create a formal wave execution plan:

```
WAVE EXECUTION PLAN
════════════════════════════════════════
Total tasks:     [N]
Total waves:     [W]
Max wave size:   [target: 5-10 agents]
Est. time saved: [sequential time] → [parallel time with waves]

Wave 1 ([N] agents in parallel):
  Agent 1 → [Task A]
  Agent 2 → [Task B]
  Agent 3 → [Task C]
  ...

Wave 2 ([M] agents in parallel, after Wave 1 complete):
  Agent 1 → [Task D]
  Agent 2 → [Task E]
  ...
════════════════════════════════════════
```

### Output Contracts per Agent

Before dispatching each wave, define a clear output contract for every agent:

```
Agent 1 — Task A
  Input:  [what it reads]
  Output: [exactly what it produces, file name, format]
  Scope:  [files it may touch]
  NOT allowed: [what to avoid]

Agent 2 — Task B
  Input:  [what it reads]
  Output: [exactly what it produces, file name, format]
  Scope:  [files it may touch]
  NOT allowed: [what to avoid]
```

### Conflict Detection

Before integrating parallel outputs:
1. Check if any agents modified the same files
2. If conflict exists → do NOT auto-merge; bring to user

```bash
# Check for conflicts in parallel outputs
git diff agent-1/feature agent-2/feature -- shared-file.js
```

### Agent Failure Handling

If an agent reports BLOCKED:
1. Check if the block affects other agents
2. If independent: let others continue, fix the blocked one separately
3. If dependent: pause the dependent agents, resolve the block

### Integration Verification

After all agents in a wave report DONE:

1. **Review each output independently** — don't integrate until you've reviewed
2. **Integrate in dependency order** — sequential dependencies first
3. **Run tests after each integration** — catch conflicts early
4. **Proceed to next wave** — unblock agents waiting on this wave's output
5. **Final integration test** — run full test suite after all waves complete

```bash
# Integration verification after each wave
npm test 2>&1 | tail -10
git diff HEAD --stat
```

## Consensus Protocol (Optional)

For critical decisions, run two agents with the same task and compare outputs:
- If they agree → proceed
- If they disagree → surface disagreement to user as TASTE decision

## Model Selection Strategy

Match model cost to task complexity. Signals:

| Signal | Model tier |
|--------|-----------|
| 1–2 files, complete spec, no ambiguity | Lightweight / fast model |
| Multi-file, integration concerns, pattern matching | Standard model |
| Architecture decisions, broad codebase understanding, review tasks | Strongest model |

Rules:
- Default to the **cheapest model that can reliably complete the task**.
- Upgrade when a sub-agent reports BLOCKED due to reasoning limits (not context gaps).
- Never downgrade mid-task; finish the task at the assigned tier.
- For Spec Compliance Review and Code Quality Review agents: use standard model minimum.

## Save Sub-Agent Session Document

After the sub-agent session is complete, save the full session record as a Markdown document:

```bash
_SA_DATE=$(date +%Y%m%d-%H%M%S)
_SA_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_SA_FILE="subagent-${_SA_BRANCH}-${_SA_DATE}.md"
mkdir -p docs/superomni/subagents
cat > "docs/superomni/subagents/${_SA_FILE}" << EOF
# Sub-Agent Session: ${_SA_BRANCH}

**Date:** ${_SA_DATE}
**Branch:** ${_SA_BRANCH}

## Agents Dispatched

[List each agent, its type, task, wave, and reported status]

## Wave Summary

[Wave 1: N agents, duration. Wave 2: M agents, duration. Total elapsed vs sequential estimate.]

## Integration Summary

[What was merged, any conflicts resolved, final state]

## Status

[DONE | DONE_WITH_CONCERNS | BLOCKED]
[Any concerns or issues]
EOF
echo "Sub-agent session saved to docs/superomni/subagents/${_SA_FILE}"
```

Write the full session record (agents dispatched, wave breakdown, outputs, integration summary, and final status, formatted as Markdown) to `docs/superomni/subagents/subagent-[branch]-[session]-[date].md`. This file serves as the permanent record for the user to audit the sub-agent session.
