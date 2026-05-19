#!/usr/bin/env node
// hooks/launcher.js — Cross-platform entry point for session-start.sh
// Node.js handles Windows/Unix paths natively; no bash path mangling issues.

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const script = path.join(__dirname, 'session-start.sh');
const bash = process.platform === 'win32' ? 'bash.exe' : 'bash';

const result = spawnSync(bash, [script], { stdio: 'inherit' });
process.exit(result.status ?? 0);
