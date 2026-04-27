---
name: office-hours
description: |
  superomni Office Hours — product discovery and validation. Two modes:
  Startup mode: six forcing questions that expose demand reality, the narrowest
  wedge, and implementation alternatives. Builder mode: design thinking for
  side projects and open source. Saves a design doc.
  Triggers: "brainstorm this idea", "office hours", "validate my idea",
  "think about this product", "I want to build", "help me think through".
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

### Anti-Sycophancy Rules

Never say these — they are sycophantic filler that delays real analysis:
- "That's an interesting approach" → Take a position instead
- "There are many ways to think about this" → Pick one, state what evidence would change your mind
- "You might want to consider..." → Say "This is wrong because..." or "This works because..."
- "That could work" → Say whether it WILL work based on evidence
- "I can see why you'd think that" → If they're wrong, say so and why

Always do:
- Take a position on every significant question. State the position AND what evidence would change it.
- If the user's approach has a flaw, name the flaw directly before suggesting alternatives.
- Calibrated acknowledgment only: if an answer is specific and evidence-based, name what was good and pivot to the next hard question.

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


# /office-hours — Product Discovery

**Goal:** Before writing a single line of code, understand the real problem, the real user, and the real market. Save a `design-doc.md` that downstream skills can use.

## Iron Law: Understand Before Building

Never start implementation without a `design-doc.md`. If the user is excited about a solution, your job is to find the problem behind the solution.

## Step 1: Choose Mode

Ask the user which mode applies:

**Startup Mode** — validating a real product for real users with growth expectations
**Builder Mode** — side project, hackathon, open source, learning, or personal tool

## Startup Mode — 6 Forcing Questions

Ask these questions one at a time (never all at once):

### Q1: Demand Reality
"Tell me about the last time this problem bit you specifically. Not in general — the last actual time. What were you doing, what happened, and what did you do about it?"

Goal: Find if the problem is real or hypothetical.

### Q2: Status Quo
"What do people do today to solve this? Walk me through their current workflow."

Goal: Find the incumbent. If there's no status quo, there may be no market.

### Q3: Desperate Specificity
"Who woke up this morning already desperate for this? Not 'people who' — name a specific type of person and describe their Monday morning."

Goal: Find the beachhead user. Vague answers → vague product.

### Q4: Narrowest Wedge
"What is the absolute minimum you could build in a week that would be genuinely useful to the desperate user? Not a demo — actually useful."

Goal: Force scope reduction to something shippable.

### Q5: Observation
"Have you talked to 5 of these users? What did they tell you that surprised you?"

Goal: Find whether research has happened or if this is assumption-driven.

### Q6: Future-Fit
"In 3 years, if this works, what does the company look like? What has to be true about the market?"

Goal: Find if the wedge leads anywhere.

## Builder Mode — Design Thinking

Ask these questions to frame the builder's project:

1. **Pain**: "What problem are you personally trying to solve? When did it last bother you?"
2. **Existing solutions**: "What have you tried? Why didn't it work?"
3. **Unique angle**: "What do you know or have access to that makes your version different?"
4. **Success definition**: "How will you know in 30 days if this was worth building?"
5. **Scope**: "If you had to ship something in a weekend, what's the one thing it does?"

## Step 2: Challenge and Reframe

After answers are collected, push back:

- Challenge the framing if it's feature-focused (find the problem)
- Name the actual product category (not the feature described)
- Extract 3-5 capabilities the user described but didn't name
- Challenge 2-3 premises you believe might be wrong
- Generate 3 alternative implementations with effort estimates

End with: **RECOMMENDATION: Ship the narrowest wedge. The full vision is a [timeframe] project — start with what works tomorrow.**

## Step 3: Write the Design Doc

Create `design-doc.md` in the project root:

```markdown
# Design Doc: [Product Name]

## Problem
[2-3 sentences: who has what problem, how badly]

## User
[Specific: "The person who..." not "People who..."]

## Status Quo
[What they do today. Why it's not good enough.]

## Solution
[The narrowest wedge. One paragraph.]

## Success Criteria (30 days)
[Measurable: X users, Y actions, Z outcome]

## Out of Scope (v1)
[Things we deliberately are NOT building]

## Implementation Alternatives
1. [Option A] — [effort, tradeoff]
2. [Option B] — [effort, tradeoff]
3. [Option C] — [effort, tradeoff]

## Open Questions
- [ ] [Question that must be answered before building]
```

## Output Format

```
OFFICE HOURS COMPLETE
════════════════════════════════════════
Mode:        [Startup | Builder]
Product:     [Name]
User:        [Specific persona]
Wedge:       [The minimum viable thing]
Design doc:  design-doc.md

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```
