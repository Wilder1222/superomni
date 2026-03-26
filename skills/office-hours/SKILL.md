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
