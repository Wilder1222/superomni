#!/usr/bin/env node
"use strict";

// Runs all 3 generators (js / sh / ps1) on lib/templates/fixture.md.tmpl and
// asserts byte-identical output via sha256. Catches generator-parity regressions.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const fixtureTmpl = path.join(repoRoot, "lib", "templates", "fixture.md.tmpl");
const fixtureOut = path.join(repoRoot, "lib", "templates", "fixture.md");

if (!fs.existsSync(fixtureTmpl)) {
    console.error(`ERROR: golden fixture not found at ${fixtureTmpl}`);
    process.exit(1);
}

function sha256(buf) {
    return crypto.createHash("sha256").update(buf).digest("hex");
}

function readAndHash(file) {
    const buf = fs.readFileSync(file);
    return { bytes: buf, hex: sha256(buf) };
}

function runGenerator(label, cmd) {
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
    return readAndHash(fixtureOut);
}

const jsResult = runGenerator("js", `node lib/gen-skill-docs.js lib/templates/fixture.md.tmpl`);
const shResult = runGenerator("sh", `bash lib/gen-skill-docs.sh lib/templates/fixture.md.tmpl`);

let psAvailable = true;
let psResult = null;
try {
    execSync("pwsh -NoProfile -Command \"$null\"", { stdio: "pipe" });
} catch {
    psAvailable = false;
}

if (psAvailable) {
    psResult = runGenerator("ps1", `pwsh -NoProfile -File lib/gen-skill-docs.ps1 -TemplatePath lib/templates/fixture.md.tmpl`);
}

console.log(`fixture parity hashes:`);
console.log(`  js : ${jsResult.hex}`);
console.log(`  sh : ${shResult.hex}`);
if (psResult) console.log(`  ps1: ${psResult.hex}`);
else console.log(`  ps1: (skipped — pwsh not available)`);

const hashes = [jsResult.hex, shResult.hex];
if (psResult) hashes.push(psResult.hex);

if (new Set(hashes).size === 1) {
    console.log("verify:fixture-parity PASSED — all generators produce byte-identical output.");
    process.exit(0);
} else {
    console.error("verify:fixture-parity FAILED — generators diverged.");
    process.exit(1);
}
