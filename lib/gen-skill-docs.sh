#!/usr/bin/env bash
# lib/gen-skill-docs.sh
# Generates SKILL.md from SKILL.md.tmpl by expanding {{PREAMBLE}} macro.
#
# Usage:
#   bash lib/gen-skill-docs.sh           — process all .tmpl files
#   bash lib/gen-skill-docs.sh <path>    — process a single .tmpl file
#
# The {{PREAMBLE}} token in any .tmpl file is replaced with the contents
# of lib/preamble.md. The output is written as SKILL.md in the same directory.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "${SCRIPT_DIR}")"
PREAMBLE_FILE="${SCRIPT_DIR}/preamble.md"

if [ ! -f "${PREAMBLE_FILE}" ]; then
  echo "ERROR: preamble.md not found at ${PREAMBLE_FILE}" >&2
  exit 1
fi

# Read preamble content (escape for sed: & and \ and newlines)
PREAMBLE_CONTENT=$(cat "${PREAMBLE_FILE}")

process_template() {
  local tmpl_file="${1}"
  local out_file="${tmpl_file%.tmpl}"

  # Use awk to replace {{PREAMBLE}} with preamble content.
  # Only the FIRST occurrence is treated as the real macro.
  # Subsequent occurrences (e.g. in example code blocks) are left as-is.
  awk -v preamble="${PREAMBLE_CONTENT}" '
    !replaced && /\{\{PREAMBLE\}\}/ {
      print preamble
      replaced = 1
      next
    }
    { print }
  ' "${tmpl_file}" > "${out_file}"

  echo "  ✓ ${tmpl_file} → ${out_file}"
}

if [ -n "${1}" ]; then
  # Process single file
  if [ ! -f "${1}" ]; then
    echo "ERROR: File not found: ${1}" >&2
    exit 1
  fi
  process_template "${1}"
else
  # Process all .tmpl files under skills/
  count=0
  while IFS= read -r -d '' tmpl_file; do
    process_template "${tmpl_file}"
    count=$((count + 1))
  done < <(find "${REPO_ROOT}/skills" -name "*.tmpl" -print0)

  echo "  → Processed ${count} template(s)"
fi
