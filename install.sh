#!/usr/bin/env bash
# Quick installer for superomni
# Usage: curl -fsSL https://raw.githubusercontent.com/Wilder1222/superomni/main/install.sh | bash
#   or:  bash install.sh [--only claude|codex|gemini|copilot] [--force]

set -e

REPO="https://github.com/Wilder1222/superomni.git"
TMPDIR="${TMPDIR:-/tmp}/superomni-install-$$"

cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

echo "Downloading superomni..."
git clone --depth 1 "$REPO" "$TMPDIR" 2>/dev/null

echo "Installing..."
node "$TMPDIR/bin/superomni-cli" "$@"
