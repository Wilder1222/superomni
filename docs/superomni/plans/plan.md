# Implementation Plan: Frontend Design Skill & Agent Upgrade

**Session:** frontend-design-integration
**Date:** 2026-04-03
**Branch:** main

---

## Overview

Add a production-grade frontend design skill to superomni with 7 domain reference files (typography, color, spatial, motion, interaction, responsive, UX writing), 10 steering commands, and upgrade the existing designer agent with impeccable-level design knowledge. Integrate with the brainstorm → plan → execute pipeline.

## Prerequisites

- [x] Spec reviewed and approved
- [x] Reference sources identified (pbakaus/impeccable, anthropics/skills)
- [ ] Web access to fetch reference content from GitHub

## Steps

### Step 1: Create Skill Directory Structure

**What:** Set up the frontend-design skill directory with all required files
**Files:** 
- `skills/frontend-design/` (new directory)
- `skills/frontend-design/reference/` (new directory)

**How:**
1. `mkdir -p skills/frontend-design/reference`
2. Create placeholder files for validation

**Verification:** `ls skills/frontend-design/` shows SKILL.md.tmpl and reference/ directory
**Estimated effort:** S (<10min)

---

### Step 2: Write 7 Reference Files

**What:** Adapt content from impeccable's reference files into superomni format
**Files:**
- `skills/frontend-design/reference/typography.md`
- `skills/frontend-design/reference/color-and-contrast.md`
- `skills/frontend-design/reference/spatial-design.md`
- `skills/frontend-design/reference/motion-design.md`
- `skills/frontend-design/reference/interaction-design.md`
- `skills/frontend-design/reference/responsive-design.md`
- `skills/frontend-design/reference/ux-writing.md`

**How:**
1. Fetch content from `https://raw.githubusercontent.com/pbakaus/impeccable/main/source/skills/frontend-design/reference/*.md`
2. Add attribution header to each file:
   ```markdown
   <!-- 
   Adapted from pbakaus/impeccable
   Source: https://github.com/pbakaus/impeccable
   License: Apache 2.0
   -->
   ```
3. Format for readability (keep technical depth, remove marketing language)
4. Ensure each file is ~150-250 lines (context-efficient)

**Verification:** All 7 files exist, each has attribution header, total size ~1400-1750 lines
**Estimated effort:** M (1-2h)

---

### Step 3: Write SKILL.md.tmpl

**What:** Create the main skill template with 5 phases and {{PREAMBLE}} placeholder
**Files:** `skills/frontend-design/SKILL.md.tmpl`

**How:**
1. Add YAML frontmatter:
   ```yaml
   ---
   name: frontend-design
   description: |
     Create distinctive, production-grade frontend interfaces with high design quality.
     Use when building UI components, pages, or applications.
     Triggers: "frontend design", "build UI", "design this page", "make it look good"
   allowed-tools: [Bash, Read, Write, Edit, Grep, Glob, WebFetch, Agent]
   ---
   ```
2. Add `{{PREAMBLE}}` placeholder
3. Write 5 phases:
   - Phase 1: Context Gathering (audience, brand, constraints, aesthetic direction)
   - Phase 2: Design Direction (present 3 curated aesthetics + Other)
   - Phase 3: Reference Loading (keyword matching, max 2-3 files)
   - Phase 4: Implementation (build with guidance active)
   - Phase 5: Quality Gate (designer agent review, 2 auto-retries)
4. Document the 10 steering commands with usage
5. Add Iron Law: "Never ship UI without running the designer agent quality gate"
6. Add output format with status protocol

**Verification:** File exists, has {{PREAMBLE}}, follows existing skill patterns (compare with skills/brainstorm/SKILL.md.tmpl)
**Estimated effort:** M (1-2h)

---

### Step 4: Create 10 Command Files

