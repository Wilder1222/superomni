# superomni Polanyi Paradox Optimization Review

**Date:** 2026-04-09
**Branch:** main
**Reviewer:** Claude Opus 4.6
**Source:** `SynapseLab/30.资源库/技术/AI-Agent/17.superomni-波兰尼悖论优化方案.md`
**Project Version:** v0.5.4

---

## Executive Summary

The optimization document proposes six enhancement directions for superomni based on Polanyi's Paradox theory. After thorough source code review, **4 of 6 proposals have high compatibility with the current architecture**, 1 requires moderate adaptation, and 1 requires significant new infrastructure. The overall quality of analysis is high — the document correctly identifies existing implicit mechanisms and proposes additive enhancements that don't break current design.

---

## Part 1: Existing Mechanism Recognition — Accuracy Assessment

The document's Table 1 maps 8 existing mechanisms to Polanyi response strategies. Verification against source code:

| Claimed Mechanism | Claimed Location | Verified? | Notes |
|---|---|---|---|
| brainstorm "one question at a time" | `skills/brainstorm/SKILL.md` | **YES** | Phase 1 line: "Ask ONE clarifying question at a time" |
| Iron Laws | Various Skill Iron Law fields | **YES** | Found in systematic-debugging, TDD (3 laws), verification, careful |
| 6 Decision Principles | ETHOS.md | **YES** | All 6 present, referenced in brainstorm Phase 2 |
| Phase + Gate flow control | All Skills | **YES** | Every skill has numbered Phases, Gate checks in preamble |
| PROACTIVE mode switch | `bin/config` | **YES** | Binary true/false in `~/.omni-skills/config` |
| careful Skill confirmation | `skills/careful/SKILL.md` | **YES** | 4-phase risk assessment with explicit user gate |
| Local telemetry (usage.jsonl) | `~/.omni-skills/analytics/` | **YES** | `bin/analytics-log` writes to this location |
| verification evidence requirement | `skills/verification/SKILL.md` | **YES** | Iron Law: "I think it works is not evidence" |

**Verdict: 8/8 claimed mechanisms verified.** The document's analysis of existing design is accurate and well-researched.

---

## Part 2: Six Optimization Directions — Individual Assessment

### Direction 1: TACIT Five-Dimension Probe (brainstorm Skill Enhancement)

**Compatibility: HIGH**

| Aspect | Assessment |
|---|---|
| Target file | `skills/brainstorm/SKILL.md.tmpl` Phase 1 |
| Current state | Phase 1 has 5 checklist items for problem crystallization, but they are generic (problem, who, success, constraints, existing) |
| Proposed change | Add 5 TACIT dimension questions (Team, Aesthetic, Constraints, Integration, Tradeoffs) |
| Conflict risk | **None** — additive to existing Phase 1 checklist |
| Gate integration | New gate check ("at least 3 of 5 dimensions answered") fits existing Phase→Gate pattern |

**Feasibility: HIGH** — Pure Markdown modification. The brainstorm skill's Phase 1 already asks questions one at a time; adding 5 targeted dimension probes is a natural extension. The TACIT acronym is a practical mnemonic.

**Capability uplift:**
- **Before:** brainstorm asks generic clarification questions; implicit knowledge gaps go undetected
- **After:** Systematic coverage of the 5 most common implicit knowledge dimensions
- **Estimated improvement:** Reduces "user didn't mention X" failures by catching constraints/preferences early. Moderate uplift for complex features, minimal for simple tasks.

**Concern:** Could make Phase 1 feel heavy for simple tasks. Recommend: add a complexity gate — for S-effort tasks, ask only C (constraints) and I (integration); for M/L-effort, ask all 5.

---

### Direction 2: style-capture Skill (New Skill)

**Compatibility: MEDIUM**

| Aspect | Assessment |
|---|---|
| Target | New `skills/style-capture/SKILL.md.tmpl` + `docs/superomni/style-profiles/` |
| Architecture fit | Follows standard skill structure (frontmatter + preamble + phases) |
| Integration points | brainstorm, executing-plans, code-review, self-improvement |
| New infrastructure | `docs/superomni/style-profiles/` directory, prompt injection snippets |

