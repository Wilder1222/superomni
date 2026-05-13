# Implementation Plan (v2): superomni Framework Optimization

**Spec:** `docs/superomni/specs/spec-main-framework-optimization-v2-20260513.md`
**Branch:** main  **Session:** framework-optimization-v2  **Date:** 20260513
**Supersedes:** `plan-main-framework-optimization-20260513.md` (rebased onto post-pull main)

## Overview

Execute the 3-phase optimization confirmed in spec v2. Phase 1 (preamble diet + skill stratification) ships first as the lowest-risk, widest-blast-radius win. Phases 2 and 3 gated by Phase 1 acceptance.

**Key v2 deltas from v1 plan:**
- Skill retirements handled by upstream (ship→release, agent-management+writing-skills→framework-management) — dropped from plan.
- Step 7 (frontmatter) now covers 3 new skills (`refactoring`, `dependency-audit`, `framework-management`) — added to frontmatter map.
- Step 9 (agent consolidation) keeps 5 agents instead of 3 (`doc-writer`, `refactoring-agent` retained with their existing dispatch paths).
- Step 6 (content overflow) narrowed to 4 known-over-quota skills (`self-improvement`, `subagent-development`, `frontend-design`, `vibe`).
- framework-management/SKILL.md.tmpl gets the teaching update (it replaced `writing-skills`).

## Prerequisites

