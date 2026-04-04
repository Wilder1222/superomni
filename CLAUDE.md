# superomni — Project Configuration

## Project Identity

This is the **superomni** AI skill framework — a fusion of obra/superpowers and garrytan/gstack.

Philosophy: **Plan Lean, Execute Complete**

## Skills Available

| Skill | Trigger | Priority |
|-------|---------|----------|
| vibe | "/vibe", "activate framework", "start workflow" | P0 |
| using-skills | Always active | P0 |
| subagent-development | Default working mode — use for all non-trivial tasks | P0 |
| brainstorm | "brainstorm", "design", "spec" | P0 |
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
| frontend-design | "frontend design", "build UI", "design page", "make it look good" | P1 |
| git-worktrees | Parallel work | P2 |
| finishing-branch | "finish branch", "merge" | P2 |
| dispatching-parallel | Parallel tasks | P2 |
| investigate | "investigate", "explore" | P2 |
| retro | "retro", "weekly review" | P2 |
| ship | "ship", "release" | P2 |
| writing-skills | "create skill", "install skill", "list skills" | P2 |
| agent-management | "install agent", "create agent", "list agents", "new agent" | P2 |
| document-release | "update docs", "sync docs", "post-ship docs" | P2 |
| production-readiness | "production ready", "ready to deploy", "pre-deploy check" | P1 |
| self-improvement | "self-improve", "evaluate performance", "reflect on execution", "how did we do", "improve process" | P1 |
| harness-engineering | "harness", "harness audit", "improve harness", "agent environment", "evaluation gates", "feedback loop" | P1 |

## Commands

| Command | Description |
|---------|-------------|
| `/vibe` | Activate full framework, detect pipeline stage, launch guided workflow. Subcommands: `/vibe status`, `/vibe reset` |
| `/brainstorm` | Design a feature — produces `docs/superomni/specs/spec-[branch]-[session]-[date].md` |
| `/write-plan` | Turn a spec into an executable plan |
| `/execute-plan` | Run the plan step by step |
| `/review` | Structured code review |
| `/harness-audit` | Audit the agent harness health and produce improvement backlog |
| `/fd-audit` | Accessibility + performance check |
| `/fd-critique` | UX review for clarity and hierarchy |
| `/fd-polish` | Pre-deployment refinement |
| `/fd-distill` | Reduce complexity |
| `/fd-clarify` | UX copy improvement |
| `/fd-animate` | Add purposeful motion |
| `/fd-colorize` | Strategic color introduction |
| `/fd-harden` | Error handling + i18n |
| `/fd-arrange` | Layout and spacing fixes |
| `/fd-typeset` | Font and hierarchy fixes |

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

All outputs go in `docs/superomni/` for agent indexing and self-improvement:

| Output Type | Directory | File Pattern |
|-------------|-----------|-------------|
| Specs | `docs/superomni/specs/` | `spec-[branch]-[session]-[date].md` |
| Plans | `docs/superomni/plans/` | `plan-[branch]-[session]-[date].md` |
| Code reviews | `docs/superomni/reviews/` | `review-[branch]-[session]-[date].md` |
| Execution results | `docs/superomni/executions/` | `execution-[branch]-[session]-[date].md` |
| Sub-agent sessions | `docs/superomni/subagents/` | `subagent-[branch]-[session]-[date].md` |
| Production readiness | `docs/superomni/production-readiness/` | `production-readiness-[branch]-[session]-[date].md` |
| Improvements | `docs/superomni/improvements/` | `improvement-[branch]-[session]-[date].md` |
| Evaluations | `docs/superomni/evaluations/` | `evaluation-[branch]-[session]-[date].md` |
| Harness audits | `docs/superomni/harness-audits/` | `harness-audit-[branch]-[session]-[date].md` |

**`[session]` naming:** Auto-generate a short kebab-case identifier from conversation context (e.g., `vibe-skill`, `auth-refactor`). Max 30 chars. Enables agents to search and retrieve relevant prior sessions.

Documents in `docs/superomni/` serve as a permanent, indexable audit trail for agent self-improvement.

## Notes for Claude

- Skills in `skills/` define when and how you should behave
- Always check `using-skills/SKILL.md` first — it's the meta-skill
- **Project tools first:** Always prefer built-in skills (`skills/`) and agents (`agents/`) over any external tools. Only reach for external tools when no project-local skill or agent is suitable.
- Respect PROACTIVE mode — if false, only run skills when explicitly asked
- Use status protocol: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT
- **Session continuity:** After any skill session ends, remain in superomni mode. For every follow-up message, scan for existing context (`docs/superomni/specs/spec-*.md`, `docs/superomni/plans/plan-*.md`, `docs/superomni/`, `.superomni/`) and re-engage the appropriate skill automatically. Always close a completed session with a "What's next →" hint.
- **CRITICAL — No EnterPlanMode in superomni workflows:** When any superomni skill is active (after `/vibe`, `/brainstorm`, `/write-plan`, or any skill invocation), NEVER use Claude Code's built-in `EnterPlanMode` tool. Always follow the skill's own workflow phases and delegate to the appropriate superomni skill (e.g., `writing-plans` for planning). `EnterPlanMode` bypasses the superomni pipeline and must not be used during superomni sessions.
