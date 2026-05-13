#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs", "superomni");
const skillsRoot = path.join(repoRoot, "skills");

// Sessions whose filename date is on or after this cutoff must satisfy the new
// produces/consumes contract. Older sessions predate the contract and are
// exempted — they cannot be retroactively normalized without losing history.
// Update this when doing a contract migration sweep.
const CONTRACT_CUTOFF_YYYYMMDD = 20260513;

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
    // Date formats:
    //   - Session artifacts (specs, plans, reviews):  YYYYMMDD  (8 digits)
    //   - Runtime-generated artifacts (improvements, evaluations, releases, harness-audits):
    //     YYYY-MM-DD-HHmmss  (e.g. 2026-05-07-063753)
    // 'retro' kept for backward compatibility — standalone retros deprecated since v0.5.8.
    const m = /^(spec|plan|review|execution|evaluation|improvement|production-readiness|subagent|retro|release|harness-audit)-(.+)-(\d{8}|\d{4}-\d{2}-\d{2}-\d{6})$/.exec(baseName);
    if (!m) return null;
    return {
        type: m[1],
        flowId: m[2],
        date: m[3],
    };
}

function artifactDateYYYYMMDD(dateStr) {
    if (/^\d{8}$/.test(dateStr)) return parseInt(dateStr, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})-/.exec(dateStr);
    if (m) return parseInt(m[1] + m[2] + m[3], 10);
    return 0;
}

function loadText(file) {
    return fs.readFileSync(file, "utf8");
}

function loadSkillFrontmatters() {
    // Read each skill's SKILL.md frontmatter. Returns { [skillName]: { produces, consumes, dispatch-agent } }.
    const out = {};
    const entries = fs.readdirSync(skillsRoot, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillPath = path.join(skillsRoot, entry.name, "SKILL.md");
        if (!fs.existsSync(skillPath)) continue;
        const text = fs.readFileSync(skillPath, "utf8");
        const m = text.match(/^---\n([\s\S]*?)\n---/);
        if (!m) continue;
        try {
            const fm = yaml.load(m[1]);
            out[entry.name] = {
                produces: fm.produces || null,
                consumes: fm.consumes || null,
                dispatchAgent: fm["dispatch-agent"] || null,
            };
        } catch (e) {
            // Skip skills with unparseable frontmatter. Reported separately below.
            out[entry.name] = { _parseError: e.message };
        }
    }
    return out;
}

function normalizePattern(s) {
    // Convert "docs/superomni/specs/spec-[branch]-[session]-[date].md"
    // to a regex matching any concrete filename.
    if (!s) return null;
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                     .replace(/\\\[branch\\\]/g, "[^/]+")
                     .replace(/\\\[session\\\]/g, "[^/]+")
                     .replace(/\\\[date\\\]/g, "(?:\\d{8}|\\d{4}-\\d{2}-\\d{2}-\\d{6})");
    return new RegExp("^" + escaped + "$");
}

