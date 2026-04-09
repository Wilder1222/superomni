---
name: document-release
description: |
  Post-ship documentation update. Cross-references the diff, updates README,
  ARCHITECTURE, CONTRIBUTING, CLAUDE.md to match what shipped. Polishes
  CHANGELOG voice, cleans up TODOs, optionally bumps VERSION.
  Triggers: "update docs", "sync documentation", "post-ship docs",
  "update the readme", "document what shipped".
  Proactively suggest after a PR is merged or code is shipped.
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


# /document-release — Post-Ship Documentation Update

**Goal:** After shipping, ensure all documentation matches what was actually built. Catch stale READMEs, outdated architecture docs, and missing CHANGELOG entries.

## Iron Law: Never Mark Docs Done Without Diff Cross-Reference

Always read the actual diff before updating docs. Docs written from memory drift from reality.

## Phase 1: Gather What Shipped

```bash
# What changed since last release/tag
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~20")..HEAD 2>/dev/null | head -30
git diff $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~20")..HEAD --stat 2>/dev/null | tail -20

# Or last N commits
git log --oneline -20
```

Build a mental model of what actually shipped:
- New features added
- APIs changed (added, removed, modified)
- Configuration changes
- Dependencies added/removed
- Breaking changes

## Phase 2: Audit Existing Docs

Find all documentation files:
```bash
find . -name "README.md" -o -name "CHANGELOG.md" -o -name "ARCHITECTURE.md" \
       -o -name "CONTRIBUTING.md" -o -name "CLAUDE.md" -o -name "AGENTS.md" \
       -o -name "docs/*.md" 2>/dev/null | grep -v node_modules | grep -v .git
```

For each doc, check:
- [ ] Does it reflect what shipped?
- [ ] Are installation instructions current?
- [ ] Are API examples accurate?
- [ ] Are feature lists complete?
- [ ] Are any sections obviously stale?

## Phase 3: Update README

Check the README for:
1. **Feature list** — add new features, remove removed ones
2. **Installation** — verify all install commands still work
3. **Usage examples** — update for any API changes
4. **Configuration** — new config options documented?
5. **Quick start** — still accurate end-to-end?

Edit directly: do not add "Updated on [date]" noise.

## Phase 4: Update CHANGELOG

If a CHANGELOG exists, add an entry for the current version:

```markdown
## [VERSION] — YYYY-MM-DD

### Added
- [Feature] — [one-line description]

### Changed
- [What changed] — [why]

### Fixed
- [Bug fixed] — [impact]

### Removed
- [What was removed] — [migration path if breaking]
```

Voice guidelines:
- Past tense ("Added X", not "Adds X")
- Lead with the user value, not the technical change
- Breaking changes get their own callout: `⚠️ BREAKING:`

## Phase 5: Update Architecture/Design Docs

If ARCHITECTURE.md, DESIGN.md, or docs/ exist:
1. Update component/module descriptions for anything that changed
2. Update data flow diagrams if data flows changed
3. Flag sections that are now stale but need more research to update

## Phase 6: Clean Up TODOs

```bash
# Find all TODOs in docs
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.md" . | grep -v node_modules | grep -v .git
```

For each TODO:
- If the thing was shipped → remove the TODO
- If still valid → leave it
- If no longer relevant → remove it

## Phase 7: VERSION Bump (Optional)

Ask the user if they want to bump the version:

```bash
# Check current version
cat package.json 2>/dev/null | grep '"version"' | head -1
cat VERSION 2>/dev/null
```

If yes, bump according to what shipped:
- New features, backward compatible → MINOR
- Bug fixes only → PATCH
- Breaking changes → MAJOR

## Output Format

```
DOCUMENT RELEASE COMPLETE
════════════════════════════════════════
Files updated:   [N]
  ✓ README.md       [summary of changes]
  ✓ CHANGELOG.md    [entry added for vX.Y.Z]
  ✓ [other files]
TODOs cleared:   [N]
VERSION:         [old] → [new] (or: unchanged)

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```