**What:** Write command definition files for the 10 steering commands
**Files:**
- `commands/fd-audit.md`
- `commands/fd-critique.md`
- `commands/fd-polish.md`
- `commands/fd-distill.md`
- `commands/fd-clarify.md`
- `commands/fd-animate.md`
- `commands/fd-colorize.md`
- `commands/fd-harden.md`
- `commands/fd-arrange.md`
- `commands/fd-typeset.md`

**How:**
1. Use `commands/brainstorm.md` as template
2. Each file structure:
   ```markdown
   # /fd-[command]
   
   [1-sentence description]
   
   Use this command when you want to:
   - [use case 1]
   - [use case 2]
   
   ## How to Use
   /fd-[command]
   
   ## What Happens
   1. [step 1]
   2. [step 2]
   ```
3. Each command invokes the frontend-design skill with a specific phase/mode

**Verification:** All 10 files exist, follow command file pattern
**Estimated effort:** M (1h)

---

### Step 5: Register Commands in claude-skill.json

**What:** Add 10 command entries to the commands array
**Files:** `claude-skill.json`

**How:**
1. Read existing commands array (lines 13-23)
2. Append 10 new entries:
   ```json
   { "name": "fd-audit",     "file": "commands/fd-audit.md" },
   { "name": "fd-critique",  "file": "commands/fd-critique.md" },
   { "name": "fd-polish",    "file": "commands/fd-polish.md" },
   { "name": "fd-distill",   "file": "commands/fd-distill.md" },
   { "name": "fd-clarify",   "file": "commands/fd-clarify.md" },
   { "name": "fd-animate",   "file": "commands/fd-animate.md" },
   { "name": "fd-colorize",  "file": "commands/fd-colorize.md" },
   { "name": "fd-harden",    "file": "commands/fd-harden.md" },
   { "name": "fd-arrange",   "file": "commands/fd-arrange.md" },
   { "name": "fd-typeset",   "file": "commands/fd-typeset.md" }
   ```
3. Maintain alphabetical order within the array

**Verification:** `cat claude-skill.json | grep fd-` shows all 10 commands
**Estimated effort:** S (<15min)

---

### Step 6: Upgrade Designer Agent

**What:** Enhance agents/designer.md with 4 new dimensions and enhanced AI Slop detection
**Files:** `agents/designer.md`

**How:**
1. Read existing designer.md (77 lines)
2. In Phase 2 rating table, add 4 new dimensions after line 33:
   ```markdown
   | Typography      | / 10 | Distinctive font, modular scale, fluid type, proper line-height |
   | Color system    | / 10 | OKLCH-based, tinted neutrals, 60-30-10 ratio, dark mode |
   | Spatial rhythm  | / 10 | 4pt grid, varied spacing, squint test passes |
   | Motion quality  | / 10 | Purposeful easing, reduced-motion support, exit < entrance |
   ```
3. In Phase 3 AI Slop Detection (after line 45), add 7 new patterns:
   - Glassmorphism without purpose
   - Rounded rectangles with drop shadows everywhere
   - Gradient text as decoration
   - Neon accents on dark backgrounds
   - Hero metric layouts (big number + small label grid)
   - Default system fonts when distinctive choice would serve better
   - Cards nested in cards nested in cards
4. Add new Phase 4: Impeccable Check (after Phase 3, before "Edit the Plan")
   ```markdown
   ### Phase 4: Impeccable Check
   
   Run through the 7 reference domains as a checklist:
   - [ ] Typography: modular scale, distinctive fonts, line-height rhythm
   - [ ] Color: OKLCH, tinted neutrals, 60-30-10 ratio
   - [ ] Spatial: 4pt grid, varied spacing, squint test
   - [ ] Motion: purposeful easing, reduced-motion, exit < entrance
   - [ ] Interaction: 8 states, keyboard nav, focus indicators
   - [ ] Responsive: mobile-first, container queries, safe areas
   - [ ] UX Writing: specific labels, 3-part errors, empty states
   
   For each unchecked item, add to the issues list.
   ```
