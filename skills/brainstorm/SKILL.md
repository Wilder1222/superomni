---
name: brainstorm
description: |
  Use when starting a new feature, project, or design decision.
  Guides from fuzzy idea to concrete spec through structured dialogue.
  Triggers: "brainstorm", "design", "spec this out", "let's think through".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob, WebSearch]
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


# Brainstorming & Specification

**Goal:** Transform a fuzzy idea into a concrete, reviewable spec document.

## Iron Law: Search Before Building

Before designing anything:
1. **Layer 1 — Tried and true:** Does a well-established solution already exist?
2. **Layer 2 — New and popular:** Is there a recently popular approach? Evaluate carefully.
3. **Layer 3 — First principles:** Only design from scratch if nothing fits.

Run: `grep -r "similar functionality" . --include="*.md" -l` to check existing docs.

## Phase 1: Problem Crystallization

Ask ONE clarifying question at a time. Do not ask multiple questions at once.

Required understanding before proceeding:
- [ ] What is the problem being solved? (not the solution)
- [ ] Who experiences this problem?
- [ ] What does success look like? (measurable outcome)
- [ ] What constraints exist? (time, technology, team size)
- [ ] What already exists that's related?
- [ ] TACIT probe: at least 3 of 5 dimensions answered

### TACIT Five-Dimensional Probe

After initial understanding is established, systematically probe these 5 tacit knowledge dimensions.
Each dimension requires exactly ONE targeted question:

**T - Team & Culture**
  -> "Does your team have any preferences or taboos regarding [key technical choice in this task]?"
  Purpose: Capture implicit team conventions and consensus

**A - Aesthetic & Style**
  -> "Is there existing code or a system you consider 'feels right' as a reference?"
  Purpose: Capture code style, architecture taste, implicit quality standards
  Note: If `docs/superomni/style-profiles/` exists, reference it instead of asking

**C - Constraints Unstated**
  -> "What absolutely must NOT be touched or changed this time?"
  Purpose: Capture hidden boundaries, forbidden zones, political constraints

**I - Integration Expectations**
  -> "After this feature is complete, what will the user do first?"
  Purpose: Capture implicit acceptance scenarios and success experience

**T - Time & Quality Trade-offs**
  -> "If you had to cut one feature to ship on time, which would you cut first?"
  Purpose: Capture implicit priority weights and non-negotiables

**TACIT Probe Gate:**
Before proceeding to Phase 2, verify:
- [ ] At least 3 of 5 TACIT dimensions received an explicit answer
- [ ] If any answer revealed new constraints, problem definition has been updated
- FAIL -> continue clarification, do NOT enter Phase 2

Rule: **Ask one question. Wait for answer. Then ask the next.**
Confirmation rule: each answer (text input or single-choice) is an immediate confirmation — do NOT re-ask or add a "confirm?" prompt after the user replies.

## Phase 2: Solution Space Exploration

**Mandatory Alternatives Rule:**
The 3 options MUST collectively include both:
- One **"Minimal Viable"** approach — fewest files, smallest diff, ships fastest
- One **"Ideal Architecture"** approach — best long-term trajectory, most elegant

These two can be any 2 of the 3 options (A, B, or C); the third slot is flexible.
Each option must include: Name, 1-sentence summary, Effort (S/M/L), Pros (2), Cons (2), Reuses (existing code leveraged).

**RECOMMENDATION:** State which option you recommend and the one-line reason. The user chooses.

Generate 3 candidate approaches, then always offer an "Other" option for the user's own idea:

```
Option A: [name] — [1-sentence description]
  Pros: [pro 1], [pro 2]
  Cons: [con 1], [con 2]
  Effort: [S/M/L]
  Reuses: [existing code or infra leveraged]

Option B: [name] — [1-sentence description]
  Pros: [pro 1], [pro 2]
  Cons: [con 1], [con 2]
  Effort: [S/M/L]
  Reuses: [existing code or infra leveraged]

Option C: [name] — [1-sentence description]
  Pros: [pro 1], [pro 2]
  Cons: [con 1], [con 2]
  Effort: [S/M/L]
  Reuses: [existing code or infra leveraged]

Option D (Other): describe your own approach — ___________
```

