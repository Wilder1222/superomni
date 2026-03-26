---
name: freeze
description: |
  Restrict file edits to a specific directory for the session. Use when
  debugging to prevent accidentally changing unrelated code, or to scope
  work to one module. Pair with /careful for maximum safety.
  Triggers: "freeze", "restrict edits", "only edit this folder",
  "lock edits to", "don't touch anything outside".
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

### Escalation Policy
It is always OK to stop and say "this is too hard for me." Escalation is expected, not penalized.

- **3 attempts without success** → STOP and report BLOCKED
- **Uncertain about security** → STOP and report NEEDS_CONTEXT
- **Scope exceeds verification capacity** → STOP and flag blast radius

### Telemetry (Local Only)
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
~/.claude/skills/superomni/bin/analytics-log "SKILL_NAME" "$_TEL_DUR" "OUTCOME" 2>/dev/null || true
```
Nothing is sent to external servers. Data is stored only in `~/.omni-skills/analytics/`.

# /freeze — Restrict Edits to a Directory

**Goal:** Prevent accidental changes outside a defined scope. Set a freeze boundary so that only files within a specified directory can be edited this session.

## Iron Law: Freeze Scope Prevents Scope Creep

When you have a freeze active, **never edit files outside the boundary** — even if fixing something there seems helpful. Flag it as a task to address after unfreezing.

## Setup

Ask the user which directory to restrict edits to:

> "Which directory should I restrict edits to? I'll only modify files within that path for this session. Examples: `src/`, `lib/auth/`, `components/`"

Once the user provides a path:

1. Resolve it to an absolute path:
```bash
FREEZE_DIR=$(cd "<user-provided-path>" 2>/dev/null && pwd || echo "")
if [ -z "$FREEZE_DIR" ]; then
  echo "Directory not found: <user-provided-path>"
  exit 1
fi
echo "Freeze boundary: $FREEZE_DIR"
```

2. Save to the freeze state file:
```bash
STATE_DIR="${HOME}/.omni-skills"
mkdir -p "$STATE_DIR"
echo "${FREEZE_DIR%/}/" > "$STATE_DIR/freeze-dir.txt"
echo "✓ Freeze set to: ${FREEZE_DIR%/}/"
```

Tell the user:
> "Edits are now scoped to `<path>/`. I will not modify any files outside this directory.
> If I notice something that needs fixing outside the freeze boundary, I'll flag it as a follow-up.
> To remove the freeze, run `/unfreeze` or say 'unfreeze'."

## While Freeze Is Active

Check the freeze file before any edit:
```bash
FREEZE_DIR=$(cat "${HOME}/.omni-skills/freeze-dir.txt" 2>/dev/null || echo "")
```

If `$FREEZE_DIR` is set and a file to edit is outside that path:
1. **Do not edit the file**
2. Report: "⚠️ FREEZE: `<file>` is outside `<freeze-dir>`. I'll note this as a follow-up."
3. Add to a running list of blocked edits

## Freeze Status

```bash
# Check current freeze state
cat "${HOME}/.omni-skills/freeze-dir.txt" 2>/dev/null || echo "No freeze active"
```

## Output Format

```
FREEZE SET
════════════════════════════════════════
Boundary:    [absolute path]
Scope:       edits restricted to this directory only
Unfreeze:    say "unfreeze" or /unfreeze

Status: DONE
════════════════════════════════════════
```
