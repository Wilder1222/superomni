<!-- Reference templates for skills/self-improvement/SKILL.md.
     Loaded on demand when authoring an improvement report. -->

# Self-Improvement — Reporting Templates

This file contains the verbatim Markdown templates used by the self-improvement skill.
Open this file when you need the exact section structure to fill in. The skill body
(`SKILL.md`) tells you when each template is needed.

---

## Phase 0 — Tacit Gap Output Template

If any tacit gaps are found in mining, generate `docs/superomni/improvements/tacit-gaps-[date].md`:

```markdown
# Tacit Knowledge Gaps — [date]

| Scenario | Agent Behavior | User Expected Behavior | Proposed Rule |
|----------|---------------|----------------------|---------------|
| [context] | [what Agent did] | [what user wanted] | [candidate rule to add] |

## Recommendations
- If a gap maps to a style preference: update docs/superomni/style-profiles/
- If a gap maps to a process rule: propose new Iron Law or Gate Check
- If a gap maps to domain knowledge: flag as permanent TACIT-DENSE category
```

If no gaps found, note: "No tacit gaps detected in available history — continue to Phase 1."

---

## Phase 3 — Agent Behavior Scoring Rubrics

Three 1-5 scale dimensions; record score + evidence for each.

### Scope Management (1-5 scale)
- **5**: Stayed strictly within task scope; zero unasked-for changes
- **3**: Minor out-of-scope suggestions flagged, deferred
- **1**: Significant scope creep; made changes beyond what was asked

**Score: __ / 5** — Evidence: ___

### Instruction Following (1-5 scale)
- **5**: Followed every protocol exactly; no skipped phases
- **3**: Mostly followed protocols; minor deviations with justification
- **1**: Skipped phases or ignored Iron Laws without explanation

**Score: __ / 5** — Evidence: ___

### Escalation Behavior (1-5 scale)
- **5**: Escalated correctly when hitting 3-strike limit; never guessed past uncertainty
- **3**: Escalated once but only after extra attempts
- **1**: Kept guessing past 3 failures; never escalated

**Score: __ / 5** — Evidence: ___

**Agent Performance Score: __ / 15**

---

## Phase 6 — Improvement Action Template

Each of the 3 concrete improvement actions follows this format:

```
ACTION [N]: [TITLE]
Priority:   P0 — blocks process quality / P1 — degrades output quality / P2 — nice to have
Problem:  [what went wrong or what was missing]
Root cause: [which of the 3 root causes — process drift / evidence gap / scope creep]
Fix:      [specific, actionable change to process or behavior]
Verify:   [how to confirm this improvement was applied in the next session]
```

Worked example:

```
ACTION 1: WRITE SPEC BEFORE IMPLEMENTATION
Priority:   P0 — blocks process quality
Problem:  Started coding directly from the issue title without a spec
Root cause: Process drift — skipped THINK stage under time pressure
Fix:      Before any implementation task, spend 5 minutes writing docs/superomni/specs/spec-[branch]-[session]-[date].md with problem, goals, non-goals, acceptance criteria
Verify:   Next session starts with `ls docs/superomni/specs/spec-*.md` — must exist before first code change
```

---

## Phase 7 — Full Improvement Report Template

Save the **full** evaluation report to `$REPORT_FILE` using the following structure. All scores and tables from Phases 1–6 must be included — not just the action items:

```markdown
# Improvement Report: [branch]

**Date:** [date]
**Branch:** [branch]
**Task description:** [what was worked on this session]

## Tacit Gaps (Phase 0)

| Scenario | Agent Behavior | User Expected | Proposed Rule |
|----------|---------------|--------------|---------------|
| [from Phase 0 output, or "None detected"] | | | |

Tacit gaps file: [path or "not generated"]

## Session Evidence (Phase 1)

- Skills invoked: [list]
- Artifacts produced: [list of files in .superomni/ and project root]
- Tests outcome: [pass/fail counts]
- Evaluation report referenced: [path or "none"]

## Process Adherence (Phase 2)

| Question | Answer | Evidence |
|----------|--------|----------|
| THINK→PLAN→REVIEW→BUILD→VERIFY→RELEASE followed | YES/PARTIAL/NO | |
| Spec/plan created before implementation | YES/PARTIAL/NO | |
| Skills used for intended triggers | YES/PARTIAL/NO | |
| Session ended with status report | YES/PARTIAL/NO | |

**Iron Law compliance:** [N/5 laws followed]

## Agent Evaluation (Phase 3)

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Scope management | [N]/5 | |
| Instruction following | [N]/5 | |
| Escalation behavior | [N]/5 | |

**Agent total: [N]/15**

## Skill Effectiveness (Phase 4)

| Skill | Right skill? | Phases done | Output quality | Score |
|-------|-------------|-------------|---------------|-------|
| [skill-1] | YES/NO | 100%/80%/<50% | clear/partial/missing | [N]/5 |

**Skills avg: [N]/5**

## Gap Analysis (Phase 5)

| Deviation | Root cause | Principle violated |
|-----------|-----------|-------------------|
| [deviation] | [root cause] | [principle] |

## Action Items (Phase 6)

### ACTION 1: [TITLE]
Priority: P0/P1/P2
Problem: ...
Root cause: ...
Fix: ...
Verify: ...

### ACTION 2: [TITLE]
Priority: P0/P1/P2
Problem: ...
Root cause: ...
Fix: ...
Verify: ...

### ACTION 3: [TITLE]
Priority: P0/P1/P2
Problem: ...
Root cause: ...
Fix: ...
Verify: ...
```

---

## Final SELF-IMPROVEMENT REPORT Block

End every self-improvement run with this block (printed to the user / log):

```
SELF-IMPROVEMENT REPORT
════════════════════════════════════════
Session:            [branch / date / task description]
Tacit gaps found:   [N gaps | none]
Process adherence:  [N/N checks passed]
Agent score:        [N/15] (scope: N/5 | instructions: N/5 | escalation: N/5)
Skills evaluated:   [N skills] — avg [N]/5
Top gap:            [single most important finding]
Action 1:           [title]
Action 2:           [title]
Action 3:           [title]
Report saved:       [docs/superomni/improvements/...]
Status: DONE | DONE_WITH_CONCERNS
════════════════════════════════════════
```
