# Changelog

All notable changes to superomni are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

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
- 22 core skills: `using-skills`, `brainstorming`, `writing-plans`, `executing-plans`, `systematic-debugging`, `test-driven-development`, `verification`, `code-review`, `plan-review`, `subagent-development`, `git-worktrees`, `finishing-branch`, `dispatching-parallel`, `investigate`, `retro`, `ship`, `writing-skills`, `agent-management`, `document-release`
- `ETHOS.md`: Plan Lean / Execute Complete philosophy + 6 Decision Principles
- `lib/preamble.md`: PROACTIVE mode toggle + unified status protocol
- `{{PREAMBLE}}` template system with `lib/gen-skill-docs.sh` build step
- `hooks/session-start`: skill injection at Claude Code session start
- `bin/config`: configuration management (proactive, telemetry)
- `bin/slug`: stable project identifier
- `bin/analytics-log`: local-only telemetry (JSONL, no network calls)
- Claude Code marketplace support (`.claude-plugin/marketplace.json`)
