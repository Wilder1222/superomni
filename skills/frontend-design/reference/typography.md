<!--
Adapted from pbakaus/impeccable (Apache 2.0)
Source: https://github.com/pbakaus/impeccable
-->

# Typography

## Vertical Rhythm

Line-height is the base unit for all vertical spacing. Every margin, padding, and gap
should be a multiple of your base line-height. This creates a consistent cadence that
makes layouts feel cohesive even when content varies.

```css
:root {
  --line-height: 1.5;       /* base ratio */
  --baseline: 1.5rem;       /* computed unit: 1rem * 1.5 = 24px at 16px root */
  --space-half: calc(var(--baseline) / 2);
  --space-double: calc(var(--baseline) * 2);
}

body {
  font-size: 1rem;
  line-height: var(--line-height);
}

h2 {
  margin-top: var(--space-double);
  margin-bottom: var(--baseline);
}

p + p {
  margin-top: var(--baseline);
}
```

When elements break the rhythm (images, components with internal padding), use padding
or margin adjustments to realign the next text block to the baseline grid.

## Modular Scale

Limit your type system to a maximum of 5 font sizes. Pick a ratio and derive every
size from it. Common ratios:

| Ratio | Name           | Use case                        |
|-------|----------------|---------------------------------|
| 1.25  | Major Third    | Tight hierarchy, app UIs        |
| 1.333 | Perfect Fourth | Balanced, general purpose       |
| 1.5   | Perfect Fifth  | High contrast, marketing pages  |

Example scale at 1.25 ratio with 16px base:

```
--text-xs:  0.64rem   (10.24px)
--text-sm:  0.8rem    (12.8px)
--text-base: 1rem     (16px)
--text-lg:  1.25rem   (20px)
--text-xl:  1.563rem  (25px)
```

Muddy hierarchies happen when sizes are too close together. A system with 14px, 15px,
and 16px creates no visible distinction. If you cannot tell two sizes apart at arm's
length, they are functionally identical and one should be removed.

## Font Strategy

### Avoiding Overused Defaults

Inter, Roboto, Open Sans, and Arial are the default choices of nearly every AI-generated
and template-based project. They are competent typefaces but they signal "default" to
anyone who works with design regularly. Consider alternatives:

| Font               | Category        | Character                        |
|--------------------|-----------------|----------------------------------|
| Instrument Sans    | Geometric sans  | Clean, slightly technical        |
| Onest              | Geometric sans  | Friendly, rounded terminals      |
| Figtree            | Geometric sans  | Open, readable at small sizes    |
| Plus Jakarta Sans  | Geometric sans  | Modern, slightly warm            |
| Satoshi            | Neo-grotesque   | Neutral with personality         |

### Single Font Philosophy

One family in multiple weights creates a cleaner hierarchy than two similar fonts
fighting for attention. A single typeface at 400, 500, 600, and 700 weights provides
four distinct levels of emphasis without introducing visual noise.

```css
:root {
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}
```

## Pairing Rules

When pairing two typefaces, combine with genuine contrast. The goal is clear role
separation, not subtle variation.

**Effective pairings:**
- Serif headings + sans-serif body (classic editorial)
- Geometric sans headings + humanist sans body
- Monospace headings + proportional body (technical/developer audiences)

**Ineffective pairings:**
- Two geometric sans-serifs (Montserrat + Inter — too similar)
- Two humanist sans-serifs (Source Sans + Open Sans — no contrast)
- Serif + serif from the same era and classification

The test: if you have to squint to tell which is which, the pairing fails.

## Web Font Loading

Layout shift from font loading is a common quality problem. The solution is a
combination of `font-display` and fallback metric matching.

```css
@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/fonts/plus-jakarta-sans-var.woff2') format('woff2');
  font-weight: 200 800;
  font-display: swap;
}

/* Fallback metric matching to minimize layout shift */
@font-face {
  font-family: 'Plus Jakarta Sans Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: 'Plus Jakarta Sans', 'Plus Jakarta Sans Fallback', system-ui, sans-serif;
}
```

Use tools like `fontaine` or `@capsizecss/metrics` to generate accurate size-adjust
and override values for your chosen fonts.

## Fluid Type

Use `clamp()` for headings on marketing pages where the viewport range is wide.
For app UIs with predictable containers, use fixed scales — fluid type adds
complexity without meaningful benefit in constrained layouts.

```css
/* Marketing page headings — fluid */
h1 { font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem); }

/* App UI — fixed */
.app-heading { font-size: 1.25rem; }
.app-body    { font-size: 0.875rem; }
```

The `clamp()` formula: `clamp(min, preferred, max)` where preferred is typically
`base + Xvw`. Calculate the vw coefficient so the value hits min at your smallest
viewport and max at your largest.

## OpenType Features

Modern fonts include features that improve readability in specific contexts.
Enable them deliberately, not globally.

```css
/* Tabular numbers for data tables and prices */
.data-table td { font-variant-numeric: tabular-nums; }

/* Small caps for abbreviations */
abbr { font-variant-caps: all-small-caps; }

/* Kerning — enabled by default in most browsers, but be explicit */
body { font-kerning: auto; }

/* Oldstyle figures for running text (if font supports) */
.prose { font-variant-numeric: oldstyle-nums; }

/* Disable ligatures in code */
code, pre { font-variant-ligatures: none; }
```

## Readability

### Line Length

Optimal line length for body text is 45-75 characters, with 65ch as the target.

```css
.prose {
  max-width: 65ch;
}
```

This applies to body text. UI labels, navigation items, and headings follow
different rules — they are constrained by their containers, not by character count.

### Light-on-Dark Adjustments

When displaying light text on a dark background, increase line-height by 0.05 to
0.1 compared to dark-on-light. The optical perception of spacing changes when
polarity inverts.

```css
.dark-theme .prose {
  line-height: calc(var(--line-height) + 0.075);
  letter-spacing: 0.01em; /* slight tracking increase also helps */
}
```

## Accessibility

- **Minimum body size**: 16px (1rem). Anything smaller requires justification.
- **Use rem/em units**: Allow user font-size preferences to propagate. Never set
  `font-size` on `html` in pixels.
- **Never disable zoom**: Remove `maximum-scale=1` and `user-scalable=no` from the
  viewport meta tag.
- **Touch targets**: Interactive text elements (links in running text) should have
  at least 44px of tappable height via padding.
- **Contrast**: Body text requires 4.5:1 contrast ratio against its background
  (WCAG AA). Large text (18px bold or 24px regular) requires 3:1.

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Monospace for everything | Lazy shortcut that avoids hierarchy decisions | Use monospace only for code and data |
| Font-size fights (13/14/15px) | No visible distinction, adds complexity | Use a modular scale with clear steps |
| Missing `font-display` | Flash of invisible text or layout shift | Add `font-display: swap` to all @font-face |
| Body text below 16px | Accessibility violation, poor readability | Keep body at 1rem minimum |
| Viewport-only fluid type | Text can shrink to unreadable on small screens | Always use `clamp()` with a minimum |
| Too many font weights | Visual noise, larger downloads | Limit to 3-4 weights per family |
| px units on root font-size | Blocks user preferences | Use % or rem on html element |
