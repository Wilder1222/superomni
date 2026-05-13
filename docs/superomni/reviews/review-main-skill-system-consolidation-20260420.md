# Skill & Agent Consolidation Review (Final State, 2026-04-20)

## Scope

Reviewed all skills under `skills/` and agents under `agents/`, then completed functional fusion for overlapping skill domains.

## Final Consolidation Result

### Review domain (merged)

Canonical skill: `code-review`

- Includes giving mode, receiving mode, and security mode
- High-risk security deep-dive escalates to `security-auditor` agent

### Reflection domain (merged)

Canonical skill: `self-improvement`

- Includes process, retro scope, and harness scope
- Retrospective output uses `docs/superomni/retros/retro-[branch]-[session]-[date].md`

## Physical Cleanup Result

Removed redundant standalone skill directories and templates for the merged domains.

## Invocation Flow Updates

- Updated skill-routing docs and templates in:
  - `skills/using-skills/SKILL.md`
  - `skills/workflow/SKILL.md` and `.tmpl`
  - `skills/vibe/SKILL.md` and `.tmpl`
  - `skills/production-readiness/SKILL.md` and `.tmpl`
- Updated control plane docs:
  - `CLAUDE.md`
  - `README.md`
- Updated startup hint:
  - `hooks/session-start` (`/self-improve` guidance)

## Agent Review Summary

No agent merge was applied.

Reasoning:
- Agents remain specialized and composable for subagent parallelism.
- Consolidation gains are achieved at skill layer without reducing agent specialization.

## Risk Assessment

- Breaking risk: low
- Why low:
  - Canonical skills now own merged behavior directly
  - Pipeline routing was updated before cleanup of redundant skill directories
  - Control-plane docs and startup hints are aligned with canonical flow

## Status

DONE
