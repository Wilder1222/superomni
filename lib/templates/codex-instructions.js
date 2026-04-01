'use strict';

/**
 * Generates AGENTS.md content for Codex CLI installations.
 * Codex CLI reads AGENTS.md from project root or ~/.codex/AGENTS.md for global.
 * Codex does NOT natively support slash commands, so we teach it to recognize
 * /command patterns and load the corresponding command file.
 * @param {string} skillsDir - Relative path to skills directory
 * @param {boolean} isGlobal - Whether this is a global install
 * @param {string[]} commands - List of available command names
 * @returns {string} AGENTS.md content
 */
function generate(skillsDir, isGlobal, commands) {
    commands = commands || [];

    const location = isGlobal
        ? 'Global skills are installed at `~/.codex/skills/superomni/`.'
        : `Skills directory: \`${skillsDir}\``;

    const entryPath = isGlobal
        ? '`~/.codex/skills/superomni/skills/using-skills/SKILL.md`'
        : `\`${skillsDir}/using-skills/SKILL.md\``;

    const commandsDir = isGlobal
        ? '~/.codex/skills/superomni/commands/'
        : '.superomni/commands/';

    const cmdRows = commands.map(c => `| \`/${c}\` | Read and execute \`${commandsDir}${c}.md\` |`).join('\n');

    return `# superomni — AI Skill Framework

## Philosophy: Plan Lean, Execute Complete

You are augmented with the **superomni** AI coding skill framework.
Plan only what you need. But what you decide to build — build it fully.

## Setup

${location}
- Entry skill: ${entryPath}
- Commands directory: \`${commandsDir}\`
- **At session start**, read the entry skill to activate the framework.

## Slash Commands

When the user types any of the following commands, read the corresponding
command file and follow its instructions exactly:

| Command | Action |
|---------|--------|
${cmdRows}

**Start with \`/vibe\`** to activate the full framework and launch the guided workflow.

## Skill Triggers

You can also activate skills through natural language. When you detect one of these
situations, load and follow the corresponding skill file from \`${skillsDir}/\`:

| Situation | Skill to load | Trigger phrases |
|-----------|--------------|-----------------|
| New feature/design | brainstorm | "brainstorm", "design", "spec" |
| Creating a plan | writing-plans | "write plan", "plan this" |
| Executing a plan | executing-plans | "execute", "implement" |
| Any bug or error | systematic-debugging | any error, "debug", "fix" |
| Writing new code | test-driven-development | "implement", "add feature" |
| Claiming done | verification | "verify", "done", "complete" |
| Code review | code-review | "review", "check this code" |
| Complex multi-step task | subagent-development | default for non-trivial tasks |
| Exploring code | investigate | "investigate", "explore", "how does X work" |
| Releasing software | ship | "ship", "release", "deploy" |

## Status Protocol

End every skill session with one of: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

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
