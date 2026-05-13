#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const skillsRoot = path.join(repoRoot, "skills");
const preambleLegacyPath = path.join(__dirname, "preamble.md");
const preambleCorePath = path.join(__dirname, "preamble-core.md");

// Must match the literal emitted by gen-skill-docs.{js,sh,ps1} for {{PREAMBLE_REF_LINK}}.
const PREAMBLE_REF_LINK_LINE = "_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._";

const deprecatedPhrases = [
    "THINK is the only human gate.",
    "Pipeline stage order: THINK → PLAN → REVIEW → BUILD → VERIFY → SHIP → REFLECT",
    "[STAGE] DONE → advancing to [NEXT-STAGE]"
];

function listFiles(rootDir, suffix) {
    const out = [];
    const stack = [rootDir];

    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }
            if (entry.isFile() && fullPath.endsWith(suffix)) {
                out.push(fullPath);
            }
        }
    }

    out.sort();
    return out;
}

function countFrontmatterHeaders(text) {
    const lines = text.split(/\r?\n/);
    let count = 0;
    let inFence = false;

    for (let i = 0; i < lines.length - 1; i += 1) {
        const line = lines[i].trim();
        if (line.startsWith("```")) {
            inFence = !inFence;
            continue;
        }
        if (inFence) {
            continue;
        }
        if (line === "---" && /^name:\s+/.test(lines[i + 1].trim())) {
            count += 1;
        }
    }
    return count;
}

// Mirror the token expansion in lib/gen-skill-docs.js. Each token's FIRST occurrence
// is replaced. Subsequent occurrences (e.g. in example code blocks inside
// framework-management) are intentionally left as literal text.
function expandPreamble(templateText, coreText, legacyText) {
    const tokens = [
        ["{{PREAMBLE_CORE}}", coreText],
        ["{{PREAMBLE_REF_LINK}}", PREAMBLE_REF_LINK_LINE],
        ["{{PREAMBLE}}", legacyText],
    ];

    let output = templateText;
    for (const [token, replacement] of tokens) {
        const idx = output.indexOf(token);
        if (idx === -1) continue;
        output = output.slice(0, idx) + replacement + output.slice(idx + token.length);
    }
    return output;
}

function rel(file) {
    return path.relative(repoRoot, file).replace(/\\/g, "/");
}

function main() {
    // Match gen-skill-docs.js normalization: strip single trailing newline
    // so the template's own newline after the token terminates the expansion.
    const preambleCore = fs.readFileSync(preambleCorePath, "utf8").replace(/\n$/, "");
    const preambleLegacy = fs.readFileSync(preambleLegacyPath, "utf8").replace(/\n$/, "");
    const skillFiles = listFiles(skillsRoot, "SKILL.md");
    const templateFiles = listFiles(skillsRoot, "SKILL.md.tmpl");

    const errors = [];

    for (const file of skillFiles) {
        const content = fs.readFileSync(file, "utf8");

        const frontmatterCount = countFrontmatterHeaders(content);
        if (frontmatterCount > 1) {
            errors.push(`${rel(file)}: duplicate frontmatter header detected (${frontmatterCount} name blocks)`);
        }

        for (const phrase of deprecatedPhrases) {
            if (content.includes(phrase)) {
                errors.push(`${rel(file)}: deprecated phrase found: ${phrase}`);
            }
        }
    }

    for (const tmpl of templateFiles) {
        const target = tmpl.replace(/\.tmpl$/, "");
        if (!fs.existsSync(target)) {
            errors.push(`${rel(target)}: missing generated file for template ${rel(tmpl)}`);
            continue;
        }

        const templateContent = fs.readFileSync(tmpl, "utf8");
        const expected = expandPreamble(templateContent, preambleCore, preambleLegacy);
        const actual = fs.readFileSync(target, "utf8");

        if (expected !== actual) {
            errors.push(`${rel(target)}: drift detected against ${rel(tmpl)} (run npm run gen-skills)`);
        }
    }

    if (errors.length > 0) {
        console.error("Skill docs check FAILED:\n");
        for (const e of errors) {
            console.error(`- ${e}`);
        }
        process.exit(1);
    }

    console.log(`Skill docs check passed: ${skillFiles.length} generated files, ${templateFiles.length} templates`);
}

main();
