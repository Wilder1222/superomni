# Changelog

All notable changes to superomni are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.5.8] — 2026-04-20

### Changed
- Skill consolidation review artifacts updated to final-state wording so historical review docs match the merged canonical skill model.
- Documentation cleanup continued for canonical naming consistency in active docs and review artifacts.

### Fixed
- Version metadata synchronized to `0.5.8` across package/runtime/plugin manifests (`package.json`, `claude-skill.json`, `.claude-plugin/*`, `lib/setup.js`, `hooks/session-start`).
- README synchronized with current stable version.

## [0.5.7] — 2026-04-20

### Added
- **RELEASE stage** — merged SHIP + REFLECT into a single `RELEASE` stage; pipeline is now 6 stages (THINK → PLAN → REVIEW → BUILD → VERIFY → RELEASE)
- New `skills/release/` skill with parallel Release + Retrospective output in one artifact (`docs/superomni/releases/`)
- New `/release` command registered in `claude-skill.json` and `commands/release.md`

### Fixed
- **Windows Git Bash compatibility** — replaced `stat -c %Y`/`stat -f %m` loop in `_session_files()` with cross-platform `find -newer` approach
- **Soft artifact skip removed** — `_verify_stage_artifact("SHIP") || true` eliminated; RELEASE now requires `release-*.md` artifact before auto-advancing
- **Spec approval gate** — `brainstorm` now writes `.approved-spec-*` marker on approval; `vibe` stage detection uses this to prevent auto-advancing past THINK without explicit user approval

### Changed
- `lib/preamble.md` compressed from 221 → 148 lines (−33%) by replacing verbose bash blocks with prose descriptions
- All 30 compiled `SKILL.md` files updated with new preamble and RELEASE pipeline references
- `CLAUDE.md` updated with 6-stage pipeline, `release` skill entry, and `docs/superomni/releases/` directory

---

## [0.5.4] — 2026-04-08

### Added
- **Plan Mode Fallback** — Added a "Plan Mode Fallback" section to the shared preamble (`lib/preamble.md`) and `using-skills/SKILL.md`. If Claude enters Plan Mode despite the routing rule, skills now take precedence: skill instructions are treated as executable steps, STOP points are respected, and planning output routes to `docs/superomni/plans/` instead of Claude's built-in plan file. Inspired by garrytan/gstack's "coexist with plan mode" approach.
- **Two-layer EnterPlanMode defense** — Layer 1 (CLAUDE.md + EXTREMELY-IMPORTANT): hard routing rule intercepts EnterPlanMode → brainstorm. Layer 2 (Plan Mode Fallback in all 29 skills): if already in plan mode, vibe workflow still governs.

### Changed
- **CLAUDE.md** — Upgraded "Planning route" soft guidance to "CRITICAL RULE — EnterPlanMode routes to brainstorm skill" with hard conditional language.
- **`using-skills/SKILL.md`** — `<EXTREMELY-IMPORTANT>` block changed from "feel the urge" soft redirect to "HARD ROUTING RULE: Do NOT call EnterPlanMode" with direct action instruction.
- **28 skill preambles rebuilt** — All templated skills regenerated to include Plan Mode Fallback section.

---

## [0.5.3] — 2026-04-07

### Changed
- **EnterPlanMode: prohibition → redirect** — Replaced "CRITICAL: No EnterPlanMode" prohibitions across all 27 skills, `using-skills`, `vibe`, and `CLAUDE.md` with a superpowers-inspired redirect pattern. Instead of telling the model "never use Plan Mode", the framework now intercepts the planning impulse and routes it to `brainstorm` or `writing-plans` skills via a decision flow graph.
- **`using-skills/SKILL.md`** — Added `<EXTREMELY-IMPORTANT>` tagged redirect block and dot-language flow graph (inspired by obra/superpowers) that intercepts "About to EnterPlanMode?" decision point.
- **`vibe/SKILL.md`** — Replaced "CRITICAL: Do NOT use EnterPlanMode" with "Planning Route" section listing skill alternatives per intent.
- **27 skill preambles** — `### CRITICAL: No EnterPlanMode` (3 lines) → `### Planning Route` (1-line redirect).

### Removed
- **PreToolUse hook** (`hooks/block-plan-mode`) — Removed the hook-based hard block approach in favor of the redirect pattern.
- **`.claude/settings.json`** — Removed project-level settings that registered the PreToolUse hook.
- **`hooks.json` PreToolUse entries** — Restored to SessionStart-only configuration.

---

## [0.5.1] — 2026-04

