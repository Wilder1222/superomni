# /harness-audit

Run a full **harness engineering audit** on the superomni skill framework — evaluate context efficiency, tool action space, evaluation gate coverage, feedback loops, and documentation freshness.

## Usage

```
/harness-audit          — run full harness audit (all 6 phases)
/harness-audit context  — audit context window and preamble efficiency only
/harness-audit gates    — audit evaluation gate coverage only
/harness-audit feedback — audit feedback loops only
/harness-audit gc       — run garbage collection pass (stale docs, dead commands)
```

## What Happens

Invokes the `harness-engineering` skill, which:

1. **Inventories** the harness (skill count, agent count, preamble size, validation status)
2. **Audits context window pressure** — preamble efficiency + skill bloat
3. **Audits tool action space** — minimalism and composability
4. **Audits evaluation gates** — coverage at every workflow transition
5. **Audits feedback loops** — signal capture and improvement consumption
6. **Produces a Harness Health Score** (N/25) and prioritized improvement backlog

## Output

A structured Harness Audit Report saved to `docs/superomni/harness-audits/harness-audit-[branch]-[timestamp].md`.

## When to Run

- After any sprint that introduced new skills, agents, or commands
- After any major refactor of the harness (preamble, CLAUDE.md, etc.)
- Every 5 sprints as part of routine maintenance (garbage collection)
- When agents are performing worse than expected — the harness may have drifted

## Philosophy

> "Engineers design the system. Agents execute." — OpenAI Harness Engineering

The harness is the product. Running this audit is how you maintain it.

See `docs/HARNESS.md` for the full harness engineering guide.
