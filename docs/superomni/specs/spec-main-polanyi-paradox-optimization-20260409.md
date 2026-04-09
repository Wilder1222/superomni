# superomni Polanyi Paradox Optimization — Spec

## Problem

superomni v0.5.4 already contains multiple implicit mechanisms for addressing the Polanyi Paradox (users cannot fully articulate their intent, but the Agent must fully execute what they actually want). However, these mechanisms lack **systematic depth** — leading to avoidable misalignment between Agent output and user expectations. Specific gaps:

1. **brainstorm asks generic questions** — Phase 1 has no systematic probe for the five most common tacit knowledge dimensions (team culture, aesthetic preferences, unstated constraints, integration expectations, priority trade-offs). Result: specs miss hidden requirements.
2. **No "show me, don't tell me" channel** — Users can only describe preferences via rules; there is no mechanism to learn from examples. This contradicts Polanyi's core insight that demonstration transfers tacit knowledge better than description.
3. **PROACTIVE is binary (true/false)** — Cannot distinguish between safe-to-automate mechanical decisions and high-tacit-knowledge stylistic/strategic decisions. Result: either over-interrupts (false) or over-acts (true).
4. **Iron Laws are rule-only** — LLMs learn better from rule + example pairs. Current Iron Laws lack positive/negative examples, making boundary cases ambiguous.
5. **self-improvement doesn't mine tacit gaps** — Improvement reports are generic; they don't extract project/user-specific implicit preference patterns from execution history (rejections, manual overrides, repeated review comments).
6. **Only "dangerous operations" trigger human-in-loop** — Missing the other critical category: "high tacit-knowledge-density judgments" where Agent fundamentally cannot access the knowledge needed to decide correctly.

## Goals

- G1: Increase spec quality by systematically probing 5 tacit knowledge dimensions during brainstorm (measurable: 3+ dimensions answered before Phase 2)
- G2: Enable example-based preference capture via new `style-capture` Skill (measurable: style profile generated and referenced by downstream skills)
- G3: Replace binary PROACTIVE with 5-level trust matrix (measurable: config supports `proactive.mechanical`, `proactive.structural`, `proactive.stylistic`, `proactive.strategic`, `proactive.destructive`)
- G4: Add positive/negative example blocks to all core Iron Laws (measurable: 3 skills enhanced with standard example format)
- G5: Add Pattern Mining phase to self-improvement Skill (measurable: `tacit-gaps.md` generated from execution history)
- G6: Add TACIT-DENSE detection protocol to preamble (measurable: 4 categories of high-tacit decisions identified and routed to user)

## Non-Goals (YAGNI)

- Not building an AI training pipeline or fine-tuning system
- Not adding external service integrations for style analysis
- Not replacing the existing `careful` Skill — TACIT-DENSE is complementary, not overlapping
- Not changing the pipeline stage order (THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT)
- Not adding persistent cross-session learning beyond file-based memory (no database)

---

## Proposed Solution: Six Optimization Directions

### Direction 1: TACIT Five-Dimensional Probe (brainstorm Skill Enhancement)

#### Improvement Rationale
Current brainstorm Phase 1 asks five generic understanding questions (problem, who, success metrics, constraints, related work). These are necessary but insufficient — they don't target the five most common dimensions where tacit knowledge hides. A user might perfectly describe their problem but never mention their team's strong preference against certain patterns, or their implicit expectation about what "done" looks like in practice.

#### What Changes

**File:** `skills/brainstorm/SKILL.md.tmpl`

Add a **TACIT Five-Dimensional Probe** sub-section after the existing Phase 1 checklist. The five dimensions:

```markdown
## TACIT Five-Dimensional Probe (after initial understanding)

Each dimension targets one question — the most important question for that dimension:

T - Team & Culture
  -> "Does your team have any preferences or taboos regarding [key technical choice]?"
  (Captures: implicit team conventions and consensus)

A - Aesthetic & Style
  -> "Is there existing code or a system you consider 'feels right' as a reference?"
  (Captures: code style, architecture taste, implicit standards)

C - Constraints Unstated
  -> "What absolutely must NOT be touched this time?"
  (Captures: hidden boundaries and forbidden zones)

I - Integration Expectations
  -> "After this feature is complete, what will the user do first?"
  (Captures: implicit acceptance scenarios and success experiences)

T - Time & Quality Trade-offs
  -> "If you had to cut one feature to ship on time, which would you cut?"
  (Captures: implicit priority weights)
```