5. Update output format to show 10 dimensions (6 original + 4 new)

**Verification:** `grep -c "/ 10" agents/designer.md` returns 10 (was 6)
**Estimated effort:** M (30min)

---

### Step 7: Add Attribution File

**What:** Create LICENSE-NOTICE.md in the skill directory
**Files:** `skills/frontend-design/LICENSE-NOTICE.md`

**How:**
1. Write attribution file:
   ```markdown
   # Attribution
   
   This skill adapts content from the following sources:
   
   ## pbakaus/impeccable
   - Source: https://github.com/pbakaus/impeccable
   - License: Apache 2.0
   - Content: 7 reference files (typography, color, spatial, motion, interaction, responsive, ux-writing)
   - Author: Paul Bakaus
   
   ## anthropics/skills/frontend-design
   - Source: https://github.com/anthropics/skills/tree/main/skills/frontend-design
   - Content: Core skill philosophy and structure
   - Author: Anthropic
   
   All adapted content retains original licensing terms.
   ```

**Verification:** File exists in skills/frontend-design/
**Estimated effort:** S (<10min)

---

### Step 8: Generate SKILL.md from Template

**What:** Run gen-skill-docs.sh to expand {{PREAMBLE}} into SKILL.md
**Files:** `skills/frontend-design/SKILL.md` (generated)

**How:**
1. Run: `bash lib/gen-skill-docs.sh`
2. Verify preamble expansion

**Verification:** 
- `skills/frontend-design/SKILL.md` exists
- `grep "PROACTIVE Mode" skills/frontend-design/SKILL.md` returns match
- File size is ~300-400 lines (preamble ~119 + skill content ~200)

**Estimated effort:** S (<5min)

---

### Step 9: Validate Skill Structure

**What:** Run validation script to ensure skill follows conventions
**Files:** N/A (validation only)

**How:**
1. Run: `bash lib/validate-skills.sh`
2. Fix any errors reported
3. Run: `bin/skill-manager list | grep frontend-design`

**Verification:** 
- validate-skills.sh exits 0
- skill-manager list shows frontend-design

**Estimated effort:** S (<15min)

---

### Step 10: Pipeline Integration — Brainstorm

**What:** Add frontend-design auto-suggestion when UI work is detected
**Files:** `skills/brainstorm/SKILL.md.tmpl`

**How:**
1. In Phase 3 (Visual Companion), after line ~69, add:
   ```markdown
   **Frontend Design Integration:**
   If the spec involves UI components, pages, or visual design:
   - Suggest: "This involves UI work — recommend running `/frontend-design` after planning to ensure design quality."
   - Add to spec's "Next Steps" section
   ```
2. Regenerate: `bash lib/gen-skill-docs.sh`

**Verification:** `grep "frontend-design" skills/brainstorm/SKILL.md` returns match
**Estimated effort:** S (<15min)

---

### Step 11: Pipeline Integration — Writing Plans

**What:** Add design direction section requirement for UI plans
**Files:** `skills/writing-plans/SKILL.md.tmpl`

**How:**
1. In Phase 3 (Plan Structure), in the plan template (after line ~80), add new section:
   ```markdown
   ## Design Direction (if UI work)
   **Aesthetic:** [minimalist | maximalist | retro-futuristic | organic | other]
   **Key visual elements:** [distinctive fonts, color palette, spatial rhythm]
   **Reference files needed:** [typography, color, spatial, motion, interaction, responsive, ux-writing]
   ```
2. In Phase 2 (Completeness Check), add:
   ```markdown
   **For UI work, also include:**
   - [ ] Design direction defined
   - [ ] Acceptance criterion: "passes designer agent review at 7+/10 on all dimensions"
   ```
3. Regenerate: `bash lib/gen-skill-docs.sh`

**Verification:** `grep "Design Direction" skills/writing-plans/SKILL.md` returns match
**Estimated effort:** S (<15min)

---

### Step 12: Pipeline Integration — Code Review

**What:** Trigger designer agent for UI changes during review
**Files:** `skills/code-review/SKILL.md.tmpl`

**How:**
1. In Phase 2 (Review Execution), add conditional check (after line ~100):
   ```markdown
   **UI Change Detection:**
   If the diff includes files matching `*.html`, `*.jsx`, `*.tsx`, `*.vue`, `*.svelte`, or CSS files:
   - Run the designer agent review
   - Include designer scores in the review output
   - Block merge if any dimension < 7 without explicit override
   ```
2. Regenerate: `bash lib/gen-skill-docs.sh`

**Verification:** `grep "designer agent" skills/code-review/SKILL.md` returns match
**Estimated effort:** S (<15min)

---

### Step 13: Update CLAUDE.md

**What:** Add frontend-design to the skills table
**Files:** `CLAUDE.md`

**How:**
1. Find the skills table (around line 20-60)
2. Add new row in appropriate priority section (P1):
   ```markdown
   | frontend-design | "frontend design", "build UI", "design page" | P1 |
   ```
3. Maintain alphabetical order within priority group

**Verification:** `grep "frontend-design" CLAUDE.md` returns match
**Estimated effort:** S (<10min)

---

## Testing Strategy

### Unit Tests
- Validate YAML frontmatter in SKILL.md.tmpl
- Verify all 7 reference files have attribution headers
- Check all 10 commands registered in claude-skill.json

### Integration Tests
- Run `bash lib/gen-skill-docs.sh` — should succeed
- Run `bash lib/validate-skills.sh` — should pass
- Run `bin/skill-manager list` — should show frontend-design
- Invoke `/fd-audit` — should trigger skill with audit mode

### Manual Verification
- Read generated SKILL.md — preamble should be expanded
- Check designer.md — should have 10 dimensions (not 6)
- Test pipeline: run `/brainstorm` on a UI feature — should suggest frontend-design

---

## Rollback Plan

If issues arise:
1. `git checkout HEAD -- skills/frontend-design/` (remove skill)
2. `git checkout HEAD -- agents/designer.md` (restore original agent)
3. `git checkout HEAD -- claude-skill.json` (remove command registrations)
4. `git checkout HEAD -- commands/fd-*.md` (remove command files)
5. `bash lib/gen-skill-docs.sh` (regenerate without frontend-design)

---

## Dependencies

- Web access to fetch impeccable reference content from GitHub
- Existing superomni build tools: `lib/gen-skill-docs.sh`, `lib/validate-skills.sh`
- Existing designer agent at `agents/designer.md`

---

## Success Criteria

- [ ] All 17 acceptance criteria from spec are met
- [ ] `validate-skills.sh` passes
- [ ] `skill-manager list` discovers frontend-design
- [ ] Designer agent has 10 dimensions (6 original + 4 new)
- [ ] All 10 commands registered and functional
- [ ] Pipeline integration: brainstorm suggests frontend-design for UI work
- [ ] Pipeline integration: plans include design direction section
- [ ] Pipeline integration: code-review triggers designer agent for UI changes
- [ ] Attribution file exists with proper credits
- [ ] No regressions in existing skills (run full test suite)

---

## Estimated Total Effort

| Step | Effort | Time |
|------|--------|------|
| 1-5  | Setup + commands | 2-3h |
| 6-7  | Agent upgrade + attribution | 45min |
| 8-9  | Build + validate | 20min |
| 10-13 | Pipeline integration | 1h |
| **Total** | | **4-5h** |

---

## Notes

- Reference files are adapted, not copied verbatim — maintain technical depth, remove marketing
- Quality gate auto-retry (2x) aligns with "bias toward action" principle
- Command namespace (`fd-*`) prevents collision with future skills
- On-demand loading (max 2-3 references) manages context window efficiently
