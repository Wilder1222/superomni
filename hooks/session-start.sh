#!/usr/bin/env bash
# hooks/session-start
# Injected at the start of every session.
# Loads the superomni skill framework into context.

set -euo pipefail

SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${HOME}/.omni-skills"

mkdir -p "${STATE_DIR}/sessions"

# ── Environment Detection ────────────────────────────────────────────────────
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_PROJECT=$(basename "$(pwd)")
_SESSION_EPOCH=$(date +%s)

# Generate UUID for session identity (falls back to epoch-pid if uuid unavailable)
_SESSION_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "${_SESSION_EPOCH}-$$")

# Write session markers for vibe fresh-start detection
echo "${_SESSION_EPOCH}" > "${STATE_DIR}/sessions/current-session-ts"
echo "${_SESSION_ID}" > "${STATE_DIR}/sessions/current-session-id"

# ── Cross-Session Artifact Chain ─────────────────────────────────────────────
# Save artifact list from last session for continuity detection.
# If a new session finds no current-session artifacts, vibe can check this
# to offer resuming incomplete work from the previous session.
_MARKER="${STATE_DIR}/sessions/last-session-marker"
if [ -d "docs/superomni" ]; then
  if [ -f "$_MARKER" ]; then
    find docs/superomni -name "*.md" -newer "$_MARKER" \
      -fprint "${STATE_DIR}/sessions/last-session-artifacts.txt" 2>/dev/null || true
  else
    # First session ever — snapshot all existing artifacts
    find docs/superomni -name "*.md" \
      -fprint "${STATE_DIR}/sessions/last-session-artifacts.txt" 2>/dev/null || true
  fi
fi
touch "$_MARKER"

# ── Auto-Build Skills ────────────────────────────────────────────────────────
# If preamble.md is newer than any SKILL.md, rebuild all skills
if [ -f "${SKILLS_DIR}/lib/preamble.md" ]; then
  _NEEDS_BUILD=false
  for _s in "${SKILLS_DIR}"/skills/*/SKILL.md; do
    [ -f "$_s" ] || continue
    if [ "${SKILLS_DIR}/lib/preamble.md" -nt "$_s" ] 2>/dev/null; then
      _NEEDS_BUILD=true
      break
    fi
  done
  if [ "$_NEEDS_BUILD" = true ]; then
    "${SKILLS_DIR}/bin/build-skills" 2>/dev/null || true
  fi
fi

# ── Platform Detection ───────────────────────────────────────────────────────
_PLATFORM="unknown"
if [ -n "${CLAUDE_CODE_VERSION:-}" ] || [ -n "${CLAUDE_CODE:-}" ]; then
  _PLATFORM="Claude Code"
elif [ -n "${CURSOR_SESSION_ID:-}" ] || [ -n "${CURSOR_TRACE_ID:-}" ] || [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  _PLATFORM="Cursor"
elif [ -n "${COPILOT_CLI:-}" ]; then
  _PLATFORM="Copilot"
elif [ -n "${CODEX_ENV:-}" ] || { [ -n "${OPENAI_API_KEY:-}" ] && command -v codex &>/dev/null; }; then
  _PLATFORM="Codex"
elif [ -n "${GEMINI_API_KEY:-}" ] || [ -n "${GOOGLE_AI_STUDIO:-}" ]; then
  _PLATFORM="Gemini"
fi

# ── Count available skills ───────────────────────────────────────────────────
_SKILLS_COUNT=0
if [ -d "${SKILLS_DIR}/skills" ]; then
  _SKILLS_COUNT=$(find "${SKILLS_DIR}/skills" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
fi

echo "superomni v0.5.8 | ${_PROJECT}@${_BRANCH} | ${_SKILLS_COUNT} skills | session=${_SESSION_ID:0:8}"


# ── Log session start ────────────────────────────────────────────────────────
echo "{\"event\":\"session_start\",\"project\":\"${_PROJECT}\",\"branch\":\"${_BRANCH}\",\"platform\":\"${_PLATFORM}\",\"session\":\"${_SESSION_ID}\",\"epoch\":\"${_SESSION_EPOCH}\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  >> "${STATE_DIR}/sessions/sessions.jsonl" 2>/dev/null || true

# ── Inject using-skills content ──────────────────────────────────────────────
USING_SKILLS="${SKILLS_DIR}/skills/using-skills/SKILL.md"
if [ -f "${USING_SKILLS}" ]; then
  echo ""
  echo "Loading skill framework..."
  cat "${USING_SKILLS}"
fi

echo ""
echo "Skills loaded. Type /brainstorm, /write-plan, /review, /ship, /investigate, /workflow, or /self-improve to begin."