**Feasibility: MEDIUM** — Creating the skill itself is straightforward (standard SKILL.md.tmpl pattern). The challenge is the **injection mechanism**: the document proposes style profiles that other skills reference, but the current preamble/skill system has no "conditional context loading" mechanism. Each skill's context is statically defined at build time via `lib/gen-skill-docs.sh`.

**Implementation gap:**
1. Need to define *how* other skills load `style-profiles/prompt-<scope>.md` at runtime
2. Current `lib/preamble.md` has no `{{STYLE_PROFILE}}` macro
3. `lib/gen-skill-docs.sh` would need a new expansion step, or skills need runtime `cat` commands

**Recommended adaptation:** Instead of a new macro, use the existing `Context Window Management` section in preamble — add style profiles to the "Planning" phase load list. Skills that need it can `cat docs/superomni/style-profiles/*.md` in their Phase 0.

**Capability uplift:**
- **Before:** Agent guesses code style from existing code (works for established repos, fails for new projects)
- **After:** Explicit style preferences captured from examples, reusable across sessions
- **Estimated improvement:** Significant for new projects and cross-team work. Limited value for solo developers with established repos.

---

### Direction 3: PROACTIVE Mode Graduated Trust (5-level matrix)

**Compatibility: HIGH**

| Aspect | Assessment |
|---|---|
| Target files | `bin/config`, `lib/preamble.md` |
| Current state | Binary `proactive=true/false` in flat key=value config |
| Proposed change | `proactive.mechanical`, `proactive.structural`, `proactive.stylistic`, `proactive.strategic`, `proactive.destructive` |

**Feasibility: HIGH** — The `bin/config` script uses simple `key=value` format with `grep`-based lookup. Dotted keys (`proactive.mechanical=true`) work out of the box with the current implementation — the `grep "^${KEY}="` pattern already supports this. No code changes to `bin/config` needed.

The preamble modification is pure Markdown — add a decision matrix section with 5 levels that the Agent evaluates before each action.

**Implementation detail:**
```bash
# These all work with current bin/config:
bin/config set proactive.mechanical true
bin/config set proactive.stylistic ask
bin/config get proactive.mechanical  # → true
```

**Concern:** The current `_PROACTIVE=$(bin/config get proactive)` check in preamble returns a single value. Need to either:
- Keep `proactive=true` as a master switch, add sub-keys as overrides
- OR change preamble to check multiple keys

**Recommended:** Keep the master switch for backward compatibility. Add sub-keys as optional overrides. Preamble checks sub-keys first, falls back to master.

**Capability uplift:**
- **Before:** All-or-nothing autonomy — either everything auto-triggers or nothing does
- **After:** Fine-grained control: mechanical decisions auto-proceed, taste decisions ask
- **Estimated improvement:** High for power users who want Agent efficiency without losing control over aesthetic/strategic choices. This directly addresses the most common friction point: Agent auto-decides something the user disagrees with.

---

### Direction 4: Iron Law Exemplification

**Compatibility: VERY HIGH**

| Aspect | Assessment |
|---|---|
| Target files | `skills/systematic-debugging/SKILL.md.tmpl`, `skills/test-driven-development/SKILL.md.tmpl`, `skills/verification/SKILL.md.tmpl` |
| Current state | Iron Laws are pure rule statements (e.g., "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST") |
| Proposed change | Add standardized example blocks (good/bad examples + common excuse rebuttals) |

**Feasibility: VERY HIGH** — This is the lowest-cost, highest-impact change. It requires only adding Markdown content to existing skill templates. No tooling changes. No new files. No config changes.

**Current Iron Laws that need examples:**

| Skill | Iron Law | Has Examples? |
|---|---|---|
| systematic-debugging | NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST | **Partial** — has "Root cause hypothesis" example output, but no good/bad comparison |
| test-driven-development | Test First | **No** — rule only |
| test-driven-development | Delete Untested Code | **No** — rule with 3-step procedure but no scenario example |
| test-driven-development | Red Before Green | **No** — rule only |
| verification | Evidence Required | **No** — has checklist but no good/bad scenario |
| careful | ALWAYS CONFIRM BEFORE DESTRUCTIVE OPS | **Partial** — has trigger list but no narrative example |

