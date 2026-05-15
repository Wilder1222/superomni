#!/usr/bin/env node
"use strict";

// lib/gen-changelog.js — generate a CHANGELOG entry skeleton from Conventional Commits.
//
// Reads commits in a git range; groups by Conventional Commits prefix
// (feat/fix/chore/docs/refactor/test/perf/build/ci/style); prints a draft skeleton
// to stdout. Caller reviews and manually completes the "Why this matters" / "Verified" /
// "Deferred" subsections.
//
// Usage:
//   node lib/gen-changelog.js [--from <ref>] [--to <ref>] [--version <X.Y.Z>]
//   npm run gen:changelog -- --version 0.6.10
//
// Defaults:
//   --from    = `git describe --tags --abbrev=0` (last tag) or first commit if no tags
//   --to      = HEAD
//   --version = package.json version
//
// Output is stdout only; no file is written. Caller redirects or copy-pastes.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");

// --- Configuration ----------------------------------------------------------

// Conventional Commits prefix → CHANGELOG section.
// Prefixes not in this map are grouped under "Other".
const PREFIX_TO_SECTION = {
    feat: "Added",
    fix: "Fixed",
    chore: "Changed",
    docs: "Changed",
    refactor: "Changed",
    test: "Changed",
    perf: "Changed",
    build: "Changed",
    ci: "Changed",
    style: "Changed",
};

// Section print order. Sections with zero bullets are skipped entirely.
const SECTION_ORDER = ["Added", "Fixed", "Changed", "Removed", "Other"];

// Body summary truncation length (characters).
const BODY_TRUNCATE = 200;

// Subject line regex (Conventional Commits).
//   group 1: prefix (feat / fix / etc.)
//   group 2: optional scope (parenthesized; not currently used)
//   group 3: short description
//   group 4: optional `(vX.Y.Z)` suffix the project uses
const SUBJECT_RE = /^(\w+)(\([^)]+\))?(!?):\s+(.+?)(\s*\(v[\d.]+\))?\s*$/;

// Skip patterns: merge commits, dependabot, etc.
const SKIP_SUBJECT_PATTERNS = [
    /^Merge pull request /,
    /^Merge branch /,
    /^Merge remote-tracking /,
];

// --- Argument parsing -------------------------------------------------------

function parseArgs(argv) {
    const args = { from: null, to: "HEAD", version: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--from") {
            args.from = argv[++i];
        } else if (a === "--to") {
            args.to = argv[++i];
        } else if (a === "--version") {
            args.version = argv[++i];
        } else if (a === "--help" || a === "-h") {
            args.help = true;
        } else {
            console.error(`Unknown argument: ${a}`);
            args.error = true;
        }
    }
    return args;
}

function printUsage() {
    console.log(`Usage: node lib/gen-changelog.js [--from <ref>] [--to <ref>] [--version <X.Y.Z>]

Defaults:
  --from    = last git tag (or first commit if no tags exist)
  --to      = HEAD
  --version = package.json version

Output: CHANGELOG entry skeleton printed to stdout.`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
    printUsage();
    process.exit(0);
}
if (args.error) {
    printUsage();
    process.exit(1);
}

// --- Default resolution -----------------------------------------------------

function resolveDefaults() {
    if (!args.version) {
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
            args.version = pkg.version;
        } catch (err) {
            console.error(`ERROR: --version not provided and package.json could not be read: ${err.message}`);
            process.exit(1);
        }
    }
    // Validate semver: X.Y.Z (or X.Y.Z-suffix for pre-release / dev tags).
    if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(args.version)) {
        console.error(`ERROR: --version must match semver X.Y.Z (or X.Y.Z-suffix); got: ${args.version}`);
        process.exit(1);
    }
    if (!args.from) {
        try {
            args.from = execSync("git describe --tags --abbrev=0", {
                cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"],
            }).toString().trim();
        } catch {
            // No tags; fall back to root commit.
            try {
                args.from = execSync("git rev-list --max-parents=0 HEAD", {
                    cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"],
                }).toString().trim().split("\n")[0];
            } catch (err) {
                console.error(`ERROR: cannot determine default --from ref: ${err.message}`);
                process.exit(1);
            }
        }
    }
}

resolveDefaults();

// --- Validate refs ----------------------------------------------------------

function validateRef(ref, label) {
    try {
        execSync(`git rev-parse --verify ${JSON.stringify(ref)}`, {
            cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"],
        });
    } catch {
        console.error(`ERROR: ${label} ref ${JSON.stringify(ref)} is not a valid git revision.`);
        process.exit(1);
    }
}

