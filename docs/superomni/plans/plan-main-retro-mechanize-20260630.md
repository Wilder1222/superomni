# 回顾教训机械化锁死 — Implementation Plan

**Branch:** main
**Session:** retro-mechanize
**Date:** 20260630
**Spec:** `docs/superomni/specs/spec-main-retro-mechanize-20260630.md`
**Philosophy:** Plan Lean, Execute Complete

## Overview

Mechanize 3 of the 4 "Next Sprint" retro items from the code-drift-fix (20260629) sprint. Each is an independent, parallelizable change that converts a fragile manual convention into a checked-and-tested guard:

1. **G1** — Add `lib/test-contract.js` + `test:contract` npm script to lock down Section 3 of `check-workflow-contract.js` (positive / negative / allowlist-exempt). Tests self-clean via `fs.rmSync` in `try/finally`.
2. **G2** — Add Section 4 to `lib/check-workflow-contract.js` (symmetric produces→dir advisory check). Advisory only — pushes to `warnings[]`, never changes exit code.
3. **G3** — Add a 0-steps advisory `console.warn` to `lib/check-plan-content.js` so a malformed plan (wrong header format / inline `**How:**`) surfaces a "Pre-Destructive Gate may be a silent no-op" hint instead of silently reporting "0 destructive steps".
4. **Verification** — Run all 4 changed artifacts via direct node entrypoints (ENOSPC-safe, no `npm run`), plus a negative-test for the 0-steps warning, and confirm `git diff HEAD --name-only` lists exactly 4 files.

The 4th retro item (forbidden-token-as-drifted-expression) is explicitly a Non-Goal — semantic complexity, high false-positive risk, stays advisory (spec Non-Goals).

