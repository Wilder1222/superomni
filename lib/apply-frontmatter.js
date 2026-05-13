#!/usr/bin/env node
"use strict";

// One-shot utility: apply frontmatter-map.json to every skill tmpl (+ using-skills SKILL.md
// which has no tmpl). Appends `when_to_use`, `produces`, `consumes`, optional `dispatch-agent`,
// and optionally overrides `description`. Preserves existing `name` / `allowed-tools`.

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const skillsRoot = path.join(repoRoot, "skills");
const mapPath = path.join(__dirname, "frontmatter-map.json");

const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));

function parseFrontmatter(text) {
    const lines = text.split(/\r?\n/);
    if (lines[0] !== "---") {
        throw new Error("missing opening ---");
    }
    let endIdx = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i] === "---") { endIdx = i; break; }
    }
    if (endIdx === -1) throw new Error("missing closing ---");
    const fmBlock = lines.slice(1, endIdx);
    const body = lines.slice(endIdx + 1).join("\n");

    const existing = {};
    let i = 0;
    while (i < fmBlock.length) {
        const line = fmBlock[i];
        const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
        if (!m) { i++; continue; }
        const key = m[1];
        const rest = m[2];
        if (rest === "|" || rest === ">") {
            const block = [];
            i++;
            while (i < fmBlock.length && (fmBlock[i].startsWith("  ") || fmBlock[i] === "")) {
                block.push(fmBlock[i].replace(/^  /, ""));
                i++;
            }
            existing[key] = { kind: "block", value: block.join("\n") };
        } else {
            existing[key] = { kind: "inline", value: rest };
            i++;
        }
    }
    return { existing, body };
}

// Emit a YAML block-scalar (|) so embedded `:`, `"`, `→` are never parsed as YAML syntax.
function emitBlockScalar(key, value, out) {
    out.push(`${key}: |`);
    const lines = String(value).split("\n");
    for (const ln of lines) {
        out.push(ln === "" ? "" : `  ${ln}`);
    }
}

function buildFrontmatter(skillName, cfg, existing) {
    const out = ["---"];

    out.push(`name: ${skillName}`);

    // description — override if provided, else preserve existing.
    const descOverride = cfg.description_override;
    if (descOverride) {
        emitBlockScalar("description", descOverride, out);
    } else if (existing.description) {
        if (existing.description.kind === "block") {
            emitBlockScalar("description", existing.description.value, out);
        } else {
            emitBlockScalar("description", existing.description.value, out);
        }
    }

    // allowed-tools — preserve existing (already a valid flow sequence).
    if (existing["allowed-tools"]) {
        out.push(`allowed-tools: ${existing["allowed-tools"].value}`);
    }

    if (cfg.when_to_use) {
        emitBlockScalar("when_to_use", cfg.when_to_use, out);
    }

    if (cfg.produces) {
        out.push(`produces: ${JSON.stringify(cfg.produces)}`);
    } else {
        out.push(`produces: ~`);
    }

    if (cfg.consumes === null || cfg.consumes === undefined) {
        out.push(`consumes: ~`);
    } else if (Array.isArray(cfg.consumes) && cfg.consumes.length === 0) {
        out.push(`consumes: []`);
    } else {
        out.push(`consumes:`);
        for (const c of cfg.consumes) {
            out.push(`  - ${JSON.stringify(c)}`);
        }
    }

    if (cfg["dispatch-agent"]) {
        out.push(`dispatch-agent: ${cfg["dispatch-agent"]}`);
    }

    out.push("---");
    return out.join("\n");
}

function processFile(filePath, skillName) {
    const cfg = map[skillName];
    if (!cfg) {
        console.warn(`[skip] no map entry for ${skillName}`);
        return false;
    }
    const text = fs.readFileSync(filePath, "utf8");
    const { existing, body } = parseFrontmatter(text);
    const newFm = buildFrontmatter(skillName, cfg, existing);
    const newText = newFm + "\n\n" + body;
    fs.writeFileSync(filePath, newText, "utf8");
    return true;
}

function main() {
    const dirs = fs.readdirSync(skillsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .filter(n => !n.startsWith("."));

    let count = 0;
    for (const skillName of dirs) {
        const tmplPath = path.join(skillsRoot, skillName, "SKILL.md.tmpl");
        const mdPath = path.join(skillsRoot, skillName, "SKILL.md");
        const target = fs.existsSync(tmplPath) ? tmplPath : mdPath;
        if (!fs.existsSync(target)) {
            console.warn(`[skip] ${skillName}: no SKILL.md(.tmpl)`);
            continue;
        }
        const ok = processFile(target, skillName);
        if (ok) {
            console.log(`applied ${path.relative(repoRoot, target).replace(/\\/g, "/")}`);
            count++;
        }
    }
    console.log(`\napplied frontmatter to ${count} skills`);
}

main();
