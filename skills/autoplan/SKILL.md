---
name: autoplan
description: |
  Auto-review pipeline: runs CEO strategy review, design review (if UI), and
  engineering review sequentially. Auto-resolves mechanical decisions using
  6 decision principles. Surfaces only taste decisions at a final gate.
  One command, fully reviewed plan out.
  Triggers: "autoplan", "auto review", "review this plan automatically",
  "run all reviews", "make the decisions for me".
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

### Session Continuity
After reporting any terminal status (DONE / DONE_WITH_CONCERNS), **always** close with a
"What's next?" line that names the next logical superomni skill:

```
What's next → [skill-name]: [one-sentence reason]
```

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls spec.md plan.md .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
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

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

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

# /autoplan — Automated Plan Review Pipeline

**Goal:** One command. Rough plan in, fully reviewed plan out. Auto-decides mechanical questions using the 6 Decision Principles. Surfaces only taste decisions for human approval.

## Iron Law: Never Skip the Final Gate

Auto-decisions are provisional. The final approval gate is mandatory — all taste decisions must surface and the human must approve before execution begins.

## The 6 Decision Principles (Auto-Resolve Reference)

1. **Choose completeness** → Auto-choose the more complete option
2. **Boil lakes** → Auto-include adjacent cleanup if <1 day effort
3. **Pragmatic** → Auto-pick the cleaner of two equal options
4. **DRY** → Auto-reject if it duplicates existing functionality
5. **Explicit over clever** → Auto-choose the readable option
6. **Bias toward action** → Auto-resolve ambiguity toward shipping

**Decision types:**
- **Mechanical** (one right answer) → Auto-decide silently, log the decision
- **Taste** (reasonable disagreement) → Collect, surface at final gate only

---

## Phase 1: Find the Plan

```bash
# Look for plan documents
ls plan.md PLAN.md plan/*.md docs/plan.md 2>/dev/null || echo "No plan file found"
git diff --name-only HEAD~1 2>/dev/null | grep -i plan || true
```

If no plan file exists, ask the user to describe the plan or point to the file.

---

## Phase 2: Strategy Review (CEO Lens)

Apply the CEO lens to the plan. For each question below:
- If the answer is clear → Auto-decide using principles, log the decision
- If it's a judgment call → Record as a taste decision for the gate

Questions:
1. **Premise validity** — are key assumptions stated? Auto-flag any implicit ones.
2. **Scope calibration** — right-sized? Apply Principle 1 (completeness) and 2 (lakes).
3. **Alternatives** — was the chosen approach selected, not just defaulted? Apply Principle 3.
4. **DRY check** — apply Principle 4. If reinventing something, auto-flag.
5. **Top 3 risks** — identify and classify each as P0/P1/P2.
6. **Success definition** — is there a measurable definition of done?

```
AUTO-DECISION LOG (Strategy)
  [P1] completeness: included error handling phase — Principle 1
  [P1] scope: added cleanup task for dead code — Principle 2 (lake, <1 day)
  [TASTE] approach: REST vs GraphQL — flagging for gate
```

---

## Phase 3: Design Review (Conditional)

**Only if the plan includes UI or user-facing changes.**

Check each item. Auto-decide using principles where clear.

- [ ] Information hierarchy — most important thing most prominent?
- [ ] Missing states — loading, empty, error, degraded?
- [ ] Responsive strategy — works at different screen sizes?
- [ ] Accessibility — keyboard nav, color contrast?
- [ ] Error recovery — can users recover from mistakes?

```
AUTO-DECISION LOG (Design)
  [P1] missing states: added loading/error states to plan — Principle 1
  [TASTE] visual style: minimal vs rich — flagging for gate
```

---

## Phase 4: Engineering Review

Apply engineering rigor:

1. **Data model** — is the data model correct? Any missing entities or relationships?
2. **Test coverage** — is there a test plan? Apply Principle 1 (full coverage).
3. **Error paths** — are failure modes covered? Apply Principle 1.
4. **Sequence** — is the implementation order optimal? Dependencies respected?
5. **Security** — any auth, injection, or data exposure risks?
6. **Performance** — any O(n²) or blocking operations?

```
AUTO-DECISION LOG (Engineering)
  [P1] tests: added test phase to plan — Principle 1
  [P1] error handling: added error path for API failures — Principle 1
  [TASTE] architecture: monolith vs service split — flagging for gate
```

---

## Phase 5: Final Approval Gate

Summarize all taste decisions collected across all phases. Present them as a single list:

```
TASTE DECISIONS — YOUR CALL
════════════════════════════════════════
[1] API design: REST vs GraphQL
    RECOMMENDATION: REST — simpler, less overhead for this scale (Principle 5)

[2] Architecture: monolith vs service split
    RECOMMENDATION: Monolith — YAGNI for current scope (Principle 3)

[3] Visual style: minimal vs rich UI
    RECOMMENDATION: Minimal — ships faster, iterate after user feedback

────────────────────────────────────────
Auto-resolved [N] mechanical decisions (see log above)
Taste decisions needing your input: [N]

Reply with one option — your choice is immediate confirmation, no second submit needed:
  A) Approve all recommendations above
  B) Review each decision individually
  C) Reject and revise the plan
  D) Other — describe your own approach: ___________
════════════════════════════════════════
```

**Confirmation rule:** This is a single-choice question. The moment the user types A, B, C, or D (with custom text for D), treat that as confirmed and act immediately — do NOT ask "Are you sure?" or prompt again.

If approved → write the final reviewed `plan.md` with all auto-decisions incorporated.
If reviewing individually → present each taste decision as its own single-choice (pick A or B, or type your own idea); each answer confirms that decision immediately before moving to the next.

---

## Output Format

```
AUTOPLAN COMPLETE
════════════════════════════════════════
Phases:      Strategy | Design (if UI) | Engineering
Auto-decided: [N] mechanical decisions
Taste decisions: [N] (all resolved at gate)
Plan:        plan.md (updated)

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```
