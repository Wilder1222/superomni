---
name: frontend-design
description: |
  Create distinctive, production-grade frontend interfaces with high design quality.
  Use when building UI components, pages, or applications.
  Guides from context gathering through implementation to quality gate.
  Triggers: "frontend design", "build UI", "design this page", "make it look good"
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob, WebFetch, Agent]
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

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT) auto-advance on DONE.

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


# Frontend Design

**Goal:** Build frontend interfaces that are functional, production-ready, AND visually distinctive. Avoid generic AI aesthetics — every design choice must be intentional.

## Iron Law: Never Ship UI Without the Quality Gate

No frontend code ships without running the designer agent quality gate. A passing score on all 10 dimensions (7+/10 each) is required. Two auto-retry attempts are allowed before escalating to the user.

## The Core Problem

Every LLM learned from the same generic templates. Without guidance, you get:
- Inter font, purple gradients, cards nested in cards
- Gray text on colored backgrounds, glassmorphism everywhere
- Rounded rectangles with drop shadows (the "SaaS dashboard" look)
- Hero metric layouts, neon accents, gradient text as decoration

**The quality test:** If someone saw this interface and said "AI made this," would they believe it immediately? If yes — that's the problem.

---

## Phase 1: Context Gathering (mandatory)

**You cannot infer design context from code alone.** Ask the user ONE question at a time:

Required understanding before proceeding:
- [ ] **Target audience** — who uses this? (technical vs non-technical, expert vs beginner)
- [ ] **Brand personality** — what feeling should this evoke? (serious, playful, minimal, bold)
- [ ] **Use context** — how will it be used? (quick glance vs deep focus, desktop vs mobile, high stress vs relaxed)
- [ ] **Existing design system** — are there brand colors, fonts, or components to reuse?
- [ ] **Constraints** — browser support, performance budgets, accessibility requirements

Check for project design config:
```bash
ls .impeccable.md .design-config.md 2>/dev/null
```

If a config file exists, load it and skip questions it already answers.

---

## Phase 2: Design Direction

Commit to a bold aesthetic direction. Present 3 curated options + Other:

```
Design Direction Options:

A) Minimalist Precision — Swiss-inspired, generous whitespace, one accent color,
   strong typography hierarchy. Think: Linear, Stripe, Vercel.
   Pro: Timeless, professional. Con: Can feel cold.

B) Warm Organic — Rounded shapes, earth tones or pastels, hand-drawn accents,
   friendly micro-interactions. Think: Notion, Loom, Figma.
   Pro: Approachable, memorable. Con: Harder to maintain consistency.

C) Bold Maximalist — High contrast, dramatic typography, intentional color blocking,
   confident whitespace. Think: Bloomberg, Pentagram, Readymag.
   Pro: Distinctive, authoritative. Con: Polarizing.

D) Other — describe your own aesthetic direction: ___________
```

**Key principle:** Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

---

## Phase 3: Reference Loading

Load relevant reference files on-demand based on the current task. **Maximum 2-3 at a time** to manage context.

### Reference Selection Matrix

| Task involves... | Load these references |
|-------------------|---------------------|
| Text layout, fonts, headings | `reference/typography.md` |
| Colors, palette, dark mode | `reference/color-and-contrast.md` |
| Layout, spacing, grid | `reference/spatial-design.md` |
| Animations, transitions | `reference/motion-design.md` |
| Forms, buttons, states | `reference/interaction-design.md` |
| Mobile, responsive, breakpoints | `reference/responsive-design.md` |
| Labels, errors, microcopy | `reference/ux-writing.md` |

```bash
# Load references on-demand
cat skills/frontend-design/reference/typography.md  # only when needed
```

If the user requests a reference not yet loaded, load it. If context pressure is high, summarize the current reference into 5 key rules and unload the raw content.

---

## Phase 4: Implementation

Build with the loaded reference guidance active. Every implementation must:

1. **Match code complexity to aesthetic vision** — a minimalist design needs clean, simple code; a maximalist design may need more CSS
2. **Use modern CSS** — prefer oklch(), clamp(), container queries, :focus-visible, prefer-reduced-motion
3. **Design all states** — default, hover, focus, active, disabled, loading, error, success
4. **Apply the reference rules** — don't just read them, apply them to every decision
5. **Test the squint test** — blur your eyes: can you still see the hierarchy?

