<!-- Reference: vibe stage-dispatch brief format + canonical stage→agent mapping. -->

# Vibe — Stage Dispatch Brief

Before invoking any skill, the `vibe` skill prints the following brief for the stage being entered. This gives the user full visibility into what is about to run.

## Brief Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Entering [STAGE] stage
  Skill  : [skill-name]
  Agents : [comma-separated agent list, or "none"]
  Output : [artifact that will be created]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Canonical Stage → Skill / Agent / Output Map

| Stage   | Skill              | Agents                                    | Output artifact |
|---------|--------------------|-------------------------------------------|-----------------|
| THINK   | `brainstorm`       | none                                      | `docs/superomni/specs/spec-*.md` |
| PLAN    | `writing-plans`    | `planner-reviewer`                        | `docs/superomni/plans/plan-*.md` |
| REVIEW  | `plan-review`      | `planner-reviewer` (+ `frontend-designer` if UI) | `docs/superomni/reviews/plan-review-*.md` |
| BUILD   | `executing-plans` / `subagent-development` / `refactoring` | `frontend-designer` (UI steps), `refactoring-agent` (debt cleanup), `explorer` (cross-file survey for ≥5-step waves) | `docs/superomni/executions/execution-*.md` |
| VERIFY  | `code-review` → `qa` → `verification` → `dependency-audit` | `planner-reviewer` (code/architecture review in isolated context, includes security-sensitive diffs & OWASP A06 dependency scan) | `docs/superomni/evaluations/evaluation-*.md` |
| RELEASE | `release` → `document-release` | `doc-writer` (post-ship documentation)    | `docs/superomni/releases/release-*.md` |

## Worked Example — Entering REVIEW

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Entering REVIEW stage
  Skill  : plan-review
  Agents : planner-reviewer
  Output : docs/superomni/reviews/plan-review-[branch]-[session]-[date].md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
