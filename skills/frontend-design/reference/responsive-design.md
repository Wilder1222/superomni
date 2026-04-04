<!--
Adapted from pbakaus/impeccable (Apache 2.0)
Source: https://github.com/pbakaus/impeccable
-->

# Responsive Design

## Mobile-First

Start with the narrowest viewport and layer complexity as space increases. This
approach forces prioritization — if a feature cannot fit on mobile, question whether
it is essential.

```css
/* Base styles target mobile (320-640px) */
.card {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Add complexity at larger viewports */
@media (min-width: 640px) {
  .card {
    flex-direction: row;
    padding: var(--space-lg);
    gap: var(--space-md);
  }
}

@media (min-width: 1024px) {
  .card {
    padding: var(--space-xl);
  }
}
```

Desktop-first CSS forces mobile to inherit and override excessive complexity. The
cascade works against you. Mobile-first uses the cascade as intended — progressive
enhancement.

## Content-Driven Breakpoints

Do not use device-specific breakpoints (iPhone width, iPad width). Start with a
narrow viewport, stretch the browser window until the design breaks, then add a
breakpoint at that width.

Typical breakpoints emerge naturally:

| Breakpoint | Approximate width | Common layout shift                |
|------------|-------------------|------------------------------------|
| sm         | ~640px            | Single column → two columns        |
| md         | ~768px            | Stacked nav → horizontal nav       |
| lg         | ~1024px           | Sidebar appears, three-column grid |
| xl         | ~1280px           | Max-width container, more padding  |

```css
:root {
  --breakpoint-sm: 40rem;    /* 640px */
  --breakpoint-md: 48rem;    /* 768px */
  --breakpoint-lg: 64rem;    /* 1024px */
  --breakpoint-xl: 80rem;    /* 1280px */
}
```

Three breakpoints are usually sufficient. More than five suggests the design is
fighting the medium.

## clamp() for Fluid Scaling

Reduce breakpoint count by using `clamp()` for properties that can scale smoothly:
font-size, padding, gap, margin.

```css
.section {
  padding-block: clamp(2rem, 1rem + 4vw, 6rem);
  gap: clamp(1rem, 0.5rem + 2vw, 3rem);
}

h1 {
  font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
}
```

**Formula breakdown:**

```
clamp(min, preferred, max)
```

- `min`: smallest value (mobile)
- `preferred`: fluid calculation (typically `base + Xvw`)
- `max`: largest value (desktop)

To calculate the `vw` coefficient:
1. Decide your min and max viewport widths (e.g., 320px and 1280px)
2. Desired value range (e.g., 2rem to 3.5rem)
3. Coefficient = (max - min) / (max-viewport - min-viewport) * 100

For most cases, trial and error in DevTools is faster than calculation.

## Input Method Detection

Screen size does not determine input capability. A 13" laptop has a large screen but
precise pointer. A 12.9" iPad Pro has a large screen but coarse touch input.

```css
/* Hover-capable devices (mouse, trackpad) */
@media (hover: hover) and (pointer: fine) {
  .button:hover {
    background: var(--primary-600);
  }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .button {
    min-height: 44px;  /* larger touch targets */
  }
}
```

Do not assume mobile = touch. Chromebooks, Surface devices, and convertible laptops
blur the line. Test both input methods at every screen size.

## Safe Areas

Modern devices have notches, rounded corners, and home indicators. Use safe area
insets to prevent content from being obscured.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.header {
  padding-top: max(var(--space-md), env(safe-area-inset-top));
  padding-left: max(var(--space-md), env(safe-area-inset-left));
  padding-right: max(var(--space-md), env(safe-area-inset-right));
}

.footer {
  padding-bottom: max(var(--space-md), env(safe-area-inset-bottom));
}
```

The `max()` function ensures padding is never less than your design system spacing,
but expands when safe area insets are larger.

## Responsive Images

### srcset with Width Descriptors

Provide multiple image sizes and let the browser choose based on viewport width and
device pixel ratio.

```html
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w,
    image-1600.jpg 1600w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
  alt="Description"
