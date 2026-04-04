<!--
Adapted from pbakaus/impeccable (Apache 2.0)
Source: https://github.com/pbakaus/impeccable
-->

# Spatial Design

## 4pt Base Unit

Use 4px as the base unit instead of 8px. The 8pt grid is popular but too coarse for
fine-tuning. A 4pt base gives you the in-between values (12px, 20px) that interfaces
frequently need while maintaining mathematical consistency.

**The scale:**

```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
```

```css
:root {
  --space-1:  0.25rem;   /* 4px  */
  --space-2:  0.5rem;    /* 8px  */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
}
```

Every spacing value in your design should come from this scale. If you find yourself
reaching for `padding: 11px`, round to 12px. The discipline of snapping to the grid
creates alignment that is felt even when not consciously noticed.

## Semantic Token Names

Name spacing tokens by their semantic role, not their value. This enables scale
changes without renaming every variable.

```css
:root {
  --space-xs:    var(--space-1);   /* tight: icon gaps, inline spacing */
  --space-sm:    var(--space-2);   /* compact: list item padding */
  --space-md:    var(--space-4);   /* standard: card padding, form gaps */
  --space-lg:    var(--space-6);   /* roomy: section padding */
  --space-xl:    var(--space-8);   /* spacious: page sections */
  --space-2xl:   var(--space-12);  /* large: hero sections */
  --space-3xl:   var(--space-16);  /* extra large: page-level breathing room */
}
```

Component-level tokens can reference these:

```css
:root {
  --card-padding:    var(--space-md);
  --card-gap:        var(--space-sm);
  --section-padding: var(--space-xl);
  --input-padding-x: var(--space-sm);
  --input-padding-y: var(--space-xs);
}
```

## Responsive Grids

Avoid fixed column counts. Use CSS Grid with `auto-fit` and `minmax()` to create
layouts that adapt without media queries.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
}
```

This produces:
- 1 column on screens narrower than ~600px
- 2 columns around 600-900px
- 3+ columns on wider screens

For asymmetric layouts, combine named grid areas with `auto-fit` tracks:

```css
.dashboard {
  display: grid;
  grid-template-columns: minmax(200px, 280px) 1fr;
  gap: var(--space-lg);
}

/* Collapse to single column on narrow screens */
@media (max-width: 640px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
}
```

## Visual Hierarchy: The Squint Test

Blur your vision (or squint at the screen) and check whether key elements are still
distinguishable. If everything looks the same when blurred, the hierarchy is flat.

Hierarchy comes from combining multiple dimensions simultaneously:

| Dimension | Low emphasis        | High emphasis           |
|-----------|--------------------|-----------------------|
| Size      | Small text          | Large heading          |
| Weight    | Regular (400)       | Bold (700)             |
| Color     | Muted gray          | Primary/accent color   |
| Position  | Below the fold      | Top-left or center     |
| Space     | Tight margins       | Generous whitespace    |
| Contrast  | Low against background | High against background |

A common mistake is relying on a single dimension. Making something bigger alone
is not enough — combine size with weight, color, and surrounding space for clear
hierarchy.

## Container Queries

Container queries let components adapt to their container size rather than the
viewport. This means the same component works correctly whether placed in a sidebar,
main content area, or modal.

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

.card {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-sm);
}

@container card (min-width: 400px) {
  .card {
    grid-template-columns: 200px 1fr;
    gap: var(--space-md);
  }
}

@container card (min-width: 600px) {
  .card {
    grid-template-columns: 250px 1fr auto;
  }
}
```

Container queries replace many component-level media queries and make components
truly portable across layout contexts.

## Optical Refinements

Mathematical alignment and optical alignment are different. The eye perceives
balance differently than a ruler measures it.

### Letterform Whitespace

Some elements (particularly text and icons with internal whitespace) need negative
margin adjustments to appear optically aligned with their container edges.

```css
/* A large heading may need to pull left to align optically */
.section-heading {
  margin-left: -0.04em;  /* compensate for letterform whitespace */
}
```

### Icon Positioning

Asymmetric shapes (play button, arrows) need position offsets to appear centered.
A play triangle placed at mathematical center looks shifted left because the visual
weight is on the right side.

```css
.play-button svg {
  transform: translateX(8%);  /* shift right to appear optically centered */
}
```

### Touch Target Expansion

Visual elements can be smaller than their interactive area. Use padding or
pseudo-elements to expand the touch target to 44px minimum.

```css
.small-icon-button {
  /* Visual size: 24px icon */
  width: 24px;
  height: 24px;
  /* Interactive size: 44px via padding */
  padding: 10px;
  margin: -10px;  /* prevent layout expansion */
  position: relative;
}
```

## Z-Index

Use a semantic z-index scale instead of arbitrary values. This prevents z-index wars
where numbers escalate to 9999 and beyond.

```css
:root {
  --z-base:      0;
  --z-raised:    1;
  --z-dropdown:  10;
  --z-sticky:    20;
  --z-overlay:   30;
  --z-modal:     40;
  --z-tooltip:   50;
  --z-toast:     60;
}
```

Rules:
- Every z-index in the codebase must reference a token
- If something needs to be between two levels, the scale is wrong — add a new level
- Never use `z-index: 9999` or any arbitrary large number
- Create stacking contexts intentionally with `isolation: isolate` on containers

## Depth with Shadows

Build an elevation system where each level has defined shadow properties. Avoid
one-off box-shadow values scattered through the codebase.

```css
:root {
  --shadow-xs: 0 1px 2px oklch(0% 0.01 250 / 0.06);
  --shadow-sm: 0 1px 3px oklch(0% 0.01 250 / 0.08),
               0 1px 2px oklch(0% 0.01 250 / 0.04);
  --shadow-md: 0 4px 6px oklch(0% 0.01 250 / 0.07),
               0 2px 4px oklch(0% 0.01 250 / 0.04);
  --shadow-lg: 0 10px 15px oklch(0% 0.01 250 / 0.08),
               0 4px 6px oklch(0% 0.01 250 / 0.03);
  --shadow-xl: 0 20px 25px oklch(0% 0.01 250 / 0.08),
               0 8px 10px oklch(0% 0.01 250 / 0.03);
}
```

Use two-layer shadows (a larger diffused shadow + a smaller tight shadow) for more
realistic depth. Single-layer shadows look flat.

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Equal spacing everywhere | No visual rhythm, monotonous | Vary spacing to group related elements |
| Overusing card components | Every section in a card creates visual sameness | Reserve cards for distinct, interactive items |
| Nesting cards in cards | Confusing depth hierarchy | Flatten structure, use spacing to separate |
| No rhythm variation | Mechanical, lifeless layout | Alternate tight and loose spacing |
| Pixel values throughout | Hard to maintain, no system | Use spacing tokens from the scale |
| Arbitrary z-index values | Z-index escalation, unpredictable stacking | Use semantic z-index tokens |
| Single-layer box-shadows | Flat, unrealistic depth | Use two-layer shadow combinations |
| 8pt grid only | Too coarse for many UI elements | Start with 4pt for finer control |
