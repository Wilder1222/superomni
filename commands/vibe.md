# /vibe

Activate the full **superomni** skill framework and launch the default guided workflow.

## Usage

```
/vibe              — activate framework, detect stage, and continue workflow
/vibe auto         — run the full pipeline end-to-end with only the THINK gate
/vibe status       — show which skills are active and pipeline position
/vibe reset        — restart the guided workflow from the beginning
```

## What Happens

1. Loads `skills/using-skills/SKILL.md` as the meta-routing protocol
2. Detects current stage by scanning `docs/superomni/` artifacts
3. Applies a single human gate in THINK (spec approval)
4. Runs PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE in auto wave mode on DONE
5. Falls back to guided menu only when stage is ambiguous or user asks `/vibe` with no context

## Core Workflow Pipeline

```
THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE
```

Human confirmation gate:
- Spec file review/approval in THINK

`brainstorm` runs without manual gate. Everything after spec approval auto-advances in waves.

## Stage Artifact Contract

Every stage must leave document evidence before advancing:

| Stage | Required artifact |
|------|-------------------|
| THINK | `docs/superomni/specs/spec-[branch]-[session]-[date].md` |
| PLAN | `docs/superomni/plans/plan-[branch]-[session]-[date].md` |
| REVIEW | `docs/superomni/reviews/review-[branch]-[session]-[date].md` |
| BUILD | `docs/superomni/executions/execution-[branch]-[session]-[date].md` or `docs/superomni/subagents/subagent-[branch]-[session]-[date].md` |
| VERIFY | `docs/superomni/evaluations/evaluation-[branch]-[session]-[date].md` |
| RELEASE | `docs/superomni/releases/release-[branch]-[session]-[date].md` |

If the stage artifact is missing, do not auto-advance.

## /vibe auto — Single-Command End-to-End Pipeline

`/vibe auto` chains every pipeline stage into a single invocation. Useful when you have a clear feature idea and want to hand the full sprint to the framework with minimum interaction.

### Flow

```
User → /vibe auto "feature description"
         ↓
THINK    brainstorm          → spec-*.md
         ↓ ── HUMAN GATE: approve spec ──
PLAN     writing-plans       → plan-*.md       → auto-advance on DONE
REVIEW   plan-review         → review-*.md     → auto-advance on DONE
BUILD    executing-plans     → execution-*.md  → auto-advance on DONE
                              (dispatches subagent-development, test-driven-development,
                               frontend-design, refactoring as needed)
VERIFY   code-review → qa → verification       → auto-advance on DONE
                              → evaluation-*.md
RELEASE  release             → release-*.md    → end of pipeline
```

### Rules

- **Only one human gate:** spec approval at THINK. Everything else runs hands-free.
- **Any non-DONE status stops the pipeline.** `BLOCKED`, `DONE_WITH_CONCERNS`, or `NEEDS_CONTEXT` surfaces to the user before the next stage starts. This is by design — safety beats autonomy.
- **Stage artifact contract is enforced.** If a stage reports DONE but the expected artifact is missing, `/vibe auto` stops and flags the harness deficiency.
- **Skill frontmatter `produces:` / `consumes:` is validated** by `npm run check:workflow-contract`. Run the contract checker in CI to catch drift.

### When NOT to use /vibe auto

- You want step-by-step human oversight → use plain `/vibe` (which stops at every stage).
- The task is exploratory / research-only → use `investigate` skill directly.
- You already have a spec and want to skip THINK → invoke `/write-plan` directly.

## All Available Commands

| Command | What it does |
|---------|-------------|
| `/vibe` | Activate framework, detect stage, and continue auto workflow |
| `/brainstorm` | Design a feature — produces `docs/superomni/specs/spec-[branch]-[session]-[date].md` |
| `/write-plan` | Turn a spec into an executable plan |
| `/execute-plan` | Run the plan step by step and produce execution evidence |
| `/review` | Structured code review and review artifact generation |

## First-Time Setup

If superomni is not yet installed, run one of these in your terminal:

```bash
npm install -g github:Wilder1222/superomni   # recommended — installs globally from GitHub
# or
npx github:Wilder1222/superomni              # one-time run without permanent install
# or
git clone https://github.com/Wilder1222/superomni.git && cd superomni && ./setup
```

## Skill Reference

See `skills/using-skills/SKILL.md` for the full framework protocol.
