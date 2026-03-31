#!/usr/bin/env node
// lib/setup.js — Cross-platform setup for superomni
// Replaces the bash `setup` script with pure Node.js implementation
// Installs skill framework for Claude Code, Codex CLI, Gemini CLI, GitHub Copilot
//
// Usage:
//   node lib/setup.js                 # Global install (auto-detect platforms)
//   node lib/setup.js --only claude   # Install for specific platform
//   SUPEROMNI_TARGET_DIR=/path node lib/setup.js  # Project-level install
//
// Supports: Windows, Linux, macOS (no bash/shell dependencies)

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// ── Configuration ────────────────────────────────────────────────────────────

const VERSION = '0.4.1';
const SCRIPT_DIR = path.join(__dirname, '..');
const OMNI_STATE_DIR = path.join(os.homedir(), '.omni-skills');
const TARGET_DIR = process.env.SUPEROMNI_TARGET_DIR || '';

// ── CLI Parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let ONLY_PLATFORM = '';
let SKIP_PLATFORMS = new Set();
let DRY_RUN = false;
let VERBOSE = false;

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
        showHelp();
        process.exit(0);
    } else if (arg === '--only') {
        ONLY_PLATFORM = args[++i];
    } else if (arg === '--skip') {
        SKIP_PLATFORMS.add(args[++i]);
    } else if (arg === '--dry-run') {
        DRY_RUN = true;
    } else if (arg === '--verbose') {
        VERBOSE = true;
    } else {
        console.error(`Unknown option: ${arg} (try --help)`);
        process.exit(1);
    }
}

