<!-- Reference: subagent-development consensus protocol + model selection strategy. -->

# Sub-Agent Development — Consensus Protocol & Model Selection

## Consensus Protocol (Optional)

For critical decisions, run two agents with the same task and compare outputs:
- If they agree → proceed
- If they disagree → surface disagreement to user as TASTE decision

## Model Selection Strategy

Match model cost to task complexity. Signals:

| Signal | Model tier |
|--------|-----------|
| 1–2 files, complete spec, no ambiguity | Lightweight / fast model |
| Multi-file, integration concerns, pattern matching | Standard model |
| Architecture decisions, broad codebase understanding, review tasks | Strongest model |

Rules:
- Default to the **cheapest model that can reliably complete the task**.
- Upgrade when a sub-agent reports BLOCKED due to reasoning limits (not context gaps).
- Never downgrade mid-task; finish the task at the assigned tier.
- For Spec Compliance Review and Code Quality Review agents: use standard model minimum.