Apply the 6 Decision Principles when evaluating:
- Prefer completeness (covers more cases)
- Prefer DRY (reuses existing)
- Prefer explicit over clever

Surface only TASTE decisions to the user. Decide MECHANICAL ones silently.

## Phase 3: Visual Companion (if applicable)

For UI or architecture work, produce a text diagram or ASCII wireframe.
See `visual-companion.md` for diagram formats.

**Frontend Design Integration:**
If the spec involves UI components, pages, or visual design:
- Note in the spec: *"This involves UI work — recommend running the `frontend-design` skill during BUILD to ensure design quality."*
- When generating acceptance criteria, include: "Passes designer agent review at 7+/10 on all dimensions"

## Phase 4: Spec Document Output

```bash
mkdir -p docs/superomni/specs
_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_SESSION="<auto-generate-kebab-case-from-context>"  # e.g., auth-refactor, vibe-skill
_DATE=$(date +%Y%m%d)
_SPEC_FILE="docs/superomni/specs/spec-${_BRANCH}-${_SESSION}-${_DATE}.md"
```

Produce `docs/superomni/specs/spec-[branch]-[session]-[date].md` with this structure:

```markdown
# [Feature Name] — Spec

## Problem
[1 paragraph: what is broken or missing and for whom]

## Goals
- [Measurable outcome 1]
- [Measurable outcome 2]

## Non-Goals (YAGNI)
- [What we are explicitly NOT building]

## Proposed Solution
[Selected approach + rationale]

## Key Design Decisions
| Decision | Choice | Rationale | Principle Applied |

## Acceptance Criteria
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]

## Open Questions
- [Any unresolved taste decisions requiring user input]
```

## Phase 5: Spec Self-Review (Inline)

Before presenting to user, run this inline check (no sub-agent needed):

**Placeholder scan** — any TBD, TODO, [placeholder], "similar to X", undefined references?
  → If yes: fill them in before proceeding

**Scope check** — does Proposed Solution match Goals exactly?
  → Over-scoped: move extras to Non-Goals
  → Under-scoped: add missing requirements to Goals

**Internal consistency** — do Acceptance Criteria actually test the Proposed Solution?
  → Any criterion that can't be traced to the solution → revise or remove

**Ambiguity check** — is each Acceptance Criterion yes/no testable?
  → Vague criteria ("works correctly", "performs well") → make measurable

If all 4 checks pass → proceed to Phase 6. If any fail → fix in spec and re-check.

## Phase 6: Human Gate — Spec Approval

**THINK is the human gate.** After the spec is generated and self-reviewed, STOP and present the spec to the user for approval.

Present:
```
SPEC READY FOR REVIEW
════════════════════════════════════════
File: [spec file path]

[Summary: 3-5 bullet points of the proposed solution]

Acceptance criteria:
  - [criterion 1]
  - [criterion 2]
  ...

Please review the spec above.
  Y) Approve — proceed to PLAN (all subsequent stages will auto-execute)
  N) Reject — describe what needs to change
  [Or provide revision notes directly]
════════════════════════════════════════
```

**Wait for user response.** This is the ONLY human gate in the entire pipeline.
- If approved → write approval marker file, report DONE and auto-advance to PLAN (`writing-plans`). All subsequent stages (PLAN → REVIEW → BUILD → VERIFY → RELEASE) will execute automatically without further user input.
  ```bash
  # Write approval marker (enables vibe stage detection to advance past THINK)
  _SPEC_BASE=$(basename "$_SPEC_FILE" .md)
  touch "docs/superomni/specs/.approved-${_SPEC_BASE}"
  ```
- If rejected → revise the spec based on feedback and re-present for review.

Report status: **DONE** — spec written, reviewed, and approved by user. Path: [spec file path]
