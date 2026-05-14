---
name: frontend-design
description: |
  Create distinctive, production-grade frontend interfaces with high design quality.
  Use when building UI components, pages, or applications.
  Guides from context gathering through implementation to quality gate.
  Triggers: "frontend design", "build UI", "design this page", "make it look good"
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob, WebFetch, Agent]
when_to_use: |
  Use when building UI, pages, or components. Guides context gathering → implementation → frontend-designer-agent quality gate at 7+/10. Triggers: "frontend design", "build UI", "design page".
produces: ~
consumes:
  - "docs/superomni/specs/spec-[branch]-[session]-[date].md"
dispatch-agent: frontend-designer
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

# Frontend Design

**Goal:** Build frontend interfaces that are functional, production-ready, AND visually distinctive. Avoid generic AI aesthetics — every design choice must be intentional.

## Iron Law: Never Ship UI Without the Quality Gate

No frontend code ships without running the frontend-designer agent quality gate. A passing score on all 10 dimensions (7+/10 each) is required. Two auto-retry attempts are allowed before escalating to the user.

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

### DESIGN.md Adaptation Layer (awesome-design-md compatible)

External site `DESIGN.md` files are treated as **brand style input**, not as implementation truth. Engineering and accessibility rules must still come from the core references.

Load order for brand-guided work:
1. Load `reference/design-md-adaptation.md` (mapping layer)
2. Load **one** brand file from `reference/design-md-whitelist.md`
3. Load **1-2** core reference files from the matrix above

Hard limits:
- Never load more than **one** brand `DESIGN.md` in a session
- Never replace quality gate dimensions with brand rules
- Keep total active references to 2-3 files

Governance and legal boundary:
- Borrow style system patterns, not proprietary identity assets
- Do **not** replicate logos, trademarks, unique illustrations, proprietary copy, or exact layout signatures
- Target: "same design language", never "1:1 visual clone"

Naming boundary:
- This project already has `docs/DESIGN.md` (architecture). Keep external style references under `skills/frontend-design/reference/` and distilled outputs under `docs/superomni/style-profiles/`.

### Phase 3.5: Style Distillation Output (for reuse and audit)

After implementing with one brand reference, distill reusable style guidance:
- Create/update `docs/superomni/style-profiles/design-md-<brand>.md`
- Create/update `docs/superomni/style-profiles/prompt-design-md-<brand>.md`
- Use `docs/superomni/style-profiles/design-md-distillation-template.md` as the schema
- If the template file is unavailable, fallback to sections in `reference/design-md-adaptation.md` and structure output into: `Metadata`, `Transferable Rules`, `Quality Gate Mapping`, `Anti-Copy Constraints`, `Prompt Fragment`; prioritize quality-gate/accessibility constraints over brand-style phrasing.

Distillation rule:
- Keep only transferable tokens/rules (typography scale, spacing rhythm, color roles, state behavior, motion principles)
- Remove brand-locked identity elements and copyrighted copy
- Keep the profile concise and implementation-oriented

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

Run the **frontend-designer agent** for a full design review. Quality gate must clear all 10 dimensions at ≥7/10 (3-attempt auto-retry, then escalate).

**Reference:** see [reference/quality-gate.md](${CLAUDE_SKILL_DIR}/reference/quality-gate.md) for full Gate Protocol (3-attempt retry policy + escalation message) and the canonical Quality Gate Output block.

---

## Steering Command

Single command `/front-design` invokes frontend-design with automatic mode detection (auto / audit / critique / polish / distill / clarify / animate / colorize / harden / arrange / typeset).

**Reference:** see [reference/reference-loading.md](${CLAUDE_SKILL_DIR}/reference/reference-loading.md) for: mode validation rules, brand-input single-brand rule, per-mode reference-loading order, fallback behavior, and the mandatory execution-receipt flags.

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

Execution Receipts:
  mode: [auto|audit|critique|polish|distill|clarify|animate|colorize|harden|arrange|typeset]
  brand: [name|none]
  loaded refs: [list]
  adaptation loaded: [yes|no]
  brand loaded: [yes|no]
  core refs loaded: [yes|no]
  quality gate authority kept: yes
  fallback: [none|core-references-only]
  gate result: PASS | RETRY | ESCALATE

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

### Command-Level Acceptance Checklist

- [ ] Valid mode executes normally
- [ ] Invalid mode returns fixed correction text
- [ ] Non-whitelist brand request is blocked with approval + vendor guidance
- [ ] Multi-brand request is blocked
- [ ] Missing adaptation/whitelist/brand files trigger core-references-only fallback
- [ ] After two auto-fix retries, failed gate escalates with options A/B/C

Report status using the completion protocol. After DONE, suggest next steps:
- "Run `/front-design mode:polish` for a final refinement pass"
- "Run `/front-design mode:audit` to verify accessibility compliance"
- "Ready for code review — the frontend-designer agent will run automatically for UI changes"