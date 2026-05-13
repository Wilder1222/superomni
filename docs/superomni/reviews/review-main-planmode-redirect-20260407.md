# Code Review: EnterPlanMode Prohibition → Redirect

**Date:** 2026-04-07
**Reviewer:** superomni code-review skill
**Branch:** main (unstaged changes)

```
CODE REVIEW
════════════════════════════════════════
PR/Branch: main (EnterPlanMode redirect refactor)
Files changed: 32
Blast radius: MEDIUM

P0 ISSUES (must fix before merge):
  (none)

P1 ISSUES (should fix):
  1. [vibe/SKILL.md.tmpl] — Had stale "CRITICAL: Do NOT use EnterPlanMode" text (FIXED during review)
  2. [vibe/SKILL.md:290] — Had stale "Do NOT use Claude Code's built-in EnterPlanMode" (FIXED during review)
  3. Version not bumped yet — 5 files still say 0.5.2
  4. CHANGELOG.md missing 0.5.3 entry
  5. README.md — no content changes needed (no EnterPlanMode references found)

P2 SUGGESTIONS (optional improvement):
  1. The 27 skill preambles still reference `EnterPlanMode` by name in the redirect text.
     This is intentional (intercepting the impulse), but worth noting that the word
     "EnterPlanMode" appears 31 times across the codebase — all in redirect context now.

SECURITY: CLEAN
  No security implications.

TESTS: N/A
  Skill framework — no automated test suite for prompt engineering changes.

AFFECTED FILES SUMMARY:
  - CLAUDE.md — 1 line changed (prohibition → redirect)
  - skills/using-skills/SKILL.md — Core change: flow graph + EXTREMELY-IMPORTANT tag
  - skills/vibe/SKILL.md + .tmpl — Planning Route section + Phase 4 text
  - 27 x skills/*/SKILL.md — Preamble: "CRITICAL: No EnterPlanMode" → "Planning Route"
  - hooks/hooks.json — PreToolUse entries removed (restored to SessionStart only)
  - hooks/block-plan-mode — DELETED
  - .claude/settings.json — DELETED

VERSION BUMP NEEDED (0.5.2 → 0.5.3):
  - package.json
  - claude-skill.json
  - .claude-plugin/plugin.json
  - .claude-plugin/marketplace.json (×2 version fields)
  - docs/DESIGN.md

DECISION QUESTIONS:
  (none — all changes are mechanical)

VERDICT: APPROVED_WITH_NOTES
Strategy change from prohibition to redirect is sound. Inspired by
obra/superpowers' proven approach. P1 issues (version, changelog)
should be applied before commit.
════════════════════════════════════════
```
