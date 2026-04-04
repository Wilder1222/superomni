# Frontend Design Skill & Agent Upgrade — Spec

**Session:** frontend-design-integration
**Date:** 2026-04-03
**Status:** REVIEWED

---

## Problem

superomni has a Designer agent focused on UX review (rating dimensions, detecting AI slop) but lacks a **frontend implementation skill** — structured guidance for actually *building* distinctive, production-grade interfaces. Without this, AI-generated frontends fall into generic patterns: Inter font, purple gradients, cards-in-cards, gray-on-color text.

Two excellent external references exist:
- **Anthropic's `frontend-design` skill** — core philosophy of intentional aesthetic direction
- **pbakaus/impeccable** — 7 domain reference files + 20 steering commands

Neither is integrated into superomni's pipeline or conventions.

## Goals

- Add a `skills/frontend-design/` skill with 7 domain reference files, following superomni conventions
- Upgrade `agents/designer.md` with impeccable-level design knowledge
- Integrate with the brainstorm → plan → execute pipeline (not standalone)
- Include steering commands adapted as superomni sub-commands

## Non-Goals (YAGNI)

- Not building a separate visual design tool or Figma integration
- Not adding all 20 impeccable commands — curate to the most valuable 10
- Not changing the existing pipeline stages
- Not supporting non-web platforms (native mobile, desktop apps)
- Not using impeccable as an external dependency — content is adapted and integrated natively

## Proposed Solution

### 1. New Skill: `skills/frontend-design/`

**Structure:**
```
skills/frontend-design/
├── SKILL.md              # Main skill (generated from .tmpl)
├── SKILL.md.tmpl         # Template with {{PREAMBLE}} placeholder
└── reference/
    ├── typography.md
    ├── color-and-contrast.md
    ├── spatial-design.md
    ├── motion-design.md
    ├── interaction-design.md
    ├── responsive-design.md
    └── ux-writing.md
```

**Command registration (required for steering commands):**
```
commands/
├── fd-audit.md
├── fd-critique.md
├── fd-polish.md
├── fd-distill.md
├── fd-clarify.md
├── fd-animate.md
├── fd-colorize.md
├── fd-harden.md
├── fd-arrange.md
└── fd-typeset.md
```

Each command file registered in `claude-skill.json` under `commands[]`.

**SKILL.md phases:**
1. **Context Gathering** — Audience, brand personality, constraints, aesthetic direction (mandatory before any coding)
2. **Design Direction** — Commit to a bold aesthetic. Present 3 curated directions + "Other"
3. **Reference Loading** — Load relevant reference files on-demand based on the task (not all at once — context window management). Loading strategy: skill reads the task description and loads max 2-3 reference files that match. User can request additional references explicitly.
4. **Implementation** — Build with the reference guidance active. Code must be functional AND visually distinctive
5. **Quality Gate** — Run the designer agent for review. If any dimension scores < 7: auto-suggest fixes based on reference files, apply, and re-run review. Max 2 auto-retries; escalate to user on 3rd failure.