**New Gate Check at Phase 1 end:**
```
Phase 1 Gate:
  [x] At least 3 of 5 TACIT dimensions answered explicitly
  [x] If any answer reveals new constraints, problem definition updated
  -> FAIL -> continue clarification, do NOT enter Phase 2
```

#### Benefits & Returns
| Dimension | Before | After |
|-----------|--------|-------|
| Hidden constraints discovery | Ad-hoc, depends on Agent intuition | Systematic, 5 dimensions guaranteed |
| Spec completeness | Missing team/style/priority context | Covers cultural, aesthetic, boundary, integration, priority |
| Rework from missed requirements | Frequent "not what I wanted" | Reduced by catching implicit expectations early |

---

### Direction 2: Style Capture Skill (New Skill)

#### Improvement Rationale
Polanyi's central insight: "We know more than we can tell." Users cannot fully describe their style preferences through rules alone — but they can **point to examples** of code they like and dislike. superomni currently has no mechanism for this demonstration-based knowledge transfer. Every time the Agent writes code, it guesses at style, and the user corrects — a wasteful loop.

#### What Changes

**New Skill:** `skills/style-capture/SKILL.md.tmpl`

**Iron Law:** LEARN FROM EXAMPLES, NOT JUST RULES

**Phases:**

1. **Phase 1: Sample Collection** — Prompt user for 3-5 "good" examples and 1-2 "bad" examples of code/docs/designs. Key: don't ask "what's your style" — ask "show me something you're satisfied with."

2. **Phase 2: Feature Extraction** — Analyze examples across dimensions:
   - Naming style (descriptive vs concise vs Hungarian)
   - Comment density and placement (inline vs block vs none)
   - Function length and modularization granularity
   - Error handling style (defensive vs optimistic)
   - Abstraction level preference (extreme DRY vs concrete-first)
   - Documentation style (What vs Why vs How emphasis)

3. **Phase 3: Style Profile Output** — Generate `docs/superomni/style-profiles/<scope>.md`:
   ```
   # Style Profile: <scope> (project / frontend / api / docs)
   ## Confirmed Preferences (from examples)
   ## Reference Examples (with citations)
   ## Unknown / Ask Before Assuming
   ```

4. **Phase 4: Injection Verification** — Distill profile into system prompt fragment at `docs/superomni/style-profiles/prompt-<scope>.md` for downstream Skill reference.

**Integration with existing Skills:**
| Skill | How it uses style profile |
|-------|-------------------------|
| `brainstorm` | References profile when generating spec (aesthetic decisions) |
| `executing-plans` | References profile when writing code |
| `code-review` | Uses profile as review criteria |
| `self-improvement` | Treats profile as improvement target |

**Trigger:** Project initialization (detected by `vibe` for new projects) or explicit `/style-capture`.

**CLAUDE.md Registration:**
```
| style-capture | "/style-capture", project init | P1 |
```

#### Benefits & Returns
| Dimension | Before | After |
|-----------|--------|-------|
| Style knowledge transfer | Rule-based only (lossy) | Example-based (richer, more accurate) |
| First-time code quality | Agent guesses, user corrects | Agent references profile, fewer corrections |
| Cross-session consistency | Style resets each conversation | Style profile persists in `docs/superomni/style-profiles/` |
| Code review efficiency | Reviewer explains same style issues repeatedly | Profile captures preferences once, applied consistently |

---

### Direction 3: PROACTIVE Five-Level Trust Matrix

#### Improvement Rationale
Current `proactive=true/false` is too coarse. With `true`, the Agent auto-executes everything — including decisions that require human judgment (e.g., choosing a UI layout, naming a module). With `false`, the Agent asks about everything — including obvious mechanical decisions. This forces users into an unsatisfying binary choice. The Polanyi Paradox perspective reveals why: different decision types have different tacit knowledge intensities, and automation level should match.