function shouldInstall(platform) {
    if (ONLY_PLATFORM && ONLY_PLATFORM !== platform) return false;
    if (SKIP_PLATFORMS.has(platform)) return false;
    return true;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function log(msg, level = 'INFO') {
    if (level === 'VERBOSE' && !VERBOSE) return;
    console.log(`[${level}] ${msg}`);
}

function showHelp() {
    console.log(`
superomni v${VERSION} — AI skill framework setup

Usage: setup [OPTIONS]

  This script is run automatically by:
    npm install -g superomni   (global install)
    SUPEROMNI_TARGET_DIR=. npx superomni  (project-level install)

Options:
  --help, -h        Show this help message
  --only <platform> Install for a single platform only
                    (claude, codex, gemini, copilot)
  --skip <platform> Skip a specific platform (repeatable)
  --dry-run         Show what would be done without making changes
  --verbose         Show detailed output

Supported platforms:
  claude   Claude Code        (~/.claude/skills/ or <project>/CLAUDE.md)
  codex    Codex CLI          (~/.agents/skills/ or <project>/AGENTS.md)
  gemini   Gemini CLI         (~/.gemini/skills/ or <project>/GEMINI.md)
  copilot  GitHub Copilot     (<project>/.github/copilot-instructions.md)

Examples:
  npm install -g superomni
  SUPEROMNI_TARGET_DIR=. npx superomni
  npx superomni --only codex
  npx superomni --skip gemini
`);
}

function ensureDir(dirPath) {
    if (!DRY_RUN && !fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
    if (!DRY_RUN) {
        ensureDir(path.dirname(filePath));
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

function symlinkDir(sourceDir, targetPath) {
    if (DRY_RUN) {
        log(`[dry-run] Would symlink ${sourceDir} → ${targetPath}`);
        return true;
    }

    ensureDir(path.dirname(targetPath));

    // Remove existing symlink
    if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isSymbolicLink()) {
        fs.unlinkSync(targetPath);
    }

    // Don't overwrite real directories
    if (fs.existsSync(targetPath) && !fs.lstatSync(targetPath).isSymbolicLink()) {
        log(`⚠ ${targetPath} already exists (not a symlink). Skipping.`);
        return false;
    }

    try {
        fs.symlinkSync(sourceDir, targetPath, 'dir');
        return true;
    } catch (err) {
        log(`Error creating symlink: ${err.message}`, 'ERROR');
        return false;
    }
}

function symlinkFile(sourceFile, targetPath) {
    if (DRY_RUN) {
        log(`[dry-run] Would symlink ${sourceFile} → ${targetPath}`);
        return true;
    }

    ensureDir(path.dirname(targetPath));

    // Remove existing symlink
    if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isSymbolicLink()) {
        fs.unlinkSync(targetPath);
    }

    // Don't overwrite real files
    if (fs.existsSync(targetPath) && !fs.lstatSync(targetPath).isSymbolicLink()) {
        log(`⚠ ${targetPath} already exists and is not managed by superomni. Skipping.`);
        return false;
    }

    try {
        fs.symlinkSync(sourceFile, targetPath, 'file');
        return true;
    } catch (err) {
        log(`Error creating symlink: ${err.message}`, 'ERROR');
        return false;
    }
}

function buildCommandCatalog() {
    const cmdsDir = path.join(SCRIPT_DIR, 'commands');
    let catalog = '';

    if (fileExists(cmdsDir)) {
        const files = fs.readdirSync(cmdsDir);
        for (const file of files) {
            if (file.endsWith('.md')) {
                const name = file.replace(/\.md$/, '');
                catalog += `\n- /${name}`;
            }
        }
    }

    return catalog || '\n- /vibe';
}

const LOCAL_SKILL_SNIPPET = `# superomni Skills

You are augmented with the superomni AI coding skill framework.

Skills directory: .superomni/skills
Agent library:    .superomni/agents

Load and follow \.superomni/skills/using-skills/SKILL.md at session start.
See \.superomni/agents/ for specialized agents.

Available slash-style commands:${buildCommandCatalog()}

If this CLI does not support native slash commands, treat the command names above
as intents and execute the matching command file from .superomni/commands/.`;

// ── Build skill docs ────────────────────────────────────────────────────────

function buildSkillDocs() {
    log('Building skill docs from templates...');

    if (DRY_RUN) {
        log('[dry-run] Would build skill docs');
        return;
    }

    try {
        const preambleFile = path.join(SCRIPT_DIR, 'lib', 'preamble.md');
        if (!fileExists(preambleFile)) {
            VERBOSE && log('⚠ preamble.md not found (optional)', 'WARN');
            return;
        }

        const preambleContent = readFile(preambleFile);
        const skillsDir = path.join(SCRIPT_DIR, 'skills');

        if (!fileExists(skillsDir)) {
            VERBOSE && log('⚠ skills directory not found (optional)', 'WARN');
            return;
        }

        // Find all SKILL.md.tmpl files and process them (non-recursive for safety)
        const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter(e => e.isDirectory())
            .map(e => e.name);

        let processed = 0;
        for (const skillDirName of skillDirs) {
            const skillDir = path.join(skillsDir, skillDirName);
            const tmplFile = path.join(skillDir, 'SKILL.md.tmpl');

            if (fileExists(tmplFile)) {
                try {
                    const tmplContent = readFile(tmplFile);
                    // Replace {{PREAMBLE}} (only first occurrence)
                    const skillContent = tmplContent.replace(
                        /\{\{PREAMBLE\}\}/,
                        preambleContent
                    );
                    const skillFile = path.join(skillDir, 'SKILL.md');
                    writeFile(skillFile, skillContent);
                    processed++;
                    VERBOSE && log(`✓ ${tmplFile} → ${skillFile}`);
                } catch (err) {
                    log(`⚠ Failed to process ${tmplFile}: ${err.message}`, 'WARN');
                }
            }
        }

        VERBOSE && log(`✓ Skill docs built (${processed} skills)`);
    } catch (_err) {
        // Non-fatal
        log('⚠ Could not build skill docs (optional)', 'WARN');
    }
}

// ── Copy skills to project ───────────────────────────────────────────────────

function copySkillsToProject(projectDir) {
    if (DRY_RUN) {
        log(`[dry-run] Would copy skills → ${projectDir}/.superomni`);
        return;
    }

    const destDir = path.join(projectDir, '.superomni');

    // Skip if already installed
    if (fileExists(path.join(destDir, 'skills'))) {
        return;
    }

    ensureDir(destDir);

    // Copy directories recursively
    const copyRecursive = (src, dest) => {
        ensureDir(dest);
        const files = fs.readdirSync(src);
        for (const file of files) {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);

            if (fs.statSync(srcPath).isDirectory()) {
                copyRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    };

    copyRecursive(path.join(SCRIPT_DIR, 'skills'), path.join(destDir, 'skills'));
    copyRecursive(path.join(SCRIPT_DIR, 'agents'), path.join(destDir, 'agents'));
    copyRecursive(path.join(SCRIPT_DIR, 'commands'), path.join(destDir, 'commands'));

    log(`✓ Skills copied → ${destDir}`);
}

// ── Write local config ───────────────────────────────────────────────────────

function writeLocalConfig(filePath, content) {
    if (DRY_RUN) {
        log(`[dry-run] Would write ${filePath}`);
        return;
    }

    ensureDir(path.dirname(filePath));

    // Check if already references superomni
    if (fileExists(filePath)) {
        const existing = readFile(filePath);
        if (existing.includes('superomni')) {
            log(`✓ ${filePath} already references superomni (skipped)`);
            return;
        }
    }

    writeFile(filePath, content + '\n');
    log(`✓ Written → ${filePath}`);
}

// ── Platform installation ────────────────────────────────────────────────────

function installClaude() {
    if (!shouldInstall('claude')) return;

    const claudeSkillsDir = path.join(os.homedir(), '.claude', 'skills');

    if (TARGET_DIR) {
        log('● Claude Code (local install → ' + TARGET_DIR + ')');
        copySkillsToProject(TARGET_DIR);
        writeLocalConfig(path.join(TARGET_DIR, 'CLAUDE.md'), LOCAL_SKILL_SNIPPET);
    } else {
        log('● Claude Code (global install)');
        if (symlinkDir(SCRIPT_DIR, path.join(claudeSkillsDir, 'superomni'))) {
            log(`✓ Claude Code: linked → ${path.join(claudeSkillsDir, 'superomni')}`);
        }

        // Install slash commands
        const cmdsDir = path.join(SCRIPT_DIR, 'commands');
        const claudeCmdsDir = path.join(os.homedir(), '.claude', 'commands');

        if (fileExists(cmdsDir)) {
            ensureDir(claudeCmdsDir);
            const cmdFiles = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.md'));
            for (const cmdFile of cmdFiles) {
                symlinkFile(
                    path.join(cmdsDir, cmdFile),
                    path.join(claudeCmdsDir, cmdFile)
                );
            }
            if (!DRY_RUN) {
                log(`✓ Claude Code commands linked (${cmdFiles.length} commands) → ${claudeCmdsDir}`);
            }
        }
    }
}

function installCodex() {
    if (!shouldInstall('codex')) return;

    const codexSkillsDir = path.join(os.homedir(), '.agents', 'skills');

    if (TARGET_DIR) {
        log('● Codex CLI (local install → ' + TARGET_DIR + ')');
        copySkillsToProject(TARGET_DIR);
        writeLocalConfig(path.join(TARGET_DIR, 'AGENTS.md'), LOCAL_SKILL_SNIPPET);
    } else {
        // Check if codex is installed
        let hasCodex = false;
        try {
            execSync('codex --version', { stdio: 'ignore', timeout: 2000 });
            hasCodex = true;
        } catch (_err) {
            // codex not available
        }

        if (hasCodex || fileExists(path.join(os.homedir(), '.agents'))) {
            log('● Codex CLI detected');
            if (symlinkDir(SCRIPT_DIR, path.join(codexSkillsDir, 'superomni'))) {
                log(`✓ Codex CLI: linked → ${path.join(codexSkillsDir, 'superomni')}`);
            }
        } else if (ONLY_PLATFORM === 'codex') {
            log('● Codex CLI (forced via --only)');
            if (symlinkDir(SCRIPT_DIR, path.join(codexSkillsDir, 'superomni'))) {
                log(`✓ Codex CLI: linked → ${path.join(codexSkillsDir, 'superomni')}`);
            }
        } else {
            VERBOSE && log('○ Codex CLI not detected (skipped)');
        }
    }
}

function installGemini() {
    if (!shouldInstall('gemini')) return;

    const geminiSkillsDir = path.join(os.homedir(), '.gemini', 'skills');

    if (TARGET_DIR) {
        log('● Gemini CLI (local install → ' + TARGET_DIR + ')');
        copySkillsToProject(TARGET_DIR);
        writeLocalConfig(path.join(TARGET_DIR, 'GEMINI.md'), LOCAL_SKILL_SNIPPET);
    } else {
        let hasGemini = false;
        try {
            execSync('gemini --version', { stdio: 'ignore', timeout: 2000 });
            hasGemini = true;
        } catch (_err) {
            // gemini not available
        }

        if (hasGemini || fileExists(path.join(os.homedir(), '.gemini'))) {
            log('● Gemini CLI detected');
            if (symlinkDir(SCRIPT_DIR, path.join(geminiSkillsDir, 'superomni'))) {
                log(`✓ Gemini CLI: linked → ${path.join(geminiSkillsDir, 'superomni')}`);
            }
        } else if (ONLY_PLATFORM === 'gemini') {
            log('● Gemini CLI (forced via --only)');
            if (symlinkDir(SCRIPT_DIR, path.join(geminiSkillsDir, 'superomni'))) {
                log(`✓ Gemini CLI: linked → ${path.join(geminiSkillsDir, 'superomni')}`);
            }
        } else {
            VERBOSE && log('○ Gemini CLI not detected (skipped)');
        }
    }
}

function installCopilot() {
    if (!shouldInstall('copilot')) return;

    const localDir = TARGET_DIR || process.cwd();
    const copilotFile = path.join(localDir, '.github', 'copilot-instructions.md');

    let shouldInstallCopilot = false;

    if (TARGET_DIR) {
        shouldInstallCopilot = true;
    } else {
        try {
            execSync('gh --version', { stdio: 'ignore', timeout: 2000 });
            shouldInstallCopilot = true;
        } catch (_err) {
            // gh not available
        }

        if (!shouldInstallCopilot && fileExists(path.join(localDir, '.github'))) {
            shouldInstallCopilot = true;
        }

        if (!shouldInstallCopilot && ONLY_PLATFORM === 'copilot') {
            shouldInstallCopilot = true;
        }
    }

    if (shouldInstallCopilot) {
        log(`● GitHub Copilot (local install → ${localDir})`);
        copySkillsToProject(localDir);
        writeLocalConfig(copilotFile, LOCAL_SKILL_SNIPPET);
    } else {
        VERBOSE && log('○ GitHub Copilot not detected (skipped)');
    }
}

// ── Hooks registration ───────────────────────────────────────────────────────

function registerHooks() {
    if (!shouldInstall('claude') || TARGET_DIR) return;

    log('→ Registering Claude Code hooks...');

    const hooksSource = path.join(SCRIPT_DIR, 'hooks', 'hooks.json');
    const claudeHooksDir = path.join(os.homedir(), '.claude', 'hooks');

    if (!DRY_RUN && fileExists(hooksSource)) {
        ensureDir(claudeHooksDir);
        const content = readFile(hooksSource);
        writeFile(path.join(claudeHooksDir, 'superomni-hooks.json'), content);
        log('✓ Hooks registered');
    } else if (DRY_RUN) {
        log('[dry-run] Would copy hooks.json → ' + claudeHooksDir);
    }
}

// ── Initialize config ────────────────────────────────────────────────────────

function initializeConfig() {
    const configFile = path.join(OMNI_STATE_DIR, 'config');

    if (!DRY_RUN && !fileExists(configFile)) {
        ensureDir(OMNI_STATE_DIR);
        writeFile(configFile, 'proactive=true\ntelemetry=true\n');
        log('✓ Default config initialized (proactive=true, telemetry=true)');
    } else if (DRY_RUN) {
        log('[dry-run] Would initialize config at ' + configFile);
    } else if (fileExists(configFile)) {
        log(`✓ Config already exists at ${configFile}`);
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log(`║         superomni  v${VERSION}               ║`);
    console.log('║   Plan Lean, Execute Complete            ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    if (DRY_RUN) {
        log('Dry-run mode — no changes will be made');
    }

    if (TARGET_DIR) {
        log(`Target directory: ${TARGET_DIR}`);
    }

    console.log('');

    // Step 1: Create state directories
    log('→ Creating state directories...');
    if (!DRY_RUN) {
        ensureDir(path.join(OMNI_STATE_DIR, 'sessions'));
        ensureDir(path.join(OMNI_STATE_DIR, 'analytics'));
        ensureDir(path.join(OMNI_STATE_DIR, 'projects'));
    }
    log(`✓ ${OMNI_STATE_DIR}`);

    // Step 2: Build skill docs
    console.log('→ Building skill docs from templates...');
    buildSkillDocs();
    log('✓ Skill docs built');

    // Step 3: Detect platforms & install
    console.log('→ Detecting AI platforms...');
    console.log('');

    installClaude();
    installCodex();
    installGemini();
    installCopilot();

    // Step 4: Register hooks
    console.log('');
    registerHooks();

    // Step 5: Initialize config
    console.log('→ Initializing configuration...');
    initializeConfig();

    // Summary
    console.log('');
    console.log(`✅ superomni v${VERSION} setup complete`);
    console.log('');
    console.log('Next steps:');
    if (TARGET_DIR) {
        console.log('  1. Commit the generated config files (.superomni/, CLAUDE.md, AGENTS.md, etc.)');
        console.log('  2. Open your project in your AI CLI — skills activate automatically');
    } else {
        console.log('  1. Open your project in your AI CLI or IDE');
        console.log('  2. Skills activate automatically via session hooks');
    }
    console.log('');
    console.log('To disable auto-skill triggers:');
    console.log(`  ${path.join(SCRIPT_DIR, 'bin', 'config')} set proactive false`);
    console.log('');
}

main();