**Steering commands (curated 10 from impeccable's 20):**

| Command | Purpose | When to use |
|---------|---------|-------------|
| `/fd-audit` | Accessibility + performance check | Before shipping any UI |
| `/fd-critique` | UX review for clarity and hierarchy | After initial implementation |
| `/fd-polish` | Pre-deployment refinement | Final pass before ship |
| `/fd-distill` | Reduce complexity | When UI feels overloaded |
| `/fd-clarify` | UX copy improvement | When labels/messages are vague |
| `/fd-animate` | Add purposeful motion | When interactions feel flat |
| `/fd-colorize` | Strategic color introduction | When palette feels generic |
| `/fd-harden` | Error handling + i18n | When hardening for production |
| `/fd-arrange` | Layout and spacing fixes | When spatial rhythm is off |
| `/fd-typeset` | Font and hierarchy fixes | When text hierarchy is unclear |

### 2. Upgraded Agent: `agents/designer.md`

Enhance the existing designer agent with:

**New dimensions added to the 0-10 rating:**

| Dimension | What 10 looks like |
|-----------|-------------------|
| Typography | Distinctive font choice, modular scale, fluid type, proper line-height |
| Color system | OKLCH-based, tinted neutrals, 60-30-10 ratio, dark mode considered |
| Spatial rhythm | 4pt grid, varied spacing, visual hierarchy passes squint test |
| Motion quality | Purposeful easing, reduced-motion support, exit < entrance duration |

**Enhanced AI Slop detection** (add to existing list):
- Glassmorphism without purpose
- Rounded rectangles with drop shadows everywhere
- Gradient text as decoration
- Neon accents on dark backgrounds
- Hero metric layouts (big number + small label grid)
- Default system fonts when a distinctive choice would serve better
- Cards nested in cards nested in cards

**New Phase: Impeccable Check** — After dimension rating, run through the 7 reference domains as a checklist.

### 3. Pipeline Integration

**THINK stage (brainstorm):**
- When the brainstorm identifies a UI component/page, auto-suggest frontend-design skill
- Visual Companion phase (Phase 3) references frontend-design for aesthetic direction

**PLAN stage (writing-plans):**
- Plans for UI work include design direction as a required section
- Acceptance criteria auto-include: "passes designer agent review at 7+/10 on all dimensions"

**BUILD stage (executing-plans):**
- Frontend-design skill activates automatically for UI implementation steps
- Reference files loaded on-demand as relevant to current step

**REVIEW stage (code-review):**
- Designer agent runs as part of review for any PR with UI changes
- New dimensions are included in the review output

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| 10 commands vs 20 | 10 curated | Removed overlap, kept highest-value commands | YAGNI + Pragmatic |
| Upgrade designer vs new agent | Upgrade existing | Avoids duplication, designer already has UX review foundation | DRY |
| Reference files on-demand | Load per-task, not all at once | 7 files × ~200 lines = 1400 lines of context if loaded together | Explicit over clever |
| OKLCH over HSL | OKLCH in color reference | Perceptually uniform, modern CSS standard | Choose completeness |
| Prefix commands with `fd-` | Namespace to avoid collision | Other skills may have `/audit`, `/polish` etc. | Explicit over clever |
| Auto-retry quality gate | 2 retries max, escalate on 3rd | Bias toward action — auto-fix before bothering user | Bias toward action |
| Command registration | `commands/*.md` + `claude-skill.json` | Required by superomni architecture for command discovery | Completeness |

## Attribution

Reference content adapted from:
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable) — Apache 2.0 License
- [anthropics/skills/frontend-design](https://github.com/anthropics/skills) — original frontend-design skill

Attribution noted in each reference file header and in a `LICENSE-NOTICE.md` in the skill directory.

## Acceptance Criteria

- [ ] `skills/frontend-design/SKILL.md` exists with 5 phases following superomni conventions
- [ ] `skills/frontend-design/SKILL.md.tmpl` exists with `{{PREAMBLE}}` placeholder
- [ ] 7 reference files exist in `skills/frontend-design/reference/`
- [ ] `agents/designer.md` upgraded with 4 new dimensions + enhanced AI Slop list
- [ ] 10 steering commands: `commands/fd-*.md` files created
- [ ] 10 commands registered in `claude-skill.json`
- [ ] Skill triggers on: "frontend design", "build UI", "design this page", "make it look good"
- [ ] Pipeline integration: brainstorm auto-suggests for UI work
- [ ] Pipeline integration: plans for UI include design direction section
- [ ] Pipeline integration: designer agent runs during review for UI PRs
- [ ] Reference files loaded on-demand (max 2-3 per task, not all 7)
- [ ] Quality gate: auto-retry up to 2 times when scores < 7, escalate on 3rd
- [ ] `CLAUDE.md` updated with frontend-design skill entry in skills table
- [ ] Attribution: `LICENSE-NOTICE.md` in skill directory credits impeccable + anthropics
- [ ] `gen-skill-docs.sh` successfully expands preamble
- [ ] `validate-skills.sh` passes for the new skill
- [ ] `skill-manager list` discovers the new skill

## Open Questions

- Should `.impeccable.md` project config file be supported for per-project design preferences (brand colors, font choices)? → Deferred to v2
