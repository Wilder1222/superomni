<!-- Reference: frontend-design steering-command protocol — mode validation, reference loading, execution receipts. -->

# Frontend Design — Steering Command & Reference Loading Protocol

Single command `/front-design` invokes frontend-design with automatic mode detection:

| Command | Mode | What it does |
|---------|------|-------------|
| `/front-design` | Auto (or explicit mode hint) | Detects and applies one or more high-impact modes (audit, critique, polish, distill, clarify, animate, colorize, harden, arrange, typeset) |

## Steering Command Protocol

When invoked via a steering command:

1. Validate `mode:*` against the allowed set: `audit`, `critique`, `polish`, `distill`, `clarify`, `animate`, `colorize`, `harden`, `arrange`, `typeset`
2. If no mode is provided, enter auto mode and echo `mode=auto`
3. If mode is invalid, STOP and return fixed correction:
   - `Invalid mode: <value>`
   - `Supported modes: audit, critique, polish, distill, clarify, animate, colorize, harden, arrange, typeset`
   - `Tip: run /front-design (auto) or /front-design mode:<supported-mode>`
4. Skip Phases 1-2 **only when context is already established**, meaning at least one is true:
   - A prior response in the same session already captured target audience, brand personality, use context, design-system reuse, and constraints
   - A project design config file (`.impeccable.md` or `.design-config.md`) exists covering the five inputs in the Phase 1 checklist
   - User explicitly instructs to skip discovery and provides constraints inline
5. Resolve brand input with single-brand rule:
   - If brand is not in whitelist, STOP and request approval + local vendoring + whitelist update
   - If multiple brands are requested, STOP and ask user to choose one
6. Load references in order:
   - `reference/design-md-adaptation.md`
   - exactly one whitelist brand DESIGN.md (if requested)
   - 1-2 core references selected by mode:
     - `audit` -> `color-and-contrast.md` + `responsive-design.md`
     - `critique` -> `typography.md` + `spatial-design.md`
     - `polish` -> `interaction-design.md` + `motion-design.md`
     - `distill` -> `ux-writing.md` (+ `typography.md` if wording+hierarchy both change)
     - `clarify` -> `ux-writing.md` (+ `interaction-design.md` when state copy is affected)
     - `animate` -> `motion-design.md` (+ `responsive-design.md` when motion differs by viewport)
     - `colorize` -> `color-and-contrast.md` (+ `typography.md` when color alters hierarchy)
     - `harden` -> `interaction-design.md` + `responsive-design.md`
     - `arrange` -> `spatial-design.md` + `responsive-design.md`
     - `typeset` -> `typography.md` (+ `ux-writing.md` when readability copy tuning is needed)
7. If adaptation/whitelist/brand files are missing, degrade to core references only
8. Analyze current implementation through the command lens
9. Apply fixes
10. Run the quality gate on affected dimensions only

## Execution Receipts (mandatory)

Always emit these receipt flags in output:
- `adaptation loaded`
- `brand loaded`
- `core refs loaded`
- `quality gate authority kept`

If fallback was used, include:
- `fallback: core-references-only`
- `missing files: [list]`
