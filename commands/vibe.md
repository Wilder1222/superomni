# /vibe

Activate the full **superomni** skill framework and launch the default guided workflow.

## Usage

```
/vibe              — activate framework, detect stage, and continue workflow
/vibe status       — show which skills are active and pipeline position
/vibe reset        — restart the guided workflow from the beginning
```

## What Happens

1. Loads `skills/using-skills/SKILL.md` as the meta-routing protocol
2. Detects current stage by scanning `docs/superomni/` artifacts
3. Applies a single human gate in THINK (spec approval)
4. Runs PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE in auto wave mode on DONE
5. After a full RELEASE completion, can offer optional self-iteration loop mode
6. Falls back to guided menu only when stage is ambiguous or user asks `/vibe` with no context

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

## All Available Commands

| Command | What it does |
|---------|-------------|
| `/vibe` | Activate framework, detect stage, and continue auto workflow |
| `/brainstorm` | Design a feature — produces `docs/superomni/specs/spec-[branch]-[session]-[date].md` |
| `/write-plan` | Turn a spec into an executable plan |
| `/execute-plan` | Run the plan step by step and produce execution evidence |
| `/review` | Structured code review and review artifact generation |
| `/release` | Combined release + retrospective workflow |
| `/loop` | Start bounded self-iteration toward a goal (default 3 iterations, max 5) |

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
