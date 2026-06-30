#!/usr/bin/env node
"use strict";

// lib/check-plan-content.js — CI hard-gate for v0.6.3 Pre-Destructive Gate.
//
// Scans every docs/superomni/plans/plan-*.md (date >= CUTOFF_DATE). For each step
// whose **How:** subsection contains a destructive pattern (markdown-aware: outside
// code fences AND outside inline-backtick spans), the IMMEDIATELY PRECEDING step
// in document order MUST contain the keyword "careful" (case-insensitive). If not,
// the plan violates the gate.
//
// This is the CI hard-gate for the writing-plans Pre-Destructive Gate template
// guidance added in v0.6.3. Closes the v0.6.3 retro deferred item.
//
// Mirrors: lib/check-plugin-sync.js shape (output format), lib/check-skill-docs.js
// fence/inline-backtick stripping (v0.6.4 token-literal advisory).

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const plansDir = path.join(repoRoot, "docs", "superomni", "plans");

// Plans dated < CUTOFF_DATE are exempt (historical immutability — v0.6.0 plan
// dated 20260513 has Step 14.5 inserted AFTER Step 14, which would violate the
// document-order rule. v0.6.3+ plans (date >= 20260514) all comply.)
const CUTOFF_DATE = 20260514;

// Destructive patterns that require a preceding `careful` step. Hard-coded; add
// new patterns here as discovered. Case-sensitive (these are exact command tokens).
const DESTRUCTIVE_PATTERNS = [
    "git rm",
    "git filter-branch",
    "git reset --hard",
    "git push --force",
    "git push -f",
    "git push --force-with-lease",
    "rm -rf",
    "gh repo delete",
    "gh release delete",
    "DROP TABLE",
    "DROP DATABASE",
    "DELETE FROM",
    "TRUNCATE",
    "npm publish",
    "npm unpublish",
];

function rel(file) {
    return path.relative(repoRoot, file).replace(/\\/g, "/");
}

// Extract the date suffix from a plan filename: plan-<branch>-<session>-<YYYYMMDD>.md
// Returns the integer date or null if filename doesn't match.
function extractDate(filename) {
    const m = /-([12]\d{7})\.md$/.exec(filename);
    return m ? parseInt(m[1], 10) : null;
}

// NOTE: unlike v0.6.4 token-literal advisory in check-skill-docs.js, plan-content
// does NOT strip inline-backtick spans. In a SKILL.md.tmpl, `` `{{PREAMBLE_CORE}}` ``
// means "literal token, don't expand" — so backticks indicate "ignore this for the
// expansion gate". In a plan **How:** section, backticks indicate "command to run"
// (e.g., `Run `git rm -rf foo/``). Stripping them would suppress real command
// instructions. We DO strip fenced code blocks (```...```) because those are usually
// documentation/teaching content (e.g., v0.6.3 plan Step 9 quotes the gate's
// teaching template inside a fence — those are example, not action).

// Parse a plan into an array of step objects, in document order:
//   { number: "14" | "14.5", title: "...", body: "...full body text including How section" }
function parsePlan(text) {
    const lines = text.split(/\r?\n/);
    const stepHeaderRe = /^### Step (\d+(?:\.\d+)?):\s*(.*)$/;
    const steps = [];
    let current = null;
    for (const line of lines) {
        const m = stepHeaderRe.exec(line);
        if (m) {
            if (current) steps.push(current);
            current = { number: m[1], title: m[2], bodyLines: [] };
            continue;
        }
        // Stop accumulating into current step at top-level non-step section header
        // (lines starting with `## ` — single hash is a higher level than `### Step`).
        if (current && /^## [^#]/.test(line)) {
            steps.push(current);
            current = null;
            continue;
        }
        if (current) current.bodyLines.push(line);
    }
    if (current) steps.push(current);
    return steps.map((s) => ({
        number: s.number,
        title: s.title,
        body: s.bodyLines.join("\n"),
    }));
}

