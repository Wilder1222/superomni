<!--
Adapted from pbakaus/impeccable (Apache 2.0)
Source: https://github.com/pbakaus/impeccable
-->

# Color and Contrast

## OKLCH Over HSL

HSL is not perceptually uniform. Two colors at the same HSL lightness value will
appear different to the human eye — yellow at 50% lightness looks far brighter than
blue at 50% lightness. OKLCH solves this by modeling human color perception.

**OKLCH parameters:**

| Parameter  | Range     | Description                              |
|------------|-----------|------------------------------------------|
| Lightness  | 0-100%    | Perceived brightness (0 = black, 100 = white) |
| Chroma     | 0-0.4+    | Color intensity (0 = gray, higher = more vivid) |
| Hue        | 0-360     | Color angle on the color wheel           |

```css
/* HSL: these look like different lightness despite both being 50% L */
.hsl-yellow { background: hsl(60, 100%, 50%); }   /* appears very bright */
.hsl-blue   { background: hsl(240, 100%, 50%); }   /* appears much darker */

/* OKLCH: these actually look the same lightness */
.oklch-yellow { background: oklch(80% 0.2 90); }
.oklch-blue   { background: oklch(80% 0.2 260); }
```

### Reduce Chroma Toward Extremes

As lightness approaches 0% or 100%, high chroma produces garish or physically
impossible colors. Reduce chroma as you move toward white or black.

```css
:root {
  --primary-50:  oklch(97% 0.02 250);   /* near white: very low chroma */
  --primary-100: oklch(93% 0.04 250);
  --primary-300: oklch(75% 0.12 250);
  --primary-500: oklch(55% 0.20 250);   /* midpoint: peak chroma */
  --primary-700: oklch(40% 0.15 250);
  --primary-900: oklch(25% 0.08 250);   /* near black: reduced chroma */
  --primary-950: oklch(15% 0.04 250);
}
```

## Functional Palette

Structure your palette by function, not by color name.

### Primary (1 color, 3-5 shades)

The brand color used for primary actions, active states, and key UI accents.
Generate shades by adjusting lightness while tapering chroma at the extremes.

### Neutral (9-11 shades with tinted gray)

Pure gray feels sterile. Add a tiny chroma tint (0.005-0.015) pulled from your
primary hue to create warmth without visible color.

```css
:root {
  /* Neutral with a hint of blue (hue 250) */
  --gray-50:  oklch(98% 0.005 250);
  --gray-100: oklch(95% 0.007 250);
  --gray-200: oklch(90% 0.008 250);
  --gray-300: oklch(82% 0.009 250);
  --gray-400: oklch(70% 0.010 250);
  --gray-500: oklch(55% 0.010 250);
  --gray-600: oklch(45% 0.010 250);
  --gray-700: oklch(35% 0.009 250);
  --gray-800: oklch(25% 0.008 250);
  --gray-900: oklch(18% 0.007 250);
  --gray-950: oklch(12% 0.005 250);
}
```

### Semantic Colors

```css
:root {
  --success: oklch(65% 0.19 145);  /* green family */
  --error:   oklch(55% 0.22 25);   /* red family */
  --warning: oklch(75% 0.18 75);   /* amber family */
  --info:    oklch(65% 0.15 250);  /* blue family */
}
```

### Surface Roles

Define surfaces by role, not by shade number:

```css
:root {
  --surface-base:    var(--gray-50);
  --surface-raised:  white;
  --surface-overlay: var(--gray-100);
  --surface-sunken:  var(--gray-200);
}
```

## The 60-30-10 Rule

Distribute color across your interface in roughly these proportions:

- **60% neutral** — backgrounds, surfaces, body text backgrounds
- **30% secondary** — cards, sections, secondary elements
- **10% accent** — primary actions, active indicators, key highlights

This ratio creates visual stability. When everything is colorful, nothing stands out.
When accent color is scarce, it commands attention where you place it.

## Never Pure Gray or Pure Black

Natural shadows and surfaces always carry some color. Pure gray (`oklch(X% 0 0)`) and
pure black (`#000000`) look synthetic on screen.

```css
/* Avoid */
.shadow-bad { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
.text-bad   { color: #000000; }
.bg-bad     { background: #808080; }

/* Prefer */
.shadow-good { box-shadow: 0 2px 8px oklch(0% 0.01 250 / 0.12); }
.text-good   { color: oklch(15% 0.005 250); }
.bg-good     { background: oklch(55% 0.008 250); }
```

