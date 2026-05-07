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

/** Parse evaluator verdict: APPROVED / APPROVED_WITH_NOTES / CHANGES_REQUIRED / EVALUATION_INCOMPLETE */
function parseEvaluatorVerdict(text) {
    const m = text.match(/\b(APPROVED_WITH_NOTES|CHANGES_REQUIRED|EVALUATION_INCOMPLETE|APPROVED)\b/);
    return m ? m[1] : null;
}

/** Parse Iron Law compliance count (e.g. "Iron Law compliance: 4/5") */
function parseIronLawCompliance(text) {
    const m = text.match(/Iron Law compliance[:\s]+(\d+)\s*\/\s*(\d+)/i);
    if (m) return { passed: Number(m[1]), total: Number(m[2]) };
    return null;
}

/** Count lines in lib/preamble.md (context efficiency metric) */
function countPreambleLines() {
    const p = path.join(repoRoot, "lib", "preamble.md");
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, "utf8").split("\n").length;
}

function main() {
    const evalDir = path.join(docsRoot, "evaluations");
    const improveDir = path.join(docsRoot, "improvements");

    const evalFiles = listFiles(evalDir);
    const improveFiles = listFiles(improveDir);

    // --- Evaluation metrics ---
    const evalStatuses = {};
    const evalVerdicts = {};
    for (const file of evalFiles) {
        const text = fs.readFileSync(file, "utf8");
        const status = parseStatus(text);
        evalStatuses[status] = (evalStatuses[status] || 0) + 1;

        const verdict = parseEvaluatorVerdict(text);
        if (verdict) {
            evalVerdicts[verdict] = (evalVerdicts[verdict] || 0) + 1;
        }
    }

    const gatePassCount = (evalVerdicts["APPROVED"] || 0) + (evalVerdicts["APPROVED_WITH_NOTES"] || 0);
    const gateFailCount = evalVerdicts["CHANGES_REQUIRED"] || 0;
    const gatePassRate = evalFiles.length > 0
        ? Number((gatePassCount / evalFiles.length).toFixed(2))
        : null;

    // --- Improvement metrics ---
    const agentTotals = [];
    const skillsAvgs = [];
    const ironLawCompliance = [];

    for (const file of improveFiles) {
        const text = fs.readFileSync(file, "utf8");
        const a = parseAgentTotal(text);
        const s = parseSkillsAvg(text);
        const il = parseIronLawCompliance(text);
        if (a !== null) agentTotals.push(a);
        if (s !== null) skillsAvgs.push(s);
        if (il !== null) ironLawCompliance.push(il.passed / il.total);
    }

    // --- Context efficiency ---
    const preambleLines = countPreambleLines();
    const preambleStatus = preambleLines === null ? "N/A"
        : preambleLines < 150 ? "OK"
        : preambleLines < 200 ? "WARNING"
        : "BLOATED";

    // --- Evaluation coverage ---
    // ratio of flows that have both evaluation + improvement vs total flows with improvements
    const evalCoverage = improveFiles.length > 0
        ? Number((evalFiles.length / improveFiles.length).toFixed(2))
        : null;

    const report = {
        evaluations: {
            count: evalFiles.length,
            statusBreakdown: evalStatuses,
            verdictBreakdown: evalVerdicts,
            gatePassCount,
            gateFailCount,
            gatePassRate,
        },
        improvements: {
            count: improveFiles.length,
            scoredAgentReports: agentTotals.length,
            scoredSkillReports: skillsAvgs.length,
            avgAgentTotalOver15: Number(mean(agentTotals).toFixed(2)),
            avgSkillsAvgOver5: Number(mean(skillsAvgs).toFixed(2)),
            avgIronLawComplianceRate: ironLawCompliance.length > 0
                ? Number(mean(ironLawCompliance).toFixed(2))
                : null,
        },
        contextEfficiency: {
            preambleLines,
            preambleStatus,
        },
        kpi: {
            evaluationCoverage: evalCoverage,
            gatePassRate,
            avgAgentScore: agentTotals.length > 0 ? Number(mean(agentTotals).toFixed(2)) : null,
            avgIronLawCompliance: ironLawCompliance.length > 0 ? Number(mean(ironLawCompliance).toFixed(2)) : null,
        },
    };

    console.log(JSON.stringify(report, null, 2));
}

main();
