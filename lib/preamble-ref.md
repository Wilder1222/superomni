<!-- Deep-reference preamble. Loaded on demand from SKILL.md core preamble link. -->

# superomni Preamble — Deep Reference

The core preamble (inlined in every SKILL.md) covers: status protocol, auto-advance, output directory, TACIT-DENSE one-liner, anti-sycophancy one-liner, telemetry.

This document contains the detailed protocols that skills load **on demand** when their branch needs them. Link back with `_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._`

---

## Environment Detection

On session start, read: branch from `git branch --show-current`, proactive config from `bin/config get proactive` (default `true`), session timestamp from `~/.omni-skills/sessions/current-session-ts`.

## PROACTIVE Mode

**Legacy (single value):** `proactive=true` → auto-invoke skills; `proactive=false` → ask first. If `PROACTIVE=false` and you would have auto-invoked, say *"I think [skill-name] might help here — want me to run it?"* and wait.

**5-Level Trust Matrix:**

| Decision Type | Config Key | Default | When to Use |
|--------------|------------|---------|-------------|
| Mechanical | proactive.mechanical | true | Iron Law applies; gate check deterministic |
| Structural | proactive.structural | true | Architecture, interface, module boundaries |
| Stylistic | proactive.stylistic | ask | Naming, formatting, UI layout, comment style |
| Strategic | proactive.strategic | ask | Approach selection, architecture trade-offs |
| Destructive | proactive.destructive | false | Delete, overwrite, irreversible operations |

Classification rules:
- If `docs/superomni/style-profiles/` exists, stylistic decisions matching the profile can be treated as mechanical.
- Strategic decisions ALWAYS surface to user unless `proactive.strategic=true`.
- Destructive decisions ALWAYS confirm (integrates with `careful` skill) regardless of config.

## Auto-Advance Rule (Full Table)

| Status | At THINK stage (after spec generation) | At all other stages |
|--------|----------------------------------------|-------------------|
| **DONE** | STOP — present spec for user review, wait for approval | Auto-advance — print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and invoke next skill |
| **DONE_WITH_CONCERNS** | STOP — present concerns, wait for user | STOP — present concerns, wait for user |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP — present blocker, wait for user | STOP — present blocker, wait for user |

When auto-advancing: (1) write session artifact to `docs/superomni/`, (2) print the `[STAGE] DONE -> advancing` line, (3) immediately invoke the next pipeline skill.

**REVIEW (plan-review) runs fully auto.** All decisions (mechanical and taste) are auto-resolved using the 6 Decision Principles. No user input during REVIEW.

## Session Continuity

When the user sends a **follow-up message after a completed session**, before anything else:
1. Read `~/.omni-skills/sessions/current-session-ts`. Find artifacts in `docs/superomni/specs/` and `docs/superomni/plans/` newer than that timestamp (`find -newer`). Check `git log --oneline -3`.
2. If current-session context exists → re-engage the skill framework. Pick the skill matching the current stage (see `workflow` / `using-skills`) and announce: *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no current-session context → treat as a fresh session; offer the relevant skill from `using-skills/SKILL.md` Quick Reference.

## Question Confirmation Protocol

| Question type | Confirmation rule |
|---------------|-------------------|
| **Single-choice** (A/B/C, 1/2/3, Y/N) | User's selection IS the confirmation. No re-ask. |
| **Free-text input** | Submitted text IS the confirmation. No secondary prompt. |
| **Multi-choice** | After user lists selections, ask once: *"Confirm these selections? (Y to proceed)"*. |
| **Complex / open-ended** | Collect all input, present summary, ask: *"Ready to proceed with the above? (Y/N)"*. |

**Never add a redundant confirmation on top of single-choice or text-input.**

**Custom Input Option Rule:** always append `Other — describe your own idea: ___` to predefined choice lists. Treat custom text as the chosen option; ask one clarifying question only if ambiguous.

## Context Window Management

Load context progressively — only what the current phase needs:

| Phase | Load these | Defer these |
|-------|-----------|-------------|
| Planning | Latest `docs/superomni/specs/spec-*.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | Latest `docs/superomni/plans/plan-*.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | Diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

## Feedback Signal Protocol

Agent failures are harness signals — not reasons to retry the same approach:

- **1 failure** → retry with a different approach
- **2 failures** → surface: *"Tried [A] and [B], both failed. Recommend [C]."*
- **3 consecutive failures** → STOP. Report `BLOCKED`. Treat as harness deficiency — recommend `harness-engineering` skill before retrying.
- **Uncertain about security** → STOP and report `NEEDS_CONTEXT`.
- **Scope exceeds verification capacity** → STOP and flag blast radius.

It is always OK to stop and say "this is too hard for me." Escalation is expected.

## Performance Checkpoint

Before reporting final status, answer:
1. **Process** — all phases followed?
2. **Evidence** — every claim backed by output or file reference?
3. **Scope** — stayed within task boundary?

If any NO, address it or report `DONE_WITH_CONCERNS`. For full sprint evaluation, use `self-improvement`.

## TACIT-DENSE Detection (Full Table)

| Category | Trigger | Action |
|----------|---------|--------|
| **D1** Domain Expertise | Security, compliance, legal, financial judgment | State `TACIT-DENSE [D1]`, present trade-offs, wait for user |
| **D2** User-Facing UX | UI copy, interaction flow, error messaging | Draft with explicit review markers |
| **D3** Team Culture | Workflow, naming conventions, file organization | Check `docs/superomni/style-profiles/` first; ask if none |
| **D4** Novel Pattern | Fewer than 3 precedents in project history | Reduce autonomy, add checkpoints before executing |

On hit, emit: `TACIT-DENSE [D#]: [category] — [question] — My default: [recommendation]`.

**careful vs TACIT-DENSE:** `careful` = "can we undo this?" (operational). TACIT-DENSE = "can we judge this correctly?" (knowledge). Complementary.

## Plan Mode Fallback

If you have already entered Plan Mode (via `EnterPlanMode`):

1. **Skills take precedence over plan mode.** Treat loaded skill instructions as executable steps, not reference material. Follow them exactly — do not summarize, skip, or reorder.
2. **STOP points in skills must be respected.** Do NOT call `ExitPlanMode` prematurely to bypass a skill STOP/gate.
3. **Safe operations in plan mode** (always allowed — they inform the plan, not produce code):
   - Reading files, searching code, `git log`/`git status`
   - Writing to `docs/superomni/` (specs, plans, reviews)
   - Writing to `~/.omni-skills/` (sessions, analytics)
4. **Route planning through vibe workflow.** Even inside plan mode, follow the pipeline: `brainstorm → writing-plans → plan-review → executing-plans`. Write plans to `docs/superomni/plans/`, not to Claude's built-in plan file.
5. **ExitPlanMode timing:** only call `ExitPlanMode` after the current skill workflow is complete and has reported a status.

## Telemetry Details

At session end, append a JSON line to `~/.omni-skills/analytics/usage.jsonl` via `bin/analytics-log`, containing: skill name, duration, outcome, branch, session id. Nothing is sent to external servers. To inspect: `cat ~/.omni-skills/analytics/usage.jsonl | tail -20`. To disable: `bin/config set telemetry false`.
