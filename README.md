# super-omni

> **Plan Lean, Execute Complete** — A fused AI coding skill framework for Claude Code, Cursor, Codex, Gemini CLI, and OpenCode.

super-omni combines the best ideas from [obra/superpowers](https://github.com/obra/superpowers) (methodology-driven AI skill framework) and [garrytan/gstack](https://github.com/garrytan/gstack) (engineering completeness principles) into a unified, opinionated system for AI-assisted software development.

---

## What Is This?

super-omni is a collection of **skills** — structured behavior specifications for AI coding assistants. Each skill tells Claude Code exactly how to handle a specific type of work: brainstorming, planning, debugging, testing, reviewing, shipping.

The framework is built on one core philosophy:

> **Plan with YAGNI. Execute with completeness.**

Plan only what you need. But what you decide to build — build it fully.

---

## Quick Start

### Install

Choose the method that fits your workflow:

---

**① npm global install (recommended for regular use):**

```bash
npm install -g super-omni
```

Setup runs automatically after install. To re-run at any time:

```bash
super-omni
# or with options:
super-omni --only claude
super-omni --skip gemini
super-omni --dry-run
```

---

**② npx — run once without a permanent install:**

```bash
npx super-omni
# or with options:
npx super-omni --only claude
```

---

**③ Claude Code marketplace / skill install:**

Install the full framework via npm — the `postinstall` hook links skills automatically:

```bash
npm install -g super-omni   # auto-links skills to ~/.claude/skills/super-omni
```

The `claude-skill.json` manifest at the package root provides the metadata Claude Code needs to discover commands, agents, and hooks automatically.

To add skills into your local Claude CLI plugin marketplace:

```bash
bin/skill-manager install <url-or-path>
bin/skill-manager list
```

From inside Claude Code, use:

```text
/install-skill <url-or-path>
/list-skills
```

To add individual agents from within a Claude Code session, see the [Agent Management](#agent-management) section below.

---

**④ One-line curl install:**

```bash
# Inspect before running (recommended):
curl -fsSL https://raw.githubusercontent.com/Wilder1222/super-omni/main/bin/install | less
# Then install:
curl -fsSL https://raw.githubusercontent.com/Wilder1222/super-omni/main/bin/install | bash
```

---

**⑤ Clone and run setup manually:**

```bash
git clone https://github.com/Wilder1222/super-omni.git ~/.claude/skills/super-omni
cd ~/.claude/skills/super-omni
./setup
```

The setup script auto-detects your platform and configures accordingly. Supported platforms: **Claude Code**, **Cursor**, **Codex**, **Gemini CLI**, **OpenCode**, **VS Code (Cline/Continue.dev)**, **JetBrains AI Assistant**.

### Install for a Specific Platform

```bash
# Claude Code only
super-omni --only claude          # if installed globally
npx super-omni --only claude      # via npx
./setup --only claude             # manual clone

# VS Code (Cline / Continue.dev)
super-omni --only vscode

# JetBrains AI Assistant
super-omni --only jetbrains

# Skip a platform
super-omni --skip gemini
```

### Use in Claude Code

Open your project in Claude Code. Skills activate automatically via session hooks.

Start with:
- `/brainstorm` — design a feature from scratch
- `/write-plan` — turn an idea into an executable plan
- `/execute-plan` — run the plan step by step
- `/retro` — weekly engineering retrospective
- `/ship` — release workflow with changelog
- `/investigate` — explore unfamiliar code
- `/review` — structured code review
- `/workflow` — sprint pipeline orchestration
- `/qa` — quality assurance pass
- `/security` — security audit
- `/list-skills` — list all built-in + installed marketplace skills
- `/install-skill <source>` — install a skill from URL/path into your local marketplace
- `/list-agents` — list all available agents
- `/install-agent <url>` — install an agent from GitHub
- `/create-agent <name>` — create a custom agent

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

super-omni ships with specialized agents you can spawn for focused tasks:

| Agent | Specialty |
|-------|-----------|
| `code-reviewer` | Structured code review (P0/P1/P2) |
| `planner` | Task decomposition and plan writing |
| `debugger` | Root-cause analysis and bug resolution |
| `test-writer` | Behavior-verifying test suites |
| `security-auditor` | OWASP-aware vulnerability identification |
| `architect` | System design and architecture review |

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

super-omni supports multiple AI coding platforms:

| Platform | Status | Setup |
|----------|--------|-------|
| **Claude Code** | ✅ Full support | Auto-detected by `./setup` |
| **Cursor** | ✅ Full support | Auto-detected by `./setup` |
| **Codex** | ✅ Full support | Auto-detected by `./setup` |
| **Gemini CLI** | ✅ Full support | Auto-detected by `./setup` |
| **OpenCode** | ✅ Full support | Auto-detected by `./setup` |
| **VS Code (Cline)** | ✅ Full support | Auto-detected by `./setup` |
| **VS Code (Continue.dev)** | ✅ Full support | Auto-detected by `./setup` |
| **JetBrains AI Assistant** | ✅ Full support | Auto-detected by `./setup` |

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
super-omni/
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
│   └── agent-management/     ← Install, create, and manage agents
│
├── agents/                   ← Specialized agent definitions
│   ├── code-reviewer.md      ← Code reviewer agent
│   ├── planner.md            ← Strategic task planner
│   ├── debugger.md           ← Root-cause debugger
│   ├── test-writer.md        ← Test suite writer
│   ├── security-auditor.md   ← OWASP-aware security auditor
│   └── architect.md          ← Architecture reviewer
│
├── commands/                 ← Slash command definitions
│   ├── brainstorm.md
│   ├── write-plan.md
│   ├── execute-plan.md
│   ├── retro.md
│   ├── ship.md
│   ├── investigate.md
│   ├── review.md
│   ├── workflow.md
│   ├── qa.md
│   ├── security.md
│   ├── list-agents.md        ← List all agents
│   ├── install-agent.md      ← Install agent from URL/path
│   ├── create-agent.md       ← Scaffold a new agent
│   ├── list-skills.md        ← List all skills
│   └── install-skill.md      ← Install skill from URL/path
│
├── lib/
│   ├── preamble.md           ← Shared preamble injected into all skills
│   └── gen-skill-docs.sh     ← Builds SKILL.md from SKILL.md.tmpl
│
├── bin/
│   ├── install               ← One-line bootstrap installer
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