Minimal chroma (0.005-0.01) in your neutrals creates an authentic feel without
introducing visible color. The effect is subliminal but the difference is noticeable
in side-by-side comparison.

## Contrast Requirements

### WCAG AA Standards

| Element         | Minimum ratio | Applies to                        |
|-----------------|---------------|-----------------------------------|
| Body text       | 4.5:1         | All text under 18px bold / 24px   |
| Large text      | 3:1           | 18px bold or 24px+ regular        |
| UI components   | 3:1           | Borders, icons, focus indicators  |
| Non-text        | 3:1           | Charts, graphs, meaningful images |

### Dangerous Combinations

These commonly fail contrast checks:

- Light gray text on white backgrounds
- Gray text on colored backgrounds (especially blue or green)
- Red text on green backgrounds (and vice versa — affects ~8% of males)
- Placeholder text that is too light to read
- Disabled states that are completely invisible

Always test with a contrast checker. Perception varies across displays, ambient
lighting, and individual vision.

## Dark Mode

Dark mode is not "invert the colors." It requires a separate design approach.

### Core Principles

**Lighter surfaces for depth:** In light mode, shadows create depth. In dark mode,
lighter surface colors create depth (elements closer to the user are lighter).

```css
[data-theme="dark"] {
  --surface-base:    oklch(14% 0.008 250);  /* deepest */
  --surface-raised:  oklch(20% 0.008 250);  /* elevated */
  --surface-overlay: oklch(25% 0.008 250);  /* modals, dropdowns */
}
```

**Reduce font weight:** Light text on dark backgrounds appears heavier than the
same weight dark-on-light. Consider reducing font-weight by one step in dark mode,
or increasing letter-spacing slightly.

**Desaturate accents:** Full-chroma colors vibrate against dark backgrounds. Reduce
chroma by 15-25% for dark mode variants.

```css
:root {
  --primary: oklch(55% 0.22 250);
}

[data-theme="dark"] {
  --primary: oklch(70% 0.17 250);  /* lighter, less saturated */
}
```

**Pure dark gray base:** Keep your darkest background in the 12-18% lightness range
in OKLCH. Below 12% creates too much contrast with text. Above 18% starts to feel
like a medium gray rather than a dark mode.

### Semantic Tokens

The key to maintainable theming is semantic tokens that map to different values
per theme:

```css
:root {
  --text-primary:   oklch(15% 0.005 250);
  --text-secondary: oklch(40% 0.008 250);
  --border:         oklch(85% 0.008 250);
}

[data-theme="dark"] {
  --text-primary:   oklch(95% 0.005 250);
  --text-secondary: oklch(65% 0.008 250);
  --border:         oklch(28% 0.008 250);
}
```

## Alpha Is a Design Smell

Reaching for `rgba()` or `/ 0.5` opacity is often a signal that the palette is
incomplete. Transparent overlays mix unpredictably with whatever is behind them.

```css
/* Fragile — changes appearance based on background */
.overlay-bad { background: oklch(0% 0 0 / 0.5); }

/* Stable — explicit color for each context */
.overlay-light { background: oklch(95% 0.005 250); }
.overlay-dark  { background: oklch(20% 0.008 250); }
```

There are legitimate uses for alpha (scrim overlays behind modals, fade effects),
but if alpha values appear throughout your component styles, it usually means
the palette needs more explicit surface tokens.

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Pure `#000000` text | Harsh, unnatural contrast | Use near-black with minimal chroma |
| Pure `#808080` elements | Feels lifeless and synthetic | Add 0.005-0.01 chroma tint |
| HSL for palette generation | Non-uniform lightness perception | Switch to OKLCH |
| Rainbow gradients | Visually noisy, amateur aesthetic | Use single-hue gradients varying lightness |
| Opacity for everything | Unpredictable color mixing | Define explicit surface colors |
| Same palette in dark mode | Colors that worked light may vibrate or fail contrast | Create separate dark mode token values |
| No contrast testing | Accessibility failures in production | Test every text/background pair |
| Neon accents at full chroma | Eye strain, especially on dark backgrounds | Reduce chroma for UI elements |
