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
