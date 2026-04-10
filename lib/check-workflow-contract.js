#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs", "superomni");

function listFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    const stack = [dir];

    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(full);
            } else if (entry.isFile() && full.endsWith(".md")) {
                out.push(full);
            }
        }
    }

    return out.sort();
}

function rel(p) {
    return path.relative(repoRoot, p).replace(/\\/g, "/");
}

function parseArtifactBaseName(baseName) {
    const m = /^(spec|plan|review|execution|evaluation|improvement|production-readiness|subagent|retro)-(.+)-(\d{8})$/.exec(baseName);
    if (!m) return null;
    return {
        type: m[1],
        flowId: m[2],
        date: m[3],
    };
}

function loadText(file) {
    return fs.readFileSync(file, "utf8");
}

function main() {
    if (!fs.existsSync(docsRoot)) {
        console.error("docs/superomni directory not found.");
        process.exit(1);
    }

    const files = listFiles(docsRoot);
    const byFlow = new Map();
    const improvements = [];

    for (const file of files) {
        const parsed = parseArtifactBaseName(path.basename(file, ".md"));
        if (!parsed) continue;

        if (!byFlow.has(parsed.flowId)) {
            byFlow.set(parsed.flowId, { types: new Set(), files: [] });
        }

        const group = byFlow.get(parsed.flowId);
        group.types.add(parsed.type);
        group.files.push(file);

        if (parsed.type === "improvement") {
            improvements.push(file);
        }
    }

    const errors = [];
    const warnings = [];

    for (const [flowId, group] of byFlow.entries()) {
        const types = group.types;

        if (types.has("evaluation") && !types.has("improvement")) {
            errors.push(`flow ${flowId}: has evaluation but missing improvement (REFLECT gate)`);
        }

        if (types.has("plan") && !types.has("review")) {
            warnings.push(`flow ${flowId}: has plan but missing review`);
        }

        if (types.has("review") && !types.has("execution") && !types.has("subagent")) {
            warnings.push(`flow ${flowId}: has review but missing execution/subagent`);
        }
    }

    for (const file of improvements) {
        const text = loadText(file);
        const hasAgentTotal = /\*\*Agent total:\s*\[?\d+\]?\/?15\*\*/i.test(text) || /Agent total:\s*\d+\/?15/i.test(text);
        const hasSkillsAvg = /\*\*Skills avg:\s*\[?\d+(?:\.\d+)?\]?\/?5\*\*/i.test(text) || /Skills avg:\s*\d+(?:\.\d+)?\/?5/i.test(text);
        const actionCount = (text.match(/^### ACTION\s+\d+:/gm) || []).length;

        if (!hasAgentTotal) {
            errors.push(`${rel(file)}: missing \"Agent total\" score field`);
        }

        if (!hasSkillsAvg) {
            errors.push(`${rel(file)}: missing \"Skills avg\" score field`);
        }

        if (actionCount < 3) {
            errors.push(`${rel(file)}: expected at least 3 action items, found ${actionCount}`);
        }
    }

    console.log(`Workflow contract check: scanned ${files.length} markdown files in docs/superomni`);

    if (warnings.length > 0) {
        console.log("Warnings:");
        for (const w of warnings) {
            console.log(`- ${w}`);
        }
    }

    if (errors.length > 0) {
        console.error("Errors:");
        for (const e of errors) {
            console.error(`- ${e}`);
        }
        process.exit(1);
    }

    console.log("Workflow contract check passed.");
}

main();
