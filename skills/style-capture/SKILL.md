---
name: style-capture
description: |
  Capture user's code style preferences through examples, not rules.
  Generates a style profile for consistent code generation across sessions.
  Triggers: "/style-capture", "capture style", "show me your preferences",
  "style profile", project initialization (new project detected by vibe).
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

Check proactive configuration:
```bash
_PROACTIVE=$(~/.claude/skills/superomni/bin/config get proactive 2>/dev/null || echo "true")
```

**Legacy mode (single value):**
If `proactive=true`: auto-invoke skills. If `proactive=false`: ask first.

If `PROACTIVE` is `false`: do NOT proactively suggest skills. Only run skills the
user explicitly invokes. If you would have auto-invoked, say:
*"I think [skill-name] might help here — want me to run it?"* and wait.

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
- If a style profile exists (`docs/superomni/style-profiles/`), stylistic decisions
  that match the profile can be treated as mechanical
- Strategic decisions ALWAYS surface to user unless `proactive.strategic=true`
- Destructive decisions ALWAYS confirm (integrates with `careful` Skill) regardless of config

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


# Style Capture — Learn From Examples

**Goal:** Capture the user's implicit code style, architecture, and documentation preferences by analyzing examples they consider "good" and "bad" — then produce a reusable style profile that downstream skills reference.

## Iron Law

**LEARN FROM EXAMPLES, NOT JUST RULES.**

Never ask "what's your style?" — ask "show me something you're satisfied with."
Demonstration transfers tacit knowledge better than description (Polanyi's Paradox).

### Good Example (Learn From Examples)
```
Agent: "Can you point me to 2-3 files in this project that you consider well-written?"
User: "Look at src/auth/middleware.ts and src/utils/validation.ts"
Agent: [reads both files, extracts patterns]
  -> Naming: camelCase functions, PascalCase types, descriptive 2-3 word names
  -> Comments: JSDoc on public APIs only, no inline comments
  -> Error handling: early returns, typed errors
  -> Saves to style profile with citations
```

### Bad Example (AVOID)
```
Agent: "What's your preferred coding style?"
User: "Uh... clean code I guess?"
Agent: [applies generic 'clean code' assumptions]
  -> Writes overly abstracted code with dependency injection everywhere
  [VIOLATED: Asked for rules instead of examples — got vague answer, applied wrong assumptions]
```

## Phase 1: Sample Collection

Prompt the user to provide examples. Key principle: concrete examples, not abstract descriptions.

### Collecting Good Examples
Ask: **"Can you point me to 3-5 files, code snippets, or references that you consider well-written or 'feel right'?"**

Accepted input formats:
- File paths in the current project (preferred — most relevant)
- Pasted code snippets
- URLs to external repos or gists
- Names of libraries/projects they admire

If user provides fewer than 3: proceed but note gaps in the profile's "Unknown" section.

### Collecting Bad Examples (Optional)
Ask: **"Optionally — is there code in this project (or elsewhere) that you consider poorly written, or a style you want to avoid?"**

1-2 contrast examples significantly improve feature extraction accuracy. If the user declines, proceed without.

### Phase 1 Gate
- [ ] At least 2 "good" examples collected
- [ ] Examples are readable (file exists, code is accessible)
- FAIL -> ask for additional examples before proceeding

## Phase 2: Feature Extraction

Analyze the collected examples across 6 style dimensions. For each dimension, compare good vs bad examples to identify the preference direction.

### Extraction Dimensions

| Dimension | What to Look For | Signal Examples |
|-----------|-----------------|-----------------|
| **Naming style** | Variable/function/type naming patterns | camelCase vs snake_case, descriptive vs concise, prefix conventions |
| **Comment density** | Where and how comments are used | JSDoc only, inline explanations, no comments, "why" vs "what" |
| **Function granularity** | Function length and decomposition | Short single-purpose vs longer procedural, helper count |
| **Error handling** | How errors are managed | Early returns, try/catch depth, error types, fallback strategies |
| **Abstraction level** | DRY extremism vs concrete-first | Utility extraction threshold, interface vs implementation |
| **Documentation style** | How docs/READMEs are written | What vs Why vs How emphasis, examples included, formal vs casual |

### Extraction Process

For each dimension:
1. Scan all good examples for the pattern
2. Scan bad examples (if provided) for the anti-pattern
3. Rate confidence: HIGH (clear pattern in 3+ examples) / MEDIUM (2 examples) / LOW (1 example)
4. If confidence is LOW, mark as "Unknown — ask before assuming"

## Phase 3: Style Profile Output

Generate the style profile document:

```bash
_SCOPE="${1:-project}"  # default scope is "project"; can be "frontend", "api", "docs"
mkdir -p docs/superomni/style-profiles
_PROFILE="docs/superomni/style-profiles/${_SCOPE}.md"
```

Write `docs/superomni/style-profiles/<scope>.md`:

```markdown
# Style Profile: <scope>

**Generated:** [date]
**Based on:** [N] good examples, [N] bad examples
**Confidence:** [HIGH/MEDIUM/LOW overall]

## Confirmed Preferences

### Naming
- [Observed pattern with citation: "In `file.ts:12`, functions use camelCase..."]

### Comments
- [Observed pattern with citation]

### Function Granularity
- [Observed pattern with citation]

### Error Handling
- [Observed pattern with citation]

### Abstraction Level
- [Observed pattern with citation]

### Documentation
- [Observed pattern with citation]

## Reference Examples

### Good Examples
- `[file path]` — [why it's a good reference for: naming, error handling]
- `[file path]` — [why it's a good reference for: comments, granularity]

### Bad Examples (Contrast)
- `[file path]` — [what to avoid: over-abstraction, unclear naming]

## Unknown / Ask Before Assuming
- [Dimension where signal is insufficient — e.g., "No test files were provided; testing style is unknown"]
- [Dimension where examples conflict — e.g., "Two examples use different error patterns"]
```

## Phase 4: Injection Verification

Distill the profile into a compact prompt fragment for downstream skill consumption:

```bash
_PROMPT_FILE="docs/superomni/style-profiles/prompt-${_SCOPE}.md"
```

Write `docs/superomni/style-profiles/prompt-<scope>.md`:

```markdown
## Style Guidelines (from style profile)

Apply these preferences when writing code for this project:
- Naming: [1-line summary]
- Comments: [1-line summary]
- Functions: [1-line summary]
- Errors: [1-line summary]
- Abstraction: [1-line summary]
- Docs: [1-line summary]

When in doubt about style, check: docs/superomni/style-profiles/<scope>.md
```

### Downstream Integration Check
Verify that the profile is discoverable by other skills:
```bash
# These skills should reference style profiles when they exist:
echo "Integration points:"
echo "  brainstorm     -> references profile for aesthetic decisions"
echo "  executing-plans -> references profile when writing code"
echo "  code-review    -> uses profile as review criteria"
echo "  self-improvement -> treats profile as improvement target"
ls docs/superomni/style-profiles/*.md 2>/dev/null
```

## Style Profile Report

```
STYLE CAPTURE REPORT
════════════════════════════════════════
Scope:              [project / frontend / api / docs]
Good examples:      [N files/snippets analyzed]
Bad examples:       [N files/snippets analyzed]
Dimensions captured: [N/6]
Unknown dimensions: [list]
Profile saved:      docs/superomni/style-profiles/<scope>.md
Prompt fragment:    docs/superomni/style-profiles/prompt-<scope>.md
Status:             DONE | DONE_WITH_CONCERNS
Concerns:
  - [e.g., "Only 2 examples provided — LOW confidence on naming and comments"]
════════════════════════════════════════
```
