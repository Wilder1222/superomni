# /plugin

Manage plugins in Claude CLI marketplace style.

## Usage

```
/plugin add marketplace <source>
```

Where `<source>` can be:
- A local `SKILL.md` file path
- A local skill directory containing `SKILL.md`
- A direct HTTP(S) URL to `SKILL.md`

## Examples

```
/plugin add marketplace ./skills/custom/data-analysis/SKILL.md
/plugin add marketplace ./my-marketplace-skill/
/plugin add marketplace https://raw.githubusercontent.com/user/skills/main/data-analysis/SKILL.md
```

## What Happens

`/plugin add marketplace <source>` maps to the existing skill marketplace install flow:

1. Validate marketplace source
2. Install skill into `~/.omni-skills/skills/<skill-name>/SKILL.md`
3. If `~/.claude/skills/super-omni/skills/` exists, auto-link into `~/.claude/skills/super-omni/skills/<skill-name>/`
4. Verify with `/list-skills`

## Equivalent Commands

```text
/install-skill <source>
/list-skills
```

Or in shell:

```bash
bin/skill-manager install <source>
bin/skill-manager list
```
