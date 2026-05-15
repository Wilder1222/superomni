#!/usr/bin/env node
"use strict";

// Asserts first-occurrence-only semantics for token replacement across all 3 generators
// (js / sh / ps1). The lib/templates/multi-occurrence-fixture.md.tmpl has 2 `{{PREAMBLE_CORE}}`
// tokens; only the first should expand. Catches regressions like the v0.6.1 ps1 [regex]::Replace
// count-arg silent failure that wasn't caught by single-occurrence parity testing.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const fixtureTmpl = path.join(repoRoot, "lib", "templates", "multi-occurrence-fixture.md.tmpl");
const fixtureOut = path.join(repoRoot, "lib", "templates", "multi-occurrence-fixture.md");

if (!fs.existsSync(fixtureTmpl)) {
    console.error(`ERROR: multi-occurrence fixture not found at ${fixtureTmpl}`);
    process.exit(1);
}

function run(label, cmd) {
    if (fs.existsSync(fixtureOut)) fs.unlinkSync(fixtureOut);
    try {
        execSync(cmd, { cwd: repoRoot, stdio: "pipe" });
    } catch (err) {
        console.error(`[${label}] generator FAILED:\n${err.stderr ? err.stderr.toString() : err.message}`);
        process.exit(1);
    }
    if (!fs.existsSync(fixtureOut)) {
        console.error(`[${label}] generator did not produce ${fixtureOut}`);
        process.exit(1);
    }
    return fs.readFileSync(fixtureOut, "utf8");
}

function assertFirstOccurrenceOnly(label, content) {
    // KEY CHECK: the preamble's signature line (`**Status protocol**`) must appear EXACTLY ONCE.
    // - Correct generator: replaces ONLY the first {{PREAMBLE_CORE}} → 1 inline preamble.
    // - Broken generator (replaces ALL): expands BOTH the canonical AND the code-block token →
    //   2 copies of the preamble → 2 occurrences of `**Status protocol**`.
    const sigMatches = content.match(/\*\*Status protocol\*\*/g) || [];
    if (sigMatches.length !== 1) {
        console.error(
            `[${label}] FAIL: expected exactly 1 expanded preamble (signature '**Status protocol**'), got ${sigMatches.length}.`
        );
        if (sigMatches.length === 0) {
            console.error(`  -> Generator did not expand {{PREAMBLE_CORE}} at all.`);
        } else {
            console.error(`  -> Generator over-expanded: replaced ALL occurrences (incl. the code-block one) instead of just the first.`);
        }
        process.exit(1);
    }

    // Sanity: PREAMBLE_REF_LINK should be expanded (no literal token left).
    if (content.includes("{{PREAMBLE_REF_LINK}}")) {
        console.error(`[${label}] FAIL: {{PREAMBLE_REF_LINK}} not expanded.`);
        process.exit(1);
    }

    // Sanity: at least 1 literal {{PREAMBLE_CORE}} must remain (the one in the code block).
    // A correct generator leaves 2 (preamble's self-mention + code-block); a broken one leaves
    // 2 also (2× preamble each with their self-mention) — we don't assert exact count here
    // because it's not the discriminating signal; the `**Status protocol**` check above is.
    if (!/\{\{PREAMBLE_CORE\}\}/.test(content)) {
        console.error(`[${label}] FAIL: code-block {{PREAMBLE_CORE}} was replaced (should stay literal).`);
        process.exit(1);
    }
    // {{PREAMBLE_REF_LINK}} is single-occurrence; expanded form must appear and literal must not.
    if (content.includes("{{PREAMBLE_REF_LINK}}")) {
        console.error(`[${label}] FAIL: {{PREAMBLE_REF_LINK}} not expanded.`);
        process.exit(1);
    }
    // The expanded preamble's signature line must appear (sanity check first-token expansion really happened).
    if (!content.includes("**Status protocol**")) {
        console.error(`[${label}] FAIL: expanded preamble signature ('**Status protocol**') not found.`);
        process.exit(1);
    }
}

console.log("test-generators: multi-occurrence first-occurrence-only check\n");

const jsOutput = run("js", `node lib/gen-skill-docs.js lib/templates/multi-occurrence-fixture.md.tmpl`);
assertFirstOccurrenceOnly("js", jsOutput);
console.log("  js : PASS");

const shOutput = run("sh", `bash lib/gen-skill-docs.sh lib/templates/multi-occurrence-fixture.md.tmpl`);
assertFirstOccurrenceOnly("sh", shOutput);
console.log("  sh : PASS");

let psAvailable = true;
try {
    execSync("pwsh -NoProfile -Command \"$null\"", { stdio: "pipe" });
} catch {
    psAvailable = false;
}
if (psAvailable) {
    const psOutput = run("ps1", `pwsh -NoProfile -File lib/gen-skill-docs.ps1 -TemplatePath lib/templates/multi-occurrence-fixture.md.tmpl`);
    assertFirstOccurrenceOnly("ps1", psOutput);
    console.log("  ps1: PASS");
} else {
    console.log("  ps1: (skipped -- pwsh not available)");
}

console.log("\ntest-generators PASSED.");
process.exit(0);
