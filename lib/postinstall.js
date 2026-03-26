#!/usr/bin/env node
// lib/postinstall.js — runs after `npm install` / `npm install -g`
//
// Automatically invokes the setup script so skills are linked into the right
// platform directories without requiring the user to run a separate command.
//
// Skips silently when:
//   • Running inside a CI environment (CI=true / GITHUB_ACTIONS=true, etc.)
//   • SUPER_OMNI_SKIP_POSTINSTALL=1 is set
//   • The package is installed as a *dependency* of another project
//     (npm_config_save / npm_config_global heuristics)

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── Skip conditions ───────────────────────────────────────────────────────────
const skip =
  process.env.SUPER_OMNI_SKIP_POSTINSTALL === '1' ||
  process.env.CI === 'true' ||
  process.env.GITHUB_ACTIONS === 'true' ||
  process.env.CONTINUOUS_INTEGRATION === 'true' ||
  process.env.TRAVIS === 'true' ||
  process.env.CIRCLECI === 'true' ||
  // Installed as a dependency of another package (not a direct/global install)
  (process.env.npm_config_global !== 'true' &&
    process.env.INIT_CWD &&
    process.env.INIT_CWD !== process.cwd());

if (skip) {
  // Silent skip so downstream installs aren't noisy
  process.exit(0);
}

// ── Locate setup script ────────────────────────────────────────────────────
const packageRoot = path.join(__dirname, '..');
const setupScript = path.join(packageRoot, 'setup');

if (!fs.existsSync(setupScript)) {
  // Non-fatal: the package may be incomplete but we don't want to break installs
  process.stderr.write(
    'superomni postinstall: setup script not found, skipping.\n'
  );
  process.exit(0);
}

// ── Run setup ────────────────────────────────────────────────────────────────
try {
  execSync(`bash "${setupScript}"`, {
    stdio: 'inherit',
    cwd: packageRoot,
  });
} catch (err) {
  // Non-fatal: log but don't fail the install
  process.stderr.write(
    `superomni postinstall: setup returned non-zero exit (${err.status}). ` +
      'You can run it manually: superomni\n'
  );
}
