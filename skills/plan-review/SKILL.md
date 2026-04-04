---
name: plan-review
description: |
  Multi-stage plan review pipeline: Strategy (CEO) → Design (if UI) → Engineering.
  Applies 6 decision principles. Auto-resolves mechanical decisions, surfaces taste decisions.
  Triggers: "review this plan", "autoplan", "is this plan good", before executing any plan.
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection
```bash
mkdir -p ~/.omni-skills/sessions
_PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_TEL_START=$(date +%s)
echo "Branch: $_BRANCH | PROACTIVE: $_PROACTIVE"
```

### PROACTIVE Mode
If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

### Completion Status Protocol
Report status using one of these at the end of every skill session:

- **DONE** — All steps completed. Evidence provided.
- **DONE_WITH_CONCERNS** — Completed with issues. List each concern explicitly.
- **BLOCKED** — Cannot proceed. State what blocks you and what was tried.
- **NEEDS_CONTEXT** — Missing information. State exactly what you need.

### Auto-Advance Rule

Pipeline stage order: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT

**REVIEW is the only human gate.** All other stages auto-advance on DONE.

| Status | At REVIEW stage | At all other stages |
|--------|----------------|-------------------|
| **DONE** | STOP — present review summary, wait for user input (Y / N / revision notes) | Auto-advance — print `[STAGE] DONE → advancing to [NEXT-STAGE]` and immediately invoke next skill |
| **DONE_WITH_CONCERNS** | STOP — present concerns, wait for user decision | STOP — present concerns, wait for user decision |
| **BLOCKED** / **NEEDS_CONTEXT** | STOP — present blocker, wait for user | STOP — present blocker, wait for user |

When auto-advancing:
1. Write the session artifact to `docs/superomni/`
2. Print: `[STAGE] DONE → advancing to [NEXT-STAGE] ([skill-name])`
3. Immediately invoke the next pipeline skill

### Session Continuity

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/specs/spec-*.md docs/superomni/plans/plan-*.md docs/superomni/ .superomni/ 2>/dev/null | head -20
   git log --oneline -3 2>/dev/null
   ```
   To find the latest spec or plan:
   ```bash
   _LATEST_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
   _LATEST_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
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

**Custom Input Option Rule:** Whenever you present a predefined list of choices (A/B/C, numbered options, etc.), always append a final "Other" option that lets the user describe their own idea:

```
  [last letter/number + 1]) Other — describe your own idea: ___________
```

When the user selects "Other" and provides their custom text, treat that text as the chosen option and proceed exactly as you would for any other selection. If the custom text is ambiguous, ask one clarifying question before proceeding.

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
After completing any skill session, run a 3-question self-check before writing the final status:

1. **Process** — Did I follow all defined phases? If any were skipped, state why.
2. **Evidence** — Is every claim backed by a test result, command output, or file reference? If not, gather the missing evidence now.
3. **Scope** — Did I stay within the task boundary? If I touched files outside the original scope, flag them explicitly.

If any answer is NO, address it before reporting DONE. If it cannot be addressed, report DONE_WITH_CONCERNS and name the gap.

For a full performance evaluation spanning the entire sprint, use the `self-improvement` skill.

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# Plan Review Pipeline

**Goal:** Review a plan through multiple lenses before execution begins. Catch problems before they become expensive mistakes.

One command. Rough plan in, fully reviewed plan out.

## The 6 Decision Principles (Reference)

1. **Choose completeness** — cover more edge cases
2. **Boil lakes** — fix everything in blast radius if <1 day effort
3. **Pragmatic** — two equal options? Pick the cleaner one
4. **DRY** — duplicates existing? Reject. Reuse what exists.
5. **Explicit over clever** — 10-line obvious > 200-line abstraction
6. **Bias toward action** — flag concerns but don't block

**Conflict resolution:**
- Strategy phase: Principles 1+2 dominate (completeness + lake-boiling)
- Engineering phase: Principles 5+3 dominate (explicit + pragmatic)
- Design phase: Principles 5+1 dominate (explicit + completeness)

## Decision Classification

**Mechanical** — one clearly right answer given constraints. Auto-decide silently, don't burden the user.
**Taste** — reasonable engineers could disagree. Collect and surface at the final gate only.

---

## Phase 1: Strategy Review (CEO Lens)

