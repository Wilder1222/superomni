# Implementation Guide

## superomni — Developer Reference

**Version:** 0.3.0

---

## Project Structure

```
superomni/
├── .claude-plugin/           ← Claude Code plugin marketplace files
│   ├── marketplace.json      ← Marketplace manifest (required by Claude Code)
│   └── plugin.json           ← Plugin manifest (skills, commands, hooks)
├── hooks/                    ← Claude Code session hooks
├── skills/                   ← Skill definitions (28 skills)
├── agents/                   ← Agent specifications
├── commands/                 ← Slash command docs
├── lib/                      ← Build tools and shared assets
│   ├── gen-skill-docs.sh     ← Builds SKILL.md from SKILL.md.tmpl
│   └── postinstall.js        ← npm postinstall hook (runs setup)
├── bin/                      ← Runtime utilities
│   ├── superomni-cli        ← CLI entry point (npm global / npx)
│   ├── agent-manager         ← Agent lifecycle manager
│   ├── config                ← Config management
│   ├── slug                  ← Project identifier
│   └── analytics-log         ← Local telemetry writer
├── docs/                     ← This directory
├── ETHOS.md                  ← Philosophy
├── CLAUDE.md                 ← Claude project config
├── claude-skill.json         ← Legacy Claude Code skill manifest
├── setup                     ← Installation script
└── package.json
```

---

## Installation Methods

superomni supports three installation methods.

### 1. Claude Code marketplace install

Inside a Claude Code session:

```
/plugin marketplace add Wilder1222/superomni
```

Claude Code reads `.claude-plugin/marketplace.json` to discover the plugin, then reads `.claude-plugin/plugin.json` for skills, agents, commands, and hooks, and installs them automatically. No `npm` or `setup` step needed.

### 2. npm global install

For Codex, Gemini CLI, and GitHub Copilot:

```bash
npm install -g github:Wilder1222/superomni
```

