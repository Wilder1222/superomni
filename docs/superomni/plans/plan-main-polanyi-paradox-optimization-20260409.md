# Implementation Plan: superomni Polanyi Paradox Optimization

## Overview

Systematically deepen superomni's tacit knowledge handling across 3 waves (v0.6.0, v0.7.0, v0.8.0), covering 6 optimization directions: Iron Law example blocks, TACIT-DENSE routing, style-capture Skill, TACIT 5-dimensional probe, PROACTIVE 5-level trust matrix, and execution pattern mining. All changes are Markdown/shell-only — no new runtime dependencies.

## Spec Reference

`docs/superomni/specs/spec-main-polanyi-paradox-optimization-20260409.md`

## Prerequisites

- [ ] Current `bash lib/validate-skills.sh` passes (baseline green)
- [ ] `lib/gen-skill-docs.sh` runs successfully
- [ ] Understand existing Iron Law format in 3 target skills (already read in spec phase)

---

## WAVE 1 (v0.6.0) — Low-cost, High-value Mechanism Deepening

### Step 1: Add Iron Law Example Block to systematic-debugging

**What:** Add standardized good/bad example blocks and "common excuse rebuttals" table under the existing Iron Law section.
**Files:** `skills/systematic-debugging/SKILL.md.tmpl`
**How:**
  1. Locate the Iron Law section (line ~17: `**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**`)
  2. Insert after the explanatory paragraph (before `## Phase 1`):
     ```markdown
     ### Good Execution Example
     ```
     User reports: Button click has no response
     Agent:
       1. Check event listener bindings -> confirmed bound correctly
       2. Check if handler function is called -> found it is NOT called
       3. Check for event propagation blockers -> found parent element has e.stopPropagation()
       4. Root cause identified: parent stopPropagation() prevents click from reaching button
       5. Fix: remove incorrect stopPropagation() call
     ```

     ### Bad Execution Example (AVOID)
     ```
     User reports: Button click has no response
     Agent:
       Guesses it might be CSS pointer-events: none
       -> Adds pointer-events: auto
       -> Still broken
       -> Guesses it might be z-index
       -> Adjusts z-index
       -> Still broken
       [VIOLATED: Started fixing without root cause investigation]
     ```

     ### Common Excuse Rebuttals
     | Excuse | Rebuttal |
     |--------|----------|
     | "The problem is obvious, root cause is X" | "Obvious" is not evidence — spend 2 minutes verifying |
     | "Similar bug was fixed this way before" | Similar is not identical — verify root cause before applying fix |
     | "User described the cause already" | User describes symptoms, not causes — investigate anyway |
     ```
  3. Preserve all existing content below unchanged
**Verification:** `grep -c "Good Execution Example" skills/systematic-debugging/SKILL.md.tmpl` returns 1
**Estimated effort:** S

### Step 2: Add Iron Law Example Blocks to test-driven-development

