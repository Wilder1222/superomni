---
name: subagent-development
description: |
  Default working mode for non-trivial tasks. Decompose into waves of 5-10 parallel sub-agents. Triggers: any multi-file / multi-concern task, "use subagents", "parallel implementation".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use whenever a task spans multiple files, multiple concerns, or benefits from parallel execution. Complementary to executing-plans (which is sequential-with-waves). NOT for writing tests — use test-driven-development for that.
produces: "docs/superomni/subagents/subagent-[branch]-[session]-[date].md"
consumes: []
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

## Parallel Execution & Wave Planning

When using multiple sub-agents simultaneously, follow the wave-execution model: independent tasks run in parallel within a wave; dependent tasks across waves. For task lists with 6+ items, draft a formal Wave Execution Plan.

**Reference:** see [reference/wave-planning.md](${CLAUDE_SKILL_DIR}/reference/wave-planning.md) for: parallel-wave template, formal wave-plan template, per-agent output contracts, conflict detection, agent failure handling, and integration verification.

## Consensus Protocol & Model Selection

For critical decisions, optionally run two agents on the same task; agreement → proceed, disagreement → surface as TASTE decision. Match model cost to task complexity.

**Reference:** see [reference/consensus-protocol.md](${CLAUDE_SKILL_DIR}/reference/consensus-protocol.md) for the consensus protocol and the model-tier selection table.

## Save Sub-Agent Session Document

After the session ends, write the full session record (agents dispatched, wave breakdown, outputs, integration summary, final status) to `docs/superomni/subagents/subagent-[branch]-[session]-[date].md`. This is the permanent record the user audits.

**Reference:** see [reference/report-templates.md](${CLAUDE_SKILL_DIR}/reference/report-templates.md) for the save script and file template.