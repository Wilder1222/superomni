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

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

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

```
TASTE DECISIONS FOR YOUR INPUT
═══════════════════════════════════════
These require your judgment. No objectively right answer.

1. [Decision description]
   Option A: [description] — Pro: ... Con: ...
   Option B: [description] — Pro: ... Con: ...
   My suggestion: [A/B] because [reason]

2. [Decision description]
   ...
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