#### What Changes

**File:** `bin/config` — Support dotted key notation for hierarchical config:

```bash
# New granular configuration
config set proactive.mechanical true    # Clear rules exist -> auto
config set proactive.structural true    # Architecture, interfaces -> auto
config set proactive.stylistic ask      # Appearance, naming preferences -> ask
config set proactive.strategic ask      # Direction, priority decisions -> ask
config set proactive.destructive false  # Delete, overwrite, irreversible -> always confirm
```

**File:** `lib/preamble.md` — Add TACIT Knowledge Intensity Check section:

```markdown
### TACIT Knowledge Intensity Check

Before executing any decision, classify its tacit knowledge intensity:

Mechanical — Iron Law applies or Gate Check has deterministic condition
  -> Follow proactive.mechanical config

Structural — Architecture, interface contracts, module boundaries
  -> Follow proactive.structural config

Stylistic — Naming, formatting, comment style, UI layout choices
  -> Check style profile first; if none exists, follow proactive.stylistic config

Strategic — Approach selection, architecture trade-offs, no single right answer
  -> Follow proactive.strategic config

Destructive — Delete, overwrite, irreversible operations
  -> Always confirm (integrates with careful Skill)
```

**Backward Compatibility:** When only `proactive=true` exists (legacy), interpret as all sub-keys = true except destructive = false. When `proactive=false`, interpret as all sub-keys = false.

#### Benefits & Returns
| Dimension | Before | After |
|-----------|--------|-------|
| User interruption frequency | All-or-nothing | Proportional to decision risk |
| Agent autonomy on safe decisions | Blocked if proactive=false | Always autonomous for mechanical |
| Human judgment on taste decisions | Skipped if proactive=true | Always requested for stylistic/strategic |
| Configuration expressiveness | 1 bit | 5 independent levels |

---

### Direction 4: Iron Law Example Blocks

#### Improvement Rationale
LLMs learn significantly better from rule + example pairs than from rules alone. Current Iron Laws are pure declarative rules (e.g., "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"). While clear to a human expert, these leave boundary cases ambiguous for the Agent. Adding standardized positive/negative examples with "common excuse rebuttals" makes the boundaries explicit and reduces Iron Law violations.

#### What Changes

**Files:**
- `skills/systematic-debugging/SKILL.md.tmpl` — Add examples for "No fixes without root cause"
- `skills/test-driven-development/SKILL.md.tmpl` — Add examples for each of 3 Iron Laws
- `skills/verification/SKILL.md.tmpl` — Add examples for "Evidence Required"

**Standard Example Block Format:**

```markdown
### Good Execution Example
```
User reports: [symptom]
Agent does:
  1. [investigation step] -> [finding]
  2. [investigation step] -> [finding]
  3. [root cause identified]
  4. [targeted fix based on root cause]
```

### Bad Execution Example (AVOID)
```
User reports: [symptom]
Agent does:
  Directly guesses it might be [X]
  -> Applies fix for [X]
  -> Doesn't work
  -> Guesses another cause
  [Violated Iron Law: started fixing without root cause investigation]
```

### Common Excuse Rebuttals
| Excuse | Rebuttal |
|--------|----------|
| "The problem is obvious, root cause is X" | "Obvious" is not evidence — spend 2 min verifying |
| "Similar bug was fixed this way before" | Similar != identical — verify root cause first |
```

**File:** `lib/validate-skills.sh` — Add optional check for example blocks:

```bash
# 9. Iron Law example blocks (recommended for core skills)
if grep -q '## Iron Law' "$tmpl"; then
  if ! grep -qE '### .*(Good|Bad|Correct|Incorrect|Compliant|Violat)' "$tmpl"; then
    warn "$rel_tmpl: Iron Law present but no example blocks found (recommended: add good/bad examples)"
  else
    pass "Iron Law example blocks present"
  fi
fi
```

#### Specific Examples to Add

