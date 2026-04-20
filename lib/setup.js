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

const VERSION = '0.5.7';
const SCRIPT_DIR = path.join(__dirname, '..');

// Platform instruction templates
const claudeInstructions = require('./templates/claude-instructions');
const codexInstructions = require('./templates/codex-instructions');
const copilotInstructions = require('./templates/copilot-instructions');

// Mutable module state — set by run() before invoking any helpers
let OMNI_STATE_DIR = path.join(os.homedir(), '.omni-skills');
let TARGET_DIR = '';
let ONLY_PLATFORM = '';
let SKIP_PLATFORMS = new Set();
let DRY_RUN = false;
let VERBOSE = false;
let FORCE = false;

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
  --force           Force reinstall (overwrite existing files)
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

function getCommandNames() {
    const cmdsDir = path.join(SCRIPT_DIR, 'commands');
    if (!fileExists(cmdsDir)) return ['vibe'];
    return fs.readdirSync(cmdsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace(/\.md$/, ''));
}

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

    // Skip if already copied in this run
    if (fileExists(path.join(destDir, 'skills'))) {
        if (!FORCE) {
            log(`✓ .superomni/skills already exists (use --force to overwrite)`);
        }
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

    // Check if already references superomni (unless --force)
    if (!FORCE && fileExists(filePath)) {
        const existing = readFile(filePath);
        if (existing.includes('superomni')) {
            log(`✓ ${filePath} already references superomni (use --force to overwrite)`);
            return;
        }
    }

    writeFile(filePath, content + '\n');
    log(`✓ Written → ${filePath}`);
}

// ── Gitignore rules ─────────────────────────────────────────────────────────

function appendGitignoreRules(projectDir) {
    if (DRY_RUN) {
        log(`[dry-run] Would append .gitignore rules in ${projectDir}`);
        return;
    }

    const gitignorePath = path.join(projectDir, '.gitignore');
    const marker = '# superomni session artifacts';
    const rules = [
        '',
        '# superomni session artifacts (transient, not source-controlled)',
        'docs/superomni/executions/',
        'docs/superomni/reviews/',
        'docs/superomni/subagents/',
        'docs/superomni/production-readiness/',
        'docs/superomni/improvements/',
        'docs/superomni/evaluations/',
        'docs/superomni/harness-audits/',
        ''
    ].join('\n');

    if (fileExists(gitignorePath)) {
        const existing = readFile(gitignorePath);
        if (existing.includes(marker)) {
            log('✓ .gitignore already has superomni rules');
            return;
        }
        writeFile(gitignorePath, existing.trimEnd() + '\n' + rules);
    } else {
        writeFile(gitignorePath, rules.trimStart());
    }
    log('✓ .gitignore updated with superomni artifact rules');
}

// ── Platform installation ────────────────────────────────────────────────────

