<!--
Adaptation guide for integrating external DESIGN.md style references.
Primary external corpus: VoltAgent/awesome-design-md (MIT)
Source: https://github.com/VoltAgent/awesome-design-md
-->

# DESIGN.md Adaptation Guide

This file defines how external website-style `DESIGN.md` documents map into superomni's `frontend-design` workflow.

## Positioning

- External `DESIGN.md` = **brand style input**
- Existing reference files = **engineering and accessibility constraints**
- Existing 10-dimension quality gate = **final authority**

Never replace the quality gate with brand-specific rules.

## Section Mapping (Stitch format -> superomni references)

| External DESIGN.md section | Primary superomni reference(s) |
|---|---|
| 1) Visual Theme & Atmosphere | `spatial-design.md`, `typography.md`, `ux-writing.md` |
| 2) Color Palette & Roles | `color-and-contrast.md` |
| 3) Typography Rules | `typography.md` |
| 4) Component Stylings | `interaction-design.md` |
| 5) Layout Principles | `spatial-design.md`, `responsive-design.md` |
| 6) Depth & Elevation | `spatial-design.md`, `motion-design.md` |
| 7) Do's and Don'ts | `ux-writing.md`, `interaction-design.md` |
| 8) Responsive Behavior | `responsive-design.md` |
| 9) Agent Prompt Guide | distilled to `docs/superomni/style-profiles/` prompt files |

## Quality Gate Mapping (brand input -> 10 dimensions)

| Quality gate dimension | Brand input usage rule |
|---|---|
| Information hierarchy | Use theme density and heading contrast; validate with squint test |
| Missing states | Brand style cannot reduce required state coverage |
| Responsive strategy | Keep brand layout intent but enforce mobile-first and breakpoints |
| Accessibility | Enforce WCAG and keyboard/focus regardless of brand aesthetics |
| Error recovery | Brand tone may shape wording, but must keep actionable recovery |
| AI Slop detection | Reject generic clichés even if present in brand source |
| Typography | Reuse hierarchy logic; avoid exact proprietary lockups |
| Color system | Rebuild roles using OKLCH/tinted neutrals instead of direct copy |
| Spatial rhythm | Transfer spacing rhythm, not exact pixel-for-pixel layout signatures |
| Motion quality | Transfer interaction intent, enforce reduced-motion support |

## Loading Protocol

1. Load this adaptation guide first.
2. Select exactly one brand from `design-md-whitelist.md`.
3. Load only 1-2 core reference files required by the task.
4. If context pressure rises, summarize brand rules into 5 transferable constraints and unload raw brand text.

## Anti-Copy Guardrails

Do not reproduce:
- Logos, trademarks, wordmarks
- Proprietary illustrations, icon sets, or mascot styles
- Brand-specific marketing copy and slogans
- Pixel-identical page composition

Acceptable:
- Transferable structure (hierarchy, spacing cadence, role-based color usage, interaction patterns)

