# Plan Review — CI Completeness + Doc Version Drift (v0.6.6)

**Plan:** `docs/superomni/plans/plan-main-ci-completeness-20260515.md`
**Spec:** `docs/superomni/specs/spec-main-ci-completeness-20260515.md`
**Branch:** `feat/ci-completeness`  **Date:** 20260515  **Mode:** Auto.

## Phase 1: Strategy Review

```
STRATEGY REVIEW
  Premises: explicit (7 observed bugs documented with line numbers; user feedback on G7 captured in 2 iterations)
  Scope:    right-sized — single bug-batch patch; touch surfaces don't overlap
  Alternatives: considered — split into 2-3 patches (rejected: same CI cycle, single PR cleaner); skip G7 (rejected: user-explicit P1)
  DRY:      reuses existing — extends check-plugin-sync invariant 4; vibe cross-session-resume already detects spec+plan co-existence as PLAN-stage
  Risks:    (1) vibe stage matrix collapse may break legitimate "spec written but not yet approved" detection (M×M) — mitigation: gate is now spec-*.md alone (any spec triggers THINK); brainstorm STOPs and asks user; PLAN advance happens only when vibe is re-invoked AFTER user replied. Fundamentally same flow without filesystem signal.
  Strategy mode: SELECTIVE EXPANSION (7 observed bugs in single patch; user-directed P1 G7 added during THINK)
```

**Auto-decisions (Strategy):**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| S1 | Bundle G7 into v0.6.6? | Yes (vs separate v0.6.7) | T | Same touch surface (vibe + brainstorm); single CI cycle |
| S2 | Should G7 keep some lighter signal (e.g., a comment in spec file marking approval)? | No — pure conversational | M | User directive explicit |
| S3 | After G7, how does cross-session resume distinguish "spec written, not approved" from "spec approved, not yet planned"? | Same as before: spec exists + no plan ⇒ TWO sub-states (awaiting approval / approved-but-not-planned) collapse into "vibe should ask". Pre-G7 marker mechanism only worked within-session anyway. | T | Existing fallback already handles cross-session via last-session-artifacts.txt |

## Phase 2: Design Review

N/A — no UI.

## Phase 3: Engineering Review

```
ENGINEERING REVIEW
  Architecture: sound — additive (CI steps), subtractive (marker mechanism); no schema changes
  Test plan:    comprehensive — Step 11 grep confirms G7 completeness; Step 12 demonstrates G6 multi-file fires; Step 16 full regression
  Performance:  CI improves (3 more gates catch more drift); runtime neutral
  Security:     improves — defense-in-depth via more CI gates
  Blast radius: ~12 files modified, 0 new files. Largest single change: vibe SKILL.md.tmpl (6 references).
```

**Auto-decisions (Engineering):**

| # | Topic | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| E1 | Step 3 stage matrix collapse — keep "spec exists but not approved" as separate row? | No — collapse | M | Without marker, no way to distinguish; "spec exists" is the only signal |
| E2 | Step 9 invariant 4 file list — hard-coded array or external config file? | Hard-coded array in JS (top of script) | T | YAGNI on config-file split; ~5 entries expected long-term |
| E3 | Step 9 — what if a configured doc file doesn't exist? | Skip with warning to stderr (don't fail) | T | Permissive — projects may have varying doc layouts |
| E4 | Step 9 — what if regex doesn't match in an existing file? | Fail (probably means doc was reformatted; needs human attention) | M | Fail-loud is correct — silent skip would re-introduce drift class |
| E5 | Step 13 CI step ordering — fixture-parity before or after test-generators? | Fixture first, generators second, plugin-sync last | T | Logical: generator parity → generator semantics → cross-manifest semantics |
| E6 | Step 14 README bump location — also update docs/COMPARISON header? | Already covered by Step 5; don't double-edit | M | DRY |
| E7 | Step 14 — windows job CHANGELOG-files entry test? | Outside this sprint | M | npm pack doesn't run on validate workflow; covered if release workflow added separately |

7 decisions: 4 mechanical, 3 taste. All confirm plan; no amendments.

## Decision Audit Trail

| # | Phase | Decision | Type | Principle |
|---|-------|----------|------|-----------|
| 1 | S1 | Single batch (7 bugs in v0.6.6) | T | Boil lakes |
| 2 | S2 | Pure conversational approval (no signal file) | M | User directive |
| 3 | S3 | Cross-session via spec+plan co-existence | T | DRY with existing fallback |
| 4 | E1 | Collapse stage matrix rows 1-2 | M | Single signal source |
| 5 | E2 | Hard-coded VERSION_DOCS array | T | YAGNI |
| 6 | E3 | Skip-with-warning on missing doc | T | Permissive |
| 7 | E4 | Fail-loud on regex-no-match | M | Drift detection |
| 8 | E5 | CI step ordering: fixture → generators → plugin-sync | T | Logical layering |
| 9 | E6 | README bump done in single step | M | DRY |
| 10 | E7 | CHANGELOG-tarball test out of scope | M | YAGNI |

10 decisions auto-resolved. 5 mechanical, 5 taste. All confirm plan; **0 amendments needed**.

## Verdict

**APPROVED — auto-advance to BUILD.**

| Lens | Result |
|---|---|
| Strategy | ✓ |
| Design | N/A |
| Engineering | ✓ |
| Decision Principles | ✓ 10/10 resolved |
| YAGNI | ✓ |

**Status: DONE.** No user-blocking concerns; 0 amendments; 0 sub-questions raised.
