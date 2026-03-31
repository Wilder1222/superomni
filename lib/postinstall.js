#!/usr/bin/env node
// lib/postinstall.js — runs after `npm install -g superomni`
//
// For npx runs, exits immediately — bin/superomni-cli handles installation.
// For global installs (npm install -g), runs setup directly in-process.

'use strict';

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

// ── Global install: run setup directly in-process ─────────────────────────────
try {
    const { run } = require('./setup');
    run({});  // no targetDir — global install links to ~/.claude, ~/.agents, etc.
} catch (err) {
    process.stderr.write('superomni postinstall: setup failed - ' + err.message + '\n');
}
