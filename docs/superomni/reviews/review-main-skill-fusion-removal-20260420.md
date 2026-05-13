# Skill Fusion and Removal Review (2026-04-20)

## Goal

Fuse overlapping skills into canonical skills, remove redundant standalone skill directories, and optimize invocation flow so pipeline routing no longer depends on deprecated skill names.

## Canonical Fusion

### 1) Review domain
- Canonical skill: `code-review`
- Merged capabilities:
  - receiving mode (previously standalone review-feedback workflow)
  - security mode (previously standalone security workflow)
- Escalation path:
  - high-risk security deep-dive -> `security-auditor` agent

### 2) Reflection domain
- Canonical skill: `self-improvement`
- Merged capability:
  - retro scope (previously standalone engineering retrospective workflow)
- Additional output in retro scope:
  - `docs/superomni/retros/retro-[branch]-[session]-[date].md`

## Removed Skills (Physical Deletion)

Deleted directories and templates:
- Legacy standalone review-feedback skill directory
- Legacy standalone security-review skill directory
- Legacy standalone retrospective skill directory

## Invocation Flow Optimizations

Updated runtime-facing routes and references:
- `skills/using-skills/SKILL.md`
  - quick reference now routes receiving/security/retro intents to canonical skills
- `skills/workflow/SKILL.md` and `.tmpl`
  - VERIFY optional path uses `code-review` modes
  - REFLECT stage uses `self-improvement` with retro scope
- `skills/vibe/SKILL.md` and `.tmpl`
  - stage matrix and guided command text updated for mode-based routing
- `skills/production-readiness/SKILL.md` and `.tmpl`
  - security gate now points to `code-review` security mode
- `hooks/session-start`
  - startup hint switched from `/retro` to `/self-improve`

Control-plane docs updated:
- `CLAUDE.md`
- `README.md`

## Expected Outcome

- Reduced skill surface area for overlapping capabilities
- Fewer ambiguous trigger matches
- Single source of truth for review and reflection workflows
- Better maintainability of template regeneration path (`SKILL.md.tmpl` aligned)

## Status

DONE