**Decision Principles applied:**
- *Explicit over implicit* — Section 4 warning text states the legitimate reason ("may be setup-bootstrapped in target projects, not a source-repo artifact"); 0-steps warning names the exact linter format (`### Step N:` 3-hashes-colon, `**How:**` own line).
- *YAGNI* — test:contract only covers Section 3 (the path last sprint's QA actually exercised). No Section 1/2 fixtures, no CI wiring.
- *Bias to action* — both new guards are advisory `warn` (not error) so they hint without blocking on legitimate edge cases.
- *Completeness* — tests self-clean in `try/finally` and assert `git status` leaves no residue; the verification milestone re-runs the full regression suite.

## Prerequisites

- **P1 — Working tree is clean of plan-affecting changes.** The 7 untracked files from the prior sprint (specs/plans/reviews/etc. for `feishu-doc-align-20260629`) are unrelated to this sprint's 4-file diff. Confirm `git status --short` shows only those pre-existing untracked docs before starting; do NOT commit them as part of this sprint.
- **P2 — TEMP redirected to D: drive.** C: is near-full (ENOSPC). Before running any node command, set `export TEMP=/d/omni-temp TMP=/d/omni-temp` (Bash tool) or `$env:TEMP="D:\omni-temp"; $env:TMP="D:\omni-temp"` (PowerShell). All verifications run as `node lib/<script>.js` directly — **never** `npm run` (npm writes to C: cache).
- **P3 — Read spec fully.** `docs/superomni/specs/spec-main-retro-mechanize-20260630.md` is the source of truth for the 3 changes and their acceptance criteria.
- **P4 — Reference model confirmed.** `lib/test-generators.js` is the DRY style model for `lib/test-contract.js`: self-contained node, `execSync(cmd, {cwd: repoRoot, stdio: "pipe"})`, `console.error` on failure, `process.exit(1)`. test-contract.js extends this with `fs.mkdirSync`/`fs.rmSync` (recursive) for temp dirs wrapped in `try/finally`.
- **P5 — No destructive ops in this plan.** Tests use temp dirs under `docs/superomni/` with self-cleanup via `fs.rmSync` (recursive, in code blocks). No `git rm`, no `rm -rf` in prose `**How:**` sections. The Pre-Destructive Gate does NOT flag this plan's steps. (Note: after M3 lands, `check-plan-content.js` WILL emit an `[advisory]` for THIS plan because it uses `### Milestone N` headers → 0 steps parsed. That advisory is informational only — the gate still exits 0. It is G3 doing its job, flagging that the Pre-Destructive Gate is a no-op on Milestone-style plans.)

## Milestones (4)

### Milestone 1 — G1: lib/test-contract.js + test:contract script

**What:** Create `lib/test-contract.js` (new) modeled on `lib/test-generators.js`, plus add `"test:contract": "node lib/test-contract.js"` to `package.json` immediately after the `test:generators` line. The test file runs `node lib/check-workflow-contract.js` as a subprocess and asserts exit codes for 3 scenarios (positive clean tree / negative un-declared dir / allowlist-exempt). Self-cleaning via `try/finally` + `fs.rmSync` recursive.

**Files:**
- `lib/test-contract.js` (NEW)
- `package.json` (EDIT — insert one script line)

**How:**

Create `lib/test-contract.js` with this structure (fenced so the plan-content linter skips it):

```js
#!/usr/bin/env node
"use strict";

// Locks down Section 3 of lib/check-workflow-contract.js (dir→produces coverage).
// Three tests, self-cleaning via try/finally + fs.rmSync. Run: node lib/test-contract.js
// Models the style of lib/test-generators.js (self-contained, execSync, console.error, exit 1).

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const CONTRACT_SCRIPT = "node lib/check-workflow-contract.js";
const TEST_DIR_NAME = "__contract_test__";
const TEST_DIR = path.join(repoRoot, "docs", "superomni", TEST_DIR_NAME);
const CONTRACT_FILE = path.join(repoRoot, "lib", "check-workflow-contract.js");

let passed = 0;
let failed = 0;

function runContract() {
    // Returns {status, stderr, stdout}. Throws on non-zero so caller can inspect stderr.
    try {
        const stdout = execSync(CONTRACT_SCRIPT, { cwd: repoRoot, stdio: "pipe" });
        return { status: 0, stdout: stdout.toString(), stderr: "" };
    } catch (err) {
        return {
            status: err.status != null ? err.status : 1,
            stdout: err.stdout ? err.stdout.toString() : "",
            stderr: err.stderr ? err.stderr.toString() : "",
        };
    }
}

function assert(label, cond, detail) {
    if (cond) {
        console.log(`  ${label}: PASS`);
        passed += 1;
    } else {
        console.error(`  ${label}: FAIL — ${detail || ""}`);
        failed += 1;
    }
}

// --- Test A: positive clean tree (current repo state) ---
function testPositiveCleanTree() {
    const r = runContract();
    assert("A positive clean tree (exit 0)", r.status === 0,
        `expected exit 0, got ${r.status}; stderr=${r.stderr.slice(0, 400)}`);
}

// --- Test B: negative un-declared dir → exit 1 + stderr names the dir ---
function testNegativeUndeclaredDir() {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    try {
        const r = runContract();
        assert("B negative un-declared dir (exit 1)", r.status === 1,
            `expected exit 1, got ${r.status}`);
        const mentions = (r.stderr + r.stdout).includes(TEST_DIR_NAME);
        assert("B negative un-declared dir (stderr names dir)", mentions,
            `expected "${TEST_DIR_NAME}" in output; stderr=${r.stderr.slice(0, 400)}`);
    } finally {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
}

// --- Test C: allowlist-exempt → exit 0 even with the un-declared dir present ---
function testAllowlistExempt() {
    const original = fs.readFileSync(CONTRACT_FILE, "utf8");
    const marker = "const DECLARATION_ALLOWLIST = [];";
    const patched = "const DECLARATION_ALLOWLIST = [\"" + TEST_DIR_NAME + "\"];";
    // R1 guard: if the marker drifted (reformatted/commented), replace() is a no-op and
    // Test C would false-PASS on exit 0 while the un-declared dir is still flagged.
    // Throw loudly instead of silently passing. Must run BEFORE writeFileSync so the
    // finally-restore (which writes `original` back) is a correct no-op on this path.
    if (!original.includes(marker) || original.replace(marker, patched) === original) {
        throw new Error("DECLARATION_ALLOWLIST marker not found or unchanged — test harness stale; update the marker string in test-contract.js");
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    try {
        fs.writeFileSync(CONTRACT_FILE, original.replace(marker, patched), "utf8");
        const r = runContract();
        assert("C allowlist-exempt (exit 0 with dir present)", r.status === 0,
            `expected exit 0, got ${r.status}; stderr=${r.stderr.slice(0, 400)}`);
    } finally {
        fs.writeFileSync(CONTRACT_FILE, original, "utf8");
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
}

console.log("test-contract: Section 3 path lockdown\n");

testPositiveCleanTree();
testNegativeUndeclaredDir();
testAllowlistExempt();

console.log(`\ntest-contract: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
```

Then edit `package.json` — insert one line after line 34 (`"test:generators": "node lib/test-generators.js",`), preserving valid JSON (trailing comma after the new line, since `audit:invariants` follows):

```json
        "test:generators": "node lib/test-generators.js",
        "test:contract": "node lib/test-contract.js",
        "audit:invariants": "bash bin/audit-repo-invariants",
```

**Verification:**
- `node lib/test-contract.js` prints `A positive clean tree (exit 0): PASS`, `B negative un-declared dir (exit 1): PASS`, `B negative un-declared dir (stderr names dir): PASS`, `C allowlist-exempt (exit 0 with dir present): PASS`, then `test-contract: 4 passed, 0 failed.` and exits 0.
- `git status --short` after the run shows NO `__contract_test__/` dir (self-cleanup verified) — only the new `lib/test-contract.js` and the `package.json` edit appear.
- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` exits 0 (valid JSON).

**Effort:** M — new file ~80 LOC, one package.json line. Risk: the `DECLARATION_ALLOWLIST = [];` marker string must match the file exactly (verified at `lib/check-workflow-contract.js:265`). If Test C's `replace` returns the original unchanged (marker not found), the test would falsely PASS on exit 0 — mitigate by also asserting the file actually changed before running (add a guard: `if (patched === original) throw ...`).

---

### Milestone 2 — G2: Section 4 (symmetric produces→dir advisory) in check-workflow-contract.js

**What:** Add Section 4 to `lib/check-workflow-contract.js` after Section 3 (after line 278's `console.log`), before the summary `console.log` at line ~280. For each `p` in `allProducePatterns`, regex-extract the dir segment from `p.pattern`; if that dir is not in `subdirs`, push to `warnings[]` (NOT `errors[]`). Add a `console.log` summary line. No change to exit code.

**Files:**
- `lib/check-workflow-contract.js` (EDIT — insert Section 4 block)

**How:**

Insert this block immediately after line 278 (`console.log(\`Section 3: ...\`)`) and before the line 280 summary `console.log`. Fenced so the plan-content linter skips it:

```js
    // ---- Section 4: symmetric produces→dir advisory (new) ----
    // Section 3 checks dir→produces (every disk dir must be declared). Section 4
    // checks the reverse: every produces: declaration should have a corresponding
    // disk dir. A missing disk dir is ADVISORY only — some produces paths are
    // setup-bootstrapped into TARGET projects (not the source repo), so the source
    // repo legitimately lacks them (e.g. harness-audits/, production-readiness/).
    let section4Missing = 0;
    for (const p of allProducePatterns) {
        if (!p.pattern) continue;
        const norm = p.pattern.replace(/\\/g, "/");
        const m = /docs\/superomni\/([^/]+)\//.exec(norm);
        if (!m) continue; // produces path not under docs/superomni/<dir>/ — skip
        const dir = m[1];
        if (!subdirs.includes(dir)) {
            warnings.push(
                `declared produces path ${p.pattern} (skill ${p.skill}) has no corresponding disk dir docs/superomni/${dir}/ — may be setup-bootstrapped in target projects, not a source-repo artifact`
            );
            section4Missing += 1;
        }
    }
    console.log(`Section 4: checked ${allProducePatterns.length} produces declarations, ${section4Missing} missing disk dirs (advisory).`);
```

**Verification:**
- `node lib/check-workflow-contract.js` exits 0.
- Output contains the line `Section 4: checked N produces declarations, 2 missing disk dirs (advisory).` (N = total produces declarations across all skills; 2 = harness-audits + production-readiness).
- The Warnings block in output contains two lines mentioning `harness-audits` and `production-readiness` respectively, each phrased "may be setup-bootstrapped in target projects".
- Exit code is still 0 (advisory only — no new entries in `errors[]`).

**Effort:** S — ~20 LOC insert, no logic refactor. Risk: regex `docs\/superomni\/([^/]+)\//` must handle forward-slash-normalized patterns. Patterns like `docs/superomni/specs/spec-[branch]-[session]-[date].md` extract `specs` correctly. Patterns NOT under `docs/superomni/` (if any) are skipped via the `if (!m) continue` guard — safe.

---

### Milestone 3 — G3: 0-steps advisory warning in check-plan-content.js

**What:** Add a `console.warn` to `lib/check-plan-content.js` that fires when a post-cutoff plan parses to 0 steps. Insert AFTER `const steps = parsePlan(text);` (line 171) and AFTER the exempt check (so only post-cutoff plans warn). Advisory only — do NOT push to `failures`, do NOT change exit code.

**Files:**
- `lib/check-plan-content.js` (EDIT — insert 4-line advisory block)

**How:**

In the main loop, after line 171 (`const steps = parsePlan(text);`), insert this block. Fenced so the plan-content linter skips it:

```js
        if (steps.length === 0) {
            console.warn(
                `[advisory] ${rel(filepath)}: parsed 0 steps — plan format may not match the linter's expected \`### Step N:\` structure; Pre-Destructive Gate may be a silent no-op on this plan. Verify the step headers use \`### Step N:\` (3 hashes, colon) and \`**How:**\` on its own line.`
            );
        }