- [x] Spec v2 approved (marker: `docs/superomni/specs/.approved-spec-main-framework-optimization-v2-20260513`)
- [x] Main pulled to latest (ebf5f6d Merge PR #46)
- [x] Working tree clean on main
- [ ] Baseline snapshot captured (Step 1)

## Scope Completeness Checklist

**What must be built:**
- [x] `lib/preamble-core.md` (new, ≤30 lines)
- [x] `lib/preamble-ref.md` (new, ~105–130 lines)
- [x] Update `lib/gen-skill-docs.{js,sh,ps1}` + `lib/check-skill-docs.js` for new tokens + deprecated alias + cross-platform trailing-newline parity
- [x] Migrate 27 `SKILL.md.tmpl` to `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}`
- [x] (Conditional) Extract overflow from `self-improvement` / `subagent-development` / `frontend-design` / `vibe` if still >500 after preamble diet
- [x] Expand frontmatter on all 28 skills: `when_to_use`, `produces`, `consumes`, optional `dispatch-agent`
- [x] Update `framework-management/SKILL.md.tmpl` to teach the new 2-token pattern
- [x] Update `CLAUDE.md` skill table (trigger column disambiguated for conflict pairs)
- [x] (Phase 2) Agent consolidation 11 → 5
- [x] (Phase 3) Contract checker + `/vibe auto` + `workflow` stub
- [x] Tests via Testing Strategy

**What is explicitly out of scope (YAGNI):**
- Pipeline rename/reorder.
- `docs/superomni/<kind>/` directory or filename contract changes.
- `EnterPlanMode → brainstorm` rule changes.
- `skillOverrides` / `/learn` / `/doctor` equivalents.
- `frontend-design/reference/design-md-library/*` modifications.
- Net-new skills or agents.

## Steps

### Step 1: Baseline snapshot + work branch

**What:** Freeze current state, set up isolated work branch.
**Files:** `/tmp/omni-v2-baseline-skill-lines.txt`
**How:**
  1. `wc -l skills/*/SKILL.md | tee /tmp/omni-v2-baseline-skill-lines.txt` — per-skill counts (expect 9,947 total).
  2. `wc -l lib/preamble.md` — confirm 135.
  3. `npm run verify:skill-docs` — confirm green.
  4. `git checkout -b feat/framework-optimization-v2` — work branch.
**Verification:** `/tmp/omni-v2-baseline-skill-lines.txt` has 28 rows totaling 9,947. Baseline commit clean.
**Effort:** S

### Step 2: Write `lib/preamble-core.md` (≤30 lines)

**What:** The inlined core — status protocol, auto-advance one-liner, output-dir pointer, anti-sycophancy one-liner, TACIT-DENSE one-liner, telemetry one-liner. Each other section becomes a link to `preamble-ref.md`.
**Files:** `lib/preamble-core.md` (new)
**How:** Start from `lib/preamble.md`; compact each section to one sentence or compact table; emit a single trailing link `→ See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols`.
**Verification:** `[ $(wc -l < lib/preamble-core.md) -le 30 ]`.
**Effort:** S

### Step 3: Write `lib/preamble-ref.md` (~105–130 lines)

**What:** Deep-reference preamble with the 9 verbose sections.
**Files:** `lib/preamble-ref.md` (new)
**How:** Move verbatim from `lib/preamble.md`: Environment Detection, PROACTIVE Mode, Auto-Advance full table, Session Continuity, Question Confirmation Protocol, Context Window Management, Feedback Signal Protocol, Performance Checkpoint, TACIT-DENSE full table, Plan Mode Fallback, Telemetry details. Add top anchor comment.
**Verification:** File exists; concatenation of core + ref accounts for all source preamble content (allow ordering diffs).
**Effort:** S

### Step 4: Update `lib/gen-skill-docs.{js,sh,ps1}` for 2-token + backward compat + parity

**What:** Generators expand `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}`; preserve `{{PREAMBLE}}` as deprecated alias with stderr warning; strip single trailing newline from preamble-core/legacy content to guarantee byte parity.
**Files:** `lib/gen-skill-docs.js`, `lib/gen-skill-docs.sh`, `lib/gen-skill-docs.ps1`
**How:**
  1. In each, handle 3 tokens in priority order (`PREAMBLE_CORE` → `PREAMBLE_REF_LINK` → `PREAMBLE`).
  2. Fixed link line emitted for `{{PREAMBLE_REF_LINK}}`: `_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._`
  3. Strip trailing newline from `preamble-core.md` + `preamble.md` content before expansion (cross-platform byte parity).
  4. Emit stderr warning when `{{PREAMBLE}}` is expanded: `[deprecated] <file> uses {{PREAMBLE}}; migrate to {{PREAMBLE_CORE}} + {{PREAMBLE_REF_LINK}}`.
**Verification:**
  1. `npm run gen-skills` still processes all 27 templates without error.
  2. On a sample `brainstorm` tmpl, output from js / sh / ps1 matches via `diff`.
**Effort:** M

### Step 5: Update `lib/check-skill-docs.js` to mirror 3-token expansion

**What:** Checker's drift detection must recognize the same 3 tokens; otherwise it will report drift on every migrated tmpl.
**Files:** `lib/check-skill-docs.js`
**How:** Replace single-token `expandPreamble` with 3-token version (identical logic to gen-skill-docs.js). Strip trailing newline on preamble read (parity).
**Verification:** After Step 5, on a migrated tmpl, `npm run check:skill-docs` exits 0.
**Effort:** S

### Step 6: Migrate 27 `SKILL.md.tmpl` to new placeholders

**What:** Replace `{{PREAMBLE}}` → `{{PREAMBLE_CORE}}\n\n{{PREAMBLE_REF_LINK}}` in each. Leave body content untouched.
**Files:** 27 `skills/*/SKILL.md.tmpl`
**How:** One-shot node script:
```js
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, t.replace('{{PREAMBLE}}', '{{PREAMBLE_CORE}}\n\n{{PREAMBLE_REF_LINK}}'), 'utf8');
}
```
Then `npm run gen-skills`.
**Verification:**
  1. `grep -rn '{{PREAMBLE}}' skills/*/SKILL.md.tmpl` returns only the literal-content reference inside `framework-management/SKILL.md.tmpl` scaffolding example (at most 1-2 matches, all in code-fenced teaching examples that must be rewritten in Step 10).
  2. Total line count drop across all 28 `SKILL.md` ≥ 2,800.
  3. `npm run verify:skill-docs` exits 0.
**Effort:** M

### Step 6b: Post-Step-6 diff snapshot checkpoint (plan-review v1 note carried forward)

**What:** Record post-migration line counts into the execution doc.
**Files:** `docs/superomni/executions/execution-main-framework-optimization-v2-20260513.md` (append)
**How:** Run `wc -l skills/*/SKILL.md` and compute the delta vs baseline. Record in execution doc.
**Verification:** Execution doc has a "Post-Step-6" table with per-skill line count + delta.
**Effort:** S

### Step 7: Overflow extraction (conditional)

**What:** Only if any `SKILL.md` still > 500 lines after Step 6.
**Files:** Up to 4 skills' `SKILL.md.tmpl` + new `reference.md`.
**How:**
  1. `wc -l skills/*/SKILL.md | awk '$1 > 500'` — list offenders.
  2. For each offender, find the largest single non-operational section (verbose template, reference list). Move to `skills/<skill>/reference.md`.
  3. Replace the moved section in the skill body with a 1-line link.
  4. `npm run gen-skills`.
**Verification:** `wc -l skills/*/SKILL.md | awk '$1 > 500'` returns nothing.
**Effort:** M (skipped in v1 when unneeded — likely same this time)

### Step 8: Author `lib/frontmatter-map.json` (include 3 new skills)

**What:** Canonical per-skill frontmatter map — `when_to_use`, `produces`, `consumes`, optional `dispatch-agent`, optional `description_override`.
**Files:** `lib/frontmatter-map.json` (new)
**How:** Cover all 28 skills. Ground-truth `produces:` / `consumes:` from CLAUDE.md's document output convention + `workflow` skill. New-skill entries:
  - `refactoring` — triggers, `dispatch-agent: refactoring-agent`; consumes none; produces none (code edits only).
  - `dependency-audit` — triggers, consumes none; produces none.
  - `framework-management` — triggers, consumes none; produces none (dev tool).
  Disambiguate 6 trigger-conflict pairs via `description_override`: `brainstorm` / `office-hours`, `code-review` / `plan-review`, `vibe` / `workflow`, `tdd` / `subagent-dev`, `verification` / `self-improvement`, `refactoring` / `code-review`.
**Verification:** `jq 'length' lib/frontmatter-map.json` returns 28 (plus the `_comment` entry = 29 keys).
**Effort:** M

### Step 9: Author `lib/apply-frontmatter.js` + run it

**What:** One-shot script that rewrites the frontmatter block of every tmpl (or `using-skills/SKILL.md` direct) using the map.
**Files:** `lib/apply-frontmatter.js` (new) + 27 tmpls + `skills/using-skills/SKILL.md`
**How:**
  1. Parse existing frontmatter (`---...---`); preserve `name`, `allowed-tools`, preserve or override `description`.
  2. Emit new frontmatter in YAML block-scalar (`|`) form for strings containing `:` / `→` / quotes (avoids YAML parse errors).
  3. Emit `produces` / `consumes` as quoted strings or `~` (null) / `[]` (empty array).
  4. Emit `dispatch-agent:` as plain scalar if set.
  5. Run the script.
  6. `npm run gen-skills`.
**Verification:**
  1. `node -e "require('js-yaml').load(fs.readFileSync(...))"` parses every skill's frontmatter without error (requires `npm install --save-dev js-yaml` first).
  2. `grep -l '^when_to_use:' skills/*/SKILL.md | wc -l` returns 28.
  3. Similarly 28/28 for `produces:`, `consumes:`.
**Effort:** L (most of it is the frontmatter-map content in Step 8)

### Step 10: Update `framework-management/SKILL.md.tmpl` to teach new token pattern

**What:** `framework-management` is the merged successor of `writing-skills`. Its scaffolding example at the moment teaches `{{PREAMBLE}}` (single-token). Rewrite to teach `{{PREAMBLE_CORE}}` + `{{PREAMBLE_REF_LINK}}`.
**Files:** `skills/framework-management/SKILL.md.tmpl`
**How:**
  1. Find the code-fenced example teaching the skill frontmatter + `{{PREAMBLE}}` scaffold. Replace `{{PREAMBLE}}` in the example body with `{{PREAMBLE_CORE}}\n\n{{PREAMBLE_REF_LINK}}`.
  2. Find the prose reference(s) mentioning `{{PREAMBLE}}` as "include the preamble". Rewrite as: "include `{{PREAMBLE_CORE}}` (inlined core) and `{{PREAMBLE_REF_LINK}}` (on-demand ref link). The legacy single-token `{{PREAMBLE}}` is deprecated and emits a build-time warning."
  3. Verify the generator still emits a warning only for the literal token usage in the code example — OR use a visually distinct representation ("the legacy single-token form") in prose to avoid matching.
  4. `npm run gen-skills`.
**Verification:** `grep -c '{{PREAMBLE_CORE}}' skills/framework-management/SKILL.md` ≥ 2 (one in the actual header, one in the scaffold example). No un-escaped `{{PREAMBLE}}` in prose (checkbox / bullet) outside code blocks.
**Effort:** S

### Step 11: Update `CLAUDE.md` skill trigger table

**What:** Sharpen the trigger column for the 6 disambiguated conflict pairs.
**Files:** `CLAUDE.md`
**How:** For `code-review`, `plan-review`, `workflow`, `release`, `test-driven-development`, `executing-plans` — append a disambiguating clause (e.g., "NOT for plans — use plan-review"). Leave priority unchanged. Keep `refactoring` / `dependency-audit` / `framework-management` rows intact (upstream already added).
**Verification:**
  1. `grep -c "^| executing-plans" CLAUDE.md` returns 1.
  2. `grep -c "NOT for" CLAUDE.md` ≥ 5 (at least 5 disambiguating clauses).
**Effort:** S

### Step 12: Phase 1 gate — acceptance criteria check

**What:** Verify all Phase 1 spec acceptance criteria pass; STOP if any fail.
**Files:** `docs/superomni/executions/execution-main-framework-optimization-v2-20260513.md` (append results)
**How:** Run each AC from spec v2 § Phase 1 and record exit codes. If any FAIL, STOP and report DONE_WITH_CONCERNS.
**Verification:** All 8 ACs PASS.
**Effort:** S

### Step 13: User gate — PAUSE for Phase 1 review

**What:** STOP here. User-approved strategy: Phase 1 ships in isolation, user validates, then Phase 2 proceeds.
**Files:** None.
**How:** Print Phase 1 summary (line counts, AC results, files changed). Wait for user "Phase 2 go" before proceeding.
**Verification:** User acknowledges Phase 1.
**Effort:** S

### Step 14: Phase 2 — design & author 3 canonical + retain 2 pass-through agents

**What:** Consolidate 11 → 5 agents. Retire 6 orphan agents. Rename `architect` → `planner-reviewer`, `designer` → `frontend-designer`. Add `explorer`. Keep `doc-writer`, `refactoring-agent`.
**Files:** `agents/explorer.md` (new), `agents/planner-reviewer.md` (rename+extend `architect.md`), `agents/frontend-designer.md` (rename+extend `designer.md`), `agents/doc-writer.md` (add Anthropic-spec frontmatter), `agents/refactoring-agent.md` (add Anthropic-spec frontmatter), retire `agents/{ceo-advisor,code-reviewer,debugger,evaluator,planner,security-auditor,test-writer}.md`
**How:**
  1. Add Anthropic-spec frontmatter to every surviving agent: `description`, `tools`, `model`, `when_to_invoke`.
  2. `explorer.md` — read-only repo exploration; tools: `[Read, Grep, Glob, Bash(git log*), Bash(git status*)]`.
  3. `planner-reviewer.md` — promoted from `architect.md`; fused architecture + planner + evaluator role for isolated-context review.
  4. `frontend-designer.md` — promoted from `designer.md`; tools: `[Read, Grep, Write, Bash(npm*)]`.
  5. Merge retired-agent unique content:
     - `ceo-advisor.md` → `skills/office-hours/reference.md` (6 forcing questions)
     - `code-reviewer.md`, `evaluator.md`, `test-writer.md`, `security-auditor.md` → skim for unique bullets, append to matching skill's `reference.md`; otherwise drop.
     - `debugger.md`, `planner.md` → confirm fully covered by `systematic-debugging` / `writing-plans`; drop if redundant.
  6. `git rm agents/{ceo-advisor,code-reviewer,debugger,evaluator,planner,security-auditor,test-writer,architect,designer}.md`.
**Verification:**
  1. `ls agents/ | wc -l` returns 5.
  2. `ls agents/` returns exactly `doc-writer.md`, `explorer.md`, `frontend-designer.md`, `planner-reviewer.md`, `refactoring-agent.md`.
  3. Every agent file's first line is `---` (YAML frontmatter present).
**Effort:** L

### Step 14.5: Rewrite pipeline stage→agent mapping (ADDED 20260513 post-careful-assessment)

**Why this step was added:** The `careful` skill assessment after Phase 1 commit revealed the retired agents (`planner`, `evaluator`, `code-reviewer`, `security-auditor`, `test-writer`, `designer`, `architect`, `ceo-advisor`, `debugger`) are referenced 78 times across 13 skill files including the **core pipeline stage→agent routing table in `skills/vibe/SKILL.md.tmpl` (lines 300-305)**. A simple grep-delete would leave the table pointing at dead files. Step 14.5 defines the concrete remap.

**What:** Rewrite the stage→agent table in `vibe/SKILL.md.tmpl` and update every other skill that references retired agent names to use the 5 canonical surviving agents. This step MUST run BEFORE Step 14's `git rm` so the table is always self-consistent.

**Files:** `skills/vibe/SKILL.md.tmpl`, `skills/plan-review/SKILL.md.tmpl`, `skills/frontend-design/SKILL.md.tmpl`, `skills/code-review/SKILL.md.tmpl`, `skills/executing-plans/SKILL.md.tmpl`, `skills/harness-engineering/SKILL.md.tmpl`, `skills/writing-plans/SKILL.md.tmpl`, `skills/framework-management/SKILL.md.tmpl`, `skills/using-skills/SKILL.md`, `skills/brainstorm/SKILL.md.tmpl` (+ any other file grep finds)

**How — concrete remap table:**

| Stage    | Retired agents today              | Remapped to (5 canonical)                                  | Rationale |
|----------|-----------------------------------|------------------------------------------------------------|-----------|
| THINK    | (none)                            | (none)                                                     | brainstorm runs in main context |
| PLAN     | `planner`                         | `planner-reviewer` (renamed from `architect`)              | planner-reviewer absorbs planner+evaluator+architect |
| REVIEW   | `ceo-advisor`, `architect`, `designer` | `planner-reviewer` (+ `frontend-designer` if UI)       | CEO-forcing-questions merge into plan-review skill body; architect → planner-reviewer |
| BUILD    | `test-writer`, `evaluator`, `designer`, `refactoring-agent` | `frontend-designer` (UI steps), `refactoring-agent` (debt), `explorer` (cross-file survey). test-writing folded into `test-driven-development` skill (runs in main context); evaluation folded into `verification` skill | test-writer + evaluator had no context-isolation benefit |
| VERIFY   | `code-reviewer`, `security-auditor`, `test-writer`, `evaluator` | `planner-reviewer` (code/architecture review in isolated context). Security audit, test-gap, final eval fold into `code-review` / `qa` / `verification` skills (main context) | security-auditor / code-reviewer / test-writer / evaluator overlap 1:1 with the skill they "support" |
| RELEASE  | `doc-writer` (kept)               | `doc-writer` (unchanged)                                   | Already has dispatch path |

**New vibe table (lines 300-305 after remap):**

```markdown
| Stage   | Skill              | Agents                                    | Output artifact |
|---------|--------------------|-------------------------------------------|-----------------|
| THINK   | `brainstorm`       | none                                      | `docs/superomni/specs/spec-*.md` |
| PLAN    | `writing-plans`    | `planner-reviewer`                        | `docs/superomni/plans/plan-*.md` |
| REVIEW  | `plan-review`      | `planner-reviewer` (+ `frontend-designer` if UI) | `docs/superomni/reviews/plan-review-*.md` |
| BUILD   | `executing-plans` / `subagent-development` / `refactoring` | `frontend-designer` (UI steps), `refactoring-agent` (debt cleanup), `explorer` (cross-file survey) | `docs/superomni/executions/execution-*.md` |
| VERIFY  | `code-review` → `qa` → `verification` → `dependency-audit` | `planner-reviewer` (code review in isolated context) | `docs/superomni/evaluations/evaluation-*.md` |
| RELEASE | `release` → `document-release` | `doc-writer` (post-ship documentation)    | `docs/superomni/releases/release-*.md` |
```

**Sub-steps:**
  1. Grep every file listed above for each retired agent name; replace per the mapping table.
  2. For `frontend-design/SKILL.md.tmpl`, replace all `designer agent` → `frontend-designer agent` (same agent, new name).
  3. For `plan-review/SKILL.md.tmpl`, replace `ceo-advisor` references with an inline section header "Strategy Review (CEO lens)" — the forcing questions already live in plan-review skill body.
  4. For `systematic-debugging/SKILL.md.tmpl`, replace `debugger agent` references with `explorer` agent (for root-cause evidence-gathering in isolated context).
  5. `npm run gen-skills && npm run verify:skill-docs`.

**Verification:**
  1. `grep -rE '\b(ceo-advisor|code-reviewer|debugger|evaluator|security-auditor|test-writer)\b' skills/` returns 0 matches (outside history/retired-content reference).
  2. `grep -rE '\b(architect|designer|planner)\b\.md' skills/` returns 0 matches (renamed forms).
  3. `grep -rnE '\b(architect|designer|planner)(-agent)?\b' skills/` shows only: `planner-reviewer`, `frontend-designer`, `refactoring-agent` (the 3 canonical renames/existing).
  4. `vibe/SKILL.md.tmpl` stage table contains only the 5 canonical agents.
  5. `npm run verify:skill-docs` passes.

**Effort:** M (touches ~15 skill files; mechanical replace per mapping table)

### Step 15: Wire `dispatch-agent` references

**What:** Skills that benefit from isolated context call the 5 canonical agents by name.
**Files:** `skills/{investigate,code-review,systematic-debugging,plan-review,frontend-design,qa,document-release,refactoring,executing-plans}/SKILL.md.tmpl`
**How:**
  1. For each, add `dispatch-agent: <name>` to frontmatter.
  2. In the body, add/update a code-fenced agent invocation block.
  3. Remove any references to retired agent names (`architect.md`, `designer.md`, `ceo-advisor`, `code-reviewer`, `debugger`, `evaluator`, `planner`, `security-auditor`, `test-writer`).
**Verification:**
  1. `grep -rE '\b(ceo-advisor|code-reviewer|debugger|evaluator|security-auditor|test-writer)\b|\b(architect|designer|planner)\.md' skills/` returns zero matches for retired forms.
  2. Each skill with `dispatch-agent:` has a code-fenced invocation block.
**Effort:** M

### Step 16: Update `CLAUDE.md` agent section + `using-skills` Quick Reference

**What:** Two canonical docs reflect the 5-agent surface.
**Files:** `CLAUDE.md`, `skills/using-skills/SKILL.md`
**How:**
  1. Add "Agents Available" table to `CLAUDE.md` listing 5 agents with when-to-invoke.
  2. Update `using-skills` Quick Reference where retired agent names appeared.
  3. Confirm `EnterPlanMode → brainstorm` rule intact in both files.
**Verification:**
  1. `grep -c "explorer\|planner-reviewer\|frontend-designer\|doc-writer\|refactoring-agent" CLAUDE.md` ≥ 5.
  2. `grep -c "EnterPlanMode" CLAUDE.md` ≥ 5 (current count — must not drop).
**Effort:** S

### Step 17: Phase 2 gate

**What:** Verify Phase 2 ACs and global regression gates.
**Files:** `docs/superomni/executions/execution-*.md` (append)
**How:** Run each Phase 2 AC from spec v2. STOP on any FAIL.
**Verification:** All ACs PASS.
**Effort:** S

### Step 18: Phase 3 — strengthen `lib/check-workflow-contract.js`

**What:** Validate `produces` ↔ `consumes` linkage; exempt pre-20260513 sessions.
**Files:** `lib/check-workflow-contract.js`
**How:**
  1. Use `js-yaml` to load every skill's frontmatter.
  2. Build graph: for each skill with `consumes: [X, Y]`, assert each matches some skill's `produces:` pattern.
  3. For every session under `docs/superomni/` with date ≥ 20260513, walk the stage chain and validate presence.
  4. Exempt pre-20260513 sessions (date in filename).
  5. Exit 1 on any break; emit diagnostic per failure.
**Verification:**
  1. Inject temporary break → `npm run check:workflow-contract` exits 1.
  2. Restore → exits 0.
  3. Legacy sessions (e.g., `release-main-*-20260420`) do NOT trigger failures.
**Effort:** M

### Step 19: Add `/vibe auto` subcommand

**What:** Single-command auto-chain.
**Files:** `commands/vibe.md`, `skills/vibe/SKILL.md` (+ its `.tmpl`)
**How:**
  1. Document `/vibe auto` in `commands/vibe.md`: chains `brainstorm → writing-plans → plan-review → executing-plans → code-review → qa → verification → release`, honors only THINK spec-approval gate.
  2. In `vibe/SKILL.md.tmpl`, add `auto` mode section. Logic: start from detected stage; on each `DONE`, invoke next skill; respect approval gate; STOP on any non-DONE.
  3. Rebuild.
**Verification:**
  1. Dry-run on trivial test spec (`docs/superomni/specs/spec-main-demo-<date>.md`): all 6 stage artifacts produced with one human interaction.
  2. Inject forced `BLOCKED` → `/vibe auto` stops cleanly.
**Effort:** L

### Step 20: Demote `workflow/SKILL.md` to ≤50-line stub

**What:** Reference stub pointing to `using-skills` + `vibe auto` — operational logic lives elsewhere.
**Files:** `skills/workflow/SKILL.md.tmpl` → rewrite
**How:** Minimal frontmatter + 1-paragraph summary + redirect links. Rebuild.
**Verification:** `[ $(wc -l < skills/workflow/SKILL.md) -le 50 ]`.
**Effort:** S

### Step 21: Phase 3 gate + global regression gate

**What:** Final verification before PR.
**Files:** `docs/superomni/executions/execution-*.md` (final checklist)
**How:**
  1. `npm run check:skill-docs && npm run validate-skills && npm run check:workflow-contract` — all exit 0.
  2. `grep -c "EnterPlanMode" CLAUDE.md` — must still be ≥ 5.
  3. Trigger-conflict grep — 0 collisions.
  4. `ls skills/frontend-design/reference/design-md-library/` — 8 brand DESIGN.md files untouched.
  5. `grep -l "framework-management" skills/framework-management/SKILL.md` — upstream consolidation preserved.
**Verification:** All PASS.
**Effort:** S

### Step 22: Produce execution + evaluation artifacts, open PR

**What:** Close out sprint.
**Files:** `docs/superomni/executions/execution-main-framework-optimization-v2-20260513.md`, `docs/superomni/evaluations/evaluation-main-framework-optimization-v2-20260513.md` (the latter written in VERIFY stage by `verification`, not here).
**How:** Commit with message `feat: framework optimization v2 — preamble diet + agent consolidation + pipeline contract`; open PR against `main`.
**Verification:** PR exists; CI green.
**Effort:** S

## Testing Strategy

- **Unit-level:** `wc -l`, `grep`, `ls` checks in Steps 2, 3, 6, 7, 9, 14, 20.
- **Integration:** `npm run gen-skills` + `verify:skill-docs` + `validate-skills` + `check:workflow-contract` at every gate (12, 17, 21).
- **Cross-platform parity:** Steps 4's `diff` across js/sh/ps1 output.
- **YAML validity:** `js-yaml` parse of every skill's frontmatter (Step 9).
- **Contract break test:** Step 18 inject-break + restore cycle.
- **End-to-end:** Step 19 `/vibe auto` dry-run on trivial test spec.
- **Regression:** Step 21 regression gate (EnterPlanMode rule, design-md-library intact, framework-management consolidation preserved, artifact filenames valid).

## Rollback Plan

- Each phase is a tight commit set. To undo:
  - **Phase 1:** `git revert <phase1 commits>`; generators fall back to single-token; frontmatter reverts to minimal form.
  - **Phase 2:** retired agent files live in git history; `git checkout main -- agents/` restores all 11 originals.
  - **Phase 3:** revert 3-4 specific files (contract checker, vibe.md/tmpl, workflow stub).
- Hard escape: `git reset --hard main` on the work branch.

## Dependencies

- `js-yaml` (`npm install --save-dev js-yaml`) — for contract checker and apply-frontmatter + Step 9 verification.
- No external services, no network, no runtime hot path.

## Design Direction (if UI work)

N/A — no UI work.

## Success Criteria

- [ ] **Phase 1 AC:** preamble-core ≤30 lines, preamble-ref exists, every SKILL.md body ≤500 lines, total line drop ≥2,800, 28/28 frontmatter completeness, `verify:skill-docs` green, cross-platform parity byte-identical, `framework-management` teaches new token pattern.
- [ ] **Phase 2 AC:** `agents/` exactly 5 files; each has Anthropic-spec frontmatter; retired-name grep returns 0; CLAUDE.md + using-skills updated; every dispatch-agent declared in frontmatter has concrete invocation block.
- [ ] **Phase 3 AC:** contract checker validates linkage and exits non-zero on break; `/vibe auto` completes test spec with one human interaction; `workflow/SKILL.md` ≤50 lines; 0 trigger collisions.
- [ ] **Global regression:** EnterPlanMode rule preserved, design-md-library intact, framework-management consolidation preserved, all CI green, PR opened.

## Deferred to Backlog

- `skillOverrides`-equivalent (user-level skill demotion)
- `/doctor` budget diagnostics
- `/learn` cross-session learning store
- Any additional agents beyond the 5
- Pipeline stage rename/reorder

## Next Stage

On DONE → auto-advance to **REVIEW** via `plan-review`, producing `review-main-framework-optimization-v2-20260513.md` with all decisions auto-resolved.