**systematic-debugging Iron Law:**
- Good: User reports button unresponsive -> Agent traces event listeners -> finds parent `e.stopPropagation()` -> removes it
- Bad: User reports button unresponsive -> Agent guesses CSS `pointer-events: none` -> applies fix -> still broken -> keeps guessing

**test-driven-development Iron Law 1 (Test First):**
- Good: Need `calculateTotal()` for empty cart -> writes test asserting `Cart().total == 0` -> confirms RED -> writes implementation
- Bad: Writes `calculateTotal()` first -> then writes test that passes immediately -> proves nothing

**test-driven-development Iron Law 2 (Delete Untested Code):**
- Good: Accidentally wrote `validateEmail()` before test -> deletes it -> writes failing test -> rewrites function to pass
- Bad: Wrote `validateEmail()` first -> writes test after -> test passes -> moves on (Iron Law violated, code was never RED)

**verification Iron Law (Evidence Required):**
- Good: Claims feature works -> shows `npm test` output with 5/5 passing -> shows UI screenshot
- Bad: Claims "it should work based on the logic" -> no test output -> no observable proof

#### Benefits & Returns
| Dimension | Before | After |
|-----------|--------|-------|
| Iron Law boundary clarity | Ambiguous for edge cases | Explicit via positive/negative examples |
| LLM comprehension | Rule-only (partial understanding) | Rule + example (significantly higher compliance) |
| New contributor onboarding | Must intuit Iron Law boundaries | Examples demonstrate exact expectations |
| Iron Law violation rate | Violations on boundary cases | Reduced by showing "common excuse rebuttals" |

---

### Direction 5: Execution Pattern Mining (self-improvement Enhancement)

#### Improvement Rationale
`self-improvement` currently evaluates process adherence and agent behavior generically. It doesn't extract **project/user-specific implicit preference patterns** from execution history. When a user repeatedly rejects Agent suggestions, overrides outputs, or leaves the same review comment three times — each instance is a signal that the Agent has failed to capture a tacit preference. Currently, these signals are lost.

#### What Changes

**File:** `skills/self-improvement/SKILL.md.tmpl` — Add Phase 0: Pattern Mining before existing Phase 1.

```markdown
## Phase 0: Tacit Gap Mining

Before evaluating the current session, mine execution history for tacit knowledge gaps:

### Signal Sources
1. `docs/superomni/reviews/` — Recurring comments in code reviews (3+ occurrences = uncodified standard)
2. `docs/superomni/executions/` — Deviation handling records (manual overrides = unmatched preferences)
3. `~/.omni-skills/analytics/usage.jsonl` — Skills frequently manually overridden

### Mining Questions
- [ ] In the last 5 executions, which Agent suggestions were rejected by the user?
- [ ] In code reviews, which comment types appeared 3+ times?
- [ ] In which scenarios did the user manually modify Agent output?

### Analysis Logic
- User rejects Agent suggestion = Agent lacks a tacit preference here
- Recurring review comment = Standard not captured by Iron Law
- Manual output modification = Style mismatch between Agent and user

### Output
Generate `docs/superomni/improvements/tacit-gaps-[date].md`:

| Scenario | Agent Behavior | User Expected Behavior | Proposed Rule |
|----------|---------------|----------------------|---------------|
| [context] | [what Agent did] | [what user wanted] | [candidate rule to add] |
```

**Relationship with style-capture:**
- `style-capture`: **Proactive** collection of tacit preferences (at session start)
- `execution-pattern-mining`: **Passive** extraction from history (at session end)
- Together they form a complete tacit knowledge lifecycle: capture -> apply -> mine gaps -> refine

#### Benefits & Returns
| Dimension | Before | After |
|-----------|--------|-------|
| Learning from mistakes | Generic improvement actions | Project-specific tacit gap identification |
| Preference drift detection | None — preferences are static | Ongoing mining reveals evolving preferences |
| Style profile refinement | Manual update only | Automatic candidates from execution history |
| Repeated review comments | Same comment given every time | Mined and codified as rule after 3 occurrences |

---

### Direction 6: TACIT-DENSE Detection & Human-in-Loop Routing

