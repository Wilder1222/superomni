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

// --- Invariant 4: doc-version anchors match package.json version (multi-file) --
// Each entry: file path (relative to repo root), regex (must capture version in group 1), label.
// If a configured file doesn't exist: skip with stderr warning (permissive — docs may vary by branch).
// If file exists but regex doesn't match: fail (probably means doc was reformatted; needs human review).

const VERSION_DOCS = [
    {
        file: "README.md",
        regex: /^Current stable version: (\d+\.\d+\.\d+)/m,
        label: "README.md `Current stable version: X.Y.Z`",
    },
    {
        file: "docs/COMPARISON.md",
        regex: /\*\*版本：\*\* superomni v(\d+\.\d+\.\d+)/,
        label: "docs/COMPARISON.md header `**版本：** superomni vX.Y.Z`",
    },
    {
        file: "docs/DESIGN.md",
        regex: /\*\*Status:\*\* Implemented \(v(\d+\.\d+\.\d+)\)/,
        label: "docs/DESIGN.md `**Status:** Implemented (vX.Y.Z)`",
    },
    {
        file: "docs/AGENTS.md",
        regex: /\*\*Last updated:\*\* v(\d+\.\d+\.\d+)/,
        label: "docs/AGENTS.md `**Last updated:** vX.Y.Z`",
    },
    {
        file: "docs/IMPLEMENTATION.md",
        regex: /\*\*Last updated:\*\* v(\d+\.\d+\.\d+)/,
        label: "docs/IMPLEMENTATION.md `**Last updated:** vX.Y.Z`",
    },
];

for (const entry of VERSION_DOCS) {
    const fullPath = path.join(repoRoot, entry.file);
    if (!fs.existsSync(fullPath)) {
        console.warn(`[plugin-sync] note: ${entry.file} not found; skipping version anchor check`);
        continue;
    }
    const text = fs.readFileSync(fullPath, "utf8");
    const m = text.match(entry.regex);
    if (!m) {
        fail(
            `doc version: cannot find expected version pattern in ${entry.label}. ` +
            `If the doc was reformatted, update VERSION_DOCS in lib/check-plugin-sync.js.`
        );
        continue;
    }
    if (m[1] !== pkgVersion) {
        fail(
            `doc version: ${entry.label} = ${m[1]}, expected ${pkgVersion} (from package.json). ` +
            `Update ${entry.file}.`
        );
    }
}

// --- Invariant 5: docs/AGENTS.md agent-section headings == agents/*.md filenames --
// Heading pattern: lines like `### `<name>`` or `## <name>` where <name> matches lowercase-kebab.
// Bidirectional intersection: a heading is counted only if its name matches an actual agents/*.md
// file (avoids false-matching prose words). The check verifies every agents/*.md file has a
// corresponding section heading in docs/AGENTS.md.

const agentsDocPath = path.join(repoRoot, "docs", "AGENTS.md");
const agentsDir = path.join(repoRoot, "agents");
if (fs.existsSync(agentsDocPath) && fs.existsSync(agentsDir)) {
    const agentsOnDisk = fs.readdirSync(agentsDir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""))
        .sort();
    const agentsDocText = fs.readFileSync(agentsDocPath, "utf8");
    const headingRe = /^#{2,3}\s+`?([a-z][a-z0-9-]+)`?\s*$/gm;
    const declaredHeadings = new Set();
    let m;
    while ((m = headingRe.exec(agentsDocText)) !== null) {
        // Bidirectional filter: only count headings whose name matches an actual agent file.
        if (agentsOnDisk.includes(m[1])) {
            declaredHeadings.add(m[1]);
        }
    }
    const missingFromDoc = agentsOnDisk.filter((a) => !declaredHeadings.has(a));
    if (missingFromDoc.length > 0) {
        fail(
            `agents-doc sync: ${missingFromDoc.length} agent(s) in agents/ but missing from docs/AGENTS.md as a section heading: ${missingFromDoc.join(", ")}. ` +
            `Add a \`### \\\`<name>\\\`\` section per agent in docs/AGENTS.md.`
        );
    }
} else {
    if (!fs.existsSync(agentsDocPath)) {
        console.warn(`[plugin-sync] note: docs/AGENTS.md not found; skipping agent-name heading check`);
    }
}

// --- Output -----------------------------------------------------------------
// 5 logical invariants: versions (cross-manifest), commands set, keywords set,
// doc-version anchors (multi-file via VERSION_DOCS), agent-doc heading set.

if (failures.length > 0) {
    console.error("Plugin sync check FAILED:\n");
    for (const f of failures) {
        console.error(`- ${f}`);
    }
    process.exit(1);
}

console.log(`Plugin sync check passed: 5 invariants validated.`);
process.exit(0);