```

The block sits between line 171 and the existing `for (let i = 0; i < steps.length; i++)` loop (line 172). Since `steps.length === 0`, the `for` loop body simply doesn't execute — no behavior change for the destructive-gate logic.

**Verification:**
- `node lib/check-plan-content.js` exits 0. It WILL emit `[advisory]` warnings for the 2 post-cutoff plans that use `### Milestone N` headers (not `### Step N:`) and therefore parse to 0 steps: `plan-main-feishu-doc-align-20260629.md` and `plan-main-retro-mechanize-20260630.md` (this very plan). **This is G3 working correctly** — these plans genuinely lack `### Step N:` headers, so the Pre-Destructive Gate is a silent no-op on them and the advisory rightly flags it. Exit code stays 0 (advisory only). The other 14 post-cutoff plans parse ≥1 step → no warning.
- Negative test (in Milestone 4): a temp `#### Step 1:` (4-hash) plan triggers the warning.

**Note (architectural decision, auto-resolved):** `### Milestone N:` is NOT a linter-accepted step header (only `### Step N:` is). The 2 Milestone-style plans correctly trigger the advisory — that is the intended signal. Migrating them to `### Step N:` is out of scope (a separate cleanup); accepting the advisory as a known signal is the chosen path (P5 explicit-over-clever + bias-to-action: the warning is informative, not blocking).

