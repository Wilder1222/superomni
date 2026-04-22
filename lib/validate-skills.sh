#!/usr/bin/env bash
# lib/validate-skills.sh — automated skill format validator
#
# Checks every SKILL.md.tmpl for required structural elements:
#   1. YAML frontmatter (name, description, allowed-tools)
#   2. {{PREAMBLE}} macro
#   3. At least one Iron Law or governing principle (recommended)
#   4. Status protocol usage (DONE / BLOCKED / etc.)
#   5. SKILL.md is up to date with its .tmpl source (no stale builds)
#
# Usage:
#   bash lib/validate-skills.sh             # validate all skills
#   bash lib/validate-skills.sh skills/systematic-debugging/SKILL.md.tmpl

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PREAMBLE="$ROOT_DIR/lib/preamble.md"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

ERRORS=0
WARNINGS=0
CHECKED=0

fail()    { echo -e "${RED}  [FAIL]${RESET} $1"; ERRORS=$((ERRORS+1)); }
warn()    { echo -e "${YELLOW}  [WARN]${RESET} $1"; WARNINGS=$((WARNINGS+1)); }
pass()    { echo -e "${GREEN}  [PASS]${RESET} $1"; }

validate_tmpl() {
  local tmpl="$1"
  local rel_tmpl="${tmpl#$ROOT_DIR/}"
  local md="${tmpl%.tmpl}"
  local rel_md="${md#$ROOT_DIR/}"
  CHECKED=$((CHECKED+1))

  echo "Checking: $rel_tmpl"

  # 1. YAML frontmatter — must start with ---
  if ! head -1 "$tmpl" | grep -q '^---'; then
    fail "$rel_tmpl: missing YAML frontmatter (file must start with '---')"
  else
    pass "YAML frontmatter present"
  fi

  # 2. Required frontmatter fields: name
  if ! grep -q '^name:' "$tmpl"; then
    fail "$rel_tmpl: missing 'name:' in YAML frontmatter"
  else
    pass "frontmatter 'name' field present"
  fi

  # 3. Required frontmatter fields: description
  if ! grep -q '^description:' "$tmpl"; then
    fail "$rel_tmpl: missing 'description:' in YAML frontmatter"
  else
    pass "frontmatter 'description' field present"
  fi

  # 4. Required frontmatter fields: allowed-tools
  if ! grep -q '^allowed-tools:' "$tmpl"; then
    fail "$rel_tmpl: missing 'allowed-tools:' in YAML frontmatter"
  else
    pass "frontmatter 'allowed-tools' field present"
  fi

  # 5. {{PREAMBLE}} macro
  if ! grep -q '{{PREAMBLE}}' "$tmpl"; then
    fail "$rel_tmpl: missing {{PREAMBLE}} macro — all skills must include the shared preamble"
  else
    pass "{{PREAMBLE}} macro present"
  fi

  # 6. Status protocol keywords
  if ! grep -qE 'DONE|BLOCKED|DONE_WITH_CONCERNS|NEEDS_CONTEXT' "$tmpl"; then
    warn "$rel_tmpl: no status protocol keywords found (DONE/BLOCKED/DONE_WITH_CONCERNS/NEEDS_CONTEXT)"
  else
    pass "status protocol keywords found"
  fi

  # 7. Phase structure (at least one ## Phase or ## Step or ## Stage)
  if ! grep -qE '^## (Phase|Step|Stage|Phase [0-9]|Step [0-9])' "$tmpl"; then
    warn "$rel_tmpl: no Phase/Step/Stage sections found — skills should have numbered phases"
  else
    pass "phase/step structure present"
  fi

  # 9. Iron Law example blocks (recommended for core skills)
  if grep -q '## Iron Law' "$tmpl"; then
    if ! grep -qE '### .*(Good|Bad|Correct|Incorrect|Compliant|Violat|Example)' "$tmpl"; then
      warn "$rel_tmpl: Iron Law present but no example blocks found (recommended: add good/bad examples)"
    else
      pass "Iron Law example blocks present"
    fi
  fi

  # 8. SKILL.md built file must exist and be up to date
  if [ ! -f "$md" ]; then
    fail "$rel_tmpl: built $rel_md does not exist — run 'bash lib/gen-skill-docs.sh'"
  else
    # Check that SKILL.md contains preamble content (sanity check for expansion)
    # We check for preamble content presence rather than {{PREAMBLE}} absence,
    # because skills like writing-skills intentionally show {{PREAMBLE}} in
    # code-block examples to teach users how to author new skills.
    if ! grep -q 'Completion Status Protocol' "$md"; then
      fail "$rel_md: SKILL.md does not contain expanded preamble content — run 'bash lib/gen-skill-docs.sh'"
    else
      pass "SKILL.md built and expanded"
    fi
  fi

  echo ""
}

# Collect files to validate
if [ $# -gt 0 ]; then
  TMPLS=("$@")
else
  mapfile -t TMPLS < <(find "$ROOT_DIR/skills" -name 'SKILL.md.tmpl' | sort)
fi

echo "================================================================"
echo "superomni skill validator"
echo "Checking ${#TMPLS[@]} template(s) in skills/"
echo "================================================================"
echo ""

for tmpl in "${TMPLS[@]}"; do
  validate_tmpl "$tmpl"
done

echo "================================================================"
echo "SUMMARY"
echo "  Checked:  $CHECKED template(s)"
echo -e "  Errors:   ${RED}${ERRORS}${RESET}"
echo -e "  Warnings: ${YELLOW}${WARNINGS}${RESET}"

if [ "$ERRORS" -gt 0 ]; then
  echo -e "\n${RED}VALIDATION FAILED — $ERRORS error(s) must be fixed${RESET}"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "\n${YELLOW}VALIDATION PASSED WITH WARNINGS — $WARNINGS warning(s)${RESET}"
  exit 0
else
  echo -e "\n${GREEN}VALIDATION PASSED${RESET}"
  exit 0
fi
