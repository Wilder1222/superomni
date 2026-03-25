# /list-skills

List all available skills in your super-omni setup.

## Usage

```
/list-skills
```

No arguments required.

## What Happens

1. The `writing-skills` skill activates
2. Built-in skills from `skills/` are listed
3. Any user-installed marketplace skills from `~/.omni-skills/skills/` are listed
4. The total count is shown

## Output Example

```
super-omni Skills
═════════════════════════════════════

Built-in skills:
  brainstorming          Starting a new feature/project idea
  writing-plans          Creating an implementation plan
  ...

Installed skills (~/.omni-skills/skills):
  data-analysis          Analyze dataset structure quickly

Total: 23 skill(s)
```

## Skill Reference

See `skills/writing-skills/SKILL.md` for skill conventions.
