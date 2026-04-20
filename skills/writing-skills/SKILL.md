---
name: writing-skills
description: |
  Meta-skill: use when creating a new skill for the superomni framework.
  Guides through the process of designing and writing a well-structured skill.
  Triggers: "create a new skill", "write a skill for", "add a skill that".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

## Preamble

### Environment Detection

On session start, read: branch from `git branch --show-current`, proactive config from `bin/config get proactive` (default `true`), session timestamp from `~/.omni-skills/sessions/current-session-ts`.

### PROACTIVE Mode

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

Pipeline stage order: THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE

**THINK has exactly one human gate: spec review approval.** `brainstorm` runs without manual gate. After `spec-[branch]-[session]-[date].md` is generated, STOP for user spec approval. Once approved, all subsequent stages (PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE) auto-advance on DONE.

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
1. Read `~/.omni-skills/sessions/current-session-ts` to get session start timestamp. Find artifacts in `docs/superomni/specs/`, `docs/superomni/plans/` newer than that timestamp using `find -newer`. Check `git log --oneline -3`.
2. If current-session context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no current-session context → treat as a fresh session and offer the relevant skill from the
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

**Custom Input Option Rule:** Always append `Other — describe your own idea: ___` to predefined choice lists. Treat custom text as the chosen option; ask one clarifying question only if ambiguous.

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
Before reporting final status, answer: (1) **Process** — all phases followed? (2) **Evidence** — every claim backed by output or file reference? (3) **Scope** — stayed within task boundary? If any NO, address it or report DONE_WITH_CONCERNS. For full sprint evaluation, use `self-improvement`.

### TACIT-DENSE Detection (Tacit Knowledge Density Check)

