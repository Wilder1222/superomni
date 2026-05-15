---
name: workflow
description: |
  Reference stub pointing to using-skills and vibe auto. The pipeline's operational logic now lives in `vibe` (runtime) and `using-skills` (routing + decision principles). Triggers: "workflow", "pipeline", "what runs at which stage".
allowed-tools: [Read]
when_to_use: |
  Use as a quick lookup when you need to remember which skill runs at which stage or what artifact each stage produces. For running the pipeline, use `vibe auto` (or plain `/vibe`).
produces: ~
consumes: ~
---


<!-- Inlined into every SKILL.md via {{PREAMBLE_CORE}}. Keep ≤30 lines. -->

## Preamble (Core)

**Status protocol** — end every session with one of: `DONE` (evidence provided) · `DONE_WITH_CONCERNS` (list each) · `BLOCKED` (state what blocks you) · `NEEDS_CONTEXT` (state what you need).

**Auto-advance** — pipeline: `THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE`. Only human gate is spec approval at THINK. On `DONE` at other stages, print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and invoke the next skill. On any non-DONE status at any stage, STOP.

**Output directory** — all artifacts go in `docs/superomni/<kind>/<kind>-[branch]-[session]-[date].md`. See `CLAUDE.md` for the full directory map.

**TACIT-DENSE** — before high-tacit decisions, classify D1 (domain expertise) · D2 (user-facing UX) · D3 (team culture) · D4 (novel pattern). On hit, output `TACIT-DENSE [D#]: [question] — My default: [recommendation]`. See reference for actions.

**Anti-sycophancy** — take a position on every significant question. Name flaws directly. No filler ("that's interesting", "you might consider", "that could work").

**Telemetry (local only)** — at session end, log `bin/analytics-log`. Nothing leaves the machine.

_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._


# Workflow — Pipeline Reference

Static pointer. Operational pipeline logic lives in `vibe` (runtime) and `using-skills` (routing).

## 6-Stage Pipeline

`THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE`

## Where to Look

| Question | Answer |
|----------|--------|
| Run the pipeline end-to-end | `/vibe auto` |
| Run step-by-step | plain `/vibe` |
| Which skill handles each stage | `using-skills` Quick Reference + `skills/vibe/SKILL.md` |
| Artifact each stage produces | Skill frontmatter `produces:` + CLAUDE.md output convention |
| Validate artifact contract | `npm run check:workflow-contract` |

Status: DONE