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
   ls spec.md plan.md .superomni/ 2>/dev/null
   git log --oneline -3 2>/dev/null
   ```
2. If context exists → re-engage the skill framework. Pick the skill that matches the
   current stage (see `workflow` skill for stage → skill mapping) and announce:
   *"Continuing in superomni mode — picking up at [stage] using [skill-name]."*
3. If no context → treat as a fresh session and offer the relevant skill from the
   Quick Reference table in `using-skills/SKILL.md`.

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

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

## Step 1: Define the Skill

Answer these questions before writing:

1. **Name** — short, verb-noun format (e.g., `systematic-debugging`, `writing-plans`)
2. **Trigger conditions** — when should this skill activate automatically?
3. **What does it do?** — describe in 2 sentences max
4. **What is the output?** — file, report, code change, recommendation?
5. **What skills are similar?** — how does this differ from existing skills?

```bash
# Check existing skills to avoid overlap
ls skills/
grep -rn "name:" skills/*/SKILL.md.tmpl | head -20
```

## Step 2: Create the Skill Directory

```bash
SKILL_NAME="your-skill-name"
mkdir -p "skills/${SKILL_NAME}"
```

## Step 3: Write the Skill Template

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

## Step 4: Generate the SKILL.md

```bash
bash lib/gen-skill-docs.sh "skills/${SKILL_NAME}/SKILL.md.tmpl"
```

Verify the output:
```bash
cat "skills/${SKILL_NAME}/SKILL.md"
head -5 "skills/${SKILL_NAME}/SKILL.md"  # confirm preamble was expanded
```

## Step 5: Register in CLAUDE.md

Add the new skill to the Skills Quick Reference in `CLAUDE.md`:

```markdown
| <skill-name> | [trigger phrases] | P[0-2] |
```

## Step 6: Test the Skill

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
