<!-- Reference: subagent-development session-record templates. -->

# Sub-Agent Development — Session Record Templates

After the sub-agent session is complete, save the full session record as a Markdown document.

## Save Script

```bash
_SA_DATE=$(date +%Y%m%d-%H%M%S)
_SA_BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-' || echo "unknown")
_SA_FILE="subagent-${_SA_BRANCH}-${_SA_DATE}.md"
mkdir -p docs/superomni/subagents
cat > "docs/superomni/subagents/${_SA_FILE}" << EOF
# Sub-Agent Session: ${_SA_BRANCH}

**Date:** ${_SA_DATE}
**Branch:** ${_SA_BRANCH}

## Agents Dispatched

[List each agent, its type, task, wave, and reported status]

## Wave Summary

[Wave 1: N agents, duration. Wave 2: M agents, duration. Total elapsed vs sequential estimate.]

## Integration Summary

[What was merged, any conflicts resolved, final state]

## Status

[DONE | DONE_WITH_CONCERNS | BLOCKED]
[Any concerns or issues]
EOF
echo "Sub-agent session saved to docs/superomni/subagents/${_SA_FILE}"
```

The file serves as the permanent record for the user to audit the sub-agent session: agents dispatched, wave breakdown, outputs, integration summary, and final status — all formatted as Markdown.
