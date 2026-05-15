## Supporting Files (Reference / Examples / Scripts)

When a skill's `SKILL.md` body grows beyond ~280 lines, extract reference material into co-located files. This follows Anthropic's progressive-disclosure convention: keep `SKILL.md` lean (it stays in context for the rest of a session), and let detailed material load on demand.

### Single project-wide convention

```text
skills/<name>/
├── SKILL.md.tmpl           # operational body — ≤280 lines target, ≤500 lines hard ceiling
├── reference/              # always a SUBDIRECTORY, never a flat reference.md
│   ├── <topic-a>.md        # one file per topic; verbatim moves of long sections
│   └── <topic-b>.md
├── examples/               # OPTIONAL — sample inputs / outputs / shape templates
│   └── sample.md
└── scripts/                # OPTIONAL — executable code Claude RUNS, not loads as text
    └── helper.py
```

**Hard rules:**

- Reference material lives at `skills/<name>/reference/<topic>.md` — subdirectory, kebab-case topic name.
- A flat `skills/<name>/reference.md` at the skill root is non-conforming and triggers a `[advisory]` warning from `lib/check-skill-docs.js`.
- A `SKILL.md.tmpl` ≥ 300 lines without a `reference/` directory triggers an `[advisory]` warning. Both are advisory (no CI fail) — they're authoring nudges.
- Single-topic skills still use `reference/<single-topic>.md`. Accept one extra path component for project-wide consistency.

### When to use each subdirectory

| Subdirectory | Contains | Loaded into context? |
|---|---|---|
| `reference/<topic>.md` | Long protocols, scoring rubrics, anti-pattern tables, full report templates, verbose worked examples | On demand, when the SKILL.md body links to it |
| `examples/<name>.md` | Concrete sample outputs/inputs Claude reads to learn the shape (e.g., a sample evaluation report) | On demand |
| `scripts/<name>.{py,sh,js}` | Executable code Claude runs (e.g., `validate.sh`); never loaded as text | Never (executed, not loaded) |

### Linking from `SKILL.md.tmpl`

Use the literal `${CLAUDE_SKILL_DIR}` token in URLs — Anthropic's skill runtime resolves it at load time, so links work whether the skill is installed at personal, project, or plugin scope. Generators preserve the literal token (no build-time substitution).

```markdown
**Reference:** see [reference/<topic>.md](${CLAUDE_SKILL_DIR}/reference/<topic>.md) for [topic].
```

### Canonical examples in this project

The five trimmed skills (sprint v3, 2026-05-14) exemplify the convention:

| Skill | Files under `reference/` |
|---|---|
| `self-improvement` | `phase-templates.md` (Phases 0/3/6/7 reporting + final block) |
| `vibe` | `stage-detection.md`, `dispatch-brief.md` |
| `subagent-development` | `wave-planning.md`, `consensus-protocol.md`, `report-templates.md` |
| `frontend-design` | `quality-gate.md`, `reference-loading.md` (alongside the existing 9 design-principle siblings + `design-md-library/`) |
| `test-driven-development` | `red-green-refactor.md`, `anti-patterns.md` |

Read any of these for shape; copy the pattern when authoring a new skill.
