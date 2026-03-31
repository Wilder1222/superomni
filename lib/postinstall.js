#!/usr/bin/env node
// lib/postinstall.js — runs after `npm install` / `npm install -g`
//
// Automatically invokes the setup script so skills are linked into the right
// platform directories without requiring the user to run a separate command.
//
// For `npx superomni` runs, INIT_CWD is forwarded to setup as
// SUPEROMNI_TARGET_DIR so skills are installed into the project directory
// instead of global platform paths.
//
// Skips silently when:
//   • Running inside a CI environment (CI=true / GITHUB_ACTIONS=true, etc.)
//   • SUPER_OMNI_SKIP_POSTINSTALL=1 is set

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
  process.env.CIRCLECI === 'true';

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

// ── Determine target directory for project-level / npx installs ──────────────
// When the user runs `npx superomni` from their project directory, npm sets
// INIT_CWD to that directory while process.cwd() points to the temporary npx
// download location.  We forward INIT_CWD as SUPEROMNI_TARGET_DIR so that the
// setup script installs config files (AGENTS.md, GEMINI.md, etc.) into the
// project rather than into global platform directories.
const INIT_CWD = process.env.INIT_CWD;
const isNpxRun =
  process.env.npm_config_global !== 'true' &&
  INIT_CWD &&
  INIT_CWD !== packageRoot &&
  !INIT_CWD.includes(`${path.sep}node_modules${path.sep}`);

const env = Object.assign({}, process.env);
if (isNpxRun) {
  env.SUPEROMNI_TARGET_DIR = INIT_CWD;
}

// ── Run setup ────────────────────────────────────────────────────────────────
try {
  execSync(`bash "${setupScript}"`, {
    stdio: 'inherit',
    cwd: packageRoot,
    env,
  });
} catch (err) {
  // Non-fatal: log but don't fail the install
  process.stderr.write(
    `superomni postinstall: setup returned non-zero exit (${err.status}). ` +
      'You can run it manually: superomni\n'
  );
}
