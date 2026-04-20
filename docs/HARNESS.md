# Harness Engineering Guide

> "Engineers design the system. Agents execute." — OpenAI Harness Engineering

## What Is Harness Engineering?

Harness engineering is the discipline of designing the **environment, constraints, context, evaluation gates, and feedback loops** that surround AI agents. It is the primary engineering activity in agentic development — more important than writing any individual piece of code.

Instead of focusing on what the agent produces, harness engineers focus on **creating the conditions under which agents reliably produce good work.**

superomni is itself a harness: a system of skills, agents, constraints, and feedback loops designed to make AI coding assistants produce high-quality, reliable output.

---

## Core Principles

These principles are derived from OpenAI and Anthropic engineering practices and applied specifically to superomni.

### 1. Context Is Everything

Agents can only work with what they can see. Information that isn't in the repository is invisible to the agent.

**In superomni:**
- Every skill, constraint, and protocol must be documented in `skills/` or `docs/`
- `lib/preamble.md` is the always-loaded context — keep it tight (< 150 lines)
- `CLAUDE.md` is the project-level harness configuration — keep it current
- Stale docs are worse than no docs: they actively mislead agents

### 2. Progressive Disclosure

Expose agents to only the context needed for the current task stage. Don't load the entire harness at once.

| Stage | Context to load | Context to defer |
|-------|---------------|-----------------|
| Planning | spec, constraints, prior decisions | Full codebase, test suites |
| Implementation | plan, relevant source files | Unrelated modules |
| Review | diff, standards, failing tests | Implementation history |
| Debug | minimal repro, error message | Entire codebase |

### 3. Fewer, More Expressive Tools

Per Anthropic's research: *fewer, more expressive tools outperform large menus of narrow tools.*

**In superomni:**
- Each skill should have the minimum tool set needed for its purpose
- Composable skill combinations are preferred over single large skills
- The `subagent-development` skill handles complexity through specialization, not a larger toolbox

### 4. Evaluation Gates Are Non-Negotiable

*"Evaluation is the load-bearing part of agent harness design."*

Without evaluation gates, agent output is unverified and quality is non-deterministic. Gates must exist at every major workflow transition:

```
Spec → Plan → Execution Wave → Review → Ship → Done
  ↑        ↑             ↑          ↑       ↑
gate     gate           gate       gate    gate
```

In superomni, these gates are implemented as:
- `plan-review` skill (Spec → Plan)
- Wave evaluation gate in `executing-plans` skill (Wave → Wave)
- `code-review` skill / `code-reviewer` agent (Implementation → Review)
- `production-readiness` skill (Review → Ship)
- `verification` skill (Ship → Done)
- `self-improvement` skill (Done → Next Sprint)

### 5. Failures Are Harness Signals

When an agent fails repeatedly, the correct response is to **update the harness**, not to retry the same prompt.

```
Agent fails 3+ times
       ↓
This is a harness deficiency signal
       ↓
Identify: missing doc? unclear constraint? wrong tool access? evaluation gap?
       ↓
Update the harness
       ↓
Retry with improved harness
       ↓
Agent succeeds (or fails differently → new signal)
```

The `harness-engineering` skill formalizes this process.

### 6. Boring > Clever

The most reliable harnesses use simple, composable patterns. Novel abstractions create debugging overhead and make harnesses harder to maintain.

**In superomni:**
- Skills are plain Markdown with a single `{{PREAMBLE}}` macro — no complex template system
- The build step is a 40-line bash script
- Agents are Markdown files, not code
- Configuration is a single `bin/config` script

### 7. Continuous Garbage Collection

Harnesses accumulate entropy over time: stale docs, drifted constraints, dead commands, conflicting iron laws. Schedule periodic GC passes.

**Recommended superomni GC cadence:** After every 5 sprints, run the `harness-engineering` skill to score and clean the harness.

---

## superomni Harness Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        HARNESS LAYER                         │
│                                                              │
│  lib/preamble.md ← always-loaded context (< 150 lines)      │
│  CLAUDE.md       ← project-level skill registry              │
│  claude-skill.json ← commands + hooks manifest              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              SKILLS (behavior specs)                │     │
│  │  P0: using-skills, brainstorm, writing-plans,    │     │
│  │      executing-plans, systematic-debugging           │     │
│  │  P1: verification, code-review, self-improvement,   │     │
│  │      production-readiness, harness-engineering       │     │
│  │  P2: investigate, ship, git-worktrees, ...          │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              AGENTS (specialized personas)          │     │
│  │  planner, code-reviewer, debugger, test-writer,     │     │
│  │  security-auditor, architect, evaluator,            │     │
│  │  ceo-advisor, designer                              │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │         EVALUATION GATES (quality enforcement)      │     │
│  │  plan-review → wave gate → code-review →            │     │
│  │  production-readiness → verification                │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │        FEEDBACK LOOPS (improvement signals)         │     │
│  │  self-improvement → workflow → next sprint          │     │
│  │  harness-engineering → harness update → retry       │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## Harness Maintenance

### Skill Health Indicators
- Skill is > 300 lines → candidate for splitting
- Skill tool set includes > 5 tools → audit for minimalism
- Skill hasn't been invoked in 10+ sprints → candidate for archival
- Skill's iron law conflicts with another skill's → resolve immediately

### Preamble Health Indicators
- Preamble > 150 lines → audit for redundancy
- Any section that duplicates individual skill instructions → remove from preamble
- Dead code in telemetry block → clean up

### Agent Health Indicators
- Agent iron law conflicts with a skill's iron law → resolve
- Agent output format not consumed by any skill → audit for usefulness
- Agent hasn't been spawned in 10+ sprints → candidate for archival

### Evaluation Gate Health Indicators
- Any workflow transition without a gate → add one
- Gate that passes everything trivially → strengthen criteria
- Gate that fails so often it's bypassed → investigate root cause, simplify criteria or improve upstream quality

---

## Reference

- OpenAI: [Harness Engineering: Leveraging Codex in an Agent-First World](https://openai.com/index/harness-engineering/)
- Anthropic: [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- Martin Fowler: [Harness Engineering](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)
- superomni skill: `skills/harness-engineering/`
- superomni agent: `agents/evaluator.md`
