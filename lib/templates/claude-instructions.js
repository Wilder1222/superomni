'use strict';

/**
 * Generates CLAUDE.md content for project-level Claude Code installations.
 * @param {string} skillsDir - Relative path to skills directory (e.g. ".superomni/skills")
 * @param {string[]} commands - List of available slash command names
 * @returns {string} CLAUDE.md content
 */
function generate(skillsDir, commands) {
    const cmdList = commands.map(c => `- /${c}`).join('\n');

    return `# superomni — AI Skill Framework

## Philosophy: Plan Lean, Execute Complete

You are augmented with the **superomni** AI coding skill framework.
Plan only what you need. But what you decide to build — build it fully.

## Setup

- Skills directory: \`${skillsDir}\`
- Entry skill: \`${skillsDir}/using-skills/SKILL.md\`
- Load the entry skill at session start to activate the framework.

## Available Slash Commands

${cmdList}

Start with \`/vibe\` to activate the full framework and launch the guided workflow.

## Skills Reference

| Skill | Trigger |
|-------|---------|
| brainstorm | "brainstorm", "design", "spec" |
| writing-plans | "write plan", "plan this" |
| executing-plans | "execute", "implement" |
| systematic-debugging | Any bug/error |
| test-driven-development | Writing code |
| verification | "verify", "done", "complete" |
| code-review | "review", "PR ready" |
| subagent-development | Default for non-trivial tasks |
| investigate | "investigate", "explore" |
| ship | "ship", "release" |

## Pipeline

\`\`\`
THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT
\`\`\`

## Document Output Convention

All skill outputs go in \`docs/superomni/\` for session tracking:

| Output Type | Directory | File Pattern |
|-------------|-----------|-------------|
| Specs | \`docs/superomni/specs/\` | \`spec-[branch]-[session]-[date].md\` |
| Plans | \`docs/superomni/plans/\` | \`plan-[branch]-[session]-[date].md\` |
| Code reviews | \`docs/superomni/reviews/\` | \`review-[branch]-[session]-[date].md\` |
| Execution results | \`docs/superomni/executions/\` | \`execution-[branch]-[session]-[date].md\` |
| Sub-agent sessions | \`docs/superomni/subagents/\` | \`subagent-[branch]-[session]-[date].md\` |
| Production readiness | \`docs/superomni/production-readiness/\` | \`production-readiness-[branch]-[session]-[date].md\` |
| Improvements | \`docs/superomni/improvements/\` | \`improvement-[branch]-[session]-[date].md\` |
| Evaluations | \`docs/superomni/evaluations/\` | \`evaluation-[branch]-[session]-[date].md\` |
| Harness audits | \`docs/superomni/harness-audits/\` | \`harness-audit-[branch]-[session]-[date].md\` |

## Status Protocol

End every skill session with: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

## The 6 Decision Principles

1. **Choose completeness** — cover more edge cases
2. **Boil lakes** — fix everything in blast radius if <1 day effort
3. **Pragmatic** — two equal options? Pick the cleaner one
4. **DRY** — duplicates existing? Reject. Reuse what exists.
5. **Explicit over clever** — 10-line obvious > 200-line abstraction
6. **Bias toward action** — flag concerns but don't block
`;
}

module.exports = { generate };
