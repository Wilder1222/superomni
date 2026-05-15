<!-- Reference: vibe Phase 1 stage-detection bash + artifact verification helper. -->

# Vibe — Stage Detection Bash

The `vibe` skill calls this script during Phase 1 to detect the current pipeline stage.
It is session-aware (uses the current-session timestamp for `find -newer`) and falls back
to disk scan when the prior session left incomplete work.

## Detection Script

```bash
# Session-aware artifact detection
# Read current session start timestamp (written by hooks/session-start)
_SESSION_TS=$(cat ~/.omni-skills/sessions/current-session-ts 2>/dev/null || echo "0")
_SESSION_ID=$(cat ~/.omni-skills/sessions/current-session-id 2>/dev/null || echo "")

# Helper: create a reference file with session-start mtime (cross-platform: Git Bash / Linux / macOS)
_ref=$(mktemp 2>/dev/null || echo "/tmp/_omni_ref_$$")
touch -d "@${_SESSION_TS}" "$_ref" 2>/dev/null || \
  touch -t "$(date -d "@${_SESSION_TS}" +%Y%m%d%H%M.%S 2>/dev/null || \
              date -r "${_SESSION_TS}" +%Y%m%d%H%M.%S 2>/dev/null || echo "$(date +%Y%m%d%H%M.%S)")" \
  "$_ref" 2>/dev/null || touch "$_ref"

# Detect all artifact types in current session using find -newer (no stat dependency)
_HAS_SPEC=$(find docs/superomni/specs -name "spec-*.md" -newer "$_ref" 2>/dev/null | sort | tail -1)
# Note: spec approval is the user's conversational reply, not a filesystem flag.
# The PLAN stage advances purely because plan-*.md exists (writing-plans only fires after user approval).
_HAS_PLAN=$(find docs/superomni/plans -name "plan-*.md" -newer "$_ref" 2>/dev/null | sort | tail -1)
_HAS_REVIEW=$(find docs/superomni/reviews -name "plan-review-*.md" -newer "$_ref" 2>/dev/null | head -1)
_HAS_EXECUTIONS=$(find docs/superomni/executions -name "*.md" -newer "$_ref" 2>/dev/null | head -1)
_HAS_EVALUATION=$(find docs/superomni/evaluations -name "evaluation-*.md" -newer "$_ref" 2>/dev/null | head -1)
_HAS_RELEASE=$(find docs/superomni/releases -name "release-*.md" -newer "$_ref" 2>/dev/null | head -1)
rm -f "$_ref" 2>/dev/null

# Cross-session fallback: if no current-session artifacts exist but
# last-session-artifacts.txt shows incomplete work, detect from disk
if [ -z "$_HAS_SPEC" ] && [ -z "$_HAS_PLAN" ]; then
  _LAST_ARTIFACTS="${HOME}/.omni-skills/sessions/last-session-artifacts.txt"
  if [ -f "$_LAST_ARTIFACTS" ] && [ -s "$_LAST_ARTIFACTS" ]; then
    # Last session had artifacts — detect from disk regardless of mtime
    _HAS_SPEC=$(ls docs/superomni/specs/spec-*.md 2>/dev/null | sort | tail -1)
    _HAS_PLAN=$(ls docs/superomni/plans/plan-*.md 2>/dev/null | sort | tail -1)
    _HAS_REVIEW=$(ls docs/superomni/reviews/plan-review-*.md 2>/dev/null | head -1)
    _HAS_EXECUTIONS=$(ls docs/superomni/executions/*.md 2>/dev/null | head -1)
    _HAS_EVALUATION=$(ls docs/superomni/evaluations/evaluation-*.md 2>/dev/null | head -1)
    _HAS_RELEASE=$(ls docs/superomni/releases/release-*.md 2>/dev/null | head -1)
    _CROSS_SESSION=true
  fi
fi

# Session matching: extract session from plan filename for review detection
_HAS_MATCHING_REVIEW=""
if [ -n "$_HAS_PLAN" ]; then
  _PLAN_SESSION=$(basename "$_HAS_PLAN" .md | sed 's/plan-[^-]*-//' | sed 's/-[0-9]*$//')
  _HAS_MATCHING_REVIEW=$(ls docs/superomni/reviews/plan-review-*-${_PLAN_SESSION}-*.md 2>/dev/null | head -1)
  _PLAN_OPEN=$(grep -c '^\- \[ \]' "$_HAS_PLAN" 2>/dev/null || echo "0")
  _PLAN_DONE=$(grep -c '^\- \[x\]' "$_HAS_PLAN" 2>/dev/null || echo "0")
fi

# Recent git activity
git log --oneline -5 2>/dev/null
git status --short 2>/dev/null
```

## Artifact Verification Helper

Run this check before invoking the next skill:

```bash
_verify_stage_artifact() {
  local from_stage="$1"
  case "$from_stage" in
    THINK)   [ -n "$_HAS_SPEC" ] ;;
    PLAN)    [ -n "$_HAS_PLAN" ] ;;
    REVIEW)  [ -n "$_HAS_MATCHING_REVIEW" ] ;;
    BUILD)   [ -n "$_HAS_EXECUTIONS" ] ;;
    VERIFY)  [ -n "$_HAS_EVALUATION" ] ;;
    RELEASE) [ -n "$_HAS_RELEASE" ] ;;
  esac
}

# Usage: before auto-advancing from stage X to stage Y:
# if ! _verify_stage_artifact "X"; then
#   echo "DONE_WITH_CONCERNS: Missing artifact for stage X"
#   echo "Cannot auto-advance. Please complete the current stage first."
#   # STOP and wait for user
# fi
```
