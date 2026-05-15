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

// Mirror the token expansion in lib/gen-skill-docs.js. Each preamble token's FIRST occurrence
// is replaced (subsequent occurrences in code-fenced examples stay literal). Trailing newline
// stripped to match generators. ${CLAUDE_SKILL_DIR} stays literal — runtime expands it.
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
    return output.replace(/\n+$/, "");
}

function rel(file) {
    return path.relative(repoRoot, file).replace(/\\/g, "/");
}

function main() {
    // Match gen-skill-docs.js normalization: strip single trailing newline
    // so the template's own newline after the token terminates the expansion.
    const preambleCore = fs.readFileSync(preambleCorePath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
    const preambleLegacy = fs.readFileSync(preambleLegacyPath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
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

        const templateContent = fs.readFileSync(tmpl, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const expected = expandPreamble(templateContent, preambleCore, preambleLegacy);
        const actualRaw = fs.readFileSync(target, "utf8");
        const actual = actualRaw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n+$/, "");

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

    // Advisory warnings (do NOT fail; project-wide skill-layering convention).
    // Convention: skills/<name>/reference/<topic>.md (subdirectory).
    // Skip the meta-skill `framework-management` because it must contain literal
    // examples of the very rules below as part of its teaching content.
    const advisories = [];
    for (const tmpl of templateFiles) {
        const skillDir = path.dirname(tmpl);
        const skillName = path.basename(skillDir);
        if (skillName === "framework-management") continue;
        const generated = tmpl.replace(/\.tmpl$/, "");
        if (!fs.existsSync(generated)) continue;
        const lineCount = fs.readFileSync(generated, "utf8").split(/\r?\n/).length;
        const referenceDirExists = fs.existsSync(path.join(skillDir, "reference"));
        if (lineCount >= 300 && !referenceDirExists) {
            advisories.push(
                `${rel(generated)}: ${lineCount} lines without a reference/ subdir. ` +
                `Consider extracting per the project's progressive-disclosure convention.`
            );
        }
    }
    // Flat reference.md files are non-conforming (project convention is reference/<topic>.md).
    const flatReferenceFiles = [];
    for (const dir of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
        if (!dir.isDirectory() || dir.name === "framework-management") continue;
        const flat = path.join(skillsRoot, dir.name, "reference.md");
        if (fs.existsSync(flat)) flatReferenceFiles.push(flat);
    }
    for (const f of flatReferenceFiles) {
        advisories.push(
            `${rel(f)} is a flat reference.md. Project convention is reference/<topic>.md. See framework-management § Supporting Files.`
        );
    }

    // Generated SKILL.md files must be LF-only. .gitattributes pins LF, but a manual edit
    // bypassing `npm run gen-skills` could leave CRLF in place. This advisory catches that.
    for (const file of skillFiles) {
        const raw = fs.readFileSync(file, "utf8");
        if (raw.includes("\r\n")) {
            advisories.push(
                `${rel(file)} contains CRLF line endings. Run \`npm run gen-skills\` to normalize, or check .gitattributes LF pin.`
            );
        }
    }

    // Token-literal advisory: a SKILL.md.tmpl that uses {{PREAMBLE*}} in raw prose
    // (outside code fences AND outside inline-backtick spans, after the first canonical
    // occurrence) will be silently expanded by the generators' deprecated-alias /
    // preamble-core paths. Caught reactively in v0.6.3 (framework-management bug);
    // this advisory makes it proactive.
    //
    // What counts as "safe":
    //   - First non-fenced occurrence (canonical position; expanded once, intentional).
    //   - Inside a fenced code block (```...```).
    //   - Inside an inline-backtick span (`...`) — markdown renders as inline code.
    //
    // What triggers the advisory:
    //   - Subsequent occurrence in raw prose, where the generator's first-occurrence
    //     behavior would NOT protect it if the canonical position were ever removed,
    //     AND markdown renders it as expandable plain text.
    const PREAMBLE_TOKENS = ["{{PREAMBLE_CORE}}", "{{PREAMBLE_REF_LINK}}", "{{PREAMBLE}}"];
    function stripInlineBackticks(line) {
        // Replace `...` spans (and ``...`` etc.) with placeholders so token
        // detection skips inline-code references.
        return line.replace(/`+[^`]*`+/g, "___INLINE_CODE___");
    }
    for (const tmpl of templateFiles) {
        const lines = fs.readFileSync(tmpl, "utf8").replace(/\r\n/g, "\n").split("\n");
        let inFence = false;
        const seenFirst = new Set();
        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            if (rawLine.trimStart().startsWith("```")) {
                inFence = !inFence;
                continue;
            }
            if (inFence) continue;
            const line = stripInlineBackticks(rawLine);
            for (const tok of PREAMBLE_TOKENS) {
                if (line.includes(tok)) {
                    if (!seenFirst.has(tok)) {
                        seenFirst.add(tok);
                        continue; // first non-fenced occurrence is canonical (allowed)
                    }
                    advisories.push(
                        `${rel(tmpl)}:${i + 1}: literal '${tok}' in prose (outside code fence / inline-backtick) will be expanded by the generator. Use prose phrasing or wrap in backticks.`
                    );
                }
            }
        }
    }

    if (advisories.length > 0) {
        for (const a of advisories) {
            console.warn(`[advisory] ${a}`);
        }
    }

    console.log(`Skill docs check passed: ${skillFiles.length} generated files, ${templateFiles.length} templates`);
}

main();
