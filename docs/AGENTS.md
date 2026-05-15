# superomni Agent Library

> Specialized AI sub-agents for focused tasks — each runs in isolated context with a constrained tool whitelist and returns a structured report.

**Last updated:** v0.6.9

---

## What Are Agents?

Agents are **specialized AI sub-agents** invoked by skills via the `Task` tool. They run in **isolated context** (separate from the main conversation), use a **restricted tool whitelist**, and return a **structured report block** that the dispatching skill consumes.

Skills define *how the main agent behaves* (protocol, phases, output format). Agents are *sub-personas* with focused expertise that skills delegate to when:

- The work benefits from **isolation** (e.g., reading a large codebase without polluting main context)
- The work needs **specialized review** (e.g., code-review by a non-author lens)
- The work has a **distinct safety profile** (e.g., refactoring with tests-first protocol)

### How dispatch works

A skill declares its agent in frontmatter (`dispatch-agent: <name>`) and invokes it via the `Task` tool inside the skill body. The agent receives the dispatching skill's prompt as context, executes its protocol, and returns a structured report. The skill then continues in main context with the report as input.

### Agent properties

Each agent file (`agents/<name>.md`) declares:

1. **`name`** — the agent identifier (kebab-case, matches filename)
2. **`description`** — one-line summary of expertise
3. **`tools`** — whitelist of tools the agent may use (Read / Grep / Glob / Bash / Edit / Write)
4. **`when_to_invoke`** — which skills dispatch this agent + when NOT to dispatch
5. **Iron Law** (in body) — single non-negotiable rule
6. **Output format** — structured report block ending with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`

---

## Built-in Agents (5)

The current superomni framework ships with 5 canonical agents. (See [Migration from v0.5.x](#migration-from-v05x) for the consolidation history.)

### `doc-writer`

**Specialty:** Diff-driven technical documentation generation and updates.

**Iron Law:** Code Is Truth — Docs Follow Code. Documentation must always be derived from reading the actual code, not from memory or assumption.

**Tools:** `[Read, Grep, Glob, Write, Bash]`

**When to invoke:**
- Dispatched by `document-release` skill after code has shipped
- Manual dispatch when README / docs drift from code has accumulated

**Do NOT dispatch for:**
- Writing specs / plans → use the `brainstorm` / `writing-plans` skills (main context)
- Live release notes during execution → use the `release` skill

**Returns:** A `DOC UPDATE REPORT` block listing files updated, sections changed, and verification grep results.

---

### `explorer`

**Specialty:** Read-only isolated-context repo exploration and evidence gathering. Returns a structured `EXPLORATION REPORT`; does NOT modify files.

**Iron Law:** Read-Only. Must NOT modify any file. Must NOT run tests (those produce side effects in some projects). Tool surface is restricted accordingly.

**Tools:** `[Read, Grep, Glob, Bash]` (Bash restricted to read-only commands: `git log`, `git status`, `git diff`, `ls`, `wc`, `cat` for small files)

**When to invoke:**
- Dispatched by `systematic-debugging` (evidence gathering after Phase 1 scope lock)
- Dispatched by `investigate` (open-ended exploration: "how does X work", "map this system")
- Dispatched by `executing-plans` (cross-file survey on ≥5-step waves where the plan needs a fresh read)
- Any skill that benefits from isolated-context repo walk without write privileges

**Do NOT dispatch for:**
- Modifying files → use `refactoring-agent` or let the skill edit in main context
- Running tests → use the `qa` skill
- Security audit → use `planner-reviewer` (security mode)

**Returns:** An `EXPLORATION REPORT` with entry points, path traces, hotspots (if debug mode), candidate hypotheses, and open questions.

---

### `frontend-designer`

**Specialty:** UX review with 10-dimension scoring, AI Slop detection, and accessibility audit.

**Iron Law:** Score every dimension; never approve UI with any dimension below 7/10 without explicit user override.

**Tools:** `[Read, Grep, Glob, Write, Bash]`

**When to invoke:**
- Dispatched by `frontend-design` Phase 5 (quality gate, 7+/10 on all 10 dimensions required)
- Dispatched by `plan-review` Phase 2 when the plan touches UI/UX
- Dispatched by `executing-plans` after completing UI steps in a wave
- Dispatched by `code-review` when a diff includes `.html`, `.jsx`, `.tsx`, `.vue`, `.svelte`, `.css`, `.scss`

**Do NOT dispatch for:**
- Backend code review → use `planner-reviewer` (code-review mode)
- Generic style nitpicks → use `code-review` skill in main context

**Returns:** A `DESIGN REVIEW` block with 10-dimension scores (Information hierarchy, Missing states, Responsive strategy, Accessibility, Error recovery, AI Slop detection, Typography, Color system, Spatial rhythm, Motion quality), an Overall score, and a Gate result (PASS / RETRY / ESCALATE).

---

### `planner-reviewer`

**Specialty:** Canonical multi-mode review agent. **Six modes** — the dispatching skill specifies which mode it needs:

- **planning** — plan authoring (dispatched by `writing-plans`)
- **strategy** — CEO lens (scope, demand validation; dispatched by `plan-review` Phase 1)
- **engineering** — architecture review (dispatched by `plan-review` Phase 3)
- **evaluation** — independent verdict gate (dispatched by `verification`, `executing-plans` wave gates)
- **security** — OWASP audit + dependency CVE (dispatched by `code-review` on security-sensitive diffs, `dependency-audit`, `production-readiness`)
- **code-review** — P0/P1/P2 layered review (dispatched by `code-review` skill)

**Iron Law:** Mode-specific (each mode declares its own iron law in the agent body). The shared meta-iron-law: never produce a verdict without specific evidence (file:line references, test output, diff hunks).

**Tools:** `[Read, Grep, Glob, Write, Bash]`

**When to invoke:** The invoking skill MUST specify a mode in its dispatch prompt (e.g., "Dispatch `planner-reviewer` in *engineering* mode").

**Do NOT dispatch for:**
- UI design review → use `frontend-designer`
- Read-only exploration → use `explorer`
- Refactoring execution → use `refactoring-agent`

**Returns:** Mode-specific report blocks: `PLAN COMPLETE`, `STRATEGY REVIEW`, `ARCHITECTURE REVIEW`, `EVALUATION VERDICT`, `SECURITY AUDIT`, or `CODE REVIEW` (all ending with `Status:` line).

**Background:** This is a **canonical fusion agent**. It absorbs the v0.5.x retired agents `planner`, `architect`, `ceo-advisor`, `evaluator`, `security-auditor`, and `code-reviewer`. Each mode preserves the prompt logic from the retired agent it replaces.

---

### `refactoring-agent`

**Specialty:** Safe, behavior-preserving code refactoring with tests-first protocol. One semantic change at a time.

**Iron Law:** Behavior Must Be Preserved. If tests don't pass before AND after, the refactoring is wrong — not the tests.

**Tools:** `[Read, Grep, Glob, Edit, Bash]`

**When to invoke:**
- Dispatched by `refactoring` skill Phase 4
- Dispatched by `executing-plans` BUILD stage when debt-cleanup is on the plan
- Dispatched by `code-review` when structural issues ≥ 3 P1/P2 findings

**Do NOT dispatch for:**
- New features (refactoring is behavior-preserving only) → use `executing-plans`
- Bug fixes → use `systematic-debugging` skill
- Test writing → use `test-driven-development` skill

**Returns:** A `REFACTORING REPORT` listing each change (one row per semantic step), test status before/after, and any deferred follow-ups.

---

## Migration from v0.5.x

The v0.6.0 release consolidated 9 specialized agents into 5 canonical ones, plus folded one agent's responsibilities into a skill. The mapping:

| Retired (v0.5.x) | Current (v0.6.x) | Notes |
|---|---|---|
| code-reviewer | planner-reviewer (code-review mode) | Merged — same P0/P1/P2 protocol, dispatched via mode selector |
| planner | planner-reviewer (planning mode) | Merged — plan authoring via the canonical agent |
| architect | planner-reviewer (engineering mode) | Merged — architecture review via the canonical agent |
| ceo-advisor | planner-reviewer (strategy mode) | Merged — CEO/scope-validation lens via the canonical agent |
| evaluator | planner-reviewer (evaluation mode) | Merged — independent verdict gate via the canonical agent |
| security-auditor | planner-reviewer (security mode) | Merged — OWASP + CVE audit via the canonical agent |
| designer | frontend-designer | Renamed — same 10-dimension UX scoring, expanded with AI Slop detection |
| debugger | explorer | Renamed (Phase-2 evidence-gathering role) — investigate/debug skills now dispatch `explorer` for read-only repo walks |
| test-writer | (folded into `test-driven-development` skill) | Absorbed — test writing is now a skill protocol, not a sub-agent dispatch (test code is best written in main context where the implementer can iterate) |

### Why consolidate?

The v0.5.x layout had **1:1 skill ↔ agent overlap**: e.g., the `code-review` skill dispatched the `code-reviewer` agent that re-implemented the skill's logic in isolated context. v0.6.0 recognized that:

- Most "review" agents shared 80%+ of their protocol (read code → categorize findings → output structured report). Differentiation was mostly *which lens* (security / architecture / strategy / etc.).
- A **multi-mode canonical agent** (`planner-reviewer`) carries the shared protocol once and varies behavior by mode parameter. Adding a new review lens later means adding a mode, not a new agent file.
- This shrunk the agents/ directory from 9 to 5 files while preserving every retired agent's prompt logic.

If you have skills or external dispatchers referencing v0.5.x agent names, update them to use the current 5-agent set per the table above.

---

## Installing Agents

### From the built-in set

The 5 canonical agents are bundled with superomni — no installation required.

### From a URL (GitHub or any HTTPS source)

```bash
bin/agent-manager install <url>
```

Downloads and validates the agent file, places it in `agents/`. Run `bin/agent-manager list` to confirm.

### From a Local File

```bash
bin/agent-manager install /path/to/agent.md
```

### List All Installed Agents

```bash
bin/agent-manager list
```

---

## Creating Custom Agents

Use the `framework-management` skill to scaffold a new agent:

```
/framework-management create-agent <name>
```

This generates an `agents/<name>.md` skeleton with the canonical frontmatter (`name`, `description`, `tools`, `when_to_invoke`) and body structure (Identity → Iron Law → Process → Report Format).

**Hard rules for custom agents:**

1. **Single expertise.** If you find yourself describing two specialties, write two agents.
2. **Tool whitelist must be minimal.** Each tool is a capability boundary; don't include tools the agent doesn't actually need.
3. **Iron Law mandatory.** One non-negotiable rule that the agent will refuse to violate.
4. **Structured output format.** End every run with a report block + `Status:` line.
5. **Document `when_to_invoke` precisely.** Which skills dispatch this agent? When should they NOT?

---

## CI Enforcement

`docs/AGENTS.md` is sync-checked by `lib/check-plugin-sync.js`. Invariant 5 verifies that every agent file in `agents/` has a corresponding `### \`<name>\`` heading section in this document. If a new agent is added but not documented here, CI fails.

The doc's `**Last updated:**` version anchor is also sync-checked (Invariant 4) against `package.json` version. Bumping the project version requires bumping this line too.

---

## See Also

- `agents/<name>.md` — full agent source (this doc summarizes; the source is canonical)
- [`bin/agent-manager`](../bin/agent-manager) — CLI for install / list / create
- [`framework-management` skill](../skills/framework-management/SKILL.md) — scaffolding for new agents
- [`subagent-development` skill](../skills/subagent-development/SKILL.md) — patterns for parallel multi-agent waves