**What:** Add example blocks for each of the 3 Iron Laws (Test First, Delete Untested Code, Red Before Green).
**Files:** `skills/test-driven-development/SKILL.md.tmpl`
**How:**
  1. After `### Iron Law 1: Test First` explanation paragraph, insert:
     ```markdown
     #### Good Example (Test First)
     ```
     Need: calculateTotal() for empty cart returns 0
     Agent:
       1. Write test: assert Cart().calculate_total() == 0
       2. Run test -> RED (Cart class doesn't exist yet)
       3. Implement Cart with calculate_total()
       4. Run test -> GREEN
     ```

     #### Bad Example (AVOID)
     ```
     Need: calculateTotal() for empty cart returns 0
     Agent:
       1. Write Cart class with calculate_total() method
       2. Then write test that calls it
       3. Test passes immediately
       [VIOLATED: Code written before test — test was never RED]
     ```
     ```
  2. After `### Iron Law 2: Delete Untested Code` explanation, insert:
     ```markdown
     #### Good Example (Delete Untested Code)
     ```
     Accidentally wrote validateEmail() before its test.
     Agent:
       1. Recognize violation — code exists without a preceding test
       2. Delete validateEmail() implementation
       3. Write failing test: assert validate_email("bad") == False
       4. Run test -> RED (function doesn't exist)
       5. Rewrite validateEmail() to pass test
       6. Run test -> GREEN
     ```

     #### Bad Example (AVOID)
     ```
     Wrote validateEmail() before its test.
     Agent:
       1. Write test after the fact
       2. Test passes immediately
       3. Move on
       [VIOLATED: Code was never deleted and rewritten — test was never RED]
     ```
     ```
  3. After `### Iron Law 3: Red Before Green` explanation, insert:
     ```markdown
     #### Good Example (Red Before Green)
     ```
     Agent:
       1. Write test for new parseCurrency("$1,234.56") -> 1234.56
       2. Run test -> RED: "parseCurrency is not defined"
       3. Confirm: failing for the RIGHT reason (function missing, not test broken)
       4. Implement parseCurrency
       5. Run test -> GREEN
     ```

     #### Bad Example (AVOID)
     ```
     Agent:
       1. Write test for existing utility function
       2. Run test -> GREEN immediately
       3. Assume test is correct and move on
       [VIOLATED: Test was never red — it may be testing the wrong thing or behavior already exists]
     ```
     ```
**Verification:** `grep -c "Good Example" skills/test-driven-development/SKILL.md.tmpl` returns 3
**Estimated effort:** S

### Step 3: Add Iron Law Example Block to verification

**What:** Add example block for "Evidence Required" Iron Law.
**Files:** `skills/verification/SKILL.md.tmpl`
**How:**
  1. After the Iron Law paragraph (line ~18: `Evidence is: running the code and showing output...`), insert:
     ```markdown
     ### Good Example (Evidence Required)
     ```
     Agent claims feature is complete.
     Evidence provided:
       1. npm test output: "15 tests, 15 passing, 0 failing"
       2. Manual verification: curl -X POST /api/users -> 201 Created
       3. Edge case tested: curl -X POST /api/users (empty body) -> 400 Bad Request
       4. Screenshot: UI renders correctly with new component
     Result: DONE — all evidence is observable and reproducible
     ```

     ### Bad Example (AVOID)
     ```
     Agent claims feature is complete.
     Evidence provided:
       "I believe the implementation is correct based on the logic"
       "It should work because I followed the pattern from the other module"
     Result: NOT ACCEPTABLE — "believe" and "should" are not evidence
     [VIOLATED: No test output, no command results, no observable behavior shown]
     ```

     ### Common Excuse Rebuttals
     | Excuse | Rebuttal |
     |--------|----------|
     | "The logic is straightforward, it must work" | Straightforward logic still needs proof — run the test |
     | "I followed the same pattern as module X" | Pattern match is not verification — show the output |
     | "Tests aren't set up for this area" | Then set them up — untestable claims cannot be verified |
     ```
**Verification:** `grep -c "Good Example" skills/verification/SKILL.md.tmpl` returns 1
**Estimated effort:** S

### Step 4: Add TACIT-DENSE Detection Protocol to preamble

**What:** Add a new section to `lib/preamble.md` that defines 4 categories of high-tacit-knowledge-density decisions and their routing behavior.
**Files:** `lib/preamble.md`
**How:**
  1. Insert new section after the `### Performance Checkpoint` section and before `### Telemetry`:
     ```markdown
     ### TACIT-DENSE Detection (Tacit Knowledge Density Check)

     Before executing substantive decisions, check if any falls into these high-tacit-density categories.
     These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
     has enough tacit knowledge to judge correctly.

     **D1 - Domain Expertise Decision**
       Trigger: Requires judgment in a specialized domain (security, compliance, legal, medical, financial)
       Examples: choosing encryption algorithm, deciding data retention policy, HIPAA compliance choice
       Action: State "TACIT-DENSE [D1]", present options with trade-offs, wait for user selection

     **D2 - User-Facing Experience Decision**
       Trigger: Substantive choices about UI copy, interaction flow, error messaging, onboarding
       Examples: writing onboarding guidance text, choosing error message tone, designing empty states
       Action: Provide draft with explicit markers on parts needing user review

     **D3 - Team Culture & Convention Decision**
       Trigger: Major choices about team workflow, naming conventions, documentation style, file organization
       Examples: naming convention for new module, choosing between monorepo approaches, doc format
       Action: Check docs/superomni/style-profiles/ first; if no profile, ask user

     **D4 - Novel Pattern Decision**
       Trigger: Task type has fewer than 3 precedents in project execution history
       Examples: first-time integration of a new framework, first use of a new deployment target
       Action: Reduce autonomy — add intermediate checkpoints, present approach before executing

     **Output format when TACIT-DENSE detected:**
     ```
     TACIT-DENSE [D1/D2/D3/D4]: This is a [category] decision requiring your judgment.
     Question: [single most important question]
     My default recommendation: [recommendation + rationale]
     Please confirm or share your preference.
     ```

     **Relationship with careful skill:** careful handles "can we undo this?" (operational risk).
     TACIT-DENSE handles "can we judge this correctly?" (knowledge risk). They are complementary.
     ```
  2. Ensure indentation matches existing preamble sections
**Verification:** `grep -c "TACIT-DENSE" lib/preamble.md` returns at least 3
**Estimated effort:** S

### Step 5: Add Iron Law Example Block Check to Validator

**What:** Add an optional validation rule that warns when a skill has an Iron Law section but no example blocks.
**Files:** `lib/validate-skills.sh`
**How:**
  1. After the Phase structure check (rule #7, around line 90), add rule #9:
     ```bash
     # 9. Iron Law example blocks (recommended for core skills)
     if grep -q '## Iron Law' "$tmpl"; then
       if ! grep -qE '### .*(Good|Bad|Correct|Incorrect|Compliant|Violat|Example)' "$tmpl"; then
         warn "$rel_tmpl: Iron Law present but no example blocks found (recommended: add good/bad examples)"
       else
         pass "Iron Law example blocks present"
       fi
     fi
     ```
  2. Place this BEFORE the SKILL.md build check (rule #8)
**Verification:** `bash lib/validate-skills.sh skills/systematic-debugging/SKILL.md.tmpl 2>&1 | grep -c "example blocks"` returns 1
**Estimated effort:** S

### Step 6: Regenerate All SKILL.md Files

**What:** Run the generation script to expand `{{PREAMBLE}}` with the updated preamble (now containing TACIT-DENSE) into all SKILL.md files.
**Files:** All `skills/*/SKILL.md` (generated output)
**How:**
  1. Run: `bash lib/gen-skill-docs.sh`
  2. Verify: `bash lib/validate-skills.sh` passes with 0 errors
  3. Spot-check: `grep "TACIT-DENSE" skills/systematic-debugging/SKILL.md` confirms preamble expanded
**Verification:** `bash lib/validate-skills.sh` exits 0; `grep -l "TACIT-DENSE" skills/*/SKILL.md | wc -l` equals total template count
**Estimated effort:** S

### Step 7: Update CLAUDE.md for Wave 1

**What:** No new skills/commands to register in Wave 1. But add a note about TACIT-DENSE in the Notes for Claude section.
**Files:** `CLAUDE.md`
**How:**
  1. In the "Notes for Claude" section, add:
     ```
     - **TACIT-DENSE decisions:** Before executing substantive decisions, check preamble's TACIT-DENSE protocol (D1-D4). Flag high-tacit-density judgments to the user.
     ```
**Verification:** `grep "TACIT-DENSE" CLAUDE.md` returns 1 line
**Estimated effort:** S

---

## WAVE 2 (v0.7.0) — Active Tacit Knowledge Collection

### Step 8: Create style-capture Skill Template

**What:** Create a new `skills/style-capture/SKILL.md.tmpl` with 4 phases: Sample Collection, Feature Extraction, Style Profile Output, Injection Verification.
**Files:** `skills/style-capture/SKILL.md.tmpl` (new)
**How:**
  1. Create directory: `mkdir -p skills/style-capture`
  2. Write `SKILL.md.tmpl` with standard structure:
     - Frontmatter: name, description, triggers (`"/style-capture"`, `"capture style"`, `"show me your preferences"`), allowed-tools
     - `{{PREAMBLE}}`
     - Iron Law: `LEARN FROM EXAMPLES, NOT JUST RULES`
     - Phase 1: Sample Collection
       - Prompt user for 3-5 "good" code/doc examples + 1-2 "bad" examples
       - Key instruction: "Don't ask 'what's your style' — ask 'show me something you're satisfied with'"
       - Support: file paths, pasted code, URLs to repos
     - Phase 2: Feature Extraction
       - Analyze across 6 dimensions: naming style, comment density/placement, function length/modularization, error handling style, abstraction level preference, documentation style
       - Compare good vs bad examples for each dimension
       - Mark dimensions where signal is insufficient as "Unknown"
     - Phase 3: Style Profile Output
       - Generate `docs/superomni/style-profiles/<scope>.md` (scope = project/frontend/api/docs)
       - Structure: Confirmed Preferences, Reference Examples (with citations), Unknown / Ask Before Assuming
     - Phase 4: Injection Verification
       - Distill profile into prompt fragment at `docs/superomni/style-profiles/prompt-<scope>.md`
       - Verify downstream skill integration: brainstorm references it, executing-plans references it, code-review uses it as criteria
     - Status report template
  3. Ensure `{{PREAMBLE}}` is on line after frontmatter closing `---`
**Verification:** `bash lib/validate-skills.sh skills/style-capture/SKILL.md.tmpl` passes with 0 errors
**Estimated effort:** M

### Step 9: Create style-capture Slash Command

**What:** Create the `/style-capture` command file.
**Files:** `commands/style-capture.md` (new)
**How:**
  1. Follow the pattern from `commands/brainstorm.md`
  2. Content:
     ```markdown
     # /style-capture

     Trigger the **style-capture** skill.

     Use this command when you want to:
     - Teach the agent your code style preferences through examples
     - Create a style profile for consistent code generation
     - Update style preferences based on new reference examples

     ## How to Use

     ```
     /style-capture [scope]
     ```

     Examples:
     - `/style-capture` — capture project-wide style
     - `/style-capture frontend` — capture frontend-specific style
     - `/style-capture api` — capture API-specific style

     ## What Happens

     1. Agent asks for 3-5 examples of code you consider "good"
     2. Optionally asks for 1-2 "bad" examples for contrast
     3. Analyzes examples across 6 style dimensions
     4. Generates `docs/superomni/style-profiles/<scope>.md`
     5. Creates prompt fragment for downstream skill reference

     ## Output

     - `docs/superomni/style-profiles/<scope>.md` — full style profile
     - `docs/superomni/style-profiles/prompt-<scope>.md` — distilled prompt fragment

     ## Skill Reference

     See `skills/style-capture/SKILL.md` for the full protocol.
     ```
**Verification:** File exists and follows command template pattern
**Estimated effort:** S

### Step 10: Create style-profiles Directory

**What:** Create the output directory for style profiles.
**Files:** `docs/superomni/style-profiles/.gitkeep` (new)
**How:**
  1. `mkdir -p docs/superomni/style-profiles`
  2. `touch docs/superomni/style-profiles/.gitkeep`
**Verification:** Directory exists
**Estimated effort:** S

### Step 11: Add TACIT Five-Dimensional Probe to brainstorm

**What:** Enhance brainstorm Phase 1 with a systematic probe for 5 tacit knowledge dimensions, plus a gate check requiring 3+ dimensions answered.
**Files:** `skills/brainstorm/SKILL.md.tmpl`
**How:**
  1. Locate Phase 1 section (line ~25: `## Phase 1: Problem Crystallization`)
  2. After the existing "Required understanding" checklist and before the "Rule: Ask one question..." line, insert:
     ```markdown
     ### TACIT Five-Dimensional Probe

     After initial understanding is established, systematically probe these 5 tacit knowledge dimensions.
     Each dimension requires exactly ONE targeted question:

     **T - Team & Culture**
       -> "Does your team have any preferences or taboos regarding [key technical choice in this task]?"
       Purpose: Capture implicit team conventions and consensus

     **A - Aesthetic & Style**
       -> "Is there existing code or a system you consider 'feels right' as a reference?"
       Purpose: Capture code style, architecture taste, implicit quality standards
       Note: If docs/superomni/style-profiles/ exists, reference it instead of asking

     **C - Constraints Unstated**
       -> "What absolutely must NOT be touched or changed this time?"
       Purpose: Capture hidden boundaries, forbidden zones, political constraints

     **I - Integration Expectations**
       -> "After this feature is complete, what will the user do first?"
       Purpose: Capture implicit acceptance scenarios and success experience

     **T - Time & Quality Trade-offs**
       -> "If you had to cut one feature to ship on time, which would you cut first?"
       Purpose: Capture implicit priority weights and non-negotiables

     **TACIT Probe Gate:**
     Before proceeding to Phase 2, verify:
     - [ ] At least 3 of 5 TACIT dimensions received an explicit answer
     - [ ] If any answer revealed new constraints, problem definition has been updated
     - FAIL -> continue clarification, do NOT enter Phase 2
     ```
  3. Update the "Required understanding" checklist to add TACIT dimensions:
     ```markdown
     - [ ] TACIT probe: at least 3 of 5 dimensions answered
     ```
**Verification:** `grep -c "TACIT" skills/brainstorm/SKILL.md.tmpl` returns at least 5
**Estimated effort:** M

### Step 12: Upgrade PROACTIVE to 5-Level Trust Matrix

**What:** Modify `bin/config` to support dotted key notation and update `lib/preamble.md` with tacit knowledge intensity classification.
**Files:** `bin/config`, `lib/preamble.md`
**How:**

**Part A — bin/config:**
  1. The existing `bin/config` already supports arbitrary `key=value` pairs with dotted notation (e.g., `proactive.mechanical=true`) because it uses simple `grep "^${KEY}="` matching. No code change needed for storage — dotted keys work as-is.
  2. Add backward compatibility logic: when `bin/config get proactive` is called AND `proactive.mechanical` keys exist, print a summary. When only `proactive=true` exists, behavior unchanged.
  3. Add a helper comment block documenting the 5-level keys:
     ```bash
     # PROACTIVE 5-Level Trust Matrix:
     #   proactive.mechanical=true    — Iron Laws, deterministic gates -> auto
     #   proactive.structural=true    — Architecture, interfaces -> auto
     #   proactive.stylistic=ask      — Naming, formatting, UI choices -> ask user
     #   proactive.strategic=ask      — Approach selection, trade-offs -> ask user
     #   proactive.destructive=false  — Delete, overwrite, irreversible -> always confirm
     #
     # Legacy: proactive=true means all=true except destructive=false
     # Legacy: proactive=false means all=false
     ```

**Part B — lib/preamble.md:**
  1. Replace the existing `### PROACTIVE Mode` section with an expanded version:
     ```markdown
     ### PROACTIVE Mode

     Check proactive configuration:
     ```bash
     _PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
     ```

     **Legacy mode (single value):**
     If `proactive=true`: auto-invoke skills. If `proactive=false`: ask first.

     **5-Level Trust Matrix (when configured):**

     Before executing any decision, classify its tacit knowledge intensity:

     | Decision Type | Config Key | Default | When to Use |
     |--------------|------------|---------|-------------|
     | Mechanical | proactive.mechanical | true | Iron Law applies, Gate Check is deterministic |
     | Structural | proactive.structural | true | Architecture, interface, module boundaries |
     | Stylistic | proactive.stylistic | ask | Naming, formatting, UI layout, comment style |
     | Strategic | proactive.strategic | ask | Approach selection, architecture trade-offs |
     | Destructive | proactive.destructive | false | Delete, overwrite, irreversible operations |

     Classification rules:
     - If a style profile exists (docs/superomni/style-profiles/), stylistic decisions
       that match the profile can be treated as mechanical
     - Strategic decisions ALWAYS surface to user unless proactive.strategic=true
     - Destructive decisions ALWAYS confirm (integrates with careful Skill) regardless of config
     ```
  2. Ensure the existing `_PROACTIVE` environment detection still works
**Verification:** `bin/config set proactive.stylistic ask && bin/config get proactive.stylistic` returns "ask"; `grep "5-Level Trust Matrix" lib/preamble.md` returns 1 line
**Estimated effort:** M

### Step 13: Update CLAUDE.md for Wave 2

**What:** Register style-capture Skill and PROACTIVE 5-level in CLAUDE.md.
**Files:** `CLAUDE.md`
**How:**
  1. Add to Skills Available table:
     ```
     | style-capture | "/style-capture", project init | P1 |
     ```
  2. Add to Commands table:
     ```
     | `/style-capture` | Capture code style preferences from examples |
     ```
  3. Update Configuration section to mention 5-level PROACTIVE:
     ```
     Run `bin/config set proactive.stylistic ask` to configure per-decision-type autonomy.
     ```
**Verification:** `grep "style-capture" CLAUDE.md` returns at least 2 lines
**Estimated effort:** S

### Step 14: Regenerate All SKILL.md Files (Wave 2)

**What:** Regenerate all SKILL.md files to pick up preamble changes (5-Level Trust Matrix).
**Files:** All `skills/*/SKILL.md` (generated)
**How:**
  1. Run: `bash lib/gen-skill-docs.sh`
  2. Verify: `bash lib/validate-skills.sh` passes with 0 errors
  3. Spot-check: `grep "5-Level Trust Matrix" skills/brainstorm/SKILL.md` returns 1 match
**Verification:** `bash lib/validate-skills.sh` exits 0
**Estimated effort:** S

---

## WAVE 3 (v0.8.0) — Passive Tacit Knowledge Mining

### Step 15: Add Phase 0 (Pattern Mining) to self-improvement

**What:** Insert a new Phase 0 before the existing Phase 1 in self-improvement Skill that mines execution history for tacit knowledge gaps.
**Files:** `skills/self-improvement/SKILL.md.tmpl`
**How:**
  1. Locate existing `## Phase 1: Gather Session Evidence` (around line 35)
  2. Insert BEFORE it (making current phases renumber as 1-7 -> 1 becomes 2, etc.):
     ```markdown
     ## Phase 0: Tacit Gap Mining

     Before evaluating the current session, mine execution history for tacit knowledge gaps.

     ### Signal Sources
     ```bash
     # 1. Recurring review comments (3+ occurrences = uncodified standard)
     echo "=== Review comment patterns ==="
     for review in docs/superomni/reviews/review-*.md; do
       [ -f "$review" ] && grep -h "^- " "$review" 2>/dev/null
     done | sort | uniq -c | sort -rn | head -10

     # 2. Execution deviation records (manual overrides = unmatched preferences)
     echo "=== Execution deviations ==="
     for exec in docs/superomni/executions/execution-*.md; do
       [ -f "$exec" ] && grep -h -A1 "CONCERN\|DEVIATION\|override\|manual" "$exec" 2>/dev/null
     done | head -10

     # 3. Skill override frequency
     echo "=== Skill overrides ==="
     grep "override\|rejected\|skipped" ~/.omni-skills/analytics/usage.jsonl 2>/dev/null | tail -5
     ```

     ### Mining Questions
     Answer each with evidence from the sources above:
     - [ ] In the last 5 executions, which Agent suggestions were rejected by the user?
     - [ ] In code reviews, which comment types appeared 3+ times?
     - [ ] In which scenarios did the user manually modify Agent output?

     ### Analysis Logic
     - User rejects Agent suggestion = Agent lacks a tacit preference at this point
     - Recurring review comment = Standard not yet captured by an Iron Law
     - Manual output modification = Style mismatch between Agent and user

     ### Tacit Gap Output
     If any gaps are found, generate `docs/superomni/improvements/tacit-gaps-[date].md`:

     ```markdown
     # Tacit Knowledge Gaps — [date]

     | Scenario | Agent Behavior | User Expected Behavior | Proposed Rule |
     |----------|---------------|----------------------|---------------|
     | [context] | [what Agent did] | [what user wanted] | [candidate rule to add] |

     ## Recommendations
     - If a gap maps to a style preference: update docs/superomni/style-profiles/
     - If a gap maps to a process rule: propose new Iron Law or Gate Check
     - If a gap maps to domain knowledge: flag as permanent TACIT-DENSE category
     ```

     If no gaps found, note: "No tacit gaps detected in available history — continue to Phase 1."
     ```
  3. Renumber existing phases: Phase 1 -> Phase 1 (unchanged, it follows naturally)
  4. Note: existing Phase numbering (1-7) stays the same since Phase 0 is a pre-phase
**Verification:** `grep -c "Phase 0" skills/self-improvement/SKILL.md.tmpl` returns 1; `grep "Tacit Gap Mining" skills/self-improvement/SKILL.md.tmpl` returns 1
**Estimated effort:** M

### Step 16: Update self-improvement Report Template

**What:** Add a "Tacit Gaps" section to the improvement report template in self-improvement.
**Files:** `skills/self-improvement/SKILL.md.tmpl`
**How:**
  1. In the Phase 7 report template (the markdown block starting `# Improvement Report: [branch]`), add after the "Session Evidence" section:
     ```markdown
     ## Tacit Gaps (Phase 0)

     | Scenario | Agent Behavior | User Expected | Proposed Rule |
     |----------|---------------|--------------|---------------|
     | [from Phase 0 output, or "None detected"] | | | |

     Tacit gaps file: [path or "not generated"]
     ```
  2. In the final `SELF-IMPROVEMENT REPORT` status block, add:
     ```
     Tacit gaps found:   [N gaps | none]
     ```
**Verification:** `grep "Tacit Gaps" skills/self-improvement/SKILL.md.tmpl` returns at least 1
**Estimated effort:** S

### Step 17: Regenerate All SKILL.md Files (Wave 3)

**What:** Final regeneration to pick up all template changes.
**Files:** All `skills/*/SKILL.md` (generated)
**How:**
  1. Run: `bash lib/gen-skill-docs.sh`
  2. Run: `bash lib/validate-skills.sh` — must pass with 0 errors
  3. Verify self-improvement SKILL.md contains Phase 0
**Verification:** `bash lib/validate-skills.sh` exits 0; all SKILL.md files contain expanded preamble with TACIT-DENSE
**Estimated effort:** S

---

## Testing Strategy

- **Automated validation:** `bash lib/validate-skills.sh` after every wave — must exit 0
- **Preamble expansion:** `grep "TACIT-DENSE" skills/*/SKILL.md | wc -l` must equal template count (confirms gen-skill-docs works)
- **Config backward compat:** Test that `bin/config get proactive` still works with legacy `proactive=true` config
- **Config 5-level:** Test `bin/config set proactive.stylistic ask && bin/config get proactive.stylistic` returns "ask"
- **Iron Law examples:** For each of 3 enhanced skills, verify `grep -c "Good.*Example\|Bad.*Example" skills/<name>/SKILL.md.tmpl` >= 1
- **Manual verification:** Run `brainstorm` on a sample feature and confirm TACIT probe questions appear in Phase 1

## Rollback Plan

Each wave is independent and all changes are Markdown/shell. Rollback:
- Wave 1: `git revert` the wave 1 commit(s); regenerate SKILL.md
- Wave 2: `git revert` wave 2 commits; delete `skills/style-capture/`, `commands/style-capture.md`, `docs/superomni/style-profiles/`; regenerate SKILL.md
- Wave 3: `git revert` wave 3 commit; regenerate SKILL.md

## Dependencies

- No external services or APIs
- No new runtime dependencies
- All changes are Markdown templates and shell scripts
- `lib/gen-skill-docs.sh` must work correctly (already verified)

## Success Criteria

- [ ] Wave 1: `bash lib/validate-skills.sh` passes; 3 skills have Iron Law example blocks; preamble has TACIT-DENSE D1-D4
- [ ] Wave 2: style-capture Skill validates; brainstorm has TACIT probe with gate check; PROACTIVE supports dotted keys
- [ ] Wave 3: self-improvement has Phase 0 (Pattern Mining); report template includes tacit gaps section
- [ ] All waves: `bash lib/gen-skill-docs.sh && bash lib/validate-skills.sh` exits 0 after each wave
- [ ] No regression: existing skills continue to validate and function correctly