// Extract the `**How:**` subsection from a step body. Returns the text between
// `**How:**` and the next `**Verification:**` / `**Effort:**` / EOF marker.
function extractHowSection(body) {
    const lines = body.split("\n");
    let inHow = false;
    const collected = [];
    for (const line of lines) {
        if (/^\*\*How:\*\*/.test(line)) {
            inHow = true;
            continue;
        }
        if (inHow && /^\*\*(Verification|Effort|Files|What):\*\*/.test(line)) {
            break;
        }
        if (inHow) collected.push(line);
    }
    return collected.join("\n");
}

// Find destructive patterns in a How section. Skips fenced code blocks
// (multi-line ```...```; usually teaching/documentation). Does NOT skip
// inline-backtick spans (in plan How sections, `cmd` typically means
// "run this command", not "literal token").
function findDestructiveInHow(howText) {
    const lines = howText.split("\n");
    let inFence = false;
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        if (raw.trimStart().startsWith("```")) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;
        for (const pat of DESTRUCTIVE_PATTERNS) {
            if (raw.includes(pat)) {
                hits.push({ pattern: pat, line: i + 1 });
                break; // one hit per line is enough
            }
        }
    }
    return hits;
}

// Check the preceding step's body for the careful keyword (case-insensitive).
// "Preceding" = previous index in the parsePlan() array (document order).
function hasCarefulInPrecedingStep(steps, idx) {
    if (idx === 0) return false; // no preceding step
    const prev = steps[idx - 1];
    const haystack = `${prev.title}\n${prev.body}`.toLowerCase();
    return /\bcareful\b/.test(haystack);
}

const failures = [];
const planFiles = fs.readdirSync(plansDir)
    .filter((f) => /^plan-.*\.md$/.test(f))
    .sort();

let scannedCount = 0;
let destructiveStepCount = 0;
let exemptCount = 0;

for (const filename of planFiles) {
    const filepath = path.join(plansDir, filename);
    const date = extractDate(filename);
    if (date === null || date < CUTOFF_DATE) {
        exemptCount += 1;
        continue;
    }
    scannedCount += 1;
    const text = fs.readFileSync(filepath, "utf8");
    const steps = parsePlan(text);
    if (steps.length === 0) {
        console.warn(
            `[advisory] ${rel(filepath)}: parsed 0 steps — plan format may not match the linter's expected \`### Step N:\` structure; Pre-Destructive Gate may be a silent no-op on this plan. Verify the step headers use \`### Step N:\` (3 hashes, colon) and \`**How:**\` on its own line.`
        );
    }
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const howText = extractHowSection(step.body);
        if (!howText) continue;
        const hits = findDestructiveInHow(howText);
        if (hits.length === 0) continue;
        destructiveStepCount += 1;
        if (!hasCarefulInPrecedingStep(steps, i)) {
            const patterns = [...new Set(hits.map((h) => h.pattern))].join(", ");
            const precedingLabel = i === 0 ? "(none — destructive is first step)" : `Step ${steps[i - 1].number}`;
            failures.push(
                `${rel(filepath)}: Step ${step.number} contains destructive pattern(s) [${patterns}] in **How:** but preceding ${precedingLabel} does not invoke 'careful'. ` +
                `Per writing-plans Pre-Destructive Gate, insert a careful step BEFORE Step ${step.number} (document order).`
            );
        }
    }
}

if (failures.length > 0) {
    console.error("Plan-content check FAILED:\n");
    for (const f of failures) {
        console.error(`- ${f}`);
    }
    process.exit(1);
}

console.log(
    `Plan-content check passed: scanned ${scannedCount} plan(s), ` +
    `${destructiveStepCount} destructive step(s), all preceded by 'careful' step. ` +
    `(${exemptCount} historical plan(s) exempt by cutoff date < ${CUTOFF_DATE}.)`
);
process.exit(0);
