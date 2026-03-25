# /plugin

Manage plugins in Claude CLI marketplace style.

## Usage

```
/plugin add marketplace                  — install the full super-omni framework
/plugin add marketplace super-omni       — install the full super-omni framework
/plugin add marketplace <source>         — install a single marketplace skill
```

Where `<source>` for a single skill can be:
- A local `SKILL.md` file path
- A local skill directory containing `SKILL.md`
- A direct HTTP(S) URL to `SKILL.md`

## Examples

```
/plugin add marketplace
/plugin add marketplace super-omni
/plugin add marketplace ./skills/custom/data-analysis/SKILL.md
/plugin add marketplace ./my-marketplace-skill/
/plugin add marketplace https://raw.githubusercontent.com/user/skills/main/data-analysis/SKILL.md
```

## What Happens

### Installing the full super-omni framework

When called with no source or with `super-omni` as the source:

1. Checks if super-omni is already installed at `~/.claude/skills/super-omni`
2. If not installed, runs the full setup:
   - `npm install -g super-omni` (recommended), **or**
   - `npx super-omni` (one-time), **or**
   - `git clone … && ./setup` (manual)
3. Verifies installation and lists all available commands with `/superpower`

After installation every command in the framework is immediately available:
`/brainstorm`, `/write-plan`, `/execute-plan`, `/review`, `/ship`, `/retro`,
`/investigate`, `/workflow`, `/qa`, `/security`, `/list-skills`, `/install-skill`,
`/list-agents`, `/install-agent`, `/create-agent`, and more.

Use `/superpower` to activate the guided default workflow.

### Installing a single marketplace skill

`/plugin add marketplace <source>` maps to the existing skill marketplace install flow:

1. Validate marketplace source
2. Install skill into `~/.omni-skills/skills/<skill-name>/SKILL.md`
3. If `~/.claude/skills/super-omni/skills/` exists, auto-link into `~/.claude/skills/super-omni/skills/<skill-name>/`
4. Verify with `/list-skills`

## Equivalent Commands

For the full framework:

```bash
npm install -g super-omni
# then in Claude Code:
/superpower
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
