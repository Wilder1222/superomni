---
name: receiving-code-review
description: |
  Use when responding to code review feedback on your changes.
  Guides you through processing comments, making fixes, and re-requesting review.
  Triggers: "address review", "fix review comments", "respond to feedback", "review feedback".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection

On session start, read: branch from `git branch --show-current`, proactive config from `bin/config get proactive` (default `true`), session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### PROACTIVE Mode

**Legacy mode (single value):**
If `proactive=true`: auto-invoke skills. If `proactive=false`: ask first.

If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

**5-Level Trust Matrix (when configured):**

Before executing any decision, classify its tacit knowledge intensity:

| Decision Type | Config Key | Default | When to Use |
|--------------|------------|---------|-------------|
| Mechanical | proactive.mechanical | true | Iron Law applies, Gate Check is deterministic |
| Structural | proactive.structural | true | Architecture, interface, module boundaries |
| Stylistic | proactive.stylistic | ask | Naming, formatting, UI layout, comment style |
| Strategic | proactive.strategic | ask | Approach selection, architecture trade-offs |
| Destructive | proactive.destructive | false | Delete, overwrite, irreversible operations |

Classification rules:
- If a style profile exists (`docs/superomni/style-profiles/`), stylistic decisions
  that match the profile can be treated as mechanical
- Strategic decisions ALWAYS surface to user unless `proactive.strategic=true`
- Destructive decisions ALWAYS confirm (integrates with `careful` Skill) regardless of config

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

# Receiving Code Review

**Goal:** Process code review feedback systematically, fix what needs fixing, discuss what needs discussing, and re-request review with a clean diff.

## Iron Law

**NEVER DISMISS FEEDBACK WITHOUT UNDERSTANDING IT FIRST.**

Before marking any comment as "won't fix" or "disagree," you must:
1. Restate the reviewer's concern in your own words
2. Explain why you believe your approach is correct
3. Offer a concrete alternative if you're rejecting their suggestion

## Phase 1: Triage Review Comments

Read every comment. Classify each one:

| Priority | Meaning | Action |
|----------|---------|--------|
| **P0 — Must fix** | Correctness bug, security issue, test gap, spec violation | Fix immediately, no discussion needed |
| **P1 — Should fix** | Code quality, naming, readability, DRY violation | Fix unless you have a strong reason not to |
| **P2 — Optional** | Style preference, minor suggestion, alternative approach | Consider, but OK to skip with brief explanation |

### Mechanical vs. Taste

- **Mechanical** — has a clear right answer (bug fix, missing null check, wrong variable name). Just fix it silently.
- **Taste** — reasonable people could disagree (naming conventions, abstraction level, code organization). Discuss if you disagree.

```bash
# Review the PR comments (if using GitHub)
gh pr view --comments 2>/dev/null | head -60

# See the current diff to understand what was reviewed
git diff main...HEAD --stat
```

Produce a triage list:

```
REVIEW TRIAGE
─────────────────────────────────
P0 (must fix):
  [ ] [file:line] — [summary of issue]

P1 (should fix):
  [ ] [file:line] — [summary of issue]

P2 (optional):
  [ ] [file:line] — [summary of suggestion]

Taste discussions:
  [ ] [file:line] — [topic to discuss]
─────────────────────────────────
```

## Phase 2: Fix P0 and P1 Issues

Work through fixes in priority order: all P0s first, then P1s.

For each fix:

1. **Understand the comment** — re-read it. What specifically is wrong?
2. **Make the fix** — change the minimum necessary
3. **Verify the fix** — run tests, check the behavior is correct
4. **Check for ripple effects** — did this fix break anything else?

```bash
# After each fix, run tests
npm test 2>&1 | tail -10
# or
pytest -v 2>&1 | tail -10

# Verify no regressions
git diff HEAD --stat
```

### Rules for Fixing

- **One commit per logical fix** — don't lump unrelated fixes together
- **Don't sneak in unrelated changes** — if you see something else to fix, note it for later
- **Match the reviewer's intent** — if they said "add a null check," add a null check, not a total refactor

## Phase 3: Handle Taste Discussions

For comments you disagree with:

1. **Acknowledge the concern** — "I see your point about X"
2. **Explain your reasoning** — "I chose Y because Z"
3. **Propose a resolution** — "Would you be OK with [alternative]?" or "I'll make the change"
4. **Never be defensive** — the reviewer is trying to help

### Response Templates

**Agreeing:**
> Good catch, fixed in [commit SHA].

**Partially agreeing:**
> I see the concern about [X]. I've addressed [part] but kept [other part] because [reason]. Let me know if you'd prefer a different approach.

**Respectfully disagreeing:**
> I considered [their approach] but went with [your approach] because [specific reason]. The tradeoff is [what you lose vs. gain]. Happy to change if you feel strongly.

**Asking for clarification:**
> I want to make sure I understand — are you suggesting [interpretation A] or [interpretation B]?

## Phase 4: Update and Re-Request Review

After all fixes are applied:

```bash
# Verify everything passes
npm test 2>&1 | tail -10

# Review your own diff before re-requesting
git diff main...HEAD --stat
git diff main...HEAD | head -100

# Check for leftover debug code
git diff main...HEAD | grep -E "console\.log|debugger|TODO|FIXME|print\(" | head -10

# Commit and push
git add -A
git commit -m "Address review feedback

- [summary of P0 fixes]
- [summary of P1 fixes]
- [summary of taste decisions made]"
git push
```

Leave a summary comment on the PR:

```
Review feedback addressed:
- ✓ [P0 fix 1]
- ✓ [P0 fix 2]
- ✓ [P1 fix 1]
- 💬 [Taste discussion — see inline reply]
- ⏭ [P2 skipped — reason]

Ready for re-review.
```

## Phase 5: If Review Goes Multiple Rounds

After 2+ rounds of review on the same comment:
1. **Stop** — async text is failing to communicate
2. **Propose a sync discussion** — "Can we discuss this live?"
3. **If async only** — write a longer explanation with examples, not a shorter one

## Report

```
REVIEW RESPONSE
════════════════════════════════════════
PR/Branch:       [name]
Comments total:  [N]
  P0 fixed:      [N]
  P1 fixed:      [N]
  P2 addressed:  [N]
  Taste discussed: [N]
  Skipped (with reason): [N]
Tests passing:   [yes/no]
Re-review requested: [yes/no]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
════════════════════════════════════════
```
