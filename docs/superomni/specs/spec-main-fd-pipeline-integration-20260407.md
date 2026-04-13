# Frontend-Design Pipeline Integration & Skill Audit — Spec

## Problem

`frontend-design` is a comprehensive P1 skill with a 5-phase workflow and 10-dimension quality gate, but it's **loosely coupled** to the vibe pipeline. Current integration points are weak:

- **brainstorm** (THINK): Only leaves a _note_ in the spec ("recommend running frontend-design during BUILD")
- **writing-plans** (PLAN): Mentions design direction for UI work, but no formal trigger
- **plan-review** (REVIEW): Has conditional Design phase, but it's a plan review — not design review
- **code-review** (VERIFY): Detects UI file changes and invokes designer agent
- **executing-plans** (BUILD): **Zero** references to frontend-design or designer agent
- **vibe** (entry point): **Zero** references to frontend-design in stage detection or menu

The result: when a user says `/vibe build me a portfolio site`, the pipeline goes brainstorm → plan → review → executing-plans (BUILD) — and `frontend-design` is never invoked unless the user manually calls it or the brainstorm spec happens to mention it.

## Goals

1. Integrate `frontend-design` as a **first-class participant** in the BUILD and VERIFY stages
2. Auto-detect UI-heavy tasks at THINK stage and route design decisions early
3. Ensure the designer agent quality gate runs automatically on UI changes (not just when manually invoked)
4. Audit all 28 skills for fitness and consistency

## Non-Goals (YAGNI)

- Not restructuring the 7-stage pipeline itself
- Not creating new skills — only modifying integration points
- Not changing the frontend-design skill's internal phases

## Proposed Solution (Refined — 3 changes, not 5)

After architectural review, brainstorm and writing-plans already have sufficient UI awareness (brainstorm Phase 3 Visual Companion + plan-review conditional Design phase). Adding `ui-heavy` flags and design direction sections to them would violate YAGNI and DRY. The real gap is only in the BUILD/routing layer.

### Change 1: `executing-plans/SKILL.md` — Frontend-design integration

Add to Step Execution Protocol:
- Step 3 "Frontend Check": if step involves UI files → apply `frontend-design` Phase 4 (Implementation)
- After all UI steps in a wave → run designer agent quality gate (Phase 5)
- If no design direction in plan → run frontend-design Phase 1-2 once per session

### Change 2: `vibe/SKILL.md` — Menu and routing

- Stage Detection Matrix: BUILD stage notes `frontend-design` for UI steps
- Phase 2 menu: add `/front-design mode:audit`, `/front-design mode:critique`, `/front-design mode:polish` command usage

### Change 3: `workflow/SKILL.md` — Documentation

- BUILD stage skills list: add `frontend-design (if UI steps)`
- Data flow diagram: add frontend-design → designer agent quality gate
- Quick Reference table: add "Build UI with design quality → frontend-design"

## Skill Audit Summary

### Well-Integrated (no changes needed)

| Skill | Role | Fitness |
|-------|------|---------|
| vibe | Entry point, stage detection | Good — needs frontend-design menu addition |
| using-skills | Meta-skill, always active | Good |
| brainstorm | THINK → spec | Good — needs stronger UI flag |
| writing-plans | PLAN → plan | Good — needs design direction step |
| plan-review | REVIEW gate | Good — already has conditional Design phase |
| executing-plans | BUILD → code | Gap — needs frontend-design integration |
| test-driven-development | BUILD → tests | Good |
| systematic-debugging | Any error → fix | Good |
| code-review | VERIFY → review | Good — already detects UI changes |
| qa | VERIFY → tests | Good |
| verification | VERIFY → checklist | Good |
| security-audit | VERIFY → security | Good |
| production-readiness | VERIFY → deploy gate | Good |
| careful | Safety guardrail | Good |
| subagent-development | Parallel execution | Good |
| ship | SHIP → release | Good |
| finishing-branch | SHIP → merge | Good |
| self-improvement | REFLECT → evaluation | Good |
| retro | REFLECT → retrospective | Good |
| workflow | Reference/orchestration | Good — needs frontend-design in BUILD |
| receiving-code-review | Review response | Good |
| harness-engineering | Harness audit | Good |
| writing-skills | Skill creation meta | Good |
| agent-management | Agent lifecycle | Good |
| git-worktrees | Parallel branches | Good |
| investigate | Exploration | Good |
| office-hours | Product discovery | Good |
| document-release | Post-ship docs | Good |

### Core Gap: frontend-design isolated from pipeline

The only skill with a significant integration gap. All other 27 skills are well-connected within their respective pipeline stages.

## Acceptance Criteria

- [x] executing-plans Step Execution Protocol includes Frontend Check (step 3)
- [x] executing-plans includes Frontend-Design Integration flow diagram
- [x] vibe Stage Detection Matrix notes frontend-design for BUILD
- [x] vibe Phase 2 menu includes `/front-design mode:audit`, `/front-design mode:critique`, `/front-design mode:polish`
- [x] workflow BUILD stage lists frontend-design in skills
- [x] workflow data flow diagram includes frontend-design
- [x] workflow Quick Reference includes frontend-design entry

## Open Questions

None — all changes are mechanical integrations based on existing skill protocols.
