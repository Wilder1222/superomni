---
name: office-hours
description: |
  Product discovery and idea validation (startup/builder modes). Outputs a design-doc for product decisions, NOT a sprint spec. Triggers: "office hours", "validate my idea", "help me think through a product".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
when_to_use: |
  Use for product-market validation, narrow-wedge discovery, side-project design thinking. NOT for sprint-pipeline features — use brainstorm for those.
produces: "docs/superomni/specs/spec-[branch]-[session]-[date].md"
consumes: ~
---


<!-- Inlined into every SKILL.md via {{PREAMBLE_CORE}}. Keep ≤30 lines. -->

## Preamble (Core)

**Status protocol** — end every session with one of: `DONE` (evidence provided) · `DONE_WITH_CONCERNS` (list each) · `BLOCKED` (state what blocks you) · `NEEDS_CONTEXT` (state what you need).

**Auto-advance** — pipeline: `THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE`. Only human gate is spec approval at THINK. On `DONE` at other stages, print `[STAGE] DONE -> advancing to [NEXT-STAGE]` and invoke the next skill. On any non-DONE status at any stage, STOP.

**Output directory** — all artifacts go in `docs/superomni/<kind>/<kind>-[branch]-[session]-[date].md`. See `CLAUDE.md` for the full directory map.

**TACIT-DENSE** — before high-tacit decisions, classify D1 (domain expertise) · D2 (user-facing UX) · D3 (team culture) · D4 (novel pattern). On hit, output `TACIT-DENSE [D#]: [question] — My default: [recommendation]`. See reference for actions.

**Anti-sycophancy** — take a position on every significant question. Name flaws directly. No filler ("that's interesting", "you might consider", "that could work").

**Telemetry (local only)** — at session end, log `bin/analytics-log`. Nothing leaves the machine.

_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._

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
