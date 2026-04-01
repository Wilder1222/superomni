# Installation Architecture

## Overview

superomni supports 4 AI CLI platforms with 3 installation methods each.

```
Installation Methods
├── Claude Code marketplace plugin    (/plugin marketplace add)
├── npx project-level install         (npx github:Wilder1222/superomni)
└── npm global install                (npm install -g github:Wilder1222/superomni)
```

## Architecture: Pure Node.js

All installation logic lives in `lib/setup.js` (pure Node.js, no shell dependencies).

```
User Action
    ↓
bin/superomni-cli (CLI entry point)
    ↓
lib/setup.js (core installer)
    ├── Detects target: global vs project-level
    ├── Detects platforms: Claude, Codex, Gemini, Copilot
    ├── Copies skills to .superomni/ (project) or symlinks (global)
    ├── Generates platform-specific instruction files
    └── Registers hooks (Claude only)
```

## Platform-Specific Instruction Templates

Each platform gets a tailored instruction file generated from `lib/templates/`:

| Platform | Template | Output file | Notes |
|----------|----------|-------------|-------|
| Claude Code | `claude-instructions.js` | `CLAUDE.md` | Includes slash commands |
| Codex CLI | `codex-instructions.js` | `AGENTS.md` | Trigger phrases, no slash commands |
| Gemini CLI | `codex-instructions.js` | `GEMINI.md` | Same format as Codex |
| GitHub Copilot | `copilot-instructions.js` | `.github/copilot-instructions.md` | References skill directories |

## Installation Flows

### npx (project-level)

```
npx github:Wilder1222/superomni [--only <platform>] [--force]
    ↓
bin/superomni-cli detects non-global → sets targetDir = cwd
    ↓
lib/setup.js
    ├── Copies skills → .superomni/skills/
    ├── Copies agents → .superomni/agents/
    ├── Copies commands → .superomni/commands/
    ├── Generates CLAUDE.md (Claude-specific instructions)
    ├── Generates AGENTS.md (Codex-specific instructions)
    ├── Generates GEMINI.md (Gemini-specific instructions)
    └── Generates .github/copilot-instructions.md (Copilot instructions)
```

### npm global install

```
npm install -g github:Wilder1222/superomni
    ↓
postinstall.js detects global → calls lib/setup.js
    ↓
lib/setup.js
    ├── Claude:  symlink → ~/.claude/skills/superomni + commands + hooks
    ├── Codex:   symlink → ~/.codex/skills/superomni + ~/.codex/AGENTS.md
    ├── Gemini:  symlink → ~/.gemini/skills/superomni + ~/.gemini/GEMINI.md
    └── Copilot: (project-only — generates .github/copilot-instructions.md)
```

### Claude marketplace plugin

```
/plugin marketplace add Wilder1222/superomni
    ↓
Claude Code reads .claude-plugin/marketplace.json
    ├── Installs skills from skills/
    ├── Registers slash commands from claude-skill.json
    └── Sets up session hooks from hooks/
```

## CLI Flags

| Flag | Effect |
|------|--------|
| `--only <platform>` | Install for a single platform (claude, codex, gemini, copilot) |
| `--skip <platform>` | Skip a specific platform |
| `--force` | Overwrite existing .superomni/ and instruction files |
| `--dry-run` | Preview changes without writing |
| `--verbose` | Show detailed output |

## Key Files

| File | Purpose |
|------|---------|
| `lib/setup.js` | Core installer (600+ lines, pure Node.js) |
| `lib/postinstall.js` | npm postinstall hook (delegates to setup.js) |
| `bin/superomni-cli` | CLI entry point (arg parsing, mode detection) |
| `lib/templates/claude-instructions.js` | Claude Code instruction template |
| `lib/templates/codex-instructions.js` | Codex CLI instruction template |
| `lib/templates/copilot-instructions.js` | Copilot instruction template |

## Platform Detection

Global installs auto-detect platforms by checking:
1. CLI command availability (`codex --version`, `gemini --version`, `gh --version`)
2. Config directory existence (`~/.codex/`, `~/.gemini/`, `~/.agents/`)
3. `--only` flag forces installation regardless of detection
