# Evaluation KPI Schema — superomni

> **Purpose:** Unified definitions for all metrics collected by `lib/score-workflow.js` and reported by `lib/check-workflow-contract.js`.
> This schema is the single source of truth for what each KPI means, how it is measured, and what a healthy value looks like.

---

## KPI Dimensions

### 1. Gate Pass Rate
**Definition:** Ratio of evaluation artifacts where the evaluator agent returned `APPROVED` or `APPROVED_WITH_NOTES` out of all evaluation artifacts.

| Field | Value |
|-------|-------|
| Formula | `(APPROVED + APPROVED_WITH_NOTES) / total evaluations` |
| Source | `docs/superomni/evaluations/evaluation-*.md` — `APPROVED` / `APPROVED_WITH_NOTES` / `CHANGES_REQUIRED` verdict |
| Healthy | ≥ 0.80 |
| Warning | 0.60 – 0.79 |
| Critical | < 0.60 |

---

### 2. Evaluation Coverage
**Definition:** Ratio of evaluation artifacts to improvement artifacts. A sprint that produces an improvement report but no evaluation report has a coverage gap.

| Field | Value |
|-------|-------|
| Formula | `evaluations.count / improvements.count` |
| Source | `docs/superomni/evaluations/` and `docs/superomni/improvements/` |
| Healthy | ≥ 1.00 (at least one evaluation per improvement) |
| Warning | 0.50 – 0.99 |
| Critical | < 0.50 |

---

### 3. Agent Performance Score (avg)
**Definition:** Average of `Agent total: N/15` across all improvement reports.

| Field | Value |
|-------|-------|
| Formula | `mean(Agent total)` across all `docs/superomni/improvements/*.md` |
| Source | `## Agent Evaluation` section → `**Agent total: [N]/15**` |
| Healthy | ≥ 12 / 15 |
| Warning | 9 – 11 |
| Critical | < 9 |

---

### 4. Skill Effectiveness Score (avg)
**Definition:** Average of `Skills avg: N/5` across all improvement reports.

| Field | Value |
|-------|-------|
| Formula | `mean(Skills avg)` across all `docs/superomni/improvements/*.md` |
| Source | `## Skill Effectiveness` section → `**Skills avg: [N]/5**` |
| Healthy | ≥ 4.0 / 5 |
| Warning | 3.0 – 3.9 |
| Critical | < 3.0 |

---

### 5. Iron Law Compliance Rate
**Definition:** Fraction of Iron Laws followed per session, averaged across improvement reports.

| Field | Value |
|-------|-------|
| Formula | `mean(passed / total)` from `Iron Law compliance: N/M` fields |
| Source | `## Process Adherence` → `**Iron Law compliance: [N/5 laws followed]**` |
| Healthy | ≥ 0.90 |
| Warning | 0.70 – 0.89 |
| Critical | < 0.70 |

---

### 6. Context Efficiency (Preamble Size)
**Definition:** Line count of `lib/preamble.md`. Measures cognitive load imposed on every skill session.

| Field | Value |
|-------|-------|
| Formula | `wc -l lib/preamble.md` |
| Source | `lib/preamble.md` |
| Healthy | < 150 lines |
| Warning | 150 – 200 lines |
| Critical | > 200 lines |

---

## Artifact Contract — Required Sections per Type

| Artifact type | Required sections / fields | Validation tool |
|---------------|---------------------------|-----------------|
| `improvement-*.md` | `Agent total: N/15`, `Skills avg: N/5`, ≥ 3 `### ACTION N:` blocks | `check-workflow-contract.js` |
| `evaluation-*.md` | `**Status:** DONE\|DONE_WITH_CONCERNS\|BLOCKED` | `check-workflow-contract.js` |
| `release-*.md` | `## Release`, `## Retrospective` | `check-workflow-contract.js` |
| `spec-*.md` | `## Acceptance Criteria` or `## Success Criteria` | skill convention |
| `plan-*.md` | numbered steps with verification criteria | skill convention |
| `harness-audit-*.md` | `## Harness Health Score` with total `/25` | skill convention |

---

## Reporting Frequency

| Metric | When to check |
|--------|--------------|
| Gate pass rate | After every VERIFY stage |
| Evaluation coverage | After every RELEASE stage |
| Agent + skill scores | After every self-improvement session |
| Iron Law compliance | After every self-improvement session |
| Preamble efficiency | After every harness-engineering audit |

Run `npm run score:workflow` to get the current snapshot of all KPIs.