>
```

**sizes attribute breakdown:**
- `(max-width: 640px) 100vw` — on narrow screens, image fills viewport width
- `(max-width: 1024px) 50vw` — on medium screens, image is half viewport width
- `800px` — on large screens, image is fixed 800px

The browser uses this information to select the optimal image from `srcset`.

### picture Element for Art Direction

When the image composition should change at different viewports (not just scale),
use `<picture>`.

```html
<picture>
  <source media="(max-width: 640px)" srcset="hero-mobile.jpg">
  <source media="(max-width: 1024px)" srcset="hero-tablet.jpg">
  <img src="hero-desktop.jpg" alt="Hero image">
</picture>
```

Common use cases:
- Cropping to different aspect ratios (16:9 desktop, 4:3 tablet, 1:1 mobile)
- Showing different focal points (wide shot vs close-up)
- Text legibility (larger text overlay on mobile version)

## Container Queries

Container queries enable component-level responsiveness. A card component adapts to
its container width, not the viewport width. This makes components truly reusable —
the same card works in a narrow sidebar or wide main content area.

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

/* When container is at least 400px wide */
@container card (min-width: 400px) {
  .card {
    grid-template-columns: 200px 1fr;
    gap: var(--space-md);
  }
}

/* When container is at least 600px wide */
@container card (min-width: 600px) {
  .card {
    grid-template-columns: 250px 1fr auto;
  }
}
```

Container queries replace many component-level media queries and eliminate the need
for modifier classes like `.card--sidebar` and `.card--main`.

## Testing Reality

DevTools responsive mode is a starting point, not a substitute for real devices.
Differences that matter:

| Aspect | DevTools | Real device |
|--------|----------|-------------|
| Touch interaction | Simulated | Actual finger size, pressure |
| Scroll behavior | Mouse wheel | Momentum, overscroll bounce |
| Font rendering | Desktop subpixel | Mobile rendering engine |
| Performance | Desktop CPU/GPU | Constrained mobile hardware |
| Network | Fast local | Variable cellular connection |

Test on at least:
- One recent iPhone (Safari)
- One recent Android phone (Chrome)
- One tablet (iPad or Android)

Physical devices reveal issues that emulation cannot: touch target size, readability
in sunlight, one-handed reachability, keyboard behavior.

## Viewport Units

### The vh Problem

`100vh` on mobile browsers includes the address bar, which collapses on scroll. This
causes layout shifts. Use `100dvh` (dynamic viewport height) instead.

```css
/* Old — causes layout shift on mobile */
.hero-bad {
  height: 100vh;
}

/* New — adapts to address bar visibility */
.hero-good {
  height: 100dvh;
}
```

### Viewport Unit Variants

| Unit | Behavior | Use case |
|------|----------|----------|
| `svh` | Small viewport height (address bar visible) | Minimum guaranteed height |
| `lvh` | Large viewport height (address bar hidden) | Maximum available height |
| `dvh` | Dynamic viewport height (changes on scroll) | Full-screen sections |

Same variants exist for width (`svw`, `lvw`, `dvw`) and inline/block directions.

## Responsive Typography

Combine fluid type with breakpoint-based adjustments for optimal readability.

```css
body {
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  line-height: 1.5;
}

h1 {
  font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
  line-height: 1.1;
}

/* Adjust line-height at larger viewports */
@media (min-width: 768px) {
  body {
    line-height: 1.6;
  }
}
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Desktop-first CSS | Mobile inherits too much complexity | Start mobile, layer up with min-width queries |
| Device-specific breakpoints | Breaks on new devices, arbitrary | Use content-driven breakpoints |
| Hover as primary interaction | Fails on touch devices | Provide visible affordances by default |
| 100vh for full-height sections | Layout shift on mobile scroll | Use 100dvh instead |
| Media queries for component layout | Components break in different contexts | Use container queries |
| Assuming screen size = input type | Fails on convertibles, tablets with mice | Use hover and pointer media queries |
| Testing only in DevTools | Misses real device issues | Test on physical iOS and Android devices |
| Fixed pixel breakpoints everywhere | Ignores user font-size preferences | Use rem-based breakpoints |
