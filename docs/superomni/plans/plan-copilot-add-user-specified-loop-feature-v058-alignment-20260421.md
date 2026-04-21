# Implementation Plan: Loop Feature v0.5.8 Alignment

## Overview
Align the loop feature implementation with the v0.5.8 baseline (6-stage pipeline ending in RELEASE). Add a new `/loop` command, a `loop` skill, and integrate optional post-RELEASE loop triggering from vibe while preserving existing v0.5.8 conventions.

## Prerequisites
- [x] Current branch fast-forward merged with `origin/main` (v0.5.8)
- [x] Existing command registry in `claude-skill.json`
- [x] Existing workflow artifact conventions under `docs/superomni/`

## Steps

### Step 1: Add loop command and skill
**What:** Introduce a dedicated loop command and protocol.
**Files:** `commands/loop.md`, `skills/loop/SKILL.md.tmpl`
**How:**
1. Add `/loop` usage and behavior docs.
2. Add loop skill protocol with bounded iterations, prior-result dependency, convergence stop, and summary output.
**Verification:** New files exist and define default 3 / max 5 iteration behavior.

### Step 2: Register loop in framework metadata
**What:** Make `/loop` discoverable in command registries and project docs.
**Files:** `claude-skill.json`, `CLAUDE.md`, `.claude-plugin/marketplace.json`, `README.md`, `skills/using-skills/SKILL.md`
**How:**
1. Register `/loop` command in `claude-skill.json`.
2. Add loop entries in commands/skills tables and output conventions.
3. Update plugin marketplace command summary string.
**Verification:** `/loop` appears in command lists and references across docs.

### Step 3: Wire vibe post-RELEASE loop gate
**What:** Add optional loop trigger after RELEASE completion.
**Files:** `commands/vibe.md`, `skills/vibe/SKILL.md.tmpl`
**How:**
1. Add `/loop` to guided command menu.
2. Add optional post-RELEASE prompt contract that normalizes iteration count (default 3, cap 5).
3. Specify that YES path dispatches `loop` skill with normalized args.
**Verification:** Vibe docs mention both manual `/loop` and post-RELEASE trigger behavior.

### Step 4: Add loop data contract
**What:** Define artifact contracts for loop states and summary.
**Files:** `docs/SKILL-DATA-FLOW.md`
**How:**
1. Add `docs/superomni/loops/` to artifact directory map.
2. Define required sections for loop state and loop summary artifacts.
3. Define producer/consumer relationships across iterations.
**Verification:** Data-flow doc includes explicit loop contract and consumption rules.

### Step 5: Generate and validate
**What:** Build generated skill docs and validate templates.
**Files:** Generated `skills/loop/SKILL.md`, regenerated `skills/vibe/SKILL.md`
**How:**
1. Run `npm run gen-skills`.
2. Run `npm test`.
**Verification:** Generation succeeds and skill validator passes (warnings acceptable if baseline already contains them).

## Testing Strategy
- **Template validation:** `npm test`
- **Skill generation:** `npm run gen-skills`
- **Manual checks:** verify `/loop` appears in `claude-skill.json`, vibe docs, and README/CLAUDE references.

## Rollback Plan
1. Remove `commands/loop.md` and `skills/loop/`.
2. Revert updates in metadata/docs (`claude-skill.json`, `CLAUDE.md`, `README.md`, `skills/vibe/SKILL.md.tmpl`, `docs/SKILL-DATA-FLOW.md`, `.claude-plugin/marketplace.json`, `skills/using-skills/SKILL.md`).
3. Regenerate skill docs via `npm run gen-skills`.

## Success Criteria
- [ ] `/loop` command is available and documented.
- [ ] Loop skill enforces prior-iteration input dependency and bounded iterations (3 default, 5 max).
- [ ] Vibe defines optional post-RELEASE loop trigger flow.
- [ ] Loop artifacts contract is documented in `docs/SKILL-DATA-FLOW.md`.
- [ ] Skill generation and validation complete successfully.