validateRef(args.from, "--from");
validateRef(args.to, "--to");

// --- Read git log -----------------------------------------------------------

const COMMIT_DELIM = "===COMMIT_DELIM_GENCHANGELOG===";
const FIELD_DELIM = "---FIELD_DELIM_GENCHANGELOG---";

let logOutput;
try {
    logOutput = execSync(
        `git log --no-merges ${JSON.stringify(args.from + ".." + args.to)} ` +
        `--format="${COMMIT_DELIM}%n%H${FIELD_DELIM}%s${FIELD_DELIM}%b"`,
        { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 }
    ).toString();
} catch (err) {
    console.error(`ERROR: git log failed for range ${args.from}..${args.to}: ${err.message}`);
    process.exit(1);
}

// --- Parse commits ----------------------------------------------------------

function extractBodySummary(body) {
    if (!body) return "";
    const lines = body.split(/\r?\n/);
    const cleaned = [];
    for (const line of lines) {
        if (/^Co-Authored-By:/i.test(line)) continue;
        if (/^Signed-off-by:/i.test(line)) continue;
        cleaned.push(line);
    }
    // First paragraph (until blank line).
    const para = [];
    for (const line of cleaned) {
        if (!line.trim()) {
            if (para.length > 0) break;
            continue;
        }
        para.push(line.trim());
    }
    let summary = para.join(" ").trim();
    if (summary.length > BODY_TRUNCATE) {
        // Truncate at last whitespace before limit + ellipsis.
        const cut = summary.lastIndexOf(" ", BODY_TRUNCATE);
        summary = (cut > 0 ? summary.slice(0, cut) : summary.slice(0, BODY_TRUNCATE)) + "…";
    }
    return summary;
}

const sections = {};
for (const sec of SECTION_ORDER) sections[sec] = [];

const skipped = [];
const blocks = logOutput.split(COMMIT_DELIM).map((b) => b.trim()).filter(Boolean);

for (const block of blocks) {
    const [hash, subject, ...rest] = block.split(FIELD_DELIM);
    const body = rest.join(FIELD_DELIM); // body may itself contain field delims if user wrote them; uncommon
    if (!hash || !subject) continue;

    if (SKIP_SUBJECT_PATTERNS.some((re) => re.test(subject))) {
        skipped.push({ hash: hash.slice(0, 7), reason: "merge", subject });
        continue;
    }

    const m = SUBJECT_RE.exec(subject);
    let section, headerScope, headerSummary;
    if (m) {
        const prefix = m[1];
        headerScope = m[2] ? m[2].slice(1, -1) : ""; // strip parens
        headerSummary = m[4]; // short description
        section = PREFIX_TO_SECTION[prefix] || "Other";
    } else {
        section = "Other";
        headerScope = "";
        headerSummary = subject;
        console.error(`[gen-changelog] note: ${hash.slice(0, 7)} subject does not match Conventional Commits format; placed under 'Other'.`);
    }

    const bodySummary = extractBodySummary(body);
    sections[section].push({
        hash: hash.slice(0, 7),
        scope: headerScope,
        summary: headerSummary,
        body: bodySummary,
    });
}

// --- Format output ----------------------------------------------------------

const today = new Date().toISOString().slice(0, 10);

const lines = [];
lines.push(`## [${args.version}] — ${today}`);
lines.push("");

let totalBullets = 0;
for (const sec of SECTION_ORDER) {
    const items = sections[sec];
    if (items.length === 0) continue;
    lines.push(`### ${sec}`);
    for (const item of items) {
        const scopePart = item.scope ? `**${item.scope}** — ` : "";
        const bodyPart = item.body ? ` ${item.body}` : "";
        lines.push(`- ${scopePart}${item.summary}${bodyPart}  *(${item.hash})*`);
        totalBullets += 1;
    }
    lines.push("");
}

lines.push("<!-- TODO: add 'Why this matters' / 'Verified' / 'Deferred (v0.X.Y+ backlog)' subsections manually -->");
lines.push("");
lines.push("---");

console.log(lines.join("\n"));

if (skipped.length > 0) {
    console.error(`\n[gen-changelog] skipped ${skipped.length} commit(s):`);
    for (const s of skipped) {
        console.error(`  - ${s.hash} (${s.reason}): ${s.subject.slice(0, 80)}`);
    }
}
console.error(`\n[gen-changelog] generated ${totalBullets} bullet(s) across ${Object.values(sections).filter((a) => a.length > 0).length} section(s) for [${args.version}].`);
