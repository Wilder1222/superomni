# superomni Agent Library

> Specialized AI agents for focused tasks — each with a single expertise, iron law, and defined output format.

## What Are Agents?

Agents are specialized AI personas defined as Markdown files in the `agents/` directory. Unlike skills (which define *how* the main agent behaves), agents are independent sub-personas that can be:

- **Spawned by the main agent** for complex parallel tasks (via `subagent-development` skill)
- **Installed from external sources** (GitHub, local files)
- **Created custom** for your project's unique needs

Each agent has:
1. **Identity** — a focused specialty and clear expertise boundary
2. **Iron Law** — one non-negotiable rule
3. **Process** — a phase-based protocol tailored to their domain
4. **Output format** — structured report with DONE/BLOCKED/DONE_WITH_CONCERNS status

---

## Built-in Agents

### `code-reviewer`

**Specialty:** Structured code review using the P0/P1/P2 priority framework.

**Iron Law:** Never approve code with P0 security issues.

**Use when:**
- You need a code review with explicit priority levels
- Security review is required
- You want to distinguish mechanical fixes from taste decisions

**Output:** Structured review with APPROVED / APPROVED_WITH_NOTES / CHANGES_REQUESTED verdict.

---

### `planner`

**Specialty:** Breaking complex goals into structured, executable plans.

**Iron Law:** Plans must not exceed 7 milestones. Split into sub-plans if larger.

**Use when:**
- A task is too large to start directly
- You need milestone-based acceptance criteria
- Risk assessment is required before starting

**Output:** `plan.md` with milestones, tasks, risks, and open questions.

---

### `debugger`

**Specialty:** Root-cause analysis and systematic bug resolution.

**Iron Law:** Never guess at a bug's cause. Every hypothesis must be verified with evidence.

**Use when:**
- A bug needs systematic investigation
- You want to avoid symptom-fixing
- The bug is intermittent or hard to reproduce

**Output:** Debug report with root cause, fix applied, and regression verification.

---

### `test-writer`

**Specialty:** Writing comprehensive, behavior-verifying test suites.

**Iron Law:** Tests must verify **what** the code does, not **how** it does it.

**Use when:**
- New code needs test coverage
- Existing tests need improvement
- You want TDD-style test-first development

**Output:** Test report with coverage metrics and test matrix.

---

### `security-auditor`

**Specialty:** OWASP-aware vulnerability identification and remediation.

**Iron Law:** Never approve code with P0 security issues.

**Use when:**
- Security review is required before deployment
- New user-facing endpoints are added
- Cryptographic or authentication changes are made

**Output:** Security audit report with threat model, findings by priority, and APPROVED / CHANGES_REQUIRED verdict.

---

### `architect`

**Specialty:** System design, layer auditing, and architectural decision-making.

**Iron Law:** Every architectural decision must be documented with its rationale.

**Use when:**
- System design review is needed
- Layer violations or high coupling are suspected
- Technology choices need evaluation

**Output:** Architecture review with APPROVED / REDESIGN_REQUIRED verdict.

---

### `evaluator`

**Specialty:** Criterion-by-criterion quality evaluation with evidence-backed verdicts.

**Iron Law:** Every finding requires evidence. Every verdict requires justification.

**Use when:**
- An independent quality gate is needed at any workflow transition
- Output quality needs scoring against defined acceptance criteria
- Regression checking is required before advancing to the next stage

**Output:** Evaluation report with APPROVED / APPROVED_WITH_NOTES / CHANGES_REQUIRED / EVALUATION_INCOMPLETE verdict and P0/P1/P2 findings.

---

### `ceo-advisor`

**Specialty:** Product strategy, scope validation, and demand analysis.

**Use when:** A product decision needs strategic validation before building.

---

### `designer`

**Specialty:** UX review, missing state detection, and AI slop identification.

**Use when:** A UI or UX change needs design quality review.

---

## Installing Agents

### From a URL (GitHub or any HTTPS source)

```bash
bin/agent-manager install https://raw.githubusercontent.com/user/repo/main/agents/my-agent.md
```

User-installed agents are stored in `~/.omni-skills/agents/` and available immediately.

### From a Local File

```bash
bin/agent-manager install ./path/to/my-agent.md
```

### List All Agents

```bash
bin/agent-manager list
```

### View Agent Details

```bash
bin/agent-manager info <name>
```

---

## Creating Custom Agents

### Quick scaffold

```bash
bin/agent-manager create <name>
```

Or use the slash command:

```
/create-agent <name>
```

### Manual creation

Create `agents/<name>.md` following this template:

```markdown
# [Name] Agent

You are the **superomni [Name]** — an AI agent specialized in [specialty].

## Your Identity

[2-3 sentences about expertise and approach]

## Iron Law

[The one rule this agent must never violate]

## Your Process

### Phase 1: [Name]
[Steps]

### Phase 2: [Name]
[Steps]

### Phase N: Output
[Output format]

## Output Format

\`\`\`
[NAME] REPORT
════════════════════════════════════════
[Fields]

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
\`\`\`
```

### Assigning Skills to Agents

Reference existing skills inside your agent definition:

```markdown
## Available Skills

This agent applies:
- `skills/systematic-debugging/SKILL.md` for root-cause analysis
- `skills/test-driven-development/SKILL.md` when writing tests
```

---

## Agent vs. Skill: When to Use Which

| Use | Agent | Skill |
|-----|-------|-------|
| Specialized expertise | ✅ | — |
| Spawned in parallel | ✅ | — |
| Reusable behavior protocol | — | ✅ |
| Main agent behavior | — | ✅ |
| Independent output format | ✅ | — |
| Cross-skill orchestration | ✅ | — |

**Rule of thumb:** Use a **skill** when you want the main agent to follow a protocol. Use an **agent** when you want to spawn a separate specialist with its own identity and focus.

---

## Removing Installed Agents

Only user-installed agents (in `~/.omni-skills/agents/`) can be removed:

```bash
bin/agent-manager remove <name>
```

Built-in agents (in `agents/`) are part of the framework and cannot be removed via this command.
