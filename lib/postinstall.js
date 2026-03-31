#!/usr/bin/env node
// lib/postinstall.js — runs after `npm install` / `npm install -g`
//
// Automatically invokes lib/setup.js to install the skill framework.
// No shell dependencies — pure Node.js, works everywhere.
//
// For `npx superomni` runs, INIT_CWD is forwarded to setup as
// SUPEROMNI_TARGET_DIR so skills are installed into the project directory
// instead of global platform paths.
//
// Cross-platform: Windows, Linux, macOS (no shell/bash required)
//
// Skips silently when:
//   • Running inside a CI environment (CI=true / GITHUB_ACTIONS=true, etc.)
//   • SUPER_OMNI_SKIP_POSTINSTALL=1 is set

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function createInstallLog(details) {
    try {
        const logDir = path.join(os.homedir(), '.omni-skills', 'logs');
        fs.mkdirSync(logDir, { recursive: true });

        const ts = new Date().toISOString().replace(/[.:]/g, '-');
        const logPath = path.join(logDir, `postinstall-${ts}.log`);

        const lines = [
            'superomni postinstall failure diagnostics',
            `timestamp=${new Date().toISOString()}`,
            `command=${details.command}`,
            `attemptedPaths=${(details.attemptedPaths || []).join(', ')}`,
            `cwd=${details.cwd}`,
            `packageRoot=${details.packageRoot}`,
            `isNpxRun=${details.isNpxRun}`,
            `INIT_CWD=${details.initCwd || ''}`,
            `SUPEROMNI_TARGET_DIR=${details.targetDir || ''}`,
            `status=${details.status}`,
            `signal=${details.signal || ''}`,
            `error=${details.error || ''}`,
            '',
            '--- STDOUT ---',
            details.stdout || '',
            '',
            '--- STDERR ---',
            details.stderr || '',
            '',
        ];

        fs.writeFileSync(logPath, `${lines.join('\n')}\n`, 'utf8');
        return logPath;
    } catch (_e) {
        return '';
    }
}

// ── Skip conditions ───────────────────────────────────────────────────────────
const skip =
    process.env.SUPER_OMNI_SKIP_POSTINSTALL === '1' ||
    process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.CONTINUOUS_INTEGRATION === 'true' ||
    process.env.TRAVIS === 'true' ||
    process.env.CIRCLECI === 'true';

if (skip) {
    process.exit(0);
}

// For npx runs, the bin/superomni-cli handles installation (its output is
// visible to the user). Postinstall output is suppressed by npm 7+ on success,
// so skip here and let the binary do the work.
const isGlobalInstall = process.env.npm_config_global === 'true';
if (!isGlobalInstall) {
    process.exit(0);
}

// ── Locate setup script ────────────────────────────────────────────────────
const packageRoot = path.join(__dirname, '..');
const setupJs = path.join(packageRoot, 'lib', 'setup.js');

if (!fs.existsSync(setupJs)) {
    // Non-fatal: the package may be incomplete but we don't want to break installs
    process.stderr.write(
        'superomni postinstall: setup script not found, skipping.\n'
    );
    process.exit(0);
}

// ── Determine target directory for project-level / npx installs ──────────────
// When the user runs `npx superomni` from their project directory, npm sets
// INIT_CWD to that directory while process.cwd() points to the temporary npx
// download location.  We forward INIT_CWD as SUPEROMNI_TARGET_DIR so that the
// setup script installs config files (CLAUDE.md, AGENTS.md, etc.) into the
// project rather than into global platform directories.
const INIT_CWD = process.env.INIT_CWD;
const isNpxRun =
    process.env.npm_config_global !== 'true' &&
    INIT_CWD &&
    INIT_CWD !== packageRoot &&
    !INIT_CWD.includes(`${path.sep}node_modules${path.sep}`);

// Debug logging for npx detection
if (process.env.DEBUG_SUPEROMNI_INSTALL) {
    process.stderr.write(
        `[DEBUG] npm_config_global=${process.env.npm_config_global}\n` +
        `[DEBUG] INIT_CWD=${INIT_CWD}\n` +
        `[DEBUG] packageRoot=${packageRoot}\n` +
        `[DEBUG] isNpxRun=${isNpxRun}\n`
    );
}

const env = Object.assign({}, process.env);
if (isNpxRun) {
    env.SUPEROMNI_TARGET_DIR = INIT_CWD;
}

// ── Run setup (pure Node.js, no shell dependencies) ──────────────────────────
if (isNpxRun) {
    process.stderr.write(`[superomni] Detected project-level install in: ${INIT_CWD}\n`);
}

const result = spawnSync(process.execPath, [setupJs], {
    cwd: packageRoot,
    env,
    stdio: 'inherit', // Pass through stdout/stderr directly
});

if (result.error || result.status !== 0) {
    const logPath = createInstallLog({
        command: `node lib/setup.js`,
        cwd: packageRoot,
        packageRoot,
        isNpxRun: Boolean(isNpxRun),
        initCwd: INIT_CWD,
        targetDir: env.SUPEROMNI_TARGET_DIR,
        status: result.status,
        signal: result.signal || '',
        error: result.error ? result.error.message : '',
    });

    const hint = logPath
        ? ` See diagnostics: ${logPath}`
        : ' Could not write diagnostics log.';

    // Non-fatal: log but don't fail the install
    const msg = result.error
        ? `superomni postinstall: setup failed - ${result.error.message}${hint}\n`
        : `superomni postinstall: setup failed (exit=${result.status}).${hint}\n`;

    process.stderr.write(msg);
} else {
    // Success: no output needed, setup.js already printed results
}