#### Improvement Rationale
`careful` Skill handles "operationally dangerous" human-in-loop (delete, overwrite, force push). But there's another critical category the Polanyi Paradox reveals: **decisions where the Agent fundamentally cannot access the tacit knowledge needed to judge correctly** — not because the operation is dangerous, but because the judgment requires domain expertise, user experience intuition, team culture knowledge, or precedent that doesn't exist in the codebase.

#### What Changes

**File:** `lib/preamble.md` — Add TACIT-DENSE Detection Protocol:

```markdown
### TACIT-DENSE Detection (Tacit Knowledge Density Check)

The following scenarios are marked TACIT-DENSE — require user confirmation before execution:

D1 - Domain Expertise Decision
  Trigger: Requires substantive judgment in a specific domain (medical, legal, financial, security compliance)
  Example: Choosing encryption algorithm, deciding data retention policy
  Action: Declare "This is a TACIT-DENSE decision", present options, wait for user selection

D2 - User-Facing Experience Decision
  Trigger: Involves substantive choices about UI copy, interaction flow, error messaging
  Example: Designing onboarding flow guidance text
  Action: Provide draft, explicitly mark which parts need user review

D3 - Team Culture & Convention Decision
  Trigger: Involves major choices about team workflow, naming conventions, documentation style
  Example: Determining file structure and naming conventions for a new module
  Action: Check if style profile exists; if not, ask user

D4 - Novel Pattern Decision
  Trigger: Task type has appeared fewer than 3 times in execution history
  Example: First-time integration of a new technology stack in the project
  Action: Reduce autonomy level, add checkpoints

Output format when TACIT-DENSE detected:
  "TACIT-DENSE [D1/D2/D3/D4]: This is a [category] decision requiring your judgment.
   Question: [single most important question]
   My default recommendation: [recommendation + rationale]
   Please confirm or share your preference."
```

**Distinction from `careful` Skill:**

| | careful Skill | TACIT-DENSE Protocol |
|--|--------------|---------------------|
| Trigger | Operation danger (delete, overwrite) | Judgment knowledge density |
| Concern | Can we undo this? | Can we judge this correctly? |
| Example | `rm -rf` operation | Choosing UI copy |
| Response | Confirm then execute | Provide recommendation, wait for user to lead |
| Location | Standalone skill | Integrated into preamble (applies to ALL skills) |

#### Benefits & Returns
| Dimension | Before | After |
|-----------|--------|-------|
| Decision quality on domain matters | Agent guesses confidently | Agent flags uncertainty, user decides |
| User-facing experience quality | Generic defaults applied | User shapes critical UX decisions |
| Novel situation handling | Same autonomy as familiar tasks | Reduced autonomy, more checkpoints |
| Trust calibration | Agent never admits "I might not know enough" | Explicit self-awareness of knowledge limits |

---

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|------------------|
| TACIT probe in brainstorm vs new skill | In brainstorm (Phase 1 enhancement) | Avoids new skill overhead; probe is part of problem crystallization | DRY + Pragmatic |
| style-capture as new Skill vs memory feature | New Skill | Has clear phases, produces artifacts, integrates with pipeline | Completeness |
| PROACTIVE 5-level vs 3-level | 5-level (mechanical/structural/stylistic/strategic/destructive) | Maps precisely to tacit knowledge intensity spectrum | Explicit over clever |
| Iron Law examples: embedded vs separate files | Embedded in SKILL.md.tmpl | Keeps context together; LLM sees rule + example in same prompt | Explicit over clever |
| Pattern Mining as Phase 0 vs separate skill | Phase 0 in self-improvement | Mining is a precursor to evaluation, not an independent workflow | DRY + Pragmatic |
| TACIT-DENSE in preamble vs new skill | In preamble | Must apply to ALL skills (cross-cutting), not just when explicitly invoked | Completeness |

## Implementation Roadmap

### Wave 1 (v0.6.0) — Low-cost, high-value existing mechanism deepening

