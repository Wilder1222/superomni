# superomni

> **Plan Lean, Execute Complete** — A fused AI coding skill framework for Claude Code, Codex, Gemini CLI, and GitHub Copilot.

superomni combines the best ideas from [obra/superpowers](https://github.com/obra/superpowers) (methodology-driven AI skill framework) and [garrytan/gstack](https://github.com/garrytan/gstack) (engineering completeness principles) into a unified, opinionated system for AI-assisted software development.

---

## What Is This?

superomni is a collection of **skills** — structured behavior specifications for AI coding assistants. Each skill tells Claude Code exactly how to handle a specific type of work: brainstorming, planning, debugging, testing, reviewing, shipping.

The framework is built on one core philosophy:

> **Plan with YAGNI. Execute with completeness.**

Plan only what you need. But what you decide to build — build it fully.

---

## Quick Start

### Install

---

**① Claude Code — marketplace install (recommended):**

Inside a Claude Code session, register and install the skill from GitHub:

```
/plugin marketplace add Wilder1222/superomni
```

Claude Code will fetch the `.claude-plugin/marketplace.json` manifest, install all skills, register slash commands, and set up session hooks automatically.

Then start with:

```
/vibe
```

---

**② Codex, Gemini CLI, GitHub Copilot — global install:**

For **Codex CLI**, **Gemini CLI**, and **GitHub Copilot**:

```bash
npm install -g github:Wilder1222/superomni
```

The `postinstall` hook auto-detects your platform and links skills, commands, and hooks automatically.

---

**③ Project-level install via npx (recommended for Codex / Gemini / Copilot):**

Run this from inside your project directory while a CLI session is active:

```bash
npx github:Wilder1222/superomni
```

This copies the skills into `.superomni/` in your project directory and creates
the appropriate config file for your CLI:

| CLI | Config file created |
|-----|---------------------|
| Codex CLI | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |

Skills are available immediately in your current session — no global install needed.

---

### Use in Claude Code

Open your project in Claude Code. Skills activate automatically via session hooks.

Start with:
- `/vibe` — **activate the full framework** and launch the guided default workflow
- `/brainstorm` — design a feature from scratch
- `/write-plan` — turn an idea into an executable plan
- `/execute-plan` — run the plan step by step
- `/review` — structured code review

---

## Skills Reference

### Core Workflow (P0)

| Skill | When to Use | Key Output |
|-------|------------|------------|
| `using-skills` | Always active | Loads the framework |
| `brainstorming` | New feature/design | `spec.md` |
| `writing-plans` | Planning implementation | `plan.md` |
| `executing-plans` | Running a plan | Code changes + report |
| `systematic-debugging` | Any bug/error | Debug report + fix |

### Quality Assurance (P1)

| Skill | When to Use | Key Output |
|-------|------------|------------|
| `test-driven-development` | Writing code | Tests + implementation |
| `verification` | Before claiming done | Verification report |
| `code-review` | Reviewing code/PRs | Structured review |
| `plan-review` | Before executing a plan | Reviewed plan |
| `subagent-development` | Complex parallel tasks | Multi-agent output |
| `receiving-code-review` | Responding to review feedback | Updated code + reply |
| `security-audit` | Security vulnerability audit | Threat model + fixes |
| `qa` | Quality assurance pass | QA report |
| `careful` | High-risk/destructive operations | Safety checklist |
| `self-improvement` | Post-task performance evaluation | Improvement report + 3 actions |
| `production-readiness` | Pre-deploy gate | Readiness report |
| `office-hours` | Product discovery before building | Validated idea + decision |
| `autoplan` | Automated full plan review pipeline | CEO→Design→Eng reviewed plan |
| `freeze` | Restrict edits during risky operations | Scope lock |
| `harness-engineering` | Audit and improve the agent harness | Health score + improvement backlog |

### Advanced (P2)

| Skill | When to Use | Key Output |
|-------|------------|------------|
| `git-worktrees` | Multiple branches | Worktree setup |
| `finishing-branch` | Merging a branch | Clean PR |
| `dispatching-parallel` | Independent parallel tasks | Coordinated output |
| `investigate` | Exploring unfamiliar code | Investigation report |
| `retro` | Weekly review | Retrospective report |
| `ship` | Releasing software | Release + changelog |
| `writing-skills` | Creating new skills | New skill file |
| `workflow` | Sprint pipeline orchestration | Workflow plan + status |
| `agent-management` | Installing or creating agents | Agent installed/created |

---

## Agent Library

superomni ships with specialized agents you can spawn for focused tasks:

| Agent | Specialty |
|-------|-----------|
| `code-reviewer` | Structured code review (P0/P1/P2) |
| `planner` | Task decomposition and plan writing |
| `debugger` | Root-cause analysis and bug resolution |
| `test-writer` | Behavior-verifying test suites |
| `security-auditor` | OWASP-aware vulnerability identification |
| `architect` | System design and architecture review |
| `evaluator` | Criterion-by-criterion quality evaluation with evidence-backed verdicts |
| `ceo-advisor` | Product strategy and scope validation |
| `designer` | UX review and AI slop detection |

### Managing Agents

```bash
# List all available agents
bin/agent-manager list

# Get details about an agent
bin/agent-manager info debugger

# Install an agent from GitHub
bin/agent-manager install https://raw.githubusercontent.com/user/repo/main/agents/my-agent.md

# Install from a local file
bin/agent-manager install ./my-custom-agent.md

# Create a new custom agent (interactive scaffold)
bin/agent-manager create my-specialist

# Remove a user-installed agent
bin/agent-manager remove my-specialist
```

See [`docs/AGENTS.md`](docs/AGENTS.md) for the full agent library reference.

---

## Multi-Platform Support

superomni supports the following AI coding platforms:

| Platform | Status | Setup |
|----------|--------|-------|
| **Claude Code** | ✅ Full support | Marketplace install or `npm install -g` |
| **Codex CLI** | ✅ Full support | `npx superomni` (writes `AGENTS.md`) or `npm install -g` |
| **Gemini CLI** | ✅ Full support | `npx superomni` (writes `GEMINI.md`) or `npm install -g` |
| **GitHub Copilot** | ✅ Full support | `npx superomni` (writes `.github/copilot-instructions.md`) |

The setup script detects your platform and configures hooks, skills injection, and session management accordingly.

---

## Configuration

```bash
# Check current config
bin/config list

# Disable auto-skill triggers (manual mode)
bin/config set proactive false

# Re-enable auto triggers
bin/config set proactive true

# Disable local telemetry
bin/config set telemetry false
```

Config is stored at `~/.omni-skills/config`. Telemetry is **local only** — nothing is sent to external servers.

---

## Philosophy

### The 6 Decision Principles

When making technical decisions, apply in context:

1. **Choose completeness** — cover more edge cases
2. **Boil lakes** — fix everything in blast radius if <1 day effort
3. **Pragmatic** — two equal options? Pick the cleaner one
4. **DRY** — duplicates existing? Reject. Reuse what exists.
5. **Explicit over clever** — 10-line obvious > 200-line abstraction
6. **Bias toward action** — flag concerns but don't block

### Status Protocol

Every skill session ends with one of:

| Status | Meaning |
|--------|---------|
| `DONE` | All steps complete. Evidence provided. |
| `DONE_WITH_CONCERNS` | Complete, but issues noted. |
| `BLOCKED` | Cannot proceed. State what blocks you. |
| `NEEDS_CONTEXT` | Missing info. State exactly what you need. |

### PROACTIVE Mode

- `proactive=true` (default): Skills auto-activate when triggers are detected
- `proactive=false`: Skills only run when explicitly invoked. Agent says: *"I think [skill] might help — want me to run it?"*

---

## Directory Structure

```
superomni/
├── hooks/                    ← Claude Code session hooks
│   ├── session-start         ← Injects skills at session start
│   └── hooks.json
│
├── skills/                   ← Skill definitions
│   ├── using-skills/         ← Meta-skill (always active)
│   ├── brainstorming/        ← Design → Spec
│   ├── writing-plans/        ← Spec → Plan
│   ├── executing-plans/      ← Plan → Code
│   ├── systematic-debugging/ ← Debug with Scope Lock + Debug Report
│   ├── test-driven-development/
│   ├── verification/
│   ├── code-review/
│   ├── plan-review/          ← CEO→Design→Eng 3-stage pipeline
│   ├── subagent-development/
│   ├── git-worktrees/
│   ├── finishing-branch/
│   ├── dispatching-parallel/
│   ├── investigate/
│   ├── retro/                ← Weekly engineering retrospective
│   ├── ship/                 ← Release workflow
│   ├── writing-skills/       ← Meta: create new skills
│   ├── receiving-code-review/ ← Respond to review feedback
│   ├── security-audit/       ← Security vulnerability audit
│   ├── qa/                   ← Quality assurance
│   ├── careful/              ← Safety guardrails
│   ├── workflow/             ← Sprint pipeline orchestration
│   ├── self-improvement/     ← Post-task performance evaluation
│   ├── harness-engineering/  ← Agent harness audit and optimization
│   └── agent-management/     ← Install, create, and manage agents
│
├── agents/                   ← Specialized agent definitions
│   ├── code-reviewer.md      ← Code reviewer agent
│   ├── planner.md            ← Strategic task planner
│   ├── debugger.md           ← Root-cause debugger
│   ├── test-writer.md        ← Test suite writer
│   ├── security-auditor.md   ← OWASP-aware security auditor
│   ├── architect.md          ← Architecture reviewer
│   ├── evaluator.md          ← Quality evaluation with evidence-backed verdicts
│   ├── ceo-advisor.md        ← Product strategy and scope validation
│   └── designer.md           ← UX review and AI slop detection
│
├── commands/                 ← Slash command definitions
│   ├── vibe.md               ← /vibe — activate full framework + guided workflow
│   ├── brainstorm.md
│   ├── write-plan.md
│   ├── execute-plan.md
│   ├── review.md
│   └── harness-audit.md      ← /harness-audit — audit agent harness health
│
├── lib/
│   ├── preamble.md           ← Shared preamble injected into all skills
│   └── gen-skill-docs.sh     ← Builds SKILL.md from SKILL.md.tmpl
│
├── bin/
│   ├── agent-manager         ← Agent lifecycle manager
│   ├── config                ← Config management
│   ├── slug                  ← Project identifier
│   └── analytics-log         ← Local telemetry writer
│
├── docs/
│   ├── AGENTS.md             ← Agent library reference
│   ├── DESIGN.md             ← Architectural design
│   └── IMPLEMENTATION.md     ← Implementation details
│
├── ETHOS.md                  ← Core philosophy
├── CLAUDE.md                 ← Project config for Claude
├── setup                     ← Installation script
└── package.json
```

---

## Design Documents

- [`ETHOS.md`](ETHOS.md) — Core philosophy: Plan Lean, Execute Complete
- [`docs/DESIGN.md`](docs/DESIGN.md) — Architectural design and fusion strategy
- [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) — Implementation details and development guide
- [`docs/AGENTS.md`](docs/AGENTS.md) — Agent library reference
- [`docs/COMPARISON.md`](docs/COMPARISON.md) — Detailed comparison: superomni vs superpowers vs gstack

---

## Development

### Building Skills from Templates

23 skills use `{{PREAMBLE}}` as a macro that gets expanded during build:

```bash
# Build all skills
npm run build
# or
bash lib/gen-skill-docs.sh

# Build a single skill
bash lib/gen-skill-docs.sh skills/systematic-debugging/SKILL.md.tmpl
```

### Adding a New Skill

```bash
# Use the meta-skill!
# In Claude Code:
/brainstorm a new skill for [your use case]
```

Or manually:
1. Create `skills/<name>/SKILL.md.tmpl` (see `writing-skills` skill)
2. Run `bash lib/gen-skill-docs.sh`
3. Add to `CLAUDE.md` skills table

---

## Attribution

This project fuses:
- [obra/superpowers](https://github.com/obra/superpowers) — MIT License — methodology-driven skill framework
- [garrytan/gstack](https://github.com/garrytan/gstack) — MIT License — engineering completeness principles

Original contributions: Plan Lean/Execute Complete philosophy, 3-stage plan review pipeline, Scope Lock + Debug Report fusion, PROACTIVE mode toggle, retro skill generalization.

## License

MIT — see [LICENSE](LICENSE)
