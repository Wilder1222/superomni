#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const skillsRoot = path.join(repoRoot, "skills");
const preamblePath = path.join(__dirname, "preamble.md");

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

function expandPreamble(templateText, preambleText) {
    const token = "{{PREAMBLE}}";
    const idx = templateText.indexOf(token);
    if (idx === -1) {
        return templateText;
    }
    return templateText.slice(0, idx) + preambleText + templateText.slice(idx + token.length);
}

function rel(file) {
    return path.relative(repoRoot, file).replace(/\\/g, "/");
}

function main() {
    const preamble = fs.readFileSync(preamblePath, "utf8");
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
        const expected = expandPreamble(templateContent, preamble);
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
