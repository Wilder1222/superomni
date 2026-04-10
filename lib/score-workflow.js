#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs", "superomni");

function listFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => path.join(dir, f))
        .sort();
}

function mean(values) {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function parseAgentTotal(text) {
    const m = text.match(/Agent total:\s*(\d+)\/?15/i);
    return m ? Number(m[1]) : null;
}

function parseSkillsAvg(text) {
    const m = text.match(/Skills avg:\s*(\d+(?:\.\d+)?)\/?5/i);
    return m ? Number(m[1]) : null;
}

function parseStatus(text) {
    const m = text.match(/\*\*Status:\*\*\s*([A-Z_]+)/);
    if (m) return m[1];
    const m2 = text.match(/Status:\s*`?([A-Z_]+)`?/i);
    return m2 ? m2[1].toUpperCase() : "UNKNOWN";
}

function main() {
    const evalDir = path.join(docsRoot, "evaluations");
    const improveDir = path.join(docsRoot, "improvements");

    const evalFiles = listFiles(evalDir);
    const improveFiles = listFiles(improveDir);

    const evalStatuses = {};
    for (const file of evalFiles) {
        const text = fs.readFileSync(file, "utf8");
        const status = parseStatus(text);
        evalStatuses[status] = (evalStatuses[status] || 0) + 1;
    }

    const agentTotals = [];
    const skillsAvgs = [];

    for (const file of improveFiles) {
        const text = fs.readFileSync(file, "utf8");
        const a = parseAgentTotal(text);
        const s = parseSkillsAvg(text);
        if (a !== null) agentTotals.push(a);
        if (s !== null) skillsAvgs.push(s);
    }

    const report = {
        evaluations: {
            count: evalFiles.length,
            statusBreakdown: evalStatuses,
        },
        improvements: {
            count: improveFiles.length,
            scoredAgentReports: agentTotals.length,
            scoredSkillReports: skillsAvgs.length,
            avgAgentTotalOver15: Number(mean(agentTotals).toFixed(2)),
            avgSkillsAvgOver5: Number(mean(skillsAvgs).toFixed(2)),
        },
    };

    console.log(JSON.stringify(report, null, 2));
}

main();