Before executing substantive decisions, check if any falls into these high-tacit-density categories.
These are NOT about operational danger (that's the `careful` skill) — they're about whether the Agent
has enough tacit knowledge to judge correctly.

| Category | Trigger | Action |
|----------|---------|--------|
| **D1** Domain Expertise | Security, compliance, legal, financial judgment | State `TACIT-DENSE [D1]`, present trade-offs, wait for user |
| **D2** User-Facing UX | UI copy, interaction flow, error messaging | Draft with explicit review markers |
| **D3** Team Culture | Workflow, naming conventions, file organization | Check `style-profiles/` first; ask if none |
| **D4** Novel Pattern | Fewer than 3 precedents in project history | Reduce autonomy, add checkpoints before executing |

When TACIT-DENSE detected, output: `TACIT-DENSE [D#]: [category] — [question] — My default: [recommendation]`

**Relationship with careful skill:** careful = "can we undo this?" (operational). TACIT-DENSE = "can we judge this correctly?" (knowledge). Complementary.

### Telemetry (Local Only)

At session end, log skill name, duration, and outcome to `~/.omni-skills/analytics/` via `bin/analytics-log`. Nothing is sent to external servers.

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


# Writing Skills (Meta-Skill)

**Goal:** Create a new, well-designed skill that integrates cleanly into the superomni framework.

## What Makes a Good Skill

A skill is good when:
1. **Triggers are clear** — there's no ambiguity about when to use it
2. **Protocol is executable** — an agent can follow it without interpretation
3. **Output is defined** — there's a defined output format/artifact
4. **It doesn't duplicate** — it doesn't overlap significantly with existing skills
5. **It uses the preamble** — via `{{PREAMBLE}}` for consistency

## Selection Flow

**Always follow this order before writing a new skill from scratch:**

```
1. Check project built-ins     →  ls skills/ && bin/skill-manager list
2. Search the network          →  bin/skill-manager search <query>
3. Install from URL            →  bin/skill-manager install <url>
4. Write from scratch          →  follow steps below
```

Never write a new skill without first completing steps 1–3.

## Step 1: Check Existing Skills

Before writing anything, verify no existing skill already covers your need:

```bash
# Check built-in skills for overlap
bin/skill-manager list
grep -rn "name:" skills/*/SKILL.md.tmpl | head -20
```

**Gate:** If an existing skill fits → use or extend it. Stop here.
If none fits → proceed to Step 2.

## Step 2: Search the Network

If no built-in skill covers your need, search GitHub and known registries:

```bash
# Search GitHub for matching skills
bin/skill-manager search <your-query>
```

Check known registries:
- obra/superpowers: `https://github.com/obra/superpowers/tree/main/skills`
- garrytan/gstack: `https://github.com/garrytan/gstack/tree/main/skills`

**Gate:** If a suitable skill is found online → install it:
```bash
bin/skill-manager install <raw-url>
```
Stop here. If nothing suitable → proceed to Step 3.

## Step 3: Define the New Skill

Answer these questions before writing:

1. **Name** — short, verb-noun format (e.g., `systematic-debugging`, `writing-plans`)
2. **Trigger conditions** — when should this skill activate automatically?
3. **What does it do?** — describe in 2 sentences max
4. **What is the output?** — file, report, code change, recommendation?
5. **What skills are similar?** — how does this differ from existing skills?

## Step 4: Create the Skill Directory

```bash
SKILL_NAME="your-skill-name"
mkdir -p "skills/${SKILL_NAME}"
```

## Step 5: Write the Skill Template

Create `skills/<skill-name>/SKILL.md.tmpl`:

### Required Sections

```markdown
---
name: <skill-name>
description: |
  [2-3 sentence description]
  Triggers: [comma-separated trigger phrases]
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

{{PREAMBLE}}

# <Skill Title>

**Goal:** [One sentence: what does this skill accomplish?]

## Iron Law (if applicable)
[Absolute rule that must never be violated]

## Phase 1: [First Phase Name]
[Steps, commands, outputs]

## Phase N: [Last Phase Name]
[...]

## Status Report
[Required output format for this skill]
```

### Checklist for Quality

- [ ] `{{PREAMBLE}}` is included
- [ ] YAML frontmatter has `name`, `description`, `allowed-tools`
- [ ] Description includes trigger phrases
- [ ] At least one "Iron Law" or governing principle
- [ ] Clear output format defined
- [ ] Status report uses DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT

## Step 6: Generate the SKILL.md

```bash
bash lib/gen-skill-docs.sh "skills/${SKILL_NAME}/SKILL.md.tmpl"
```

Verify the output:
```bash
cat "skills/${SKILL_NAME}/SKILL.md"
head -5 "skills/${SKILL_NAME}/SKILL.md"  # confirm preamble was expanded
```

## Step 7: Register in CLAUDE.md

Add the new skill to the Skills Quick Reference in `CLAUDE.md`:

```markdown
| <skill-name> | [trigger phrases] | P[0-2] |
```

## Step 8: Test the Skill

Write a brief test scenario:
1. Describe a situation that should trigger this skill
2. Manually verify the skill protocol is clear and executable
3. Ensure the output format matches what the skill claims to produce

## Skill Design Principles

### Do
- Keep phases short and numbered
- Use code blocks for all commands
- Define explicit output formats
- Include at least one verification step
- Use the status protocol (DONE/BLOCKED/etc.)

### Don't
- Don't duplicate logic from existing skills (link to them instead)
- Don't make phases so long they require scrolling
- Don't leave trigger conditions ambiguous
- Don't omit the preamble (`{{PREAMBLE}}`)
- Don't create skills for one-time tasks

## Example: Minimal Skill Template

```markdown
---
name: my-skill
description: |
  Use when [trigger condition].
  Triggers: "keyword 1", "keyword 2".
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

{{PREAMBLE}}

# My Skill

**Goal:** [What this accomplishes.]

## Iron Law
[Non-negotiable rule]

## Phase 1: [Name]
[Steps]

## Phase 2: [Name]
[Steps]

## Report

\`\`\`
MY SKILL REPORT
════════════════
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
[Key output]
════════════════
\`\`\`
```
