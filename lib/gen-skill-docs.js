#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const skillsRoot = path.join(repoRoot, "skills");
const preamblePath = path.join(__dirname, "preamble.md");

function listTemplateFiles(rootDir) {
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
            if (entry.isFile() && fullPath.endsWith(".tmpl")) {
                out.push(fullPath);
            }
        }
    }

    out.sort();
    return out;
}

function expandPreamble(templateText, preambleText) {
    const token = "{{PREAMBLE}}";
    const idx = templateText.indexOf(token);
    if (idx === -1) {
        return templateText;
    }
    return templateText.slice(0, idx) + preambleText + templateText.slice(idx + token.length);
}

function processTemplate(templateFile, preambleText) {
    const targetFile = templateFile.replace(/\.tmpl$/, "");
    const templateText = fs.readFileSync(templateFile, "utf8");
    const output = expandPreamble(templateText, preambleText);
    fs.writeFileSync(targetFile, output, "utf8");
    return { templateFile, targetFile };
}

function main() {
    if (!fs.existsSync(preamblePath)) {
        console.error(`ERROR: preamble.md not found at ${preamblePath}`);
        process.exit(1);
    }

    const inputArg = process.argv[2];
    const preambleText = fs.readFileSync(preamblePath, "utf8");

    let templates;
    if (inputArg) {
        const inputPath = path.resolve(process.cwd(), inputArg);
        if (!fs.existsSync(inputPath)) {
            console.error(`ERROR: File not found: ${inputPath}`);
            process.exit(1);
        }
        templates = [inputPath];
    } else {
        templates = listTemplateFiles(skillsRoot);
    }

    let count = 0;
    for (const tmpl of templates) {
        const { templateFile, targetFile } = processTemplate(tmpl, preambleText);
        const relTemplate = path.relative(repoRoot, templateFile).replace(/\\/g, "/");
        const relTarget = path.relative(repoRoot, targetFile).replace(/\\/g, "/");
        console.log(`generated ${relTarget} (from ${relTemplate})`);
        count += 1;
    }

    console.log(`processed ${count} template(s)`);
}

main();