### Added
- **`/vibe` entry point skill** (`skills/vibe/SKILL.md`): Unified framework activation command that auto-detects the current pipeline stage (THINK→PLAN→BUILD→REVIEW→TEST→PROD-CHECK→SHIP→REFLECT) from existing artifacts and routes to the appropriate skill. Supports `/vibe`, `/vibe status`, and `/vibe reset` subcommands.
- **`[session]` identifier in file naming**: All generated documents now use the pattern `[type]-[branch]-[session]-[date].md` where `[session]` is a short kebab-case label auto-generated from conversation context (e.g., `vibe-skill`, `auth-refactor`). Enables agents to search and retrieve relevant prior sessions.

### Changed
- **Document output reorganization**: `spec.md` moved to `docs/superomni/specs/`, `plan.md` moved to `docs/superomni/plans/`. All generated artifacts now live in categorized subdirectories — no loose files in `docs/superomni/` root.
- **Self-improvement docs now user-facing**: Improvement reports, evaluation reports, and harness audit reports moved from `.superomni/` (internal) to `docs/superomni/` (user-facing). Agents can now index these for self-improvement across sessions.
- Updated all 50+ files with new document paths and naming conventions.

---

## [0.5.0] — 2026-04

### Changed
- **Installation redesign**: `npx github:Wilder1222/superomni` is now the primary project-level install method for all platforms (Claude, Codex, Copilot, Gemini). Global install via `npm install -g` + `superomni setup`.
- **Platform-specific instruction templates**: Each CLI gets tailored config files — `CLAUDE.md` (with slash commands), `AGENTS.md` (with trigger phrases + command file mapping for Codex), `.github/copilot-instructions.md` (with skill directory references for Copilot), `GEMINI.md`.
- **Document output paths**: User-facing outputs (spec, plan, reviews, executions, subagent sessions, production readiness) now write to `docs/superomni/`. Internal state (improvements, evaluations, harness audits) stays in `.superomni/`.
- Renamed `brainstorm` skill to `brainstorm` for consistency across the project.
- Renamed `scripts.build` to `scripts.gen-skills` to avoid triggering npm git dep preparation.
- CLI rewritten with explicit `install` (default, project-level) and `setup` (global) commands.

### Fixed
- Removed `scripts.postinstall` — it triggered npm 11's git dep preparation bug (npm/cli#8131), causing `npx` to fail silently.
- Added `--force` flag to overwrite existing installations.

### Added
- `lib/templates/claude-instructions.js` — Claude Code instruction generator
- `lib/templates/codex-instructions.js` — Codex CLI instruction generator (includes slash command → file mapping)
- `lib/templates/copilot-instructions.js` — GitHub Copilot instruction generator
- `install.sh` — curl-pipe-bash installer as fallback

---

## [0.4.1] — 2026-03

### Fixed
- `bin/superomni-cli`: Project-level `npx superomni` now correctly installs into the user's current working directory. When npm sets `INIT_CWD` (standard behaviour for `npx` invocations), the CLI binary now exports it as `SUPEROMNI_TARGET_DIR` before delegating to the setup script, mirroring the detection already present in `lib/postinstall.js`.
- `setup`: Corrected stale internal `VERSION` string from `0.3.0` to `0.4.1`.

---

## [0.4.0] — 2026-03

### Added
- `skills/harness-engineering/` — harness engineering audit skill; evaluates context efficiency, tool action space, evaluation gate coverage, and feedback loops; produces Harness Health Score (N/25) and prioritized improvement backlog to `docs/superomni/harness-audits/`. Inspired by OpenAI and Anthropic harness engineering best practices.
- `agents/evaluator.md` — dedicated evaluation agent; produces criterion-by-criterion APPROVED/CHANGES_REQUIRED verdicts with evidence backing. Based on Anthropic's principle: "Evaluation is the load-bearing part of agent harness design."
- `commands/harness-audit.md` — `/harness-audit` slash command; runs the full 8-phase harness audit
- `docs/HARNESS.md` — comprehensive harness engineering guide covering core principles, superomni harness architecture, and maintenance indicators

### Changed
- `skills/executing-plans/`: Added Iron Law 2 (Evaluate Before Advancing) and Iron Law 3 (Failures Are Harness Signals); added Phase 4 (Wave Evaluation Gate) between wave execution and mid-plan check-ins — waves must now pass an evaluation gate before advancing; phases renumbered 4→5, 5→6, 6→7
- `lib/preamble.md`: Added **Context Window Management** protocol (progressive disclosure table for all workflow stages) and **Feedback Signal Protocol** (1/2/3 failure escalation with harness signal trigger)
- `CLAUDE.md`: Registered `harness-engineering` skill (P1); added `/harness-audit` command; added harness-audits output directory to Document Output Convention
- `claude-skill.json`: Bumped to v0.4.0; registered `harness-audit` command
- `docs/DESIGN.md`: Updated to v0.4.0; added Section 9 (Design Decisions: v0.4.0) documenting harness engineering decisions