function installClaude() {
    if (!shouldInstall('claude')) return;

    const claudeSkillsDir = path.join(os.homedir(), '.claude', 'skills');

    if (TARGET_DIR) {
        log('● Claude Code (local install → ' + TARGET_DIR + ')');
        copySkillsToProject(TARGET_DIR);
        const content = claudeInstructions.generate('.superomni/skills', getCommandNames());
        writeLocalConfig(path.join(TARGET_DIR, 'CLAUDE.md'), content);
        appendGitignoreRules(TARGET_DIR);

        // Install slash commands into <project>/.claude/commands/
        // Claude Code scans this path for project-level slash commands
        const cmdsDir = path.join(SCRIPT_DIR, 'commands');
        const projectCmdsDir = path.join(TARGET_DIR, '.claude', 'commands');
        if (fileExists(cmdsDir) && !DRY_RUN) {
            ensureDir(projectCmdsDir);
            const cmdFiles = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.md'));
            for (const cmdFile of cmdFiles) {
                const src = path.join(cmdsDir, cmdFile);
                const dest = path.join(projectCmdsDir, cmdFile);
                try {
                    fs.copyFileSync(src, dest);
                } catch (_e) { /* skip if already exists */ }
            }
            log(`✓ Claude Code commands installed (${cmdFiles.length} commands) → ${projectCmdsDir}`);
        }
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

    const codexHome = path.join(os.homedir(), '.codex');
    const codexSkillsDir = path.join(codexHome, 'skills');

    if (TARGET_DIR) {
        log('● Codex CLI (local install → ' + TARGET_DIR + ')');
        copySkillsToProject(TARGET_DIR);
        const content = codexInstructions.generate('.superomni/skills', false, getCommandNames());
        writeLocalConfig(path.join(TARGET_DIR, 'AGENTS.md'), content);

        // Install slash commands into <project>/.codex/commands/
        // Codex CLI scans this path for project-level slash commands
        const cmdsDir = path.join(SCRIPT_DIR, 'commands');
        const codexCmdsDir = path.join(TARGET_DIR, '.codex', 'commands');
        if (fileExists(cmdsDir) && !DRY_RUN) {
            ensureDir(codexCmdsDir);
            const cmdFiles = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.md'));
            for (const cmdFile of cmdFiles) {
                try {
                    fs.copyFileSync(path.join(cmdsDir, cmdFile), path.join(codexCmdsDir, cmdFile));
                } catch (_e) { /* skip if already exists */ }
            }
            log(`✓ Codex CLI commands installed (${cmdFiles.length} commands) → ${codexCmdsDir}`);
        }
    } else {
        // Check if codex is installed
        let hasCodex = false;
        try {
            execSync('codex --version', { stdio: 'ignore', timeout: 2000 });
            hasCodex = true;
        } catch (_err) {
            // codex not available
        }

        const shouldDo = hasCodex
            || fileExists(codexHome)
            || fileExists(path.join(os.homedir(), '.agents'))
            || ONLY_PLATFORM === 'codex';

        if (shouldDo) {
            log('● Codex CLI (global install)');

            // Symlink skill files into ~/.codex/skills/superomni
            if (symlinkDir(SCRIPT_DIR, path.join(codexSkillsDir, 'superomni'))) {
                log(`✓ Codex CLI: linked → ${path.join(codexSkillsDir, 'superomni')}`);
            }

            // Also symlink to legacy ~/.agents/skills/ path
            const legacyDir = path.join(os.homedir(), '.agents', 'skills');
            if (symlinkDir(SCRIPT_DIR, path.join(legacyDir, 'superomni'))) {
                VERBOSE && log(`✓ Codex CLI: linked → ${path.join(legacyDir, 'superomni')} (legacy)`);
            }

            // Generate global AGENTS.md at ~/.codex/AGENTS.md
            const content = codexInstructions.generate(
                path.join(codexSkillsDir, 'superomni', 'skills'),
                true,
                getCommandNames()
            );
            writeLocalConfig(path.join(codexHome, 'AGENTS.md'), content);
        } else {
            VERBOSE && log('○ Codex CLI not detected (skipped)');
        }
    }
}

function installGemini() {
    if (!shouldInstall('gemini')) return;

    const geminiHome = path.join(os.homedir(), '.gemini');
    const geminiSkillsDir = path.join(geminiHome, 'skills');

    if (TARGET_DIR) {
        log('● Gemini CLI (local install → ' + TARGET_DIR + ')');
        copySkillsToProject(TARGET_DIR);
        // Gemini uses GEMINI.md — reuse codex template format
        const content = codexInstructions.generate('.superomni/skills', false, getCommandNames());
        writeLocalConfig(path.join(TARGET_DIR, 'GEMINI.md'), content);

        // Install slash commands into <project>/.gemini/commands/ as .toml files
        // Gemini CLI scans this path for project-level slash commands (TOML format)
        const cmdsDir = path.join(SCRIPT_DIR, 'commands');
        const geminiCmdsDir = path.join(TARGET_DIR, '.gemini', 'commands');
        if (fileExists(cmdsDir) && !DRY_RUN) {
            ensureDir(geminiCmdsDir);
            const cmdFiles = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.md'));
            for (const cmdFile of cmdFiles) {
                const cmdName = cmdFile.replace(/\.md$/, '');
                const mdContent = readFile(path.join(cmdsDir, cmdFile));
                // Gemini commands use TOML format with a prompt field
                const escapedContent = mdContent.replace(/"""/g, "'''");
                const tomlContent = `description = "superomni: ${cmdName}"\nprompt = """\n${escapedContent}\n"""\n`;
                try {
                    writeFile(path.join(geminiCmdsDir, cmdName + '.toml'), tomlContent);
                } catch (_e) { /* skip on error */ }
            }
            log(`✓ Gemini CLI commands installed (${cmdFiles.length} commands) → ${geminiCmdsDir}`);
        }
    } else {
        let hasGemini = false;
        try {
            execSync('gemini --version', { stdio: 'ignore', timeout: 2000 });
            hasGemini = true;
        } catch (_err) {
            // gemini not available
        }

        const shouldDo = hasGemini
            || fileExists(geminiHome)
            || ONLY_PLATFORM === 'gemini';

        if (shouldDo) {
            log('● Gemini CLI (global install)');
            if (symlinkDir(SCRIPT_DIR, path.join(geminiSkillsDir, 'superomni'))) {
                log(`✓ Gemini CLI: linked → ${path.join(geminiSkillsDir, 'superomni')}`);
            }
            // Generate global GEMINI.md
            const content = codexInstructions.generate(
                path.join(geminiSkillsDir, 'superomni', 'skills'),
                true,
                getCommandNames()
            );
            writeLocalConfig(path.join(geminiHome, 'GEMINI.md'), content);
        } else {
            VERBOSE && log('○ Gemini CLI not detected (skipped)');
        }
    }
}

function installCopilot() {
    if (!shouldInstall('copilot')) return;

    const localDir = TARGET_DIR || process.cwd();
    const copilotFile = path.join(localDir, '.github', 'copilot-instructions.md');

    let shouldDo = false;

    if (TARGET_DIR) {
        shouldDo = true;
    } else {
        try {
            execSync('gh --version', { stdio: 'ignore', timeout: 2000 });
            shouldDo = true;
        } catch (_err) {
            // gh not available
        }

        if (!shouldDo && fileExists(path.join(localDir, '.github'))) {
            shouldDo = true;
        }

        if (!shouldDo && ONLY_PLATFORM === 'copilot') {
            shouldDo = true;
        }
    }

    if (shouldDo) {
        log(`● GitHub Copilot (local install → ${localDir})`);
        copySkillsToProject(localDir);
        const content = copilotInstructions.generate('.superomni/skills', getCommandNames());
        writeLocalConfig(copilotFile, content);

        // Install slash commands into <project>/.github/prompts/ as .prompt.md files
        // Copilot scans this path for custom slash commands (file name = command name)
        const cmdsDir = path.join(SCRIPT_DIR, 'commands');
        const promptsDir = path.join(localDir, '.github', 'prompts');
        if (fileExists(cmdsDir) && !DRY_RUN) {
            ensureDir(promptsDir);
            const cmdFiles = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.md'));
            for (const cmdFile of cmdFiles) {
                const cmdName = cmdFile.replace(/\.md$/, '');
                try {
                    fs.copyFileSync(
                        path.join(cmdsDir, cmdFile),
                        path.join(promptsDir, cmdName + '.prompt.md')
                    );
                } catch (_e) { /* skip if already exists */ }
            }
            log(`✓ GitHub Copilot prompts installed (${cmdFiles.length} commands) → ${promptsDir}`);
        }
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
        const raw = readFile(hooksSource);
        // Replace relative command paths with absolute paths so hooks resolve
        // correctly regardless of the user's working directory.
        const hooksScriptDir = path.join(SCRIPT_DIR, 'hooks');
        const content = raw.replace(
            /"command"\s*:\s*"hooks\/([^"]+)"/g,
            (_, scriptName) =>
                `"command": "${hooksScriptDir.replace(/\\/g, '/')}/${scriptName}"`
        );
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

    // Step 3: Force cleanup (if --force and project-level install)
    if (FORCE && TARGET_DIR) {
        const destDir = path.join(TARGET_DIR, '.superomni');
        if (!DRY_RUN && fileExists(destDir)) {
            fs.rmSync(destDir, { recursive: true, force: true });
            log('→ Removed existing .superomni/ (--force)');
        }
    }

    // Step 4: Detect platforms & install
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

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * run({ targetDir, dryRun, verbose, only, skip })
 * Called directly by bin/superomni-cli (no child process spawning).
 */
function run(opts = {}) {
    TARGET_DIR = opts.targetDir || process.env.SUPEROMNI_TARGET_DIR || '';
    DRY_RUN = opts.dryRun || false;
    VERBOSE = opts.verbose || false;
    FORCE = opts.force || false;
    ONLY_PLATFORM = opts.only || '';
    SKIP_PLATFORMS = new Set(opts.skip || []);
    OMNI_STATE_DIR = path.join(os.homedir(), '.omni-skills');
    main();
}

module.exports = { run };

// ── CLI entry point ───────────────────────────────────────────────────────────
// Only parse args and run when invoked directly (node lib/setup.js ...)
if (require.main === module) {
    const args = process.argv.slice(2);
    const cliOpts = { skip: [] };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--help' || arg === '-h') {
            showHelp();
            process.exit(0);
        } else if (arg === '--only') {
            cliOpts.only = args[++i];
        } else if (arg === '--skip') {
            cliOpts.skip.push(args[++i]);
        } else if (arg === '--dry-run') {
            cliOpts.dryRun = true;
        } else if (arg === '--force') {
            cliOpts.force = true;
        } else if (arg === '--verbose') {
            cliOpts.verbose = true;
        } else {
            console.error(`Unknown option: ${arg} (try --help)`);
            process.exit(1);
        }
    }

    run(cliOpts);
}
