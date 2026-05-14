---
name: fixture
description: "demo: text with colon to exercise YAML edge case"
allowed-tools: [Read]
when_to_use: |
  Test fixture for verify:fixture-parity. Not a real skill.
produces: ~
consumes: []
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

# Fixture Skill

This file exercises every substitution token used by the generators:

- `{{PREAMBLE_CORE}}` (above) → expands to the core preamble inline.
- `{{PREAMBLE_REF_LINK}}` (above) → expands to the reference link line.
- `${CLAUDE_SKILL_DIR}` → preserved as a literal token; Anthropic's skill runtime resolves it at load time. Example link target: [reference/example.md](${CLAUDE_SKILL_DIR}/reference/example.md).
- A `description` field containing a colon (`:`) — verifies YAML scalar handling stays untouched by token expansion.

The verify:fixture-parity script runs all three generators (js / sh / ps1) on this template and asserts byte-identical output via sha256.