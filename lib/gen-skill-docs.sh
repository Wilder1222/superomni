#!/usr/bin/env bash
# lib/gen-skill-docs.sh
# Generates SKILL.md from SKILL.md.tmpl by expanding preamble macros.
#
# Supported tokens (first occurrence in a template is replaced):
#   {{PREAMBLE_CORE}}      — expands to contents of lib/preamble-core.md (inlined)
#   {{PREAMBLE_REF_LINK}}  — expands to a fixed markdown link to lib/preamble-ref.md
#   {{PREAMBLE}}           — DEPRECATED. Expands to full lib/preamble.md; emits warning.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "${SCRIPT_DIR}")"
PREAMBLE_CORE_FILE="${SCRIPT_DIR}/preamble-core.md"
PREAMBLE_LEGACY_FILE="${SCRIPT_DIR}/preamble.md"

# Fixed line emitted wherever {{PREAMBLE_REF_LINK}} appears. Keep byte-identical
# with gen-skill-docs.js and gen-skill-docs.ps1 for cross-platform parity.
PREAMBLE_REF_LINK_LINE='_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._'

if [ ! -f "${PREAMBLE_CORE_FILE}" ]; then
  echo "ERROR: preamble-core.md not found at ${PREAMBLE_CORE_FILE}" >&2
  exit 1
fi
if [ ! -f "${PREAMBLE_LEGACY_FILE}" ]; then
  echo "ERROR: preamble.md not found at ${PREAMBLE_LEGACY_FILE}" >&2
  exit 1
fi

# Read preambles. Strip CR for mixed line endings. The $(...) substitution
# also strips a single trailing newline — gives byte-parity with gen-skill-docs.js/ps1.
PREAMBLE_CORE_CONTENT=$(tr -d '\r' < "${PREAMBLE_CORE_FILE}")
PREAMBLE_LEGACY_CONTENT=$(tr -d '\r' < "${PREAMBLE_LEGACY_FILE}")

process_template() {
  local tmpl_file="${1}"
  local out_file="${tmpl_file%.tmpl}"

  if grep -q '{{PREAMBLE}}' "${tmpl_file}"; then
    local rel="${tmpl_file#${REPO_ROOT}/}"
    echo "[deprecated] ${rel} uses {{PREAMBLE}}; migrate to {{PREAMBLE_CORE}} + {{PREAMBLE_REF_LINK}}" >&2
  fi

  awk \
    -v core="${PREAMBLE_CORE_CONTENT}" \
    -v ref_link="${PREAMBLE_REF_LINK_LINE}" \
    -v legacy="${PREAMBLE_LEGACY_CONTENT}" '
    !core_done && /\{\{PREAMBLE_CORE\}\}/ {
      print core
      core_done = 1
      next
    }
    !ref_done && /\{\{PREAMBLE_REF_LINK\}\}/ {
      print ref_link
      ref_done = 1
      next
    }
    !legacy_done && /\{\{PREAMBLE\}\}/ {
      print legacy
      legacy_done = 1
      next
    }
    { print }
  ' "${tmpl_file}" > "${out_file}"

  echo "  ✓ ${tmpl_file} → ${out_file}"
}

if [ -n "${1:-}" ]; then
  if [ ! -f "${1}" ]; then
    echo "ERROR: File not found: ${1}" >&2
    exit 1
  fi
  process_template "${1}"
else
  count=0
  while IFS= read -r -d '' tmpl_file; do
    process_template "${tmpl_file}"
    count=$((count + 1))
  done < <(find "${REPO_ROOT}/skills" -name "*.tmpl" -print0)

  echo "  → Processed ${count} template(s)"
fi
