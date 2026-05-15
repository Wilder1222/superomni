<!-- Reference: subagent-development wave planning, output contracts, conflict detection, integration verification. -->

# Sub-Agent Development — Wave Planning

For task lists with 6+ items, create a formal wave execution plan.

## Wave Execution Plan Template

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

## Parallel Wave Execution Template

```
PARALLEL WAVE EXECUTION
═══════════════════════════════════════
Wave 1 (8 agents):
  Agent 1: [implementer] — [task A]
  Agent 2: [implementer] — [task B]
  Agent 3: [spec-reviewer] — [spec for task C]
  Agent 4: [implementer] — [task D] (independent of A, B)
  Agent 5: [implementer] — [task E]
  Agent 6: [planner-reviewer] — [review module X]
  Agent 7: [implementer] — [task F]
  Agent 8: [implementer + TDD] — [tests for module Y]

Synchronization point: After all Wave 1 agents report DONE
Wave 2 tasks (unblocked by Wave 1): [list]
═══════════════════════════════════════
```

Rule: Only run truly independent tasks in parallel. If task B depends on task A's output, run them sequentially (in different waves).

## Output Contracts per Agent

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

## Conflict Detection

Before integrating parallel outputs:
1. Check if any agents modified the same files
2. If conflict exists → do NOT auto-merge; bring to user

```bash
# Check for conflicts in parallel outputs
git diff agent-1/feature agent-2/feature -- shared-file.js
```

## Agent Failure Handling

If an agent reports BLOCKED:
1. Check if the block affects other agents
2. If independent: let others continue, fix the blocked one separately
3. If dependent: pause the dependent agents, resolve the block

## Integration Verification

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
