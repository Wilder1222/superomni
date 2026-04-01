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

### Session Continuity
After reporting any terminal status (DONE / DONE_WITH_CONCERNS), **always** close with a
"What's next?" line that names the next logical superomni skill:

```
What's next → [skill-name]: [one-sentence reason]
```

When the user sends a **follow-up message after a completed session**, before doing anything else:
1. Scan for prior session context:
   ```bash
   ls docs/superomni/spec.md docs/superomni/plan.md docs/superomni/ .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
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
| Planning | `docs/superomni/spec.md`, constraints, prior decisions | Full codebase, test files |
| Implementation | `docs/superomni/plan.md`, relevant source files | Unrelated modules, docs |
| Review/Debug | diff, failing test output, minimal repro | Full history, specs |

**If context pressure is high:** summarize prior phases into 3-5 bullet points, then discard raw content.

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
