# Changelog

All notable changes to superomni are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.5.0] — 2026-04

### Changed
- **Installation redesign**: `npx github:Wilder1222/superomni` is now the primary project-level install method for all platforms (Claude, Codex, Copilot, Gemini). Global install via `npm install -g` + `superomni setup`.
- **Platform-specific instruction templates**: Each CLI gets tailored config files — `CLAUDE.md` (with slash commands), `AGENTS.md` (with trigger phrases + command file mapping for Codex), `.github/copilot-instructions.md` (with skill directory references for Copilot), `GEMINI.md`.
- **Document output paths**: User-facing outputs (spec, plan, reviews, executions, subagent sessions, production readiness) now write to `docs/superomni/`. Internal state (improvements, evaluations, harness audits) stays in `.superomni/`.
- Renamed `brainstorming` skill to `brainstorm` for consistency across the project.
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