**validate-skills.sh enhancement:** The document proposes adding example block format validation. Currently validates 8 checks; adding a 9th for `### ✅` and `### ❌` sections after Iron Law is straightforward — add a `grep -q '### ✅'` check similar to existing pattern.

**Capability uplift:**
- **Before:** LLM interprets Iron Laws as abstract rules — compliance depends on LLM's inherent understanding
- **After:** LLM has concrete positive/negative examples — in-context learning dramatically improves adherence
- **Estimated improvement:** HIGH. Research consistently shows that LLMs follow rules + examples far better than rules alone. This is the single highest-ROI change in the entire document.

---

### Direction 5: Execution Pattern Mining (self-improvement Enhancement)

**Compatibility: MEDIUM-LOW**

| Aspect | Assessment |
|---|---|
| Target | `skills/self-improvement/SKILL.md.tmpl` — add Phase 0 |
| Current state | 7 phases: Gather → Evaluate Process → Evaluate Agent → Evaluate Skills → Gap Analysis → Actions → Save |
| Proposed change | Prepend Phase 0 for historical pattern mining from execution artifacts |

**Feasibility: MEDIUM** — The concept is sound, but depends on:
1. **Sufficient execution history existing** — `docs/superomni/reviews/`, `docs/superomni/executions/`, `usage.jsonl` must have accumulated data
2. **Cross-session analysis** — mining "past 5 executions" requires artifacts from multiple sessions, which may not exist for new projects
3. **Pattern detection logic** — "which skills were rejected", "which comments appeared 3+ times" requires non-trivial analysis that Agent must do in-context

**Current state of data sources:**
- `docs/superomni/reviews/` — exists but typically sparse
- `docs/superomni/executions/` — directory convention defined but rarely populated
- `~/.omni-skills/analytics/usage.jsonl` — exists, records skill name + duration + outcome, but lacks rejection/override data

**Key gap:** Current telemetry doesn't capture "user rejected Agent suggestion" or "user manually modified Agent output". Without this signal, pattern mining has limited raw material.

**Recommended adaptation:** Before implementing Phase 0, first enhance telemetry to capture:
- Skill invocations that were stopped/overridden by user (BLOCKED with user reason)
- Code review comments that repeat across sessions
- User corrections during brainstorm (question was re-asked or answer contradicted assumption)

**Capability uplift:**
- **Before:** Self-improvement is session-scoped — no cross-session learning
- **After:** Patterns emerge from accumulated history
- **Estimated improvement:** Low initially (insufficient data), potentially high after 10+ sessions. This is a long-term investment.

---

### Direction 6: TACIT-DENSE Human-in-the-Loop Routing

**Compatibility: HIGH**

| Aspect | Assessment |
|---|---|
| Target | `lib/preamble.md` — add TACIT-DENSE detection protocol |
| Current state | Preamble has PROACTIVE mode + Feedback Signal Protocol but no decision-type classification |
| Relationship to careful | Complementary — careful = operation risk, TACIT-DENSE = judgment risk |

**Feasibility: HIGH** — Pure Markdown addition to preamble. The 4 detection categories (D1-D4) are clear and non-overlapping with careful's trigger conditions.

**Integration analysis:**

| careful Skill triggers | TACIT-DENSE triggers | Overlap? |
|---|---|---|
| `rm -rf`, `git push --force` | Domain expertise decisions | **None** |
| Production configs, CI/CD | User-facing experience decisions | **Minimal** (production UI copy could trigger both) |
| Security-sensitive files | Team culture decisions | **None** |
| Database migrations | Novel pattern decisions | **None** |

The document's distinction table (careful vs TACIT-DENSE) is accurate. The two systems are complementary with minimal overlap.

**Implementation detail:** The proposed `⚠️ TACIT-DENSE: ...` output format integrates naturally with the existing Question Confirmation Protocol — it's essentially a structured way to surface a question before acting.

