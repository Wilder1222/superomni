#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const skillsRoot = path.join(repoRoot, "skills");
const preambleLegacyPath = path.join(__dirname, "preamble.md");
const preambleCorePath = path.join(__dirname, "preamble-core.md");

// Fixed line emitted wherever {{PREAMBLE_REF_LINK}} appears. Keep byte-identical
// with gen-skill-docs.sh and gen-skill-docs.ps1 so the three generators produce
// byte-identical SKILL.md files.
const PREAMBLE_REF_LINK_LINE = "_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._";

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

function expandTokens(templateText, tokens) {
    let output = templateText;
    for (const [token, replacement] of tokens) {
        const idx = output.indexOf(token);
        if (idx === -1) continue;
        output = output.slice(0, idx) + replacement + output.slice(idx + token.length);
    }
    return output;
}

function processTemplate(templateFile, coreText, legacyText) {
    const targetFile = templateFile.replace(/\.tmpl$/, "");
    // Normalize CRLF/CR → LF on read so all three generators (js / sh / ps1)
    // emit identical bytes regardless of the OS that checked out the templates.
    const templateText = fs.readFileSync(templateFile, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // Note: `${CLAUDE_SKILL_DIR}` is intentionally NOT substituted here. Anthropic's
    // skill runtime resolves it at load time; the literal token must reach the generated
    // SKILL.md so the runtime sees it. Keeping it literal also guarantees byte-parity
    // across js/sh/ps1 generators (no per-OS path divergence).

    const tokens = [
        ["{{PREAMBLE_CORE}}", coreText],
        ["{{PREAMBLE_REF_LINK}}", PREAMBLE_REF_LINK_LINE],
    ];

    // Deprecated alias: {{PREAMBLE}} still expands to the full legacy preamble,
    // but emits a stderr warning so templates migrate to the new placeholders.
    if (templateText.indexOf("{{PREAMBLE}}") !== -1) {
        const rel = path.relative(repoRoot, templateFile).replace(/\\/g, "/");
        console.warn(`[deprecated] ${rel} uses {{PREAMBLE}}; migrate to {{PREAMBLE_CORE}} + {{PREAMBLE_REF_LINK}}`);
        tokens.push(["{{PREAMBLE}}", legacyText]);
    }

    let output = expandTokens(templateText, tokens);
    // Normalize: no trailing newline. All 3 generators (js / sh / ps1) emit identical output.
    output = output.replace(/\n+$/, "");
    fs.writeFileSync(targetFile, output, "utf8");
    return { templateFile, targetFile };
}

function main() {
    if (!fs.existsSync(preambleCorePath)) {
        console.error(`ERROR: preamble-core.md not found at ${preambleCorePath}`);
        process.exit(1);
    }
    if (!fs.existsSync(preambleLegacyPath)) {
        console.error(`ERROR: preamble.md not found at ${preambleLegacyPath}`);
        process.exit(1);
    }

    const inputArg = process.argv[2];
    // Strip a single trailing newline so the template line's own newline
    // terminates the expanded block — guarantees byte-parity with .sh/.ps1.
    const coreText = fs.readFileSync(preambleCorePath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
    const legacyText = fs.readFileSync(preambleLegacyPath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");

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
        const { templateFile, targetFile } = processTemplate(tmpl, coreText, legacyText);
        const relTemplate = path.relative(repoRoot, templateFile).replace(/\\/g, "/");
        const relTarget = path.relative(repoRoot, targetFile).replace(/\\/g, "/");
        console.log(`generated ${relTarget} (from ${relTemplate})`);
        count += 1;
    }

    console.log(`processed ${count} template(s)`);
}

main();
