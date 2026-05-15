# Execution: Token-Literal Advisory (v0.6.4)

**Plan:** `docs/superomni/plans/plan-main-token-literal-advisory-20260515.md`
**Review:** `docs/superomni/reviews/plan-review-main-token-literal-advisory-20260515.md`
**Branch:** `feat/skill-layering-anthropic` (HEAD = fda1cb1, v0.6.3)  **Date:** 20260515

## Step 1: Baseline ✓
Clean tree (only sprint artifacts untracked); all 5 CI commands green; total skill body 6,249 lines (unchanged from v0.6.3 final).

## Step 2: Advisory implemented ✓
Added 4th loop in `lib/check-skill-docs.js`. ~30 LOC including:
- Token list (3 PREAMBLE variants)
- Code-fence state tracking via ` ``` ` toggle
- Inline-backtick span stripping via regex (handles ` `…` ` and ` `` …`` `)
- First-occurrence per-token allowance (matches generator semantics)
- Advisory message with `file:line` and clear remediation hint

## Step 3: Clean state verified ✓
Initial run flagged a real false-positive on `framework-management/SKILL.md.tmpl:226` because the line uses `` `{{PREAMBLE_CORE}}` `` and `` `{{PREAMBLE_REF_LINK}}` `` — inline-backtick'd. Refined the implementation to strip inline-backtick spans before scanning. Post-refinement: 0 advisories on current 27 tmpls.

## Steps 4-5: Demos ✓

| Demo | Setup | Expected | Result |
|---|---|---|---|
| Positive | Append `\nTest prose with literal {{PREAMBLE_CORE}} token outside any backtick or fence.\n` to brainstorm tmpl | Advisory fires | ✓ Fired with `skills/brainstorm/SKILL.md.tmpl:224: literal '{{PREAMBLE_CORE}}' in prose...` |
| Negative (fence) | Append fenced block containing `{{PREAMBLE_CORE}}` | No advisory | ✓ No fire |
| Negative (inline backtick) | Append line with `` `{{PREAMBLE_CORE}}` `` | No advisory | ✓ No fire |

All restored cleanly between demos.

## Step 6: Final regression gate ✓

| Invariant | Pre-sprint | Post-sprint | Status |
|---|---|---|---|
| Skills count | 28 | 28 | ✓ |
| Agents count | 5 | 5 | ✓ |
| EnterPlanMode mentions in CLAUDE.md | 5 | 5 | ✓ |
| Flat reference.md files | 0 | 0 | ✓ |
| `${CLAUDE_SKILL_DIR}` literal token refs (5 v0.6.1-trimmed skills) | 15 | 15 | ✓ |
| `frontend-design/reference/design-md-library/` entries | 9 | 9 | ✓ |
| Total `wc -l skills/*/SKILL.md` | 6,249 | 6,249 | ✓ (advisory adds no skill content) |
| `verify:skill-docs` (gen + check + fixture-parity + test:generators) | green | green | ✓ |
| `check:workflow-contract` | exit 0 | exit 0 | ✓ |
| `validate-skills.sh` | 1 warning (workflow stub) | 1 warning (workflow stub) | ✓ |

## Step 7: Version Bump ✓
- `package.json` 0.6.3 → 0.6.4
- `.claude-plugin/marketplace.json` ×2 → 0.6.4
- `.claude-plugin/plugin.json` → 0.6.4
- `claude-skill.json` → 0.6.4
- `CHANGELOG.md` new `[0.6.4]` entry

## Mid-build observation

Initial implementation only checked code fences, not inline backticks. First clean-state run surfaced a false-positive on framework-management's Quality Checklist (which legitimately uses `` `{{PREAMBLE_CORE}}` `` to teach authors). Refined to strip inline-backtick spans before scanning. This iteration cost ~5 minutes but produced a more correct advisory: the version-shipped tool ignores both fence and inline-code, matching markdown rendering semantics.

**Overall execution status: DONE.** All ACs met; advisory works as designed in 3/3 cases (positive + 2 negatives).