`lib/postinstall.js` is the npm postinstall hook. It runs `setup` automatically. For npx runs, it forwards `INIT_CWD` (the user's project directory) as `SUPEROMNI_TARGET_DIR` so skills are installed into the project directory rather than global platform paths. Skips silently in CI environments or when `SUPER_OMNI_SKIP_POSTINSTALL=1` is set.

### 3. npx (project-level install into CWD)

```bash
npx github:Wilder1222/superomni
```

Downloads the package to a temp cache, runs setup with `SUPEROMNI_TARGET_DIR` pointing at the directory where `npx` was invoked. Setup copies skills into `.superomni/` and creates CLI config files (`AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md`) directly in the project directory. The project is self-contained after install — the temp cache can be cleaned up.

### Skipping postinstall

Set `SUPER_OMNI_SKIP_POSTINSTALL=1` to suppress the automatic setup during
`npm install`. CI environments are detected and skipped automatically.

---

## Development Workflow

### Setting Up Locally

```bash
git clone https://github.com/Wilder1222/superomni.git
cd superomni
npm install   # or: ./setup
```

The setup script:
1. Creates `~/.omni-skills/` state directories
2. Runs `lib/gen-skill-docs.sh` to build `.md` from `.tmpl`
3. Symlinks the project into `~/.claude/skills/superomni`
4. Registers hooks in `~/.claude/hooks/`
5. Makes bin scripts executable
6. Initializes default config

### Building Skill Docs

Skills are written as `.tmpl` files with `{{PREAMBLE}}` macro:

```bash
# Build all skills
bash lib/gen-skill-docs.sh

# Or via npm
npm run gen-skills

# Build a single skill
bash lib/gen-skill-docs.sh skills/systematic-debugging/SKILL.md.tmpl
```

**Important:** Always commit both the `.tmpl` AND generated `.md` files. Users install without running a build step.

### Testing Setup Script

```bash
# Test in a clean environment
HOME=/tmp/test-home bash setup

# Verify installation
ls -la /tmp/test-home/.claude/skills/superomni/
cat /tmp/test-home/.omni-skills/config

# Clean up
rm -rf /tmp/test-home
```

---

## Skill Development

### Creating a New Skill

1. **Create the directory:**
   ```bash
   mkdir -p skills/my-skill
   ```

2. **Write the template (`skills/my-skill/SKILL.md.tmpl`):**

   Required sections:
   - YAML frontmatter with `name`, `description`, `allowed-tools`
   - `{{PREAMBLE}}` macro
   - At least one Iron Law or governing principle
   - Numbered phases
   - Defined output format with status protocol

3. **Generate the SKILL.md:**
   ```bash
   bash lib/gen-skill-docs.sh skills/my-skill/SKILL.md.tmpl
   ```

4. **Register in CLAUDE.md:**
   Add to the Skills Available table.

5. **Register in skills/using-skills/SKILL.md:**
   Add to the Skills Quick Reference table.

### Skill Template Structure

```markdown
---
name: skill-name
description: |
  [2-3 sentence description]
  Triggers: [comma-separated trigger phrases in quotes]
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

{{PREAMBLE}}

# Skill Display Name

**Goal:** [One sentence: what this accomplishes.]

## Iron Law (required if there's a critical rule)
[RULE IN CAPS]

## Phase 1: [Phase Name]
[Steps, commands, outputs]
...

## Phase N: [Phase Name]
[Final phase, produces output]

## Report

\`\`\`
REPORT HEADER
════════════════════════════════════════
[Key fields]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
════════════════════════════════════════
\`\`\`
```

### Skill Naming Conventions

- **Format:** `kebab-case`, verb-noun preferred
- **Examples:** `systematic-debugging`, `writing-plans`, `subagent-development`
- **Avoid:** abbreviations, acronyms, ambiguous terms

---

## Preamble System

### How It Works

`lib/preamble.md` is shared content injected into every skill.

The `{{PREAMBLE}}` token in `.tmpl` files is replaced by the full content of `preamble.md` during the build step.

### What Preamble Contains

1. **Environment Detection** — detects PROACTIVE mode, branch, starts telemetry timer
2. **PROACTIVE Mode** — instructions for how to behave based on config
3. **Completion Status Protocol** — DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT
4. **Escalation Policy** — when to stop and escalate
5. **Telemetry** — writes skill usage to `~/.omni-skills/analytics/usage.jsonl`

### Modifying the Preamble

Edit `lib/preamble.md`, then rebuild:
```bash
bash lib/gen-skill-docs.sh
```

**Note:** All generated `SKILL.md` files must be regenerated and committed after preamble changes.

---

## Configuration System

### Config File Format

```
# ~/.omni-skills/config
proactive=true
telemetry=true
```

Simple `key=value` format, one per line. No sections, no nesting.

### bin/config API

```bash
# Read a value
bin/config get proactive       # → "true" or "false" or "null"

# Write a value
bin/config set proactive false  # → "✓ Set proactive=false"

# List all
bin/config list                 # → config file contents
```

### Supported Config Keys

| Key | Default | Description |
|-----|---------|-------------|
| `proactive` | `true` | Auto-trigger skills on detected conditions |
| `telemetry` | `true` | Write usage events to `~/.omni-skills/analytics/` |

---

## Telemetry

### What Is Logged

Usage events are written to `~/.omni-skills/analytics/usage.jsonl`:

```json
{"skill":"systematic-debugging","dur":420,"status":"DONE","ts":"2026-03-25T10:00:00Z","project":"my-app"}
```

### What Is NOT Logged

- No code content
- No file paths
- No user data
- No network calls
- Nothing leaves the local machine

### Disabling Telemetry

```bash
bin/config set telemetry false
```

### Analytics Format

JSONL (one JSON object per line). Each object:

| Field | Type | Description |
|-------|------|-------------|
| `skill` | string | Skill name |
| `dur` | number | Duration in seconds |
| `status` | string | DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT |
| `ts` | string | ISO 8601 timestamp |
| `project` | string | `basename $(pwd)` |

---

## Session Hooks

### How Hooks Work

`hooks/session-start` is a bash script executed by Claude Code at the start of every session.

It:
1. Creates state directories
2. Detects environment (PROACTIVE mode, branch, project)
3. Logs the session start event
4. Injects `skills/using-skills/SKILL.md` into the agent context
5. Prints a welcome banner

### hooks.json Format

```json
{
  "hooks": {
    "session-start": {
      "script": "hooks/session-start",
      "description": "..."
    }
  }
}
```

---

## Adding a Command

Commands are documentation files in `commands/` that explain how to use a slash command.

### Format

```markdown
# /command-name

Trigger the **skill-name** skill.

## How to Use
[usage examples]

## What Happens
[numbered steps]

## Output
[what is produced]

## Skill Reference
See `skills/skill-name/SKILL.md` for the full protocol.
```

Commands don't have executable logic — they're reference documentation that helps users know what `/command-name` does before invoking it.

---

## Testing

There is no automated test suite currently. Testing is done manually:

### Manual Test Checklist

1. **Setup test:**
   ```bash
   HOME=/tmp/test-home ./setup
   ls /tmp/test-home/.claude/skills/superomni/
   ls /tmp/test-home/.omni-skills/
   ```

2. **Config test:**
   ```bash
   bin/config list
   bin/config set proactive false
   bin/config get proactive   # should output "false"
   bin/config set proactive true
   ```

3. **Build test:**
   ```bash
   bash lib/gen-skill-docs.sh
   # Should say "Processed 21 template(s)"
   head -20 skills/systematic-debugging/SKILL.md
   # Should contain preamble content, not "{{PREAMBLE}}"
   ```

4. **Analytics test:**
   ```bash
   bin/analytics-log "test-skill" "60" "DONE"
   cat ~/.omni-skills/analytics/usage.jsonl | tail -1
   ```

5. **Slug test:**
   ```bash
   bin/slug
   # Should output something like "superomni-abc123"
   ```

6. **New skills test:**
   ```bash
   # Verify new skill directories exist
   ls skills/receiving-code-review/SKILL.md
   ls skills/security-audit/SKILL.md
   ls skills/qa/SKILL.md
   ls skills/careful/SKILL.md
   ls skills/workflow/SKILL.md
   ```

7. **New commands test:**
   ```bash
   # Verify new command files exist
   ls commands/ship.md commands/investigate.md commands/review.md
   ls commands/workflow.md commands/qa.md commands/security.md
   ```

8. **Multi-platform setup test:**
   ```bash
   # Verify setup detects platform correctly
   ./setup --help  # or run setup and check output
   ```

---

## Versioning

This project uses semantic versioning (`MAJOR.MINOR.PATCH`):
- **MAJOR**: Breaking changes to skill protocol or hook format
- **MINOR**: New skills added, existing skills enhanced
- **PATCH**: Bug fixes, documentation updates

Version is tracked in `package.json`.

---

## Contributing

### Contribution Guidelines

1. **Skills must be self-contained** — a skill should work without reading other skills (except via explicit cross-references)
2. **Use the preamble** — all skills must include `{{PREAMBLE}}`
3. **Status protocol** — all skills must end with DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT
4. **Iron Laws** — document any non-negotiable rules explicitly
5. **No duplication** — before adding a skill, verify it doesn't overlap an existing one
6. **Build before commit** — always run `bash lib/gen-skill-docs.sh` and commit the generated `.md` files

### Skill Quality Bar

A skill meets the quality bar when:
- [ ] `{{PREAMBLE}}` is present
- [ ] YAML frontmatter is complete
- [ ] Trigger phrases are documented
- [ ] At least one Iron Law (if applicable)
- [ ] Output format is explicitly defined
- [ ] Status protocol is used
- [ ] Blast radius awareness is included (if modifying files)
- [ ] Generated `SKILL.md` has been built and committed

---

## Roadmap

### v0.2.0 ✅ Completed

- [x] `/ship` command registration
- [x] More commands (`/investigate`, `/review`, `/workflow`, `/qa`, `/security`)
- [x] `receiving-code-review` skill — respond to review feedback
- [x] `security-audit` skill — OWASP/STRIDE security vulnerability audit
- [x] `qa` skill — quality assurance with checklists
- [x] `careful` skill — safety guardrails for destructive operations
- [x] `workflow` skill — sprint pipeline orchestration
- [x] Multi-platform support (Claude Code, Cursor, Codex, Gemini CLI, OpenCode)
- [x] Review checklists (data vs logic separation)
- [x] Platform detection in hooks

### v0.3.0

- [ ] Dual Voices support (optional Claude + Codex consensus for plan review)
- [ ] Static validation tests
- [ ] Analytics dashboard (`bin/analytics-view`)
- [ ] Skill dependency graph visualization
- [ ] Auto-update mechanism

### v1.0.0

- [ ] Full test suite (static validation + behavioral tests)
- [ ] Published npm package
- [ ] GitHub Actions CI