function main() {
    if (!fs.existsSync(docsRoot)) {
        console.error("docs/superomni directory not found.");
        process.exit(1);
    }
    if (!fs.existsSync(skillsRoot)) {
        console.error("skills directory not found.");
        process.exit(1);
    }

    // ---- Section 1: skill frontmatter produces/consumes linkage (new in v0.5.9+) ----
    const skillFrontmatters = loadSkillFrontmatters();
    const allProducePatterns = [];
    const frontmatterErrors = [];

    for (const [skillName, fm] of Object.entries(skillFrontmatters)) {
        if (fm._parseError) {
            frontmatterErrors.push(`skill ${skillName}: frontmatter YAML parse error: ${fm._parseError}`);
            continue;
        }
        if (fm.produces) {
            allProducePatterns.push({ skill: skillName, pattern: fm.produces });
        }
    }

    // Each consumes entry must match at least one skill's produces pattern.
    for (const [skillName, fm] of Object.entries(skillFrontmatters)) {
        if (fm._parseError) continue;
        if (!fm.consumes || !Array.isArray(fm.consumes)) continue;
        for (const consumeTarget of fm.consumes) {
            const matched = allProducePatterns.some(p => p.pattern === consumeTarget);
            if (!matched) {
                frontmatterErrors.push(
                    `skill ${skillName}: consumes "${consumeTarget}" but no other skill declares this as produces`
                );
            }
        }
    }

    // ---- Section 2: session artifact presence (pre-existing in earlier versions) ----
    const files = listFiles(docsRoot);
    const byFlow = new Map();
    const improvements = [];

    for (const file of files) {
        const parsed = parseArtifactBaseName(path.basename(file, ".md"));
        if (!parsed) continue;

        if (!byFlow.has(parsed.flowId)) {
            byFlow.set(parsed.flowId, { types: new Set(), files: [], latestDate: 0 });
        }

        const group = byFlow.get(parsed.flowId);
        group.types.add(parsed.type);
        group.files.push(file);
        const fileDate = artifactDateYYYYMMDD(parsed.date);
        if (fileDate > group.latestDate) group.latestDate = fileDate;

        if (parsed.type === "improvement") {
            improvements.push(file);
        }
    }

    const errors = [];
    const warnings = [];
    const releases = [];
    const evaluations = [];

    for (const [flowId, group] of byFlow.entries()) {
        const types = group.types;
        const isLegacy = group.latestDate > 0 && group.latestDate < CONTRACT_CUTOFF_YYYYMMDD;

        // Promote issues on pre-cutoff sessions to warnings; new sessions still error.
        const report = (msg, isError = true) => {
            if (isLegacy) {
                warnings.push(`[legacy, pre-${CONTRACT_CUTOFF_YYYYMMDD}] ${msg}`);
            } else if (isError) {
                errors.push(msg);
            } else {
                warnings.push(msg);
            }
        };

        if (types.has("evaluation") && !types.has("improvement")) {
            report(`flow ${flowId}: has evaluation but missing improvement (REFLECT gate)`);
        }

        if (types.has("plan") && !types.has("review")) {
            report(`flow ${flowId}: has plan but missing review`, /*isError*/ false);
        }

        if (types.has("review") && !types.has("execution") && !types.has("subagent")) {
            report(`flow ${flowId}: has review but missing execution/subagent`, /*isError*/ false);
        }
    }

    for (const file of files) {
        const parsed = parseArtifactBaseName(path.basename(file, ".md"));
        if (!parsed) continue;
        if (parsed.type === "release") releases.push(file);
        if (parsed.type === "evaluation") evaluations.push(file);
    }

    // Release files must contain both ## Release and ## Retrospective sections
    for (const file of releases) {
        const text = loadText(file);
        const parsed = parseArtifactBaseName(path.basename(file, ".md"));
        const isLegacy = parsed && artifactDateYYYYMMDD(parsed.date) < CONTRACT_CUTOFF_YYYYMMDD;
        const hasRelease = /^## Release\b/m.test(text);
        const hasRetro = /^## Retrospective\b/m.test(text);

        if (!hasRelease) {
            const msg = `${rel(file)}: release artifact missing "## Release" section`;
            isLegacy ? warnings.push(`[legacy] ${msg}`) : errors.push(msg);
        }
        if (!hasRetro) {
            const msg = `${rel(file)}: release artifact missing "## Retrospective" section`;
            isLegacy ? warnings.push(`[legacy] ${msg}`) : errors.push(msg);
        }
    }

    // Evaluation files must contain a Status field. Two formats accepted.
    for (const file of evaluations) {
        const text = loadText(file);
        const parsed = parseArtifactBaseName(path.basename(file, ".md"));
        const isLegacy = parsed && artifactDateYYYYMMDD(parsed.date) < CONTRACT_CUTOFF_YYYYMMDD;
        const hasStatus = /\*\*Status:\*\*\s*[A-Z_]+/i.test(text) || /^Status:\s*[A-Z_]+/im.test(text);

        if (!hasStatus) {
            const msg = `${rel(file)}: evaluation artifact missing "**Status:**" field`;
            isLegacy ? warnings.push(`[legacy] ${msg}`) : errors.push(msg);
        }
    }

    for (const file of improvements) {
        const text = loadText(file);
        const parsed = parseArtifactBaseName(path.basename(file, ".md"));
        const isLegacy = parsed && artifactDateYYYYMMDD(parsed.date) < CONTRACT_CUTOFF_YYYYMMDD;
        const hasAgentTotal = /\*\*Agent total:\s*\[?\d+\]?\/?15\*\*/i.test(text) || /Agent total:\s*\d+\/?15/i.test(text);
        const hasSkillsAvg = /\*\*Skills avg:\s*\[?\d+(?:\.\d+)?\]?\/?5\*\*/i.test(text) || /Skills avg:\s*\d+(?:\.\d+)?\/?5/i.test(text);
        const actionCount = (text.match(/^### ACTION\s+\d+:/gm) || []).length;

        const rep = (msg) => { isLegacy ? warnings.push(`[legacy] ${msg}`) : errors.push(msg); };
        if (!hasAgentTotal) rep(`${rel(file)}: missing "Agent total" score field`);
        if (!hasSkillsAvg) rep(`${rel(file)}: missing "Skills avg" score field`);
        if (actionCount < 3) rep(`${rel(file)}: expected at least 3 action items, found ${actionCount}`);
    }

    console.log(`Workflow contract check: scanned ${Object.keys(skillFrontmatters).length} skills + ${files.length} markdown files in docs/superomni`);
    console.log(`Contract cutoff: sessions ≥ ${CONTRACT_CUTOFF_YYYYMMDD} enforced; older sessions degrade to warnings.`);

    if (frontmatterErrors.length > 0) {
        console.error("Skill frontmatter contract errors:");
        for (const e of frontmatterErrors) {
            console.error(`- ${e}`);
        }
    }

    if (warnings.length > 0) {
        console.log("Warnings:");
        for (const w of warnings) {
            console.log(`- ${w}`);
        }
    }

    const totalErrors = errors.length + frontmatterErrors.length;
    if (errors.length > 0) {
        console.error("Errors:");
        for (const e of errors) {
            console.error(`- ${e}`);
        }
    }
    if (totalErrors > 0) {
        process.exit(1);
    }

    console.log("Workflow contract check passed.");
}

main();
