---
name: workflow
description: |
  Documents the end-to-end sprint workflow and inter-skill data flow.
  Use to understand which skills to use, in what order, and how data flows between them.
  Triggers: "workflow", "sprint", "pipeline", "what's next", "how do skills connect".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection

On session start, read: branch from `git branch --show-current`, session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Auto-Advance Rule

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE) auto-advance on DONE.

| Status | At THINK stage (after spec generation) | At all other stages |
|--------|----------------------------------------|-------------------|
| **DONE** | STOP - present spec document for user review. Wait for user approval before advancing to PLAN. | Auto-advance - print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP - present concerns, wait for user decision | STOP - present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP - present blocker, wait for user | STOP - present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE -> advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

**Note:** The REVIEW stage (plan-review) runs fully automatically — all decisions (mechanical and taste) are auto-resolved using the 6 Decision Principles. No user input is requested during REVIEW.

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Read `~/.omni-skills/sessions/current-session-ts` to get session start timestamp. Find artifacts in `docs/superomni/specs/`, `docs/superomni/plans/` newer than that timestamp using `find -newer`. Check `git log --oneline -3`.
2. If current-session context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no current-session context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Question Confirmation Protocol

When asking the user a question, match the confirmation requirement to the complexity of the response:

| Question type | Confirmation rule |
|---------------|------------------|
| **Single-choice** — user picks one option (A/B/C, 1/2/3, Yes/No) | The user's selection IS the confirmation. Do NOT ask "Are you sure?" or require a second submission. |
| **Free-text input** — user types a value and presses Enter | The submitted text IS the confirmation. No secondary prompt needed. |
| **Multi-choice** — user selects multiple items from a list | After the user lists their selections, ask once: "Confirm these selections? (Y to proceed)" before acting. |
| **Complex / open-ended discussion** — back-and-forth clarification | Collect all input, then present a summary and ask: "Ready to proceed with the above? (Y/N)" before acting. |

**Rule: never add a redundant confirmation layer on top of a single-choice or text-input answer.**

**Custom Input Option Rule:** Always append `Other — describe your own idea: ___` to predefined choice lists. Treat custom text as the chosen option; ask one clarifying question only if ambiguous.

### Context Window Management
Load context progressively — only what is needed for the current phase:

| Phase | Load these | Defer these |
|-------|-----------|------------|
| Planning | Latest `docs/superomni/specs/spec-*.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | Latest `docs/superomni/plans/plan-*.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

### Output Directory
All skill artifacts are written to `docs/superomni/` (relative to project root).
See the Document Output Convention in CLAUDE.md for the full directory map.

### Feedback Signal Protocol
Agent failures are harness signals — not reasons to retry the same approach:

- **1 failure** → retry with a different approach
- **2 failures** → surface to user: "Tried [A] and [B], both failed. Recommend [C]."
- **3 consecutive failures** → STOP. Report BLOCKED. Treat as a harness deficiency signal.
  Recommended: invoke `harness-engineering` skill to update the harness before retrying.
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

### Performance Checkpoint
Before reporting final status, answer: (1) **Process** — all phases followed? (2) **Evidence** — every claim backed by output or file reference? (3) **Scope** — stayed within task boundary? If any NO, address it or report DONE_WITH_CONCERNS. For full sprint evaluation, use `self-improvement`.

### TACIT-DENSE Detection (Tacit Knowledge Density Check)

Before executing substantive decisions, check if any falls into these high-tacit-density categories.
These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
has enough tacit knowledge to judge correctly.

| Category | Trigger | Action |
|----------|---------|--------|
| **D1** Domain Expertise | Security, compliance, legal, financial judgment | State `TACIT-DENSE [D1]`, present trade-offs, wait for user |
| **D2** User-Facing UX | UI copy, interaction flow, error messaging | Draft with explicit review markers |
| **D3** Team Culture | Workflow, naming conventions, file organization | Check `style-profiles/` first; ask if none |
| **D4** Novel Pattern | Fewer than 3 precedents in project history | Reduce autonomy, add checkpoints before executing |

When TACIT-DENSE detected, output: `TACIT-DENSE [D#]: [category] — [question] — My default: [recommendation]`

**Relationship with careful skill:** careful = "can we undo this?" (operational). TACIT-DENSE = "can we judge this correctly?" (knowledge). Complementary.

### Telemetry (Local Only)

At session end, log skill name, duration, and outcome to `~/.omni-skills/analytics/` via `bin/analytics-log`. Nothing is sent to external servers.

### Plan Mode Fallback

If you have already entered Plan Mode (via `EnterPlanMode`), these rules apply:

1. **Skills take precedence over plan mode.** Treat loaded skill instructions as executable steps, not reference material. Follow them exactly — do not summarize, skip, or reorder.
2. **STOP points in skills must be respected.** Do NOT call `ExitPlanMode` prematurely to bypass a skill's STOP/gate.
3. **Safe operations in plan mode** — these are always allowed because they inform the plan, not produce code:
   - Reading files, searching code, running `git log`/`git status`
   - Writing to `docs/superomni/` (specs, plans, reviews)
   - Writing to `~/.omni-skills/` (sessions, analytics)
4. **Route planning through vibe workflow.** Even inside plan mode, follow the pipeline: brainstorm → writing-plans → plan-review → executing-plans. Write the plan to `docs/superomni/plans/`, not to Claude's built-in plan file.
5. **ExitPlanMode timing:** Only call `ExitPlanMode` after the current skill workflow is complete and has reported a status (DONE/BLOCKED/etc).

