# /plugin

Manage plugins in Claude CLI marketplace style.

## Usage

```
/plugin add marketplace                  — register super-omni + install if not yet installed
/plugin add marketplace super-omni       — register super-omni + install if not yet installed
/plugin add marketplace <source>         — install a single marketplace skill
/plugin install                          — install super-omni and activate all slash commands
/plugin install super-omni               — install super-omni and activate all slash commands
```

Where `<source>` for a single skill can be:
- A local `SKILL.md` file path
- A local skill directory containing `SKILL.md`
- A direct HTTP(S) URL to `SKILL.md`

## Examples

```
/plugin add marketplace
/plugin add marketplace super-omni
/plugin install
/plugin install super-omni
/plugin add marketplace ./skills/custom/data-analysis/SKILL.md
/plugin add marketplace https://raw.githubusercontent.com/user/skills/main/data-analysis/SKILL.md
```

## What Happens

### Adding and installing the full super-omni framework

The typical flow is:

1. `/plugin add marketplace` — registers super-omni and installs it if not already present
2. `/plugin install` — explicitly installs super-omni and wires up all slash commands

Both commands perform the same full installation when super-omni is not yet installed.
`/plugin install` is the explicit install trigger; `/plugin add marketplace` additionally
registers super-omni in the marketplace registry before running the same install steps.

**Installation steps performed:**
1. Checks if super-omni is already installed at `~/.claude/skills/super-omni`
2. If not installed, runs the full setup via one of:
   - `npm install -g super-omni` (recommended), **or**
   - `npx super-omni` (one-time), **or**
   - `git clone https://github.com/Wilder1222/super-omni && cd super-omni && ./setup` (manual)
3. Links skills into `~/.claude/skills/super-omni/`
4. Links all slash commands into `~/.claude/commands/` so they work immediately
5. Registers hooks in `~/.claude/hooks/super-omni-hooks.json`

**After installation all commands are immediately available as Claude Code slash commands:**

| Command | Description |
|---------|-------------|
| `/supervibe` | Activate full framework + guided workflow |
| `/brainstorm` | Design a feature — produces `spec.md` |
| `/write-plan` | Turn a spec into an executable plan |
| `/execute-plan` | Run the plan step by step |
| `/review` | Structured code review |
| `/ship` | Release workflow with versioning + changelog |
| `/retro` | Weekly engineering retrospective |
| `/investigate` | Explore unfamiliar code |
| `/workflow` | Sprint pipeline status + next-step guidance |
| `/qa` | Quality assurance pass |
| `/security` | Security audit (OWASP-aware) |
| `/list-skills` | List all built-in and marketplace skills |
| `/install-skill` | Install a skill from URL or local path |
| `/list-agents` | List all available agents |
| `/install-agent` | Install an agent from GitHub or local file |
| `/create-agent` | Scaffold a new custom agent |

Use `/supervibe` to activate the guided default workflow after installation.

### Installing a single marketplace skill

`/plugin add marketplace <source>` maps to the existing skill marketplace install flow:

1. Validate marketplace source
2. Install skill into `~/.omni-skills/skills/<skill-name>/SKILL.md`
3. If `~/.claude/skills/super-omni/skills/` exists, auto-link into `~/.claude/skills/super-omni/skills/<skill-name>/`
4. Verify with `/list-skills`

## Equivalent Shell Commands

For the full framework:

```bash
# Recommended (installs globally + wires up all commands automatically):
npm install -g super-omni

# One-time without global install:
npx super-omni

# Manual from source:
git clone https://github.com/Wilder1222/super-omni
cd super-omni && ./setup

# Then in Claude Code:
/supervibe
```

For a single skill:

```text
/install-skill <source>
/list-skills
```

Or in shell:

```bash
bin/skill-manager install <source>
bin/skill-manager list
```