**Effort:** XS — 4 LOC insert. Risk: none functional. The `rel(filepath)` helper exists at line 49. `console.warn` writes to stderr but does not affect the `process.exit(0)` path.

---

### Milestone 4 — Verification & regression

**What:** Run the full verification suite via direct node entrypoints (ENOSPC-safe), execute the 0-steps negative test, and confirm the diff is exactly 4 files. This milestone makes NO code edits — it only validates Milestones 1–3.

**Files:** (none edited — verification only)

**How:**

Set TEMP first (Bash tool syntax — PowerShell equivalent in P2):
```
export TEMP=/d/omni-temp TMP=/d/omni-temp
```

Run these in order. All must pass (each is a direct node entrypoint, NOT `npm run`):

1. `node lib/test-contract.js` → expect `4 passed, 0 failed`, exit 0.
2. `node lib/check-workflow-contract.js` → expect exit 0, output contains `Section 4: checked` and `2 missing disk dirs (advisory)`, warnings block contains `harness-audits` and `production-readiness`.
3. `node lib/check-plan-content.js` → expect exit 0. It WILL emit `[advisory]` lines for the 2 Milestone-style post-cutoff plans (feishu-doc-align + this retro-mechanize plan) — that is G3 working correctly, NOT a failure. Confirm exit 0 (advisory-only).
4. `node lib/check-skill-docs.js` → expect exit 0 (regression — untouched by this sprint, must still pass).
5. Negative test for G3 — create a temp malformed plan, confirm the warning fires, then remove it. Fenced so the plan-content linter skips it:

