# superomni — Project Configuration

## Project Identity

This is the **superomni** AI skill framework — a fusion of obra/superpowers and garrytan/gstack.

Philosophy: **Plan Lean, Execute Complete**

## Skills Available

| Skill | Trigger | Priority |
|-------|---------|----------|
| using-skills | Always active | P0 |
| subagent-development | Default working mode — use for all non-trivial tasks | P0 |
| brainstorming | "brainstorm", "design", "spec" | P0 |
| writing-plans | "write plan", "plan this" | P0 |
| executing-plans | "execute", "implement" | P0 |
| systematic-debugging | Any bug/error | P0 |
| test-driven-development | Writing code | P1 |
| verification | "verify", "done", "complete" | P1 |
| code-review | "review", "PR ready" | P1 |
| plan-review | "review plan", "autoplan" | P1 |
| receiving-code-review | "review feedback", "address review" | P1 |
| security-audit | "security audit", "threat model" | P1 |
| qa | "qa", "quality assurance" | P1 |
| careful | "careful", destructive operations | P1 |
| workflow | "workflow", "sprint", "what's next" | P1 |
| office-hours | "office hours", "validate idea", "brainstorm this" | P1 |
| autoplan | "autoplan", "auto review", "review this plan" | P1 |
| freeze | "freeze", "restrict edits", "lock edits" | P1 |
| git-worktrees | Parallel work | P2 |
| finishing-branch | "finish branch", "merge" | P2 |
| dispatching-parallel | Parallel tasks | P2 |
| investigate | "investigate", "explore" | P2 |
| retro | "retro", "weekly review" | P2 |
| ship | "ship", "release" | P2 |
| writing-skills | "create skill", "install skill", "list skills" | P2 |
| agent-management | "install agent", "create agent", "list agents", "new agent" | P2 |
| document-release | "update docs", "sync docs", "post-ship docs" | P2 |

## Commands

| Command | Description |
|---------|-------------|
| `/vibe` | Activate full framework + launch guided default workflow |
| `/brainstorm` | Design a feature — produces `spec.md` |
| `/write-plan` | Turn a spec into an executable plan |
| `/execute-plan` | Run the plan step by step |
| `/review` | Structured code review |

## Configuration

Run `bin/config get proactive` to check PROACTIVE mode.
Run `bin/config set proactive false` to disable auto-skill triggers.

## Skill Data Directory

Skills store state in `~/.omni-skills/`:
- `sessions/` — session tracking
- `analytics/` — usage telemetry (local only)
- `projects/` — per-project context
- `debug-scope.txt` — active debug scope lock (if any)

## Document Output Convention

All review content, execution results, and sub-agent session records are saved as Markdown documents in the project directory under `.superomni/`:

| Output Type | Directory | File Pattern |
|-------------|-----------|-------------|
| Code reviews | `.superomni/reviews/` | `review-[branch]-[date].md` |
| Execution results | `.superomni/executions/` | `execution-[branch]-[date].md` |
| Sub-agent sessions | `.superomni/subagents/` | `subagent-[branch]-[date].md` |
| Specs | project root | `spec.md` |
| Plans | project root | `plan.md` |

These documents serve as a permanent, reviewable audit trail for the user.

## Notes for Claude

- Skills in `skills/` define when and how you should behave
- Always check `using-skills/SKILL.md` first — it's the meta-skill
- Respect PROACTIVE mode — if false, only run skills when explicitly asked
- Use status protocol: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT
