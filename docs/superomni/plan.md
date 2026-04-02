# Implementation Plan: Create `/vibe` Entry Point Skill

## Overview

The superomni framework lacks a unified entry point skill. `/vibe` is defined in `CLAUDE.md` as a command but has no corresponding `skills/vibe/SKILL.md`. This plan creates the vibe skill as an orchestration entry point for the full 8-stage sprint pipeline (THINK -> PLAN -> BUILD -> REVIEW -> TEST -> PROD-CHECK -> SHIP -> REFLECT).

## Prerequisites

- [x] Audit of all 30 existing skills completed (2026-04-02)
- [x] All referenced support docs confirmed to exist in their respective skill directories
- [x] `skills/writing-skills/SKILL.md` reviewed for skill creation standards

## Steps

### Step 1: Create `skills/vibe/SKILL.md`
**What:** Create the vibe skill file following the standard skill template format (YAML frontmatter + preamble + phases).
**Files:** `skills/vibe/SKILL.md` (new)
**How:**
  1. Add YAML frontmatter with name, description, type, triggers
  2. Include the standard preamble (identical to all other skills)
  3. Define the vibe skill protocol with these capabilities:
     - `/vibe` — activate framework, detect current pipeline stage via artifact scanning, display guided menu
     - `/vibe status` — show which stage the project is at based on existing artifacts
     - `/vibe reset` — clear superomni artifacts and restart from THINK
  4. Implement stage detection logic:
     - No artifacts → THINK stage → suggest `brainstorm`
     - `docs/superomni/spec.md` exists → PLAN stage → suggest `writing-plans`
     - `docs/superomni/plan.md` exists with open items → BUILD stage → suggest `executing-plans`
     - `docs/superomni/plan.md` all checked → REVIEW stage → suggest `code-review`
     - Review approved → TEST stage → suggest `qa` / `verification`
     - Tests green → PROD-CHECK → suggest `production-readiness`
     - Readiness confirmed → SHIP → suggest `ship`
     - Shipped → REFLECT → suggest `retro`
  5. Display welcome banner with current stage indicator and full command reference
  6. End with status protocol (DONE + What's next)
**Verification:** 
  - File exists at `skills/vibe/SKILL.md`
  - Contains valid YAML frontmatter
  - Includes standard preamble
  - All 8 pipeline stages have detection logic
  - `/vibe`, `/vibe status`, `/vibe reset` behaviors defined
**Estimated effort:** M (<2h)

### Step 2: Update `CLAUDE.md` commands table
**What:** Ensure the `/vibe` entry in `CLAUDE.md` Commands table is consistent with the new skill's capabilities (add `status` and `reset` subcommands).
**Files:** `CLAUDE.md` (modify)
**How:**
  1. Update the `/vibe` row to include subcommands description
  2. Verify the Skills Available table already has the correct trigger for vibe (it doesn't — vibe is not in the table, only in Commands)
  3. Add vibe to the Skills Available table with trigger: "/vibe", "activate framework", Priority: P0
**Verification:**
  - `CLAUDE.md` contains vibe in both Commands and Skills tables
  - Descriptions match the skill file
**Estimated effort:** S (<30min)

### Step 3: Register vibe in `skills/using-skills/SKILL.md` Quick Reference
**What:** Add `/vibe` to the using-skills Quick Reference table so the meta-skill knows about it.
**Files:** `skills/using-skills/SKILL.md` (modify)
**How:**
  1. Add entry: `| Framework activation / entry point | vibe |` to the Quick Reference table
**Verification:**
  - `vibe` appears in the Quick Reference table
**Estimated effort:** S (<30min)

### Step 4: Register vibe in `skills/workflow/SKILL.md`
**What:** Add vibe as the entry point in the workflow documentation.
**Files:** `skills/workflow/SKILL.md` (modify)
**How:**
  1. Add a note in Stage 0 / entry section that `vibe` is the unified entry point
  2. Reference vibe in the "Picking Up Mid-Sprint" section as the recommended starting command
**Verification:**
  - `workflow/SKILL.md` references vibe as the entry point
**Estimated effort:** S (<30min)

## Testing Strategy

- **Manual verification:** Run `/vibe` in a fresh conversation and confirm:
  - Welcome banner displays correctly
  - Stage detection works with no artifacts (should suggest brainstorm)
  - Stage detection works with spec.md present (should suggest writing-plans)
  - `/vibe status` displays current pipeline position
- **Cross-reference check:** Verify all skill names referenced in vibe exist in `skills/`

## Rollback Plan

Delete `skills/vibe/SKILL.md` and revert changes to `CLAUDE.md`, `using-skills/SKILL.md`, and `workflow/SKILL.md` via `git checkout -- <files>`.

## Dependencies

- None (all 30 existing skills are already functional)

## Success Criteria

- [x] `skills/vibe/SKILL.md` exists and follows standard skill template
- [x] `/vibe` detects current pipeline stage from artifacts
- [x] `/vibe status` shows pipeline position
- [x] `/vibe reset` documents how to restart
- [x] `CLAUDE.md`, `using-skills`, and `workflow` all reference vibe consistently
- [x] No existing skill behavior is broken
