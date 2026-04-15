# Design Document

## superomni — Architecture and Fusion Strategy

**Version:** 0.5.5
**Status:** Implemented (v0.5.5)

---

## 1. Project Overview

superomni is an AI coding skill framework that fuses the methodology-driven approach of [obra/superpowers](https://github.com/obra/superpowers) with the engineering completeness principles of [garrytan/gstack](https://github.com/garrytan/gstack).

### Core Tension (Resolved)

The two source projects have a philosophical tension:

| Dimension | obra/superpowers | garrytan/gstack |
|-----------|-----------------|-----------------|
| Philosophy | YAGNI — don't build what you don't need | Boil the Lake — completeness is cheap |
| Skill trigger | Forced injection at session start | Manual invocation via commands |
| Debugging | 4-phase scientific method | Scope Lock + Pattern Table + Debug Report |
| Planning | Light subagent reviewer | 3-stage CEO→Design→Eng pipeline |
| State | Stateless | `~/.gstack/` persistent state |

**Resolution: "Plan Lean, Execute Complete"**

- **During planning:** Apply YAGNI — don't design features you don't need
- **During execution:** Apply completeness — what you've decided to build, build fully

This resolves the tension without discarding either philosophy.

---

## 2. Design Decisions

### Decision 1: Skill Trigger Mode → PROACTIVE Toggle

**Problem:** superpowers forces skills at every session start. gstack requires manual invocation. Which is right?

**Decision:** Both are right for different users and contexts. Implement PROACTIVE mode with a toggle:
- `proactive=true` (default): Skills auto-activate on trigger phrases (superpowers style)
- `proactive=false`: Agent suggests skills but doesn't run them automatically (gstack style)

**Implementation:** `bin/config get/set proactive` → affects preamble behavior in all skills.

### Decision 2: Template System → `.tmpl` + `{{PREAMBLE}}`

**Problem:** superpowers uses raw `.md` files (no build step, simple). gstack uses `.tmpl` with macros (consistent shared context, requires build). Which is right?

**Decision:** Adopt gstack's template system for consistency, but:
1. Keep build step simple (single `{{PREAMBLE}}` macro only)
2. Pre-build all `.md` files and commit them (so users get skills without running build)
3. `.tmpl` files are the source of truth for developers

**Implementation:** `lib/gen-skill-docs.sh` — pure bash, no dependencies.

### Decision 3: Debugging → Fused (superpowers 4-phase + gstack Scope Lock)

**Problem:** Both projects have debugging protocols. superpowers has root-cause tracing and 3 supporting docs. gstack has Scope Lock, Pattern Table, and Debug Report format. Which is canonical?

**Decision:** Neither — merge the best of both:
- Keep superpowers' 4-phase protocol (Iron Law + root cause → hypothesis → implement)
- Add gstack's Scope Lock (prevents scope creep during debugging)
- Add gstack's Pattern Table (8 common bug patterns with signatures)
- Add gstack's Debug Report format (structured output at end)
- Keep superpowers' 3 supporting docs (root-cause-tracing, defense-in-depth, condition-based-waiting)

**Implementation:** `skills/systematic-debugging/` — 4 files total.

### Decision 4: Plan Review → 3-Stage Pipeline (simplified gstack)

**Problem:** superpowers has a lightweight plan reviewer. gstack has CEO/Design/Eng 3-stage pipeline with 6 principles + autoplan automation + Dual Voices (Claude + Codex). Which to use?

**Decision:** Adopt gstack's 3-stage pipeline, but:
1. Remove Codex dependency (Dual Voices requires external service)
2. Keep CEO/Design/Eng phases (they add real value)
3. Keep 6 Decision Principles (core value proposition)
4. Use superpowers' subagent protocol instead of Dual Voices

**Implementation:** `skills/plan-review/` — full 3-stage with Decision Audit Trail and Final Gate.

### Decision 5: investigate vs systematic-debugging

**Problem:** Both projects have investigation/debugging skills. Significant overlap risk.

**Decision:** Clear separation by purpose:
- `systematic-debugging` = you have a specific error/bug → find root cause and fix
- `investigate` = you don't have an error → you're building a mental model

The distinction is in the _starting state_, not the methods.

### Decision 6: retro → Generalized from gstack

**Problem:** gstack's `/retro` is tightly coupled to gstack infrastructure (`~/.gstack/`, gstack-specific session tracking).

**Decision:** Reimplement retro using generic git primitives only:
- Git log analysis (works in any git project)
- Session detection from commit timestamps (45-min gap threshold)
- No dependency on gstack-specific state
- Save reports to `.context/retros/` (project-local, git-ignoreable)

### Decision 7: Multi-Platform Support Strategy

**Problem:** superomni was originally built for Claude Code only. Users want to use it with Cursor, Codex, Gemini CLI, and OpenCode.

**Decision:** Platform detection at setup and hook time:
1. `./setup` auto-detects the active platform and configures paths accordingly
2. `hooks/session-start` detects the platform at runtime for environment-specific behavior
3. Skill definitions remain platform-agnostic — only hooks and setup are platform-aware
4. Each platform gets appropriate config file placement and hook registration

**Implementation:** Platform detection in `setup` and `hooks/session-start`.

### Decision 8: Review Checklists (Data vs Logic Separation)

**Problem:** Code review and QA skills need structured checklists. Embedding checklists in skill logic makes them hard to maintain.

**Decision:** Separate checklist data from skill logic:
1. Checklists are stored as data (markdown tables or YAML) within skill directories
2. Skill logic references checklists but doesn't hardcode them
3. New checklists can be added without modifying skill protocol
4. `receiving-code-review` uses checklists to systematically address review feedback

### Decision 9: Workflow/Sprint Pipeline (Inter-Skill Orchestration)

**Problem:** Individual skills work well in isolation, but real development follows a pipeline: plan → implement → test → review → ship. No skill orchestrates this.

**Decision:** The `workflow` skill orchestrates inter-skill pipelines:
1. Defines sprint phases that map to existing skills
2. Tracks progress across phases (plan → code → QA → review → ship)
3. Suggests the next skill to invoke based on current state
4. Does not replace individual skills — it sequences them

---

## 3. Architecture

### Layer 1: Session Hook

```
Claude Code session starts
    ↓
hooks/session-start executes
    ↓
Environment detected (PROACTIVE mode, branch, project)
    ↓
skills/using-skills/SKILL.md injected into context
    ↓
Agent knows: available skills, when to use them, status protocol
```

### Layer 2: Skill Protocol

```
User or agent trigger condition detected
    ↓
Relevant SKILL.md loaded
    ↓
Preamble executed (env detection, PROACTIVE check, telemetry start)
    ↓
Skill phases executed in order
    ↓
Status protocol reported (DONE/BLOCKED/etc.)
    ↓
Telemetry written (local only)
```

### Layer 3: Shared Infrastructure

```
lib/preamble.md         ← Injected into every skill via {{PREAMBLE}}
bin/config              ← Read/write configuration
bin/analytics-log       ← Write local telemetry
bin/slug                ← Stable project identifier
~/.omni-skills/         ← Runtime state directory
```

### Layer 4: Sub-Agents

```
Main agent encounters complex task
    ↓
subagent-development skill activates
    ↓
Tasks decomposed into independent units
    ↓
Sub-agents spawned with: input, output contract, scope, constraints
    ↓
Outputs validated, integrated, tested
```

---

## 4. Skill Design Patterns

### Pattern 1: Iron Law

Every skill that has a common failure mode has an "Iron Law" — an absolute rule that overrides all optimization pressure.

- `systematic-debugging`: "NO FIXES WITHOUT ROOT CAUSE FIRST"
- `test-driven-development`: "WRITE THE TEST FIRST"
- `executing-plans`: "ONE STEP AT A TIME"

### Pattern 2: Phase Structure

All skills use numbered phases that must be completed in order. No skipping.

### Pattern 3: Status Protocol

All skills end with a structured status report using the same 4 statuses. This makes skill output machine-parseable.

### Pattern 4: Decision Audit Trail

Skills that make decisions (plan-review, code-review) maintain a table of what was decided and why. This surfaces implicit reasoning.

### Pattern 5: Blast Radius Awareness

Any skill that modifies files checks and reports blast radius (number of files touched). If >5 files: mandatory user notification.

---

## 5. State Management

```
~/.omni-skills/
├── config              ← key=value pairs (proactive, telemetry)
├── .current-slug       ← cached project slug
├── sessions/
│   └── sessions.jsonl  ← session start events
├── analytics/
│   └── usage.jsonl     ← skill usage events (local only)
├── projects/
│   └── <slug>/         ← per-project state
└── debug-scope.txt     ← active debug scope lock (transient)
```

All state is local. No network calls. No external dependencies.

---

## 6. Template System

### Source Format (`SKILL.md.tmpl`)

```markdown
---
name: skill-name
description: |
  Description with triggers.
allowed-tools: [...]
---

{{PREAMBLE}}

# Skill Title
...
```

### Build Process (`lib/gen-skill-docs.sh`)

1. Read `lib/preamble.md` content
2. For each `SKILL.md.tmpl` found under `skills/`
3. Replace `{{PREAMBLE}}` with preamble content (using awk)
4. Write output as `SKILL.md` in the same directory

### Why awk?

The preamble contains shell code and special characters (`$`, `\`). Standard `sed` escaping for multiline replacements is error-prone. `awk` handles this cleanly with the `-v` parameter approach.

---

## 7. Fusion Outcome: What's New vs What's Absorbed

### Directly absorbed from superpowers (10 skills)
- brainstorm (+ Search Before Building)
- writing-plans (+ 6 principles, Completeness Check)
- executing-plans (+ Status Protocol)
- subagent-development (full prompt template suite + wave planning from dispatching-parallel)
- test-driven-development
- verification (+ Status Protocol)
- git-worktrees
- finishing-branch
- writing-skills

### Fused (superpowers + gstack)
- **systematic-debugging**: superpowers 4-phase + gstack Scope Lock + Pattern Table + Debug Report
- **code-review**: superpowers review + gstack blast radius concept + 6 principles

### Adapted from gstack
- **plan-review**: gstack 3-stage pipeline, Codex dependency removed, subagent protocol instead
- **retro**: gstack retro, generalized to pure git (no gstack-specific infrastructure)
- **investigate**: gstack investigate, scoped to complement systematic-debugging
- **ship**: gstack ship, generalized release workflow

### New in v0.2.0
- **receiving-code-review**: Structured protocol for responding to review feedback
- **security-audit**: OWASP/STRIDE-informed security vulnerability audit
- **qa**: Quality assurance pass with structured checklists
- **careful**: Safety guardrails for destructive/high-risk operations
- **workflow**: Sprint pipeline orchestration across skills
- **Multi-platform support**: Claude Code, Cursor, Codex, Gemini CLI, OpenCode
- **Review checklists**: Data-driven checklist system for review and QA skills

### New (original to superomni)
- **ETHOS.md**: Plan Lean / Execute Complete synthesis
- **lib/preamble.md**: PROACTIVE mode toggle, unified status protocol
- **using-skills**: new meta-skill (superpowers has using-superpowers but more limited)
- **bin/config**: config management with PROACTIVE toggle
- **hooks/session-start**: fused env detection + skill injection

---

## 9. Dynamic Agent & Skill Discovery

### Design

Users sometimes need skills or agents beyond what ships with superomni. Rather than requiring users to know where to find them, the framework provides discovery commands built into the manager scripts:

```bash
bin/agent-manager search <query>   # Search GitHub for agent files
bin/skill-manager search <query>   # Search GitHub for skill files
```

### Decision: In-band search vs external registry

**Problem:** How should users find community agents and skills?

**Decision:** In-band search via the existing manager scripts, with fallback to known registries. This:
1. Requires no new infrastructure or external registry
2. Works offline with graceful degradation (shows manual URLs)
3. Leverages GitHub's existing code search index
4. Keeps the install flow consistent (`search` → `install <url>`)

### New Skills in v0.3.0

| Skill | Origin | Purpose |
|-------|--------|---------|
| `office-hours` | gstack-inspired | YC-style product discovery before building (P2) |
| `document-release` | Original | Post-ship documentation synchronization (P3) |

### Consolidation (v0.3.0 → v0.5.x)

Three skills were merged to reduce overlap and cognitive load (31 → 28 skills):

| Removed Skill | Merged Into | How |
|---------------|-------------|-----|
| `autoplan` | `plan-review` | Auto mode — `/autoplan` triggers the full CEO→Design→Eng pipeline automatically |
| `dispatching-parallel` | `subagent-development` | Wave planning — parallel dispatch is now a built-in capability of subagent-development |
| `freeze` | `systematic-debugging` | Scope lock — `/freeze` restricts edits to a directory, integrated into the debug workflow |

### New Agents in v0.3.0

| Agent | Specialty |
|-------|-----------|
| `ceo-advisor` | Product strategy, scope mode, demand validation |
| `designer` | UX review, missing states, AI slop detection |

The `ceo-advisor` agent formalizes the CEO Lens from the `plan-review` skill into a standalone agent that can be invoked independently or used in `plan-review`'s auto mode (`/autoplan`).

The `designer` agent adds the missing design review dimension to the framework — previously design review existed only as a phase inside `plan-review`.

---

## 8. Design Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| 28 skills is a lot — cognitive overload | PROACTIVE mode focuses agent; `workflow` skill sequences skills; skills reference each other; consolidation reduced count from 31 to 28 |
| `.tmpl` build step adds complexity | Pre-built `.md` files committed; build only needed for dev |
| investigate + systematic-debugging overlap | Clear separation: no error → investigate; has error → debug |
| retro requires git history | Gracefully handles shallow clones with `git fetch` |
| gstack Dual Voices removed | Noted as future upgrade; consensus optional with Codex config |
| Multi-platform support fragmentation | Platform detection is isolated to setup/hooks; skills stay platform-agnostic |
| workflow skill over-orchestration | workflow suggests, doesn't force; individual skills remain independently usable |
| security-audit false sense of security | Clearly documented as AI-assisted, not a replacement for professional security review |

---

## 9. Design Decisions: v0.4.0 — Harness Engineering

### Decision 5: Harness Engineering as a First-Class Skill

**Problem:** As superomni grows, the framework itself accumulates entropy: bloated preamble, misaligned tool sets, missing evaluation gates, weak feedback loops. There was no systematic way to maintain the harness.

**Decision:** Add `harness-engineering` as a P1 skill with a formal audit protocol covering context efficiency, tool minimalism, evaluation gate coverage, feedback loops, and documentation freshness.

**Implementation:** `skills/harness-engineering/` with 8-phase audit, Harness Health Score (N/25), and prioritized improvement backlog output to `docs/superomni/harness-audits/`.

### Decision 6: Evaluator as a Dedicated Agent

**Problem:** The framework had evaluation concepts (verification skill, code-reviewer agent) but no dedicated evaluation persona that could be invoked at any quality gate — independent of the skill that produced the output.

**Decision:** Add the `evaluator` agent — a ruthlessly objective quality judge that produces criterion-by-criterion verdicts with evidence. Based on Anthropic's principle that *"judgment is the load-bearing part of agent harness design."*

**Implementation:** `agents/evaluator.md` with APPROVED / APPROVED_WITH_NOTES / CHANGES_REQUIRED / EVALUATION_INCOMPLETE verdicts.

### Decision 7: Wave Evaluation Gates in Executing-Plans

**Problem:** The `executing-plans` skill executed waves in parallel but had no gate between waves — wave N+1 could begin before wave N's outputs were verified.

**Decision:** Add an explicit evaluation gate phase between each wave. Gates check tests, regressions, and output contracts before the next wave begins. Failed gates trigger harness signal analysis before retry.

**Implementation:** Phase 4 (Wave Evaluation Gate) added to `executing-plans/SKILL.md.tmpl`. `evaluator` agent can be spawned for complex wave gates.

### New Skills in v0.4.0

| Skill | Origin | Purpose |
|-------|--------|---------|
| `harness-engineering` | OpenAI/Anthropic inspired | Design and maintain the agent harness |

### New Agents in v0.4.0

| Agent | Specialty |
|-------|-----------|
| `evaluator` | Criterion-by-criterion quality evaluation with evidence-backed verdicts |

The `evaluator` agent completes the quality gate coverage: previously `code-reviewer` covered code reviews, but there was no generic evaluation agent for output quality at any stage.

### New Documents in v0.4.0

| Document | Purpose |
|---------|---------|
| `docs/HARNESS.md` | Comprehensive harness engineering guide and architecture diagram |
