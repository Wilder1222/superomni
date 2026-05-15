#!/usr/bin/env node
"use strict";

// lib/check-plugin-sync.js — verify cross-manifest invariants.
//
// Asserts that the 4 manifest files + commands/ + README all stay in sync.
// `package.json` is the single source of truth for version. The 4 invariants:
//
//   1. Version sync: package.json version == marketplace.json (top + nested)
//      == plugin.json == claude-skill.json
//   2. Commands sync: filenames in commands/*.md == claude-skill.json commands[].name
//   3. Keywords sync: plugin.json keywords == marketplace.json plugins[0].keywords
//   4. README version: regex match of "Current stable version: X.Y.Z" == package.json version
//
// Exit 0 on all-clean; exit 1 on any drift with specific message to stderr.
// Mirrors the shape of lib/check-skill-docs.js / lib/check-workflow-contract.js.

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function readJson(rel) {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, rel), "utf8"));
}

function readText(rel) {
    return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

const failures = [];
function fail(msg) {
    failures.push(msg);
}

// --- Invariant 1: version sync across 5 surfaces ----------------------------

const pkgVersion = readJson("package.json").version;
const marketplace = readJson(".claude-plugin/marketplace.json");
const plugin = readJson(".claude-plugin/plugin.json");
const claudeSkill = readJson("claude-skill.json");

const versionSurfaces = [
    ["package.json", pkgVersion],
    [".claude-plugin/marketplace.json (top-level)", marketplace.version],
    [".claude-plugin/marketplace.json (plugins[0])", marketplace.plugins && marketplace.plugins[0] && marketplace.plugins[0].version],
    [".claude-plugin/plugin.json", plugin.version],
    ["claude-skill.json", claudeSkill.version],
];

for (const [label, val] of versionSurfaces) {
    if (val !== pkgVersion) {
        fail(`version drift: ${label} = ${JSON.stringify(val)}, expected ${JSON.stringify(pkgVersion)} (from package.json)`);
    }
}

// --- Invariant 2: commands/*.md files match claude-skill.json commands[].name set --

const commandsDir = path.join(repoRoot, "commands");
const onDisk = fs.readdirSync(commandsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
const declared = (claudeSkill.commands || []).map((c) => c.name).sort();

const missingFromManifest = onDisk.filter((c) => !declared.includes(c));
const extraInManifest = declared.filter((c) => !onDisk.includes(c));

if (missingFromManifest.length > 0) {
    fail(
        `commands sync: ${missingFromManifest.length} file(s) in commands/ but missing from claude-skill.json: ${missingFromManifest.join(", ")}`
    );
}
if (extraInManifest.length > 0) {
    fail(
        `commands sync: ${extraInManifest.length} entr(y/ies) in claude-skill.json with no commands/*.md file: ${extraInManifest.join(", ")}`
    );
}

// --- Invariant 3: keywords parity (plugin.json vs marketplace.json plugins[0]) ---

const pluginKeywords = (plugin.keywords || []).slice().sort();
const marketplacePluginKeywords = (
    (marketplace.plugins && marketplace.plugins[0] && marketplace.plugins[0].keywords) || []
).slice().sort();

const kwMissing = pluginKeywords.filter((k) => !marketplacePluginKeywords.includes(k));
const kwExtra = marketplacePluginKeywords.filter((k) => !pluginKeywords.includes(k));

if (kwMissing.length > 0 || kwExtra.length > 0) {
    fail(
        `keywords sync: plugin.json vs marketplace.json plugins[0].keywords differ. ` +
        `In plugin.json only: [${kwMissing.join(", ")}]. ` +
        `In marketplace.json plugins[0] only: [${kwExtra.join(", ")}].`
    );
}

// --- Invariant 4: README "Current stable version: X.Y.Z" matches package.json version --

const readme = readText("README.md");
const m = readme.match(/^Current stable version: (\d+\.\d+\.\d+)/m);
if (!m) {
    fail(
        `README version: cannot find "Current stable version: X.Y.Z" line in README.md. ` +
        `Add it back, or update this checker if the canonical phrase moved.`
    );
} else if (m[1] !== pkgVersion) {
    fail(
        `README version: "Current stable version: ${m[1]}" in README.md does not match package.json version ${pkgVersion}. ` +
        `Update README.md.`
    );
}

// --- Output -----------------------------------------------------------------

if (failures.length > 0) {
    console.error("Plugin sync check FAILED:\n");
    for (const f of failures) {
        console.error(`- ${f}`);
    }
    process.exit(1);
}

console.log(`Plugin sync check passed: 4 invariants validated.`);
process.exit(0);
