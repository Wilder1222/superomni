#!/usr/bin/env node
// lib/ensure-setup-lf.js
//
// Ensures setup script has LF line endings (not CRLF)
// This is run as part of the build process to guarantee bash compatibility on Windows.
//
// Usage:
//   node lib/ensure-setup-lf.js
//   node lib/ensure-setup-lf.js [setup-file-path]

'use strict';

const fs = require('fs');
const path = require('path');

const cliPath = process.argv[2] || path.join(__dirname, '..', 'bin', 'superomni-cli');

function ensureLF(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`[WARN] File not found: ${filePath}`);
        return false;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasCRLF = content.includes('\r\n');
        const hasLF = content.includes('\n');

        if (!hasCRLF && hasLF) {
            // Already has LF, no CRLF
            console.log(`[OK] ${path.basename(filePath)} already has LF line endings`);
            return true;
        }

        if (hasCRLF) {
            // Convert CRLF to LF
            const converted = content.replace(/\r\n/g, '\n');
            fs.writeFileSync(filePath, converted, 'utf8');
            console.log(`[OK] Converted ${path.basename(filePath)} to LF line endings`);
            return true;
        }

        console.log(`[OK] ${path.basename(filePath)} has no line endings to normalize`);
        return true;
    } catch (err) {
        console.error(`[ERROR] Failed to process ${filePath}: ${err.message}`);
        return false;
    }
}

function main() {
    console.log('Ensuring script line endings...');

    if (fs.existsSync(cliPath)) {
        const ok = ensureLF(cliPath);
        if (!ok) {
            console.warn('[WARN] Line ending normalization failed for ' + cliPath);
        }
    } else {
        console.log('[OK] No scripts to normalize (skipped)');
    }

    console.log('[DONE] Line ending check complete');
    process.exit(0);
}

main();
