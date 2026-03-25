# super-omni — Project Configuration

## Project Identity

This is the **super-omni** AI skill framework — a fusion of obra/superpowers and garrytan/gstack.

Philosophy: **Plan Lean, Execute Complete**

## Skills Available

| Skill | Trigger | Priority |
|-------|---------|----------|
| using-skills | Always active | P0 |
| brainstorming | "brainstorm", "design", "spec" | P0 |
| writing-plans | "write plan", "plan this" | P0 |
| executing-plans | "execute", "implement" | P0 |
| systematic-debugging | Any bug/error | P0 |
| subagent-development | "subagent", "parallel" | P1 |
| test-driven-development | Writing code | P1 |
| verification | "verify", "done", "complete" | P1 |
| code-review | "review", "PR ready" | P1 |
| plan-review | "review plan", "autoplan" | P1 |
| receiving-code-review | "review feedback", "address review" | P1 |
| security-audit | "security audit", "threat model" | P1 |
| qa | "qa", "quality assurance" | P1 |
| careful | "careful", destructive operations | P1 |
| workflow | "workflow", "sprint", "what's next" | P1 |
| git-worktrees | Parallel work | P2 |
| finishing-branch | "finish branch", "merge" | P2 |
| dispatching-parallel | Parallel tasks | P2 |
| investigate | "investigate", "explore" | P2 |
| retro | "/retro" | P2 |
| ship | "/ship" | P2 |
| writing-skills | "create skill", "install skill", "list skills" | P2 |
| agent-management | "install agent", "create agent", "list agents", "new agent" | P2 |

## Commands

| Command | Description |
|---------|-------------|
| `/supervibe` | Activate full framework + launch guided default workflow |
| `/brainstorm` | Design a feature — produces `spec.md` |
| `/write-plan` | Turn a spec into an executable plan |
| `/execute-plan` | Run the plan step by step |
| `/review` | Structured code review |
| `/ship` | Release workflow with versioning + changelog |
| `/retro` | Weekly engineering retrospective |
| `/investigate` | Explore unfamiliar code |
| `/workflow` | Sprint pipeline status + next-step guidance |
| `/qa` | Quality assurance pass |
| `/security` | Security audit (OWASP-aware) |
| `/plugin add marketplace` | Install full super-omni framework (no source) or a single skill |
| `/list-skills` | List all built-in and marketplace skills |
| `/install-skill` | Install a skill from URL or local path |
| `/list-agents` | List all available agents |
| `/install-agent` | Install an agent from GitHub or local file |
| `/create-agent` | Scaffold a new custom agent |

## Configuration

Run `bin/config get proactive` to check PROACTIVE mode.
Run `bin/config set proactive false` to disable auto-skill triggers.

## Skill Data Directory

Skills store state in `~/.omni-skills/`:
- `sessions/` — session tracking
- `analytics/` — usage telemetry (local only)
- `projects/` — per-project context
- `debug-scope.txt` — active debug scope lock (if any)

## Notes for Claude

- Skills in `skills/` define when and how you should behave
- Always check `using-skills/SKILL.md` first — it's the meta-skill
- Respect PROACTIVE mode — if false, only run skills when explicitly asked
- Use status protocol: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT
