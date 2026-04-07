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
If you feel the urge to call EnterPlanMode, that is the signal to invoke the `brainstorm` or `writing-plans` skill instead. EnterPlanMode bypasses the superomni pipeline — always route planning through superomni skills.

The impulse to plan IS the trigger for the brainstorm skill, not for Plan Mode.
</EXTREMELY-IMPORTANT>

## Follow-up Message Protocol

**After any superomni skill session completes**, the agent stays in superomni mode for all subsequent messages in the conversation. When the user sends a new message:

### Step 1 — Scan for existing context
```bash
ls docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md docs/superomni/ .superomni/ 2>/dev/null
git log --oneline -3 2>/dev/null
git status --short 2>/dev/null
```

### Step 2 — Determine current stage and re-engage
Use the scan results to locate the current pipeline stage:

| Context found | Current stage | Skill to use |
|---------------|--------------|--------------|
| No artifacts | THINK | `brainstorm` |
| `docs/superomni/specs/spec-*.md` only | PLAN | `writing-plans` |
| `docs/superomni/specs/spec-*.md` + `docs/superomni/plans/plan-*.md` but no review | REVIEW | `plan-review` |
| `docs/superomni/plans/plan-*.md` reviewed + open items | BUILD | `executing-plans` or `subagent-development` |
| Plan all checked, no verification/prod-readiness | VERIFY | `code-review` → `qa` → `verification` → `production-readiness` |
| `docs/superomni/production-readiness/` files exist | SHIP | `ship` |
| Shipped (tagged release or merged PR), no improvement/retro report | REFLECT | `self-improvement` → `retro` |
| `docs/superomni/executions/` files exist | Continuing run | Resume with the same skill |
| `docs/superomni/reviews/` files exist | Post-review | `receiving-code-review` |

### Step 3 — Announce continuity
Before handling the user's new request, say:

> *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*

Then apply the identified skill to address the user's new message.

### Override
If the user's message is clearly unrelated to the prior session (e.g. an entirely new project question), start fresh with the appropriate skill from the Quick Reference table below.

## PROACTIVE Mode

Check your PROACTIVE setting:
```bash
~/.claude/skills/superomni/bin/config get proactive
```

- **`proactive=true`** (default): Automatically trigger relevant skills when you detect a matching situation. Don't ask for permission — just invoke the skill.
- **`proactive=false`**: Do NOT auto-invoke skills. Instead, say: *"I think the [skill-name] skill might help here — want me to run it?"* and wait for confirmation.

## Default Working Mode: Sub-Agent First

**Sub-agent development is the default working mode.** Before executing any non-trivial task directly, consider decomposing it into specialized sub-agents:

- Any task spanning multiple files or concerns → use `subagent-development`
- Only skip sub-agents for trivially small tasks (< 5 min, single file, single concern)
- Sub-agent sessions, code reviews, and execution results are **always saved as Markdown documents** in `docs/superomni/` for the user to review
- Internal state (improvements, evaluations, harness audits) stays in `.superomni/`

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
| Weekly engineering summary | `retro` |
| Deploying/releasing software | `ship` |
| Creating a new skill | `writing-skills` |
| Exploratory investigation | `investigate` |
| Responding to review feedback | `receiving-code-review` |
| Auditing for security vulnerabilities | `security-audit` |
| Quality assurance and testing | `qa` |
| Safety guardrails for high-risk operations | `careful` |
| Sprint pipeline orchestration | `workflow` |
| Managing, installing, searching for online, or creating agents | `agent-management` |
| Product discovery and idea validation | `office-hours` |
| Automated full plan review pipeline | `plan-review` (auto mode) |
| Restrict edits to a directory (built into `systematic-debugging`) | `systematic-debugging` |
| Update docs after shipping | `document-release` |
| Verifying production readiness before deploy | `production-readiness` |
| Post-task performance evaluation and improvement | `self-improvement` |
| Audit and maintain the agent harness health | `harness-engineering` |

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