Questions:
1. **Premise validity** — are assumptions stated or just assumed?
2. **Scope calibration** — right amount of work? Not too much, not too little?
3. **Alternatives considered** — was the chosen approach selected, not just defaulted to?
4. **What already exists** — is anything being reinvented? (DRY check)
5. **Risk identification** — what are the top 3 risks if this goes wrong?
6. **Success definition** — is there a measurable definition of done?

```
STRATEGY REVIEW
  Premises: [explicit | implicit | missing]
  Scope:    [right-sized | too large | too small]
  Alternatives: [considered | not documented]
  DRY:      [reuses existing | reinvents wheel]
  Risks:    [list top 3]
```

**GATE:** Present premises to user for confirmation before proceeding.

---

## Phase 2: Design Review (conditional)

**Only run this phase if the plan includes UI or user-facing changes.**

Check:
- [ ] **Information hierarchy** — is the most important thing most prominent?
- [ ] **Missing states** — loading, empty, error, partial/degraded?
- [ ] **Responsive strategy** — does it work at different screen sizes?
- [ ] **Accessibility** — keyboard nav, screen readers, color contrast?
- [ ] **Error recovery** — can users recover from mistakes?

```
DESIGN REVIEW (if applicable)
  States covered: loading ✓/✗ | empty ✓/✗ | error ✓/✗
  Responsive: [strategy described | missing]
  Accessibility: [addressed | not addressed]
```

---

## Phase 3: Engineering Review

Check:
- [ ] **Architecture soundness** — appropriate layers, minimal coupling?
- [ ] **Test coverage plan** — what will be tested, at what level?
- [ ] **Performance risks** — N+1 queries, large payloads, unbounded operations?
- [ ] **Error path handling** — every error case has a handling strategy?
- [ ] **Security considerations** — auth, input validation, injection risks?
- [ ] **Backward compatibility** — does this break existing behavior?
- [ ] **Blast radius** — how many files/systems does this touch?

```
ENGINEERING REVIEW
  Architecture: [sound | concerns: ...]
  Test plan:    [comprehensive | gaps: ...]
  Performance:  [no risks | risks: ...]
  Security:     [clean | concerns: ...]
  Blast radius: [N files, N systems]
```

---

## Decision Audit Trail

| # | Phase | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| 1 | Strategy | [decision] | M/T | P1-P6 | [why] |

---

## Final Gate: Taste Decisions

List all TASTE decisions collected during review. Present to user:

**If there is only ONE taste decision** — ask it as a single-choice question. The user's reply (A, B, or custom text for "Other") confirms immediately, no second submit needed.

**If there are MULTIPLE taste decisions** — present them all at once, ask the user to reply with their choice for each number (e.g. "1:A 2:B 3:Other:my idea"), then after the user replies confirm with: "Got it — proceeding with those choices." before acting.

```
TASTE DECISIONS FOR YOUR INPUT
═══════════════════════════════════════
These require your judgment. No objectively right answer.

1. [Decision description]
   Option A: [description] — Pro: ... Con: ...
   Option B: [description] — Pro: ... Con: ...
   Option C (Other): describe your own idea — ___________
   My suggestion: [A/B] because [reason]

2. [Decision description]
   ...

[If multiple decisions: Reply with "1:A 2:B ..." or "1:Other:my idea 2:A ..." — your batch reply is the confirmation.]
[If one decision: Reply A, B, or describe your own idea — your answer is the immediate confirmation.]
═══════════════════════════════════════
```

---

## Plan Review Report

```
PLAN REVIEW COMPLETE
════════════════════════════════════════
Phases completed:     [1, 2 (skipped), 3] or [1, 2, 3]
Issues found:         [N]
Decisions made:       [N mechanical, N taste]
Plan status:          APPROVED | APPROVED_WITH_NOTES | NEEDS_REVISION

Revisions required:
  - [revision 1]

Taste decisions surfaced:
  - [decision 1 awaiting user input]

Status: DONE | NEEDS_CONTEXT
════════════════════════════════════════
```

**REVIEW is the human gate** — after reporting DONE, present the review summary and wait for user confirmation (Y / N / revision notes) before advancing to BUILD. All other pipeline stages auto-advance on DONE; REVIEW is the only stage that requires explicit user approval.