| Item | Files Changed | Effort |
|------|--------------|--------|
| Iron Law example blocks for `systematic-debugging` | `skills/systematic-debugging/SKILL.md.tmpl` | S |
| Iron Law example blocks for `test-driven-development` | `skills/test-driven-development/SKILL.md.tmpl` | S |
| Iron Law example blocks for `verification` | `skills/verification/SKILL.md.tmpl` | S |
| TACIT-DENSE D1-D4 protocol in preamble | `lib/preamble.md` | S |
| Example block check in validator | `lib/validate-skills.sh` | S |
| Regenerate all SKILL.md | `lib/gen-skill-docs.sh` (run) | S |

### Wave 2 (v0.7.0) — Active tacit knowledge collection

| Item | Files Changed | Effort |
|------|--------------|--------|
| style-capture Skill | `skills/style-capture/SKILL.md.tmpl` (new), `commands/style-capture.md` (new) | M |
| TACIT Five-Dimensional Probe in brainstorm | `skills/brainstorm/SKILL.md.tmpl` | M |
| PROACTIVE 5-level trust matrix | `bin/config`, `lib/preamble.md` | M |
| style-profiles directory | `docs/superomni/style-profiles/` (new) | S |
| CLAUDE.md registration | `CLAUDE.md` | S |

### Wave 3 (v0.8.0) — Passive tacit knowledge mining

| Item | Files Changed | Effort |
|------|--------------|--------|
| Phase 0: Pattern Mining in self-improvement | `skills/self-improvement/SKILL.md.tmpl` | M |
| tacit-gaps output template | `docs/superomni/improvements/tacit-gaps-*.md` (runtime) | S |
| Style profile auto-update from mining results | `skills/style-capture/SKILL.md.tmpl` (reference) | S |

## Acceptance Criteria

### Wave 1 (v0.6.0)
- [ ] `systematic-debugging/SKILL.md.tmpl` contains Good/Bad example block under Iron Law
- [ ] `test-driven-development/SKILL.md.tmpl` contains example blocks for each of 3 Iron Laws
- [ ] `verification/SKILL.md.tmpl` contains Good/Bad example block under Iron Law
- [ ] `lib/preamble.md` contains TACIT-DENSE section with D1/D2/D3/D4 categories
- [ ] `lib/validate-skills.sh` warns when Iron Law exists without example blocks
- [ ] `bash lib/validate-skills.sh` passes with no errors
- [ ] All SKILL.md files regenerated via `lib/gen-skill-docs.sh`

### Wave 2 (v0.7.0)
- [ ] `skills/style-capture/SKILL.md.tmpl` exists with Iron Law, 4 phases, status protocol
- [ ] `bin/config set proactive.stylistic ask` works correctly
- [ ] `bin/config get proactive.stylistic` returns "ask"
- [ ] Legacy `proactive=true` still works (backward compatible)
- [ ] `skills/brainstorm/SKILL.md.tmpl` Phase 1 contains TACIT 5-dimensional probe
- [ ] Phase 1 Gate Check requires 3+ TACIT dimensions answered
- [ ] `docs/superomni/style-profiles/` directory created
- [ ] `CLAUDE.md` updated with `style-capture` entry
- [ ] `bash lib/validate-skills.sh` passes

### Wave 3 (v0.8.0)
- [ ] `skills/self-improvement/SKILL.md.tmpl` contains Phase 0: Pattern Mining
- [ ] Phase 0 mines reviews, executions, and analytics for tacit gaps
- [ ] Output format: `docs/superomni/improvements/tacit-gaps-[date].md`
- [ ] Mining logic: 3+ occurrences of same review comment -> candidate rule
- [ ] `bash lib/validate-skills.sh` passes

## Open Questions

1. **TASTE:** Should style-capture also capture architecture preferences (microservices vs monolith, ORM vs raw SQL), or strictly code-level style? (Recommendation: start with code-level only, extend later.)
2. **TASTE:** For PROACTIVE 5-level, should the default for `proactive.structural` be `true` or `ask`? (Recommendation: `true` — structural decisions have moderate tacit density and the 6 Decision Principles usually suffice.)
3. **TASTE:** Should TACIT-DENSE detection have a learning mode where frequently-confirmed defaults get auto-promoted? (Recommendation: defer to v0.9.0 — keep it explicit for now.)