**Capability uplift:**
- **Before:** Agent proceeds autonomously on all non-destructive decisions, even when it lacks implicit knowledge to decide correctly
- **After:** Agent self-identifies 4 categories of decisions where its judgment is unreliable and asks explicitly
- **Estimated improvement:** MEDIUM-HIGH. Reduces "Agent did something technically correct but not what I wanted" — the most common and hardest-to-debug failure mode.

---

## Part 3: Implementation Priority Assessment

The document proposes: P0 (Iron Law + TACIT-DENSE) → P1 (style-capture + TACIT probe + PROACTIVE matrix) → P2 (pattern mining)

**My assessment agrees with adjustments:**

| Direction | Document Priority | My Priority | Rationale |
|---|---|---|---|
| Iron Law exemplification | P0 | **P0** | Lowest cost, highest impact, zero risk |
| TACIT-DENSE routing | P0 | **P0** | Low cost, high impact, pure preamble change |
| PROACTIVE 5-level matrix | P1 | **P0-P1** | Higher than doc suggests — `bin/config` already supports dotted keys, implementation is trivial |
| TACIT five-dimension probe | P1 | **P1** | Moderate impact, needs complexity gate design |
| style-capture Skill | P1 | **P1-P2** | Lower than doc suggests — injection mechanism needs design work |
| Pattern mining | P2 | **P2** | Correct — depends on telemetry enhancement first |

**Recommended v0.6.0 scope (immediate):**
1. Iron Law examples for systematic-debugging, TDD (3 laws), verification
2. TACIT-DENSE D1-D4 protocol in preamble.md
3. PROACTIVE sub-keys support (backward-compatible, low effort)
4. validate-skills.sh: add example block check

**Recommended v0.7.0 scope:**
1. brainstorm TACIT five-dimension probe with complexity gate
2. style-capture Skill (design injection mechanism first)

**Recommended v0.8.0 scope:**
1. Enhance telemetry to capture rejection/override signals
2. Then implement execution-pattern-mining Phase 0

---

## Part 4: Risk Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| TACIT probe makes brainstorm too heavy for simple tasks | Medium | Add complexity gate: S-effort → 2 dimensions, M/L → all 5 |
| Style profiles become stale as project evolves | Low | Add timestamp and "last validated" field; self-improvement checks staleness |
| PROACTIVE sub-keys break existing `bin/config get proactive` | Medium | Keep master switch, add sub-keys as overrides only |
| Iron Law examples increase skill template size (context pressure) | Low | Examples are typically 20-30 lines; well within acceptable range |
| TACIT-DENSE over-triggers, making Agent too cautious | Medium | Start with D1 (domain) and D4 (novel) only; add D2/D3 after tuning |
| Pattern mining produces false patterns from small sample | Low | Gate: require minimum 5 session artifacts before running |

---

## Part 5: Capability Uplift Summary

| Capability Dimension | Current v0.5.4 | After v0.6.0 (P0) | After v0.8.0 (all) |
|---|---|---|---|
| Iron Law adherence | Rules only → LLM interprets | Rules + examples → in-context learning | Same (stable) |
| Implicit knowledge detection | None → Agent guesses | TACIT-DENSE flags 4 categories | + TACIT probe catches 5 dimensions early |
| Autonomy calibration | Binary on/off | 5-level per decision type | + historical preference adaptation |
| Style consistency | Inferred from code | Same | Explicit style profiles from examples |
| Cross-session learning | None | None | Pattern mining from execution history |
| Human-in-the-loop precision | Destructive ops only | + high-implicit-knowledge decisions | + style/culture decisions |

**Overall assessment:** The optimization document is well-researched, accurately maps to the current codebase, and proposes practical enhancements with clear implementation paths. The Polanyi Paradox framing provides genuine analytical value — it's not just theoretical dressing but reveals actionable gaps (especially TACIT-DENSE and Iron Law exemplification) that wouldn't have been identified through pure engineering analysis.

---

**Status: DONE**

What's next -> If you want to proceed with implementation, I recommend starting with `/write-plan` for the v0.6.0 scope (Iron Law examples + TACIT-DENSE + PROACTIVE sub-keys).