```js
// Run as: node -e "<this script>"
const fs = require("fs");
const path = require("path");
// Filename MUST end with -<8digits>.md so extractDate() returns 20260630 (>= CUTOFF 20260514)
// and the plan is NOT exempt. A name like ...-NEG-TEST.md ends in non-digits → date=null → exempt → warning never fires.
const p = path.join("docs", "superomni", "plans", "plan-NEG-TEST-20260630.md");
// 4-hash header + inline How — both violate the linter's parser → 0 steps parsed
fs.writeFileSync(p, "# Malformed\n\n#### Step 1: Bad header\n\n**How:** inline how text.\n");
const { execSync } = require("child_process");
let out = "";
try {
    out = execSync("node lib/check-plan-content.js", { stdio: "pipe" }).toString();
} catch (e) {
    out = (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "");
}
let fired = false;
try {
    fired = out.includes("parsed 0 steps");
} finally {
    fs.rmSync(p, { force: true }); // P1-3 hardening: cleanup even if assertion throws
}
console.log(fired ? "NEG-TEST: 0-steps warning fired (expected) — PASS" : "NEG-TEST: warning did NOT fire — FAIL");
process.exit(fired ? 0 : 1);
```

   Run via a temp file: save as `lib/_neg-test.js`, run `node lib/_neg-test.js`, then remove it (it won't appear in `git diff HEAD --name-only` if removed before step 6). This is the PRIMARY method on Windows (heredoc is awkward); the temp plan file is removed by `fs.rmSync` in try/finally regardless of outcome.

6. `git diff HEAD --name-only` → expect EXACTLY these 4 files:
   - `lib/check-plan-content.js`
   - `lib/check-workflow-contract.js`
   - `lib/test-contract.js`
   - `package.json`

7. `git status --short` → confirm no `__contract_test__/` dir, no `plan-main-retro-mechanize-20260630-NEG-TEST.md` residue, no other unexpected tracked changes from this sprint (the pre-existing 7 untracked `feishu-doc-align-20260629` docs are unrelated and acceptable).

**Verification:** This milestone IS the verification — all 7 checks above must pass. If any fails, stop and diagnose before declaring DONE.

**Effort:** S — no edits, just running commands. Risk: the negative-test temp plan filename must sort AFTER the cutoff date (it uses `20260630`, which is ≥ `20260514` CUTOFF_DATE) so it's not exempt. If the negative test's `node -e` heredoc is awkward on Windows, fall back to writing a one-off `lib/_neg-test.js`, running it, then removing it (it won't appear in `git diff HEAD --name-only` if removed before step 6).

---

## Testing Strategy

- **Unit lockdown (G1):** `lib/test-contract.js` is the regression suite for Section 3. Three behavioral assertions (positive exit 0, negative exit 1 + stderr naming, allowlist-exempt exit 0). Self-cleaning. Runs in <1s.
- **Advisory observability (G2):** Section 4's correctness is verified by asserting the exact warning count (2) and the exact two skill names (`harness-audits`, `production-readiness`) in the output. No exit-code coupling.
- **Silent-no-op prevention (G3):** The negative test in Milestone 4 proves the 0-steps warning actually fires on a malformed plan. Without this negative test, G3 would be untested (the existing 13 plans never trigger it).
- **Regression breadth:** `check-skill-docs.js` is re-run even though this sprint doesn't touch it — guards against accidental cross-file breakage from the `package.json` edit or shared utilities.
- **Self-cleaning invariant:** Every temp artifact (dir in Test B/C, negative-test plan file) is removed in `try/finally` or via `fs.rmSync({force:true})`. The final `git status --short` check is the audit gate for this invariant.

## Rollback

All 3 changes are additive and independent. Rollback per-milestone:

- **G1 rollback:** `git rm lib/test-contract.js` (careful — destructive, but only on a file this sprint created) and revert the one-line `package.json` edit. Or simply `git checkout -- package.json && rm lib/test-contract.js`.
- **G2 rollback:** `git checkout -- lib/check-workflow-contract.js` (removes Section 4 block, restores line 278→280 adjacency).
- **G3 rollback:** `git checkout -- lib/check-plan-content.js` (removes the 4-line advisory block).

Full rollback: `git checkout HEAD -- lib/check-plan-content.js lib/check-workflow-contract.js package.json && rm lib/test-contract.js`. No data migration, no schema change, no external state. The advisory-only design means even a partial rollback (e.g. keep G1, revert G2/G3) is safe — no cross-dependencies between the three.

## Dependencies

- **No new runtime dependencies.** `lib/test-contract.js` uses only `fs`, `path`, `child_process` (all Node built-ins), matching `lib/test-generators.js`.
- **`lib/check-workflow-contract.js` already depends on `js-yaml`** (devDependency, present in package.json line 67). Section 4 reuses the already-loaded `allProducePatterns` and `subdirs` arrays — no new requires.
- **No ordering dependency between Milestones 1, 2, 3** — they touch 3 different files (`test-contract.js` is new, the other two are disjoint edits to disjoint files). They can be executed in any order or in parallel. Milestone 4 (verification) MUST run after all three.
- **Environment dependency:** TEMP on D: drive (P2). Node 14+ for `fs.rmSync` with `{recursive, force}` options (available since Node 14.14). The repo already uses `fs.rmSync` elsewhere — confirm with `grep -rn "fs.rmSync" lib/` if unsure.

## Success Criteria

Mirrors spec Acceptance Criteria. All must be ticked to declare DONE:

**G1 — test:contract**
- [ ] `lib/test-contract.js` exists, contains 3 tests (positive / negative / allowlist-exempt)
- [ ] `package.json` has `"test:contract": "node lib/test-contract.js"` immediately after `test:generators`
- [ ] `node lib/test-contract.js` → all assertions PASS, exit 0
- [ ] `git status --short` after the run shows no `__contract_test__/` residue (self-cleaning verified)

**G2 — symmetric produces→dir advisory**
- [ ] `lib/check-workflow-contract.js` has a Section 4 block after Section 3
- [ ] Section 4 pushes to `warnings[]`, never `errors[]` (exit code unchanged)
- [ ] `node lib/check-workflow-contract.js` → exit 0, warnings contain `harness-audits` and `production-readiness`
- [ ] Output contains a `Section 4: checked N produces declarations, 2 missing disk dirs (advisory).` summary line

**G3 — plan-content 0-steps warning**
- [ ] `lib/check-plan-content.js` emits a `console.warn` when a post-cutoff plan parses 0 steps
- [ ] Warning is advisory only — no push to `failures`, no exit-code change
- [ ] `node lib/check-plan-content.js` → exit 0; emits `[advisory]` for the 2 Milestone-style post-cutoff plans (feishu-doc-align + retro-mechanize) — correct G3 behavior, not a failure
- [ ] Negative test (temp `#### Step 1:` 4-hash plan, filename ending `-20260630.md` so non-exempt) triggers the warning; temp file removed after (try/finally)

**Regression**
- [ ] `git diff HEAD --name-only` lists EXACTLY: `lib/check-plan-content.js`, `lib/check-workflow-contract.js`, `lib/test-contract.js`, `package.json` (4 files)
- [ ] `node lib/test-contract.js`, `node lib/check-workflow-contract.js`, `node lib/check-plan-content.js`, `node lib/check-skill-docs.js` all exit 0

## P0 Risks

1. **R1 — Test C false PASS if the allowlist marker string drifts.** Test C does `original.replace("const DECLARATION_ALLOWLIST = [];", patched)`. If a future edit changes that line (e.g. adds a comment, changes spacing), `replace` returns the original unchanged, the contract script still sees the un-declared `__contract_test__/` dir, exits 1, and Test C fails the exit-0 assertion. Mitigation: add a guard `if (!original.includes(marker)) throw new Error("DECLARATION_ALLOWLIST marker not found — test harness stale");` before writing the patch. **Severity: P0** (silent test-harness rot would let Section 3 regressions through). Must be implemented in Milestone 1.

2. **R2 — Section 4 regex false negatives on non-`docs/superomni/<dir>/` produces paths.** If a skill declares a `produces:` path that doesn't match `docs/superomni/([^/]+)/` (e.g. a path outside docs, or a glob), Section 4 silently skips it via `if (!m) continue`. This is safe-by-design (those paths aren't subject to the dir-coverage contract), but means Section 4 only covers the same shape Section 3 covers. **Severity: P1** (acceptable — symmetric scope is the intent). Document in the Section 4 comment (already in the proposed code).

3. **R3 — Negative-test temp plan not removed on process crash.** If the `node -e` negative test crashes between `writeFileSync` and `rmSync`, the malformed plan stays in `plans/` and would (a) trigger the 0-steps warning on every future `check-plan-content.js` run (noisy but harmless — advisory only) and (b) appear in `git status` as untracked. Mitigation: `fs.rmSync(p, {force: true})` is in the same script after the assertion; if the process is killed by a signal, manual cleanup is `rm plans/plan-main-retro-mechanize-20260630-NEG-TEST.md`. The Milestone 4 step 7 `git status` check catches this. **Severity: P1** (annoying, not dangerous — advisory-only warning can't block CI).

4. **R4 — ENOSPC during test run if TEMP not redirected.** If P2 is skipped, `execSync` of the contract script may fail to spawn or write temp files on C:. Mitigation: P2 is a hard prerequisite; Milestone 4 step 1 sets TEMP explicitly. **Severity: P0** (blocks all verification). Re-confirm `echo $TEMP` points to D: before running Milestone 4.

5. **R5 — `package.json` JSON validity after edit.** A missing/extra trailing comma breaks `npm run` (and the `verify:skill-docs` composite script). Mitigation: Milestone 1 verification includes `node -e "JSON.parse(...)"` validity check. **Severity: P1** (caught immediately by the JSON parse check, not a silent failure).

## Status

Planning complete. Ready for `plan-review` then `executing-plans`.
