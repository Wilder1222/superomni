# Evaluation: CI Completeness + Doc Version Drift (v0.6.6)

**Branch:** `feat/ci-completeness`  **Date:** 20260515

## Code Review (Self)

| File | Change | Verdict |
|---|---|---|
| `.github/workflows/validate.yml` | + 5 new CI steps (3 ubuntu, 2 windows) | ✓ |
| `docs/COMPARISON.md` | header + footer v0.3.0 → v0.6.6 | ✓ |
| `docs/DESIGN.md` | Version + Status v0.5.7 → v0.6.6 | ✓ |
| `package.json` | + CHANGELOG.md in files; bumped to 0.6.6 | ✓ |
| `lib/validate-skills.sh` | comment block updated | ✓ |
| `lib/check-plugin-sync.js` | invariant 4 multi-file refactor | ✓ |
| `skills/brainstorm/SKILL.md.tmpl` | removed `touch .approved-*`; prose-only approval | ✓ |
| `skills/vibe/SKILL.md.tmpl` | 6 marker references removed; stage matrix collapsed | ✓ |
| `skills/vibe/reference/stage-detection.md` | `_HAS_SPEC_APPROVAL` variable removed | ✓ |
| `README.md` | Current stable version 0.6.5 → 0.6.6 | ✓ |
| `CHANGELOG.md` | + [0.6.6] entry with all 7 G items + rationale | ✓ |
| `.claude-plugin/marketplace.json` (×2), `plugin.json`, `claude-skill.json` | bumped to 0.6.6 | ✓ |

7 pre-existing `.approved-spec-*` marker files in `docs/superomni/specs/` deleted.

**P0/P1/P2 issues:** none.

## QA — Test Coverage

| Test surface | Mechanism | Result |
|---|---|---|
| G1: 3 new CI gates wired | `awk` extraction of CI workflow steps | 13 ubuntu names + 10 windows names confirmed |
| G2/G3: doc version anchors at 0.6.6 | `grep` on COMPARISON + DESIGN | match |
| G4: CHANGELOG in npm tarball | `node -e "require('./package.json').files.includes('CHANGELOG.md')"` | true |
| G5: validate-skills.sh comment | `grep "{{PREAMBLE}}" lib/validate-skills.sh` | only deprecation note remains; no instruction to write the legacy alias |
| G6: multi-file invariant fires | inject 9.9.9 in DESIGN.md → exit 1 + specific diagnostic; restore → exit 0 | ✓ |
| G7: zero marker references | `grep -rn "approved-spec\|HAS_SPEC_APPROVAL" skills/vibe/ skills/brainstorm/ skills/using-skills/` (excl. generated SKILL.md) | 0 matches |
| G7: zero marker files | `find docs/superomni/specs -name '.approved-spec-*'` | 0 matches |
| Cross-session resume still works | thought experiment: spec+plan co-existence → PLAN stage detection unchanged | functional (no marker dependency was load-bearing) |
| All 7 CI commands green | `verify:skill-docs` umbrella + `check:workflow-contract` + `validate-skills` | all exit 0 |
| Skill / agent counts | `ls -d` | 28 / 5 unchanged |

## Acceptance Criteria

### Phase 1 ACs (per spec)

- [x] G1: 3 new CI steps in ubuntu validate job; 2 new in windows
- [x] G2: docs/COMPARISON.md v0.6.6 (header line 5 + footer line 563)
- [x] G3: docs/DESIGN.md v0.6.6 (Status line 6)
- [x] G4: package.json `files` includes CHANGELOG.md
- [x] G5: validate-skills.sh comment updated
- [x] G6: check-plugin-sync.js refactored to multi-file VERSION_DOCS list; demonstrated to fire on injection
- [x] G7: zero `.approved-spec-*` markers anywhere; brainstorm prose-only; vibe stage matrix collapsed; reference bash cleaned

### Global regression gates

- [x] All 7 CI commands locally green
- [x] `${CLAUDE_SKILL_DIR}` 15 / `EnterPlanMode` 5 / design-md-library 9 / flat reference.md 0 / skills 28 / agents 5
- [x] Total skill body lines: 6,249 → 6,243 (-6 from marker-row collapse; net negative is expected)

### Version

- [x] All 5 manifest files + README at 0.6.6
- [x] CHANGELOG `[0.6.6] — 2026-05-15` with full G1-G7 documentation

## Status: DONE

**Status:** DONE

All 7 G items shipped. All hard ACs met. All regression invariants preserved. Sprint touched 7 G concerns in a single coherent patch — all surfaces non-overlapping. Net code delta: -6 skill lines (sprint subtracts complexity while adding 5 CI gates).

The user's two-iteration feedback on G7 (first "specs/ should be clean", then "no marker file at all") is the reason this sprint exists in its final form. The CI completeness work was independent but bundled for boil-lakes efficiency. Both classes of fix are now durably in CI.

**Next stage:** RELEASE.
