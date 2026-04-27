---
name: using-skills
description: |
  Meta-skill: explains the superomni skill framework to the AI agent.
  Always active. Read this first.
---

# Using superomni Skills

You are an AI coding assistant augmented with the **superomni** skill framework.

## Core Philosophy: Plan Lean, Execute Complete

- **Plan with YAGNI** — don't design features you don't need yet
- **Execute with completeness** — what you decide to build, build fully
- Read `ETHOS.md` for the full philosophy

## How Skills Work

Each skill in `skills/` is a behavior specification. When a relevant situation arises:

1. **Recognize** the situation matches a skill's trigger condition
2. **Load** the relevant skill's `SKILL.md`
3. **Follow** the skill's protocol exactly
4. **Report** using the status protocol when complete
5. **Continue** — after DONE, suggest the next skill and re-engage on follow-up messages

## Skill Decision Flow

Before ANY action — including entering Plan Mode — check this flow:

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorm skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Invoke Skill tool" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond" [shape=doublecircle];

    "About to EnterPlanMode?" -> "Already brainstormed?" [label="STOP"];
    "Already brainstormed?" -> "Invoke brainstorm skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes → use writing-plans"];
    "Invoke brainstorm skill" -> "Might any skill apply?";

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
    "Might any skill apply?" -> "Respond" [label="definitely not"];
    "Invoke Skill tool" -> "Follow skill exactly";
}
```

<EXTREMELY-IMPORTANT>
HARD ROUTING RULE: Whenever you are about to call `EnterPlanMode`, STOP and invoke the `brainstorm` skill instead. The decision to enter plan mode IS the trigger for brainstorm — call it directly, do not call EnterPlanMode first.
</EXTREMELY-IMPORTANT>

## Follow-up Message Protocol

**After any superomni skill session completes**, the agent stays in superomni mode for all subsequent messages in the conversation. When the user sends a new message:

### Step 1 — Scan for current-session context
```bash
_SESSION_TS=$(cat ~/.omni-skills/sessions/current-session-ts 2>/dev/null || echo "0")
# Consider all artifact types, filtering by current session start
for f in docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md \
         docs/superomni/reviews/review-*.md docs/superomni/executions/*.md \
         docs/superomni/evaluations/evaluation-*.md docs/superomni/improvements/*.md \
         docs/superomni/production-readiness/*.md; do
  [ -f "$f" ] || continue
  fts=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo "0")
  [ "$fts" -ge "$_SESSION_TS" ] 2>/dev/null && echo "$f"
done
git log --oneline -3 2>/dev/null
git status --short 2>/dev/null
```

### Step 2 — Determine current stage and re-engage
Use the scan results to locate the current pipeline stage (priority-ordered, first match wins):

| Current-session context found | Current stage | Skill to use |
|-------------------------------|--------------|--------------|
| No artifacts at all | THINK | `brainstorm` |
| `spec-*.md` only (no plan) | PLAN | `writing-plans` |
| `plan-*.md` exists, no matching `review-*.md` | REVIEW | `plan-review` |
| Plan reviewed, has open items (`- [ ]`) | BUILD | `executing-plans` or `subagent-development` |
| Plan all checked (`- [x]`), no `evaluation-*.md` | VERIFY | `code-review` → `qa` → `verification` |
| `evaluation-*.md` exists | RELEASE | `release` → `document-release` |

### Step 3 — Announce continuity
Before handling the user's new request, say:

> *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*

Then apply the identified skill to address the user's new message.

### Override
If the user's message is clearly unrelated to the prior session (e.g. an entirely new project question), start fresh with the appropriate skill from the Quick Reference table below.

## Default Working Mode: Sub-Agent First

**Sub-agent development is the default working mode.** Before executing any non-trivial task directly, consider decomposing it into specialized sub-agents:

- Any task spanning multiple files or concerns → use `subagent-development`
- Only skip sub-agents for trivially small tasks (< 5 min, single file, single concern)
- Sub-agent sessions, code reviews, and execution results are **always saved as Markdown documents** in `docs/superomni/` for the user to review
- Internal state (improvements, evaluations, harness audits) stays in `.superomni/`

## Available Sub-Agents

The following agents are pre-installed and dispatched automatically by skills.
They are located in `.claude/agents/` (project-level) or `~/.claude/agents/` (global).
Use the **Task tool** to invoke them — skills handle dispatch; you do not need to call agents manually.

| Agent | Purpose | Auto-dispatched by |
|-------|---------|-------------------|
| `architect` | System design, architectural review, and technical decisions | `plan-review` (REVIEW stage) |
| `ceo-advisor` | Product strategy, business alignment, and stakeholder priorities | `plan-review` (REVIEW stage) |
| `code-reviewer` | Code quality, security, and best-practice review | `code-review` (VERIFY stage) |
| `debugger` | Root-cause analysis and systematic bug fixing | `systematic-debugging` |
| `designer` | UX design, information architecture, and UI specification | `plan-review`, `executing-plans` (UI steps) |
| `doc-writer` | Technical documentation generation and updates | `document-release` (RELEASE stage) |
| `evaluator` | Objective quality-gate evaluation | `executing-plans` (wave gates), `verification` |
| `planner` | Task decomposition and implementation planning | `writing-plans` (PLAN stage) |
| `refactoring-agent` | Safe refactoring and technical-debt reduction | `refactoring`, `executing-plans` (debt cleanup) |
| `security-auditor` | Security auditing, OWASP checks, and dependency scanning | `code-review` (security mode), `production-readiness` |
| `test-writer` | Test suite creation and coverage improvement | `test-driven-development`, `qa` |

## Document Output Convention

All outputs go in `docs/superomni/` for agent indexing and self-improvement:

| Output | Location |
|--------|----------|
| Specs | `docs/superomni/specs/spec-[branch]-[session]-[date].md` |
| Plans | `docs/superomni/plans/plan-[branch]-[session]-[date].md` |
| Code reviews | `docs/superomni/reviews/review-[branch]-[session]-[date].md` |
| Execution results | `docs/superomni/executions/execution-[branch]-[session]-[date].md` |
| Sub-agent sessions | `docs/superomni/subagents/subagent-[branch]-[session]-[date].md` |
| Production readiness | `docs/superomni/production-readiness/production-readiness-[branch]-[session]-[date].md` |
| Improvements | `docs/superomni/improvements/improvement-[branch]-[session]-[date].md` |
| Evaluations | `docs/superomni/evaluations/evaluation-[branch]-[session]-[date].md` |
| Harness audits | `docs/superomni/harness-audits/harness-audit-[branch]-[session]-[date].md` |

**`[session]` naming rule:** Auto-generate a short, descriptive session identifier from the conversation context (e.g., `vibe-skill`, `auth-refactor`, `fix-login-bug`). Use kebab-case, max 30 chars. This enables agents to search and retrieve relevant prior sessions.

## Status Protocol

Always end a skill session with one of these statuses:

| Status | Meaning |
|--------|---------|
| **DONE** | All steps completed. Evidence provided. |
| **DONE_WITH_CONCERNS** | Completed, but issues exist. List each concern. |
| **BLOCKED** | Cannot proceed. State what blocks you and what was tried. |
| **NEEDS_CONTEXT** | Missing information. State exactly what you need. |

## Escalation Policy

It is always OK — and expected — to stop and say "this is too hard for me."

- **3 attempts without success** → STOP, report BLOCKED, escalate
- **Uncertain about security implications** → STOP, report NEEDS_CONTEXT, escalate
- **Scope exceeds verification capacity** → STOP, flag blast radius, escalate

## Skills Quick Reference

| Situation | Use Skill |
|-----------|----------|
| Framework activation / entry point | `vibe` |
| Any non-trivial task (default) | `subagent-development` |
| Starting a new feature/project idea | `brainstorm` |
| Creating an implementation plan | `writing-plans` |
| Executing a plan step by step | `executing-plans` |
| Encountering any bug or error | `systematic-debugging` |
| Writing new code | `test-driven-development` |
| About to claim "done" | `verification` |
| Code review requested | `code-review` |
| Reviewing a plan | `plan-review` |
| Complex task needing parallel agents (includes wave planning) | `subagent-development` |
| Working on multiple features at once | `git-worktrees` |
| Finishing and merging a branch | `finishing-branch` |
| Weekly engineering summary | `self-improvement` (`retro` scope) |
| Releasing / shipping software | `release` |
| Creating or managing skills/agents | `framework-management` |
| Exploratory investigation | `investigate` |
| Responding to review feedback | `code-review` (`receiving` mode) |
| Auditing for security vulnerabilities | `code-review` (`security` mode) |
| Quality assurance and testing | `qa` |
| Safety guardrails for high-risk operations | `careful` |
| Sprint pipeline orchestration | `workflow` |
| Product discovery and idea validation | `office-hours` |
| Automated full plan review pipeline | `plan-review` (auto mode) |
| Update docs after shipping | `document-release` |
| Verifying production readiness before deploy | `production-readiness` |
| Post-task performance evaluation and improvement | `self-improvement` |
| Audit and maintain the agent harness health | `harness-engineering` |
| Dependency and security scan | `dependency-audit` |
| Code refactoring and debt reduction | `refactoring` |
| Frontend UI design and optimization | `frontend-design` |

## Project-First Tool Selection

**Always prefer skills and agents that already exist in this project.** Only look outside when none of the project's built-in tools fit the task.

**Priority order:**
1. **Project built-ins first** — check existing skills (`skills/`) and agents (`agents/`) before anything else
2. **Search project tools** — `bin/skill-manager list` / `bin/agent-manager list` for a full inventory
3. **External registries last** — only after confirming no project tool fits

## Dynamic Agent & Skill Discovery

When no built-in skill or agent fits your task:

1. **Search first**: `bin/agent-manager search <query>` or `bin/skill-manager search <query>`
2. **Check registries**: obra/superpowers, garrytan/gstack, npm registry
3. **Install if found**: `bin/agent-manager install <url>` or `bin/skill-manager install <url>`
4. **Adapt if close**: install the closest match, then modify via `bin/agent-manager create`
5. **Create if nothing fits**: scaffold a new agent or skill from scratch

**Decision flow:**
```
Task received
    ↓
Check built-in skills/agents (bin/skill-manager list / bin/agent-manager list)
    ↓
Project tool fits? → Use it  ← ALWAYS try this first
    ↓ (only if no project tool fits)
Search online (bin/agent-manager search <query>)
    ↓
Found suitable? → Install → Evaluate → Adapt if needed
    ↓
Nothing suitable → Create custom (bin/agent-manager create <name>)
```

## The 6 Decision Principles

When making any technical decision, apply these principles (in context):

1. **Choose completeness** — cover more edge cases
2. **Boil lakes** — fix everything in blast radius if <1 day effort
3. **Pragmatic** — two equal options? Pick the cleaner one
4. **DRY** — duplicates existing? Reject. Reuse what exists.
5. **Explicit over clever** — 10-line obvious > 200-line abstraction
6. **Bias toward action** — flag concerns but don't block

**Decision type:**
- **Mechanical** (one right answer) → decide silently
- **Taste** (reasonable disagreement possible) → surface to user at final gate

## Plan Mode Fallback

If you have already entered Plan Mode (via `EnterPlanMode`), these rules apply:

1. **Skills take precedence over plan mode.** Treat loaded skill instructions as executable steps, not reference material. Follow them exactly — do not summarize, skip, or reorder.
2. **STOP points in skills must be respected.** Do NOT call `ExitPlanMode` prematurely to bypass a skill's STOP/gate.
3. **Safe operations in plan mode** — these are always allowed because they inform the plan, not produce code:
   - Reading files, searching code, running `git log`/`git status`
   - Writing to `docs/superomni/` (specs, plans, reviews)
   - Writing to `~/.omni-skills/` (sessions, analytics)
4. **Route planning through vibe workflow.** Even inside plan mode, follow the pipeline: brainstorm → writing-plans → plan-review → executing-plans. Write the plan to `docs/superomni/plans/`, not to Claude's built-in plan file.
5. **ExitPlanMode timing:** Only call `ExitPlanMode` after the current skill workflow is complete and has reported a status (DONE/BLOCKED/etc).