### Implementation Checklist

- [ ] Typography: distinctive font, modular scale, max-width: 65ch, proper line-height
- [ ] Color: OKLCH palette, tinted neutrals, 60-30-10 ratio, no pure gray/black
- [ ] Spacing: 4pt grid, varied rhythm, no equal-spacing-everywhere
- [ ] Motion: purposeful easing, reduced-motion support, exit < entrance
- [ ] States: all 8 interactive states designed
- [ ] Responsive: mobile-first, container queries where appropriate
- [ ] Accessibility: WCAG AA contrast, keyboard nav, focus indicators, screen reader support
- [ ] Copy: specific labels, 3-part error messages, helpful empty states

---

## Phase 5: Quality Gate

Run the **designer agent** for a full design review.

### Gate Protocol

1. Invoke the designer agent with the implementation
2. Receive scores on all 10 dimensions
3. **If all dimensions >= 7/10:** PASS — proceed to completion
4. **If any dimension < 7/10 (attempt 1):**
   - Read the designer's feedback for the failing dimensions
   - Load the relevant reference file(s) for guidance
   - Apply specific fixes
   - Re-run the designer agent
5. **If still < 7/10 (attempt 2):**
   - Apply different approach to failing dimensions
   - Re-run the designer agent
6. **If still < 7/10 (attempt 3):**
   - STOP — escalate to user
   - Present: "Design quality gate failed on [dimensions] after 2 auto-fix attempts. Scores: [list]. Options: A) Continue with current quality, B) Provide design guidance, C) Skip quality gate"

### Quality Gate Output

```
FRONTEND DESIGN — QUALITY GATE
════════════════════════════════════════
Attempt: [1/2/3]
Direction: [chosen aesthetic]

Dimension Scores:
  Information hierarchy:  [N]/10
  Missing states:         [N]/10
  Responsive strategy:    [N]/10
  Accessibility:          [N]/10
  Error recovery:         [N]/10
  AI Slop detection:      [N]/10
  Typography:             [N]/10
  Color system:           [N]/10
  Spatial rhythm:         [N]/10
  Motion quality:         [N]/10
  ─────────────────────────────────
  Overall:               [N]/10

Gate result: PASS | RETRY | ESCALATE
════════════════════════════════════════
```

---

## Steering Commands

These commands invoke specific modes of the frontend-design skill:

| Command | Mode | What it does |
|---------|------|-------------|
| `/fd-audit` | Audit | Accessibility + performance check (WCAG, contrast, keyboard, perf) |
| `/fd-critique` | Critique | UX review for clarity, hierarchy, and user flow |
| `/fd-polish` | Polish | Final refinement pass across all 7 design dimensions |
| `/fd-distill` | Distill | Reduce complexity — remove visual noise, simplify |
| `/fd-clarify` | Clarify | Improve UX copy — labels, errors, empty states |
| `/fd-animate` | Animate | Add purposeful motion with proper easing and reduced-motion |
| `/fd-colorize` | Colorize | Introduce/improve color system — OKLCH, tinted neutrals, dark mode |
| `/fd-harden` | Harden | Production hardening — error boundaries, i18n, RTL, fallbacks |
| `/fd-arrange` | Arrange | Fix layout and spacing — 4pt grid, whitespace rhythm |
| `/fd-typeset` | Typeset | Fix typography — modular scale, font choice, line-height |

### Steering Command Protocol

When invoked via a steering command:
1. Skip Phases 1-2 (assume context already established)
2. Load the relevant reference file(s) for the command mode
3. Analyze the current implementation through the command's lens
4. Apply fixes
5. Run the quality gate on affected dimensions only

---

## Output Format

```
FRONTEND DESIGN
════════════════════════════════════════
Session:     [session-name]
Direction:   [chosen aesthetic]
References:  [loaded reference files]

Implementation:
  Files created/modified: [list]
  States designed: [N]/8
  Responsive: [yes/no]
  Accessibility: [WCAG level]

Quality Gate:
  Attempts: [N]
  Result: PASS | ESCALATED
  Overall score: [N]/10

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

Report status using the completion protocol. After DONE, suggest next steps:
- "Run `/fd-polish` for a final refinement pass"
- "Run `/fd-audit` to verify accessibility compliance"
- "Ready for code review — the designer agent will run automatically for UI changes"
