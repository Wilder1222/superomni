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
    // P1.1 hardening: if a PRIOR run was SIGKILLed mid-Test-C (between writeFileSync of the
    // patched allowlist and the finally-restore), the source file would be left with
    // DECLARATION_ALLOWLIST = ["__contract_test__"] — a silent test-isolation leak that would
    // make Test B false-pass next run. Detect that dirty state loudly BEFORE this run mutates
    // anything further. (The R1 marker guard below covers drift; this covers crash residue.)
    if (!original.includes("const DECLARATION_ALLOWLIST = [];")) {
        throw new Error("DECLARATION_ALLOWLIST is not empty in source — a prior test-contract run may have crashed mid-Test-C. Run `git checkout -- lib/check-workflow-contract.js` to restore, then re-run.");
    }
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
