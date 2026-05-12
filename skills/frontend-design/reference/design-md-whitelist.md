<!--
Curated whitelist for local DESIGN.md references.
Source corpus is vendored into this repository under design-md-library (MIT).
-->

# DESIGN.md Brand Whitelist (Pilot Set)

Use this list for controlled adoption. Start with these local references before expanding.

## Pilot brands (8)

| Brand | Local DESIGN.md file | Why in pilot set |
|---|---|---|
| Claude | `design-md-library/claude/DESIGN.md` | Editorial layout and warm-neutral tone |
| Linear | `design-md-library/linear.app/DESIGN.md` | Minimal hierarchy and precision rhythm |
| Notion | `design-md-library/notion/DESIGN.md` | Readability-first, calm surfaces |
| Vercel | `design-md-library/vercel/DESIGN.md` | High-contrast minimalist system |
| Stripe | `design-md-library/stripe/DESIGN.md` | Strong typographic contrast and CTA clarity |
| Raycast | `design-md-library/raycast/DESIGN.md` | Dark-theme accent balance |
| Framer | `design-md-library/framer/DESIGN.md` | Motion-forward interface language |
| Shopify | `design-md-library/shopify/DESIGN.md` | Dark-first commerce storytelling patterns |

## Usage rules

- Load only **one** brand per task.
- Pair with **1-2** core references from `skills/frontend-design/reference/`.
- Use only local files in this whitelist; do not fetch remote design-md links during execution.
- If a user asks for a non-whitelist brand, ask for explicit approval and vendor that brand's DESIGN.md into `design-md-library/` first.
- Do not auto-expand this list without quality-gate stability checks.