# Workflow - Sprint Pipeline

**Goal:** Guide a complete feature from idea to shipped code by orchestrating the right skills in the right order, with clear data handoffs between each stage.

## The Pipeline

```
THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT
  |        |       |        |       |       |       |
  v        v       v        v       v       v       v
spec-*   plan-*  approved  code   green  release  retro
```

THINK has exactly one human gate: spec review approval.

- `brainstorm` runs without manual gate.
- After spec generation, user approves `spec-[branch]-[session]-[date].md`.
- After that approval, all stages auto-advance in wave mode on DONE.

Each stage uses specific skills and produces artifacts consumed by the next stage.

## Stage 1: THINK - Define the Problem

Skills: `brainstorm`, `investigate`

Input: fuzzy idea, user request, bug report, or feature ask.

Process:
1. If the problem space is unclear -> use `investigate` to map the system
2. Use `brainstorm` to crystallize the problem and explore solutions
3. Generate 3 candidate approaches and evaluate tradeoffs
4. Produce a spec document

Output: `docs/superomni/specs/spec-[branch]-[session]-[date].md`

## Stage 2: PLAN - Break It Down

Skills: `writing-plans`

Input: latest spec from Stage 1.

Process:
1. Use `writing-plans` to decompose the spec into ordered, testable steps
2. Each step must include description, files to touch, and verification criterion

Output: `docs/superomni/plans/plan-[branch]-[session]-[date].md`

## Stage 3: REVIEW - Validate the Plan

Skills: `plan-review` (full auto mode)

Input: plan from Stage 2.

Process:
1. Validate through strategy, design (if UI), and engineering lenses
2. Auto-resolve decisions using the 6 decision principles
3. Log decision rationale in the review document
4. If issues are found, auto-revise the plan and re-review

Output: reviewed plan + `docs/superomni/reviews/review-[branch]-[session]-[date].md`

## Stage 4: BUILD - Execute the Plan

Skills: `executing-plans`, `test-driven-development`, `careful`, `subagent-development`

Input: reviewed plan from Stage 3.

Process:
1. Execute the plan step by step
2. Apply TDD (Red -> Green -> Refactor) for each step
3. Activate `careful` automatically for high-risk operations
4. Use sub-agents for independent parallelizable steps
5. Verify each step before moving to the next

Output: code + tests + `docs/superomni/executions/execution-[branch]-[session]-[date].md`
Alternative output when using sub-agents: `docs/superomni/subagents/subagent-[branch]-[session]-[date].md`

## Stage 5: VERIFY - Code Review, QA, Readiness

Required skills: `code-review`, `qa`, `verification`
Optional skills by context: `code-review` (`security`/`receiving` modes), `production-readiness`

Input: code changes from Stage 4.

Process:
1. Run structured code review
2. Run QA and fill test gaps
3. Run verification against acceptance criteria
4. Run security audit when security-relevant
5. Run production-readiness when deploying
6. Process external review feedback when present

Output:
- `docs/superomni/evaluations/evaluation-[branch]-[session]-[date].md`
- `docs/superomni/production-readiness/production-readiness-[branch]-[session]-[date].md` when deploying

## Stage 6: SHIP - Release

Skills: `ship`, `finishing-branch`, `careful`

Input: verified and ready code from Stage 5.

Process:
1. Prepare branch for merge
2. Execute release workflow
3. Keep `careful` active for production-impacting operations

Output: merge/deploy/tag evidence recorded in `docs/superomni/executions/execution-[branch]-[session]-[date].md`

## Stage 7: REFLECT - Evaluate and Retro

Skills: `self-improvement` (default + `retro` scope)

Input: completed feature journey.

Process:
1. Run self-improvement to produce concrete improvement actions
2. Run self-improvement with retro scope to analyze delivery pattern and lessons

Output: `docs/superomni/improvements/improvement-[branch]-[session]-[date].md`

## Stage Artifact Gates (Auto-Advance Preconditions)

Wave auto-advance requires stage artifact evidence:

| Stage | Artifact gate |
|-------|----------------|
| THINK | `docs/superomni/specs/spec-[branch]-[session]-[date].md` approved by user |
| PLAN | `docs/superomni/plans/plan-[branch]-[session]-[date].md` |
| REVIEW | `docs/superomni/reviews/review-[branch]-[session]-[date].md` |
| BUILD | `docs/superomni/executions/execution-[branch]-[session]-[date].md` or `docs/superomni/subagents/subagent-[branch]-[session]-[date].md` |
| VERIFY | `docs/superomni/evaluations/evaluation-[branch]-[session]-[date].md` (+ production readiness report when deploying) |
| SHIP | Release evidence present in `docs/superomni/executions/execution-[branch]-[session]-[date].md` |
| REFLECT | `docs/superomni/improvements/improvement-[branch]-[session]-[date].md` |

Missing artifact => do not auto-advance. Report `DONE_WITH_CONCERNS` and request artifact completion.

## Report

```
Pipeline: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT
Stage: [current] | Branch: [branch]
Artifacts: spec-*.md [Y/N] | plan-*.md [Y/N] | executions [N] | reviews [N] | prod-readiness [N] | improvements [N]
Next -> [skill-name]: [reason]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
```
