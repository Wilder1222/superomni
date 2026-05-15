# superomni Token-Literal Advisory (v0.6.4)

**Branch:** main  **Session:** token-literal-advisory  **Date:** 20260515
**Predecessor:** v0.6.3 (`spec-main-dynamic-context-and-careful-gate-20260515.md`) shipped locally on `feat/skill-layering-anthropic` (commit fda1cb1). v0.6.4 layers on top.

## Why this spec

v0.6.3 retro flagged a P2 ACTION still open: the `framework-management/SKILL.md.tmpl` mid-build bug where literal `{{PREAMBLE}}` text in prose was expanded by the generator's deprecated-alias path, ballooning the body. Fix took 1 corrective cycle. The bug class is foreseeable: any author editing a `.tmpl` file and using `{{PREAMBLE}}`, `{{PREAMBLE_CORE}}`, or `{{PREAMBLE_REF_LINK}}` in plain prose (not in canonical position, not inside code fences) will trigger the same self-expansion.

A 30-LOC advisory in `lib/check-skill-docs.js` catches the entire bug class proactively — same form as the existing 3 advisories from v0.6.1-v0.6.2 (300-line / flat-reference / CRLF).

This is a single-purpose patch: one bug class, one advisory, one CI gate.

## Problem

| # | Concrete problem | Impact |
|---|---|---|
| 1 | Author edits `.tmpl` to document a token (e.g., teaching the deprecated alias). Generator expands the literal token mid-prose. Body balloons silently. | M: takes 1 corrective cycle to find + fix; missed v0.6.3's first regen pass |

## Goals

- **G1.** `lib/check-skill-docs.js` adds a 4th advisory: warn (stderr; exit 0) when a `SKILL.md.tmpl` contains `{{PREAMBLE}}`, `{{PREAMBLE_CORE}}`, or `{{PREAMBLE_REF_LINK}}` outside its canonical first-occurrence-only position **and** outside any code-fenced block.
- **G2.** Fixture demonstrates positive trigger: a tmpl with literal `{{PREAMBLE_CORE}}` in prose (after canonical position, outside code fence) fires the advisory.
- **G3.** Negative case demonstrated: existing 27 tmpls (which use canonical position + the framework-management body which now uses prose phrasing instead of literal token) do NOT trigger.

## Non-Goals (YAGNI)

- **NOT** turning the advisory into a hard error. v0.6.x advisories are stderr-only on principle.
- **NOT** auto-escaping or auto-fixing offending tokens. Authors should rewrite as prose.
- **NOT** adding similar advisories for `${CLAUDE_SKILL_DIR}` (no expansion footgun there — Anthropic runtime resolves it).
- **NOT** adding similar advisories for `${CLAUDE_SESSION_ID}` or `$ARGUMENTS` (not used in this codebase).
- **NOT** changing skill / agent counts. NOT changing pipeline. NOT migrating dispatch-agent.

## Proposed Solution

**Selected approach: G — "Single advisory, one CI test, version bump."**

One phase. Touch surface = `lib/check-skill-docs.js` + 1 test fixture (temporary, removed after demo) + 4 config files for version bump.

### Phase 1 — Advisory + demo

1. Edit `lib/check-skill-docs.js`. After the existing 3 advisories, add a 4th loop:
   - For each `SKILL.md.tmpl`, parse line-by-line tracking code-fence state.
   - For each non-fenced line: count occurrences of `{{PREAMBLE}}`, `{{PREAMBLE_CORE}}`, `{{PREAMBLE_REF_LINK}}`.
   - The canonical first occurrence (the only one expanded by generators) is fine. After the first occurrence of each token, any further occurrence in non-fenced prose triggers the advisory.
   - Skip `framework-management/SKILL.md.tmpl` from the rule? No — it now uses prose phrasing, so it shouldn't trigger. If it ever uses literal again, we want the warning.
2. Verify with a temporary fixture (then remove): inject a literal `{{PREAMBLE_CORE}}` into a tmpl's prose; observe advisory; restore.
3. Verify clean state: on current `main` post-fix, no advisory fires.

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| Granularity | Per-tmpl, line-based with code-fence tracking | Code-fenced examples (`framework-management` documents the convention with code blocks) must NOT trigger | Explicit |
| Scope | All 27 `.tmpl` files; no exceptions | If `framework-management` reverts to literal token in prose, we want the warning | Explicit |
| Severity | Advisory (stderr; exit 0) | Matches v0.6.1-v0.6.2 advisory pattern | DRY |
| Tokens covered | All 3: PREAMBLE, PREAMBLE_CORE, PREAMBLE_REF_LINK | Each is expanded by generators; each can self-balloon | Completeness |
| Canonical-position detection | First occurrence of each token in the file is canonical (allowed); subsequent are flagged | Simpler than tracking line-number-context (e.g., "is this between `---` markers?"); first-occurrence-only is what generators actually do | Explicit > clever |

## Acceptance Criteria

### Phase 1

- [ ] `lib/check-skill-docs.js` has a new advisory loop for token-literal detection.
- [ ] Code-fence state correctly tracked: `\`\`\`` toggle ignored on lines starting with `\`\`\``.
- [ ] On clean state (post-v0.6.3), `npm run check:skill-docs` reports 0 token-literal advisories.
- [ ] Positive demo: temporarily insert `{{PREAMBLE_CORE}}` into a tmpl's prose (after canonical position, not in code fence); advisory fires with skill name + line number; remove fixture.
- [ ] Negative demo: insert the same token inside a `\`\`\`` code fence in the same tmpl; advisory does NOT fire.
- [ ] All other CI gates remain green: `verify:skill-docs`, `check:workflow-contract`, `validate-skills`, `verify:fixture-parity`, `test:generators`.

### Global regression gates

- [ ] `${CLAUDE_SKILL_DIR}` literal token preserved (15 occurrences in 5 v0.6.1-trimmed skills' SKILL.md).
- [ ] `EnterPlanMode → brainstorm` rule preserved (5 mentions in CLAUDE.md).
- [ ] `frontend-design/reference/design-md-library/*` unchanged (9 entries).
- [ ] No flat `reference.md` files (0).
- [ ] Skill / agent counts unchanged (28 / 5).
- [ ] Total `wc -l skills/*/SKILL.md` unchanged (advisory adds no skill-body lines; expected delta = 0).

### Version

- [ ] `package.json`, `.claude-plugin/marketplace.json` (×2), `.claude-plugin/plugin.json`, `claude-skill.json` all show `0.6.4`.
- [ ] `CHANGELOG.md` has new `[0.6.4] — 2026-05-15` entry.

## Open Questions

None. Single-purpose patch; no taste decisions.

## Frontend Design Note

N/A — no UI work.

## Deferred to v0.7.0+ Backlog (unchanged)

1. `context: fork` + `agent:` migration (architectural minor).
2. `$ARGUMENTS` / `$N` substitution adoption.
3. `model:` / `effort:` per-skill overrides.
4. `paths` glob auto-trigger (likely never).
5. Plan-content auto-linter (CI hard-gate for v0.6.3's Pre-Destructive Gate).
6. Live `/vibe` E2E test (still deferred from v0.6.2 retro).

## Next Stage

On approval → auto-advance to **PLAN** via `writing-plans`.

---

**Status: DONE — spec ready for user approval.**

This is a deliberately small spec. Single advisory, single CI gate, version bump. Approve and I'll auto-advance through the remaining stages.