### Philosophy
v0.4.0 applies harness engineering principles directly to the superomni framework itself — treating the framework as the product and agent output as its artifact. The harness-engineering skill and evaluator agent close the quality loop that was previously informal.

---

## [0.3.0] — 2026-03

### Added
- `skills/production-readiness/` — pre-deploy gate with observability, reliability, and operability checks
- `skills/self-improvement/` — post-task performance evaluation skill; applies first-principles reflection to every sprint cycle
- `skills/office-hours/` — YC-style product discovery before writing code
- `skills/autoplan/` — one-command CEO→Design→Eng plan review pipeline
- `skills/freeze/` — restrict edits to a directory scope during risky operations
- `skills/document-release/` — post-ship documentation synchronization
- `agents/ceo-advisor.md` — product strategy and demand validation agent
- `agents/designer.md` — UX review and AI slop detection agent
- `lib/preamble.md` — Performance Checkpoint section: every skill session ends with a brief self-evaluation
- `lib/validate-skills.sh` — automated skill format validator (YAML frontmatter, PREAMBLE macro, Iron Law presence)
- `.github/workflows/validate.yml` — CI pipeline: build check + skill validation on every push/PR
- `CHANGELOG.md` (this file)
- `docs/COMPARISON.md` — detailed analysis: superomni vs obra/superpowers vs garrytan/gstack
- `bin/skill-manager search` — dynamic skill discovery via GitHub search
- `bin/agent-manager search` — dynamic agent discovery via GitHub search
- 9 slash commands registered in `claude-skill.json` (added `office-hours`, `autoplan`, `freeze`, `document-release`)

### Changed
- `workflow` skill: REFLECT stage now includes self-improvement evaluation step
- `using-skills` skill: added `self-improvement` to quick reference table
- `CLAUDE.md`: registered `self-improvement` skill with trigger phrases
- `docs/DESIGN.md`: updated version to 0.3.0

### Fixed
- `docs/DESIGN.md` version was stale at 0.2.0; corrected to 0.3.0

---

## [0.2.0] — 2025-12

### Added
- `skills/receiving-code-review/` — structured protocol for responding to PR review feedback
- `skills/security-audit/` — OWASP Top 10 + STRIDE vulnerability audit
- `skills/qa/` — quality assurance pass with structured checklists
- `skills/careful/` — safety guardrails for destructive/high-risk operations
- `skills/workflow/` — sprint pipeline orchestration (THINK→PLAN→BUILD→REVIEW→TEST→SHIP→REFLECT)
- Multi-platform support: Claude Code, Cursor, Codex, Gemini CLI, OpenCode, VS Code (Cline, Continue.dev), JetBrains
- `bin/agent-manager` — agent lifecycle manager (list, install, create, remove, search)
- Review checklists: data-driven checklist system separated from skill logic
- 6 built-in agents: `code-reviewer`, `planner`, `debugger`, `test-writer`, `security-auditor`, `architect`

### Changed
- `setup` script: auto-detects platform and configures all 8 supported platforms
- `hooks/session-start`: platform-aware runtime injection

---

## [0.1.0] — 2025-10

### Added
- Initial fusion of obra/superpowers + garrytan/gstack
- 22 core skills: `using-skills`, `brainstorm`, `writing-plans`, `executing-plans`, `systematic-debugging`, `test-driven-development`, `verification`, `code-review`, `plan-review`, `subagent-development`, `git-worktrees`, `finishing-branch`, `dispatching-parallel`, `investigate`, `retro`, `ship`, `writing-skills`, `agent-management`, `document-release`
- `ETHOS.md`: Plan Lean / Execute Complete philosophy + 6 Decision Principles
- `lib/preamble.md`: PROACTIVE mode toggle + unified status protocol
- `{{PREAMBLE}}` template system with `lib/gen-skill-docs.sh` build step
- `hooks/session-start`: skill injection at Claude Code session start
- `bin/config`: configuration management (proactive, telemetry)
- `bin/slug`: stable project identifier
- `bin/analytics-log`: local-only telemetry (JSONL, no network calls)
- Claude Code marketplace support (`.claude-plugin/marketplace.json`)
