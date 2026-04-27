'use strict';

// Dispatch descriptions for each preset agent, keyed by filename stem.
const AGENT_DESCRIPTIONS = {
    'architect':        'System design, architectural review, and technical decisions',
    'ceo-advisor':      'Product strategy, business alignment, and stakeholder priorities',
    'code-reviewer':    'Code quality, security, and best-practice review',
    'debugger':         'Root-cause analysis and systematic bug fixing',
    'designer':         'UX design, information architecture, and UI specification',
    'doc-writer':       'Technical documentation generation and updates',
    'evaluator':        'Objective quality-gate evaluation',
    'planner':          'Task decomposition and implementation planning',
    'refactoring-agent':'Safe refactoring and technical-debt reduction',
    'security-auditor': 'Security auditing, OWASP checks, and dependency scanning',
    'test-writer':      'Test suite creation and coverage improvement',
};

/**
 * Builds the sub-agents section for CLAUDE.md.
 * @param {string[]} agents - Sorted list of agent filename stems.
 * @returns {string} Markdown section, or empty string when no agents provided.
 */
function buildAgentsSection(agents) {
    if (!agents || agents.length === 0) return '';
    const rows = agents.map(name => {
        const desc = AGENT_DESCRIPTIONS[name] || '';
        return `| \`${name}\` | ${desc} |`;
    }).join('\n');
    return `## Available Sub-Agents

These agents are installed in \`.claude/agents/\` and dispatched automatically by skills.
Use the **Task tool** to invoke them — skills handle dispatch, you do not need to call agents manually.

| Agent | Purpose |
|-------|---------|
${rows}

`;
}

/**
 * Generates CLAUDE.md content for project-level Claude Code installations.
 * @param {string} skillsDir - Relative path to skills directory (e.g. ".superomni/skills")
 * @param {string[]} commands - List of available slash command names
 * @param {string[]} agents   - List of available agent names (filename stems)
 * @returns {string} CLAUDE.md content
 */
function generate(skillsDir, commands, agents) {
    const cmdList = commands.map(c => `- /${c}`).join('\n');
    const agentsSection = buildAgentsSection(Array.isArray(agents) ? agents : []);

    return `# superomni — AI Skill Framework

## Philosophy: Plan Lean, Execute Complete

You are augmented with the **superomni** AI coding skill framework.
Plan only what you need. But what you decide to build — build it fully.

## Setup

- Skills directory: \`${skillsDir}\`
- Entry skill: \`${skillsDir}/using-skills/SKILL.md\`
- Agents directory: \`.claude/agents/\`
- Load the entry skill at session start to activate the framework.

## Available Slash Commands

${cmdList}

Start with \`/vibe\` to activate the full framework and launch the guided workflow.

${agentsSection}## Skills Reference

| Skill | Trigger |
|-------|---------|
| brainstorm | "brainstorm", "design", "spec" |
| writing-plans | "write plan", "plan this" |
| executing-plans | "execute", "implement" |
| systematic-debugging | Any bug/error |
| test-driven-development | Writing code |
| verification | "verify", "done", "complete" |
| code-review | "review", "PR ready", "security audit" |
| subagent-development | Default for non-trivial tasks |
| investigate | "investigate", "explore" |
| release | "release", "ship and reflect" |

## Pipeline

\`\`\`
THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE
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
| Releases | \`docs/superomni/releases/\` | \`release-[branch]-[session]-[date].md\` |

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
