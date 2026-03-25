# /install-skill

Install a marketplace skill from a local file or remote URL into your super-omni setup.

## Usage

```
/install-skill <source>
```

Where `<source>` is:
- A local file path to a `SKILL.md`: `./my-skill/SKILL.md`
- A local skill directory that contains `SKILL.md`: `./my-skill/`
- A GitHub raw URL to `SKILL.md`: `https://raw.githubusercontent.com/user/repo/main/skills/my-skill/SKILL.md`
- Any direct HTTP(S) URL to a `SKILL.md`

## Examples

```
/install-skill ./skills/custom/data-analysis/SKILL.md
/install-skill ./my-marketplace-skill/
/install-skill https://raw.githubusercontent.com/user/skills/main/data-analysis/SKILL.md
```

## What Happens

1. The `writing-skills` skill activates
2. The skill definition is validated and downloaded/copied
3. It is installed to `~/.omni-skills/skills/<skill-name>/SKILL.md`
4. If `~/.claude/skills/super-omni/skills/` already exists, it is auto-linked there so it is immediately available in Claude Code. Otherwise, it remains installed in `~/.omni-skills/skills/<skill-name>/SKILL.md` and becomes available after running `./setup`.

## After Installing

List all skills (including your new one):
```
/list-skills
```

Install manually from shell (equivalent):
```bash
bin/skill-manager install <source>
```

## Skill Reference

See `skills/writing-skills/SKILL.md` for skill conventions.
