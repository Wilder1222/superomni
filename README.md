# superomni

> **Plan Lean, Execute Complete** — A fused AI coding skill framework for Claude Code, Codex, Gemini CLI, and GitHub Copilot.

superomni combines the best ideas from [obra/superpowers](https://github.com/obra/superpowers) (methodology-driven AI skill framework) and [garrytan/gstack](https://github.com/garrytan/gstack) (engineering completeness principles) into a unified, opinionated system for AI-assisted software development.

---

## What Is This?

superomni is a collection of **skills** — structured behavior specifications for AI coding assistants. Each skill tells Claude Code exactly how to handle a specific type of work: brainstorm, planning, debugging, testing, reviewing, shipping.

The framework is built on one core philosophy:

> **Plan with YAGNI. Execute with completeness.**

Plan only what you need. But what you decide to build — build it fully.

### Sprint Pipeline

```
THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE
```

One human gate: spec approval at THINK. Everything after auto-advances on DONE. The `RELEASE` stage combines ship + retrospective into a single artifact.

---

## Quick Start

### Install

| Platform | Slash Commands | Recommended Install |
|----------|---------------|---------------------|
| **Claude Code** | ✅ Full support | Plugin (recommended) or `npx` |
| **Gemini CLI** | ✅ Full support | `npx` |
| **GitHub Copilot** (VS Code) | ✅ Via prompt files | `npx` |
| **GitHub Copilot** (CLI) | ⚠️ Plugin only | Plugin |
| **Codex CLI** | ❌ Not supported | `npx` (context via `AGENTS.md`) |

---

#### Claude Code — Plugin (recommended)

```
/plugin marketplace add Wilder1222/superomni
```

Installs skills, slash commands, and session hooks automatically. Type `/vibe` to start.

---

#### Claude Code — npx (project-level)

```bash
npx github:Wilder1222/superomni --only claude
```

Installs slash commands to `.claude/commands/` and skills to `.superomni/`. Works identically to the plugin for slash command support.

---

#### Gemini CLI

```bash
npx github:Wilder1222/superomni --only gemini
```

Installs slash commands to `.gemini/commands/` as `.toml` files. Type `/vibe`, `/brainstorm`, etc. directly in Gemini CLI.

---

#### GitHub Copilot (VS Code extension)

```bash
npx github:Wilder1222/superomni --only copilot
```

Installs slash commands to `.github/prompts/` as `.prompt.md` files. Use `/vibe`, `/brainstorm`, etc. in VS Code Copilot Chat.

> **Copilot CLI users:** Slash commands are not supported in `gh copilot` CLI. Install via plugin instead:
> ```
> /plugin marketplace add Wilder1222/superomni
> ```

---

#### Codex CLI

```bash
npx github:Wilder1222/superomni --only codex
```

Installs project context to `AGENTS.md`. Codex CLI does not support custom slash commands (they are hardcoded in the binary). Activate skills using trigger phrases in conversation — e.g., *"brainstorm this feature"*, *"write a plan"*, *"debug this"*.

---

#### All platforms at once

```bash
# Project-level: install into current directory
npx github:Wilder1222/superomni

# Global: symlink skills to all detected CLI directories
npm install -g github:Wilder1222/superomni && superomni setup
```

#### npx Options

```bash
npx github:Wilder1222/superomni --only claude   # Single platform
npx github:Wilder1222/superomni --skip gemini   # Skip a platform
npx github:Wilder1222/superomni --force          # Overwrite existing files
npx github:Wilder1222/superomni --dry-run        # Preview without changes
superomni upgrade                                 # Upgrade global install
```

---

### Use

Open your project in your AI CLI. Skills activate automatically.

**Claude Code** — use slash commands:
- `/vibe` — activate the full framework, auto-detect pipeline stage
- `/brainstorm` — design a feature from scratch
- `/write-plan` — turn an idea into an executable plan
- `/execute-plan` — run the plan step by step
- `/review` — structured code review
- `/release` — ship + retrospective in one combined step
- `/front-design` — frontend design optimization
- `/style-capture` — capture code style preferences

**Codex / Copilot / Gemini** — use trigger phrases:
- "brainstorm this feature" — activates brainstorm skill
- "write a plan" — activates writing-plans skill
- "review this code" — activates code-review skill
- "debug this" — activates systematic-debugging skill

---

## Skills Reference

### Core Workflow (P0)

| Skill | When to Use | Key Output |
|-------|------------|------------|
| `vibe` | Framework activation / entry point | Auto-detects pipeline stage |
| `using-skills` | Always active | Loads the framework |
| `brainstorm` | New feature/design | `docs/superomni/specs/spec-*.md` |
| `writing-plans` | Planning implementation | `docs/superomni/plans/plan-*.md` |
| `executing-plans` | Running a plan | Code changes + report |
| `systematic-debugging` | Any bug/error (includes scope lock via `/freeze`) | Debug report + fix |

### Quality Assurance (P1)

| Skill | When to Use | Key Output |
|-------|------------|------------|
| `test-driven-development` | Writing code | Tests + implementation |
| `verification` | Before claiming done | Verification report |
| `code-review` | Reviewing code/PRs | Structured review |
| `plan-review` | Before executing a plan (includes auto mode via `/autoplan`) | Reviewed plan |
| `subagent-development` | Complex parallel tasks (includes wave planning) | Multi-agent output |
| `receiving-code-review` | Responding to review feedback | Updated code + reply |
| `security-audit` | Security vulnerability audit | Threat model + fixes |
| `qa` | Quality assurance pass | QA report |
| `careful` | High-risk/destructive operations | Safety checklist |
| `self-improvement` | Post-task performance evaluation | Improvement report + 3 actions |
| `production-readiness` | Pre-deploy gate | Readiness report |
| `harness-engineering` | Audit and improve the agent harness | Health score + improvement backlog |

### Advanced (P2)

| Skill | When to Use | Key Output |
|-------|------------|------------|
| `release` | End of sprint — ship + retrospective | `docs/superomni/releases/release-*.md` |
| `frontend-design` | Building UI/pages | Production-grade frontend |
| `style-capture` | Capture code style preferences | Style profile |
| `git-worktrees` | Multiple branches | Worktree setup |
| `finishing-branch` | Merging a branch | Clean PR |
| `investigate` | Exploring unfamiliar code | Investigation report |
| `retro` | Standalone weekly review | Retrospective report |
| `ship` | Standalone release workflow | Release + changelog |
| `writing-skills` | Creating new skills | New skill file |
| `workflow` | Sprint pipeline orchestration | Workflow plan + status |
| `office-hours` | Product discovery before building | Validated idea + decision |
| `agent-management` | Installing or creating agents | Agent installed/created |

### Utility (P3)

| Skill | When to Use | Key Output |
|-------|------------|------------|
| `document-release` | Post-ship documentation sync | Updated docs |

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

| Platform | Slash Commands | npx install | Plugin install |
|----------|---------------|-------------|----------------|
| **Claude Code** | ✅ | `.claude/commands/` | ✅ recommended |
| **Gemini CLI** | ✅ | `.gemini/commands/*.toml` | — |
| **Copilot** (VS Code) | ✅ | `.github/prompts/*.prompt.md` | ✅ |
| **Copilot** (CLI `gh`) | ❌ | context only via `.github/copilot-instructions.md` | ✅ |
| **Codex CLI** | ❌ | context only via `AGENTS.md` | — |

All `npx` installation methods are **fully automatic** — platform detection, skill copying, and config file generation require no manual steps.

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
│   ├── vibe/                 ← Entry point — auto-detects pipeline stage
│   ├── using-skills/         ← Meta-skill (always active)
│   ├── brainstorm/        ← Design → Spec
│   ├── writing-plans/        ← Spec → Plan
│   ├── executing-plans/      ← Plan → Code
│   ├── systematic-debugging/ ← Debug with Scope Lock + Debug Report + /freeze
│   ├── test-driven-development/
│   ├── verification/
│   ├── code-review/
│   ├── plan-review/          ← CEO→Design→Eng 3-stage pipeline + auto mode
│   ├── subagent-development/ ← Includes wave planning
│   ├── git-worktrees/
│   ├── finishing-branch/
│   ├── investigate/
│   ├── retro/                ← Weekly engineering retrospective
│   ├── release/              ← RELEASE stage — ship + retrospective combined
│   ├── ship/                 ← Standalone release workflow
│   ├── writing-skills/       ← Meta: create new skills
│   ├── receiving-code-review/ ← Respond to review feedback
│   ├── security-audit/       ← Security vulnerability audit
│   ├── qa/                   ← Quality assurance
│   ├── careful/              ← Safety guardrails
│   ├── workflow/             ← Sprint pipeline orchestration
│   ├── self-improvement/     ← Post-task performance evaluation
│   ├── frontend-design/      ← Production-grade frontend design
│   ├── style-capture/        ← Capture code style preferences
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
├── commands/                 ← Slash command definitions (11 commands)
│   ├── vibe.md               ← /vibe — activate full framework + guided workflow
│   ├── brainstorm.md
│   ├── write-plan.md
│   ├── execute-plan.md
│   ├── review.md
│   ├── release.md            ← /release — ship + retrospective combined
│   ├── front-design.md       ← /front-design — frontend design optimization
│   ├── style-capture.md      ← /style-capture — capture code style
│   ├── office-hours.md
│   ├── document-release.md
│   └── harness-audit.md      ← /harness-audit — audit agent harness health
│
├── lib/
│   ├── preamble.md           ← Shared preamble injected into all skills
│   ├── setup.js              ← Core installation logic (Node.js)
│   ├── templates/            ← Platform-specific instruction generators
│   └── gen-skill-docs.sh     ← Builds SKILL.md from SKILL.md.tmpl
│
├── bin/
│   ├── agent-manager         ← Agent lifecycle manager
│   ├── config                ← Config management
│   ├── slug                  ← Project identifier
│   └── analytics-log         ← Local telemetry writer
│
├── docs/
│   ├── superomni/            ← Generated session artifacts
│   │   ├── specs/            ← Spec documents
│   │   ├── plans/            ← Implementation plans
│   │   ├── executions/       ← Execution logs
│   │   ├── reviews/          ← Code reviews
│   │   ├── subagents/        ← Sub-agent sessions
│   │   ├── improvements/     ← Self-improvement reports
│   │   ├── evaluations/      ← Verification evaluations
│   │   ├── releases/         ← RELEASE stage artifacts
│   │   └── harness-audits/   ← Harness audit reports
│   ├── AGENTS.md             ← Agent library reference
│   ├── DESIGN.md             ← Architectural design
│   └── IMPLEMENTATION.md     ← Implementation details
│
├── ETHOS.md                  ← Core philosophy
├── CLAUDE.md                 ← Project config for Claude
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

`skills/**/SKILL.md` are generated artifacts.

Source-of-truth hierarchy:
1. `lib/preamble.md`
2. `skills/**/SKILL.md.tmpl`
3. Generated output: `skills/**/SKILL.md`

Do not hand-edit generated `SKILL.md` files. Edit template sources, then regenerate.

`{{PREAMBLE}}` is expanded during generation:

```bash
# Build all skills
npm run gen-skills

# Validate generated docs (drift + deprecated phrases + duplicate frontmatter)
npm run check:skill-docs

# Regenerate then validate in one command
npm run verify:skill-docs

# Linux/macOS bash path
npm run gen-skills:bash

# Windows PowerShell path
npm run gen-skills:ps

# Build a single skill
node lib/gen-skill-docs.js skills/systematic-debugging/SKILL.md.tmpl
```

If you are on Windows and see line-ending related bash failures (`$'\r'`), use `npm run gen-skills:ps`.

### Adding a New Skill

```bash
# Use the meta-skill!
# In Claude Code:
/brainstorm a new skill for [your use case]
```

Or manually:
1. Create `skills/<name>/SKILL.md.tmpl` (see `writing-skills` skill)
2. Run `npm run gen-skills`
3. Run `npm run check:skill-docs`
4. Add to `CLAUDE.md` skills table

---

## Attribution

This project fuses:
- [obra/superpowers](https://github.com/obra/superpowers) — MIT License — methodology-driven skill framework
- [garrytan/gstack](https://github.com/garrytan/gstack) — MIT License — engineering completeness principles

Original contributions: Plan Lean/Execute Complete philosophy, 3-stage plan review pipeline, Scope Lock + Debug Report fusion, PROACTIVE mode toggle, retro skill generalization.

## License

MIT — see [LICENSE](LICENSE)
