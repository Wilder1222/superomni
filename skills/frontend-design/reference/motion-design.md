<!--
Adapted from pbakaus/impeccable (Apache 2.0)
Source: https://github.com/pbakaus/impeccable
-->

# Motion Design

## Duration Hierarchy

Different types of UI changes require different timing. Faster is not always better —
overly fast animations feel twitchy, overly slow ones feel sluggish.

| Category          | Duration     | Examples                              |
|-------------------|-------------|---------------------------------------|
| Micro-interaction | 100-150ms   | Button press, toggle, checkbox        |
| State change      | 200-300ms   | Tab switch, accordion, color change   |
| Layout shift      | 300-500ms   | List reorder, panel expand/collapse   |
| Entrance          | 500-800ms   | Page transition, hero animation       |

### Exit Faster Than Entrance

Exit animations should be approximately 75% of the entrance duration. Users are
moving on — the departing element should not demand attention.

```css
.panel-enter {
  animation: slideIn 400ms ease-out;
}

.panel-exit {
  animation: slideOut 300ms ease-in;  /* 75% of 400ms */
}
```

## Easing

The default `ease` keyword is a compromise that fits nothing well. Choose easing
based on the type of motion.

| Motion type    | Easing     | CSS keyword / cubic-bezier          | Rationale |
|---------------|------------|-------------------------------------|-----------|
| Element entering | ease-out   | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` | Decelerates into resting position |
| Element leaving  | ease-in    | `cubic-bezier(0.4, 0.0, 1.0, 1.0)` | Accelerates away from view |
| Toggle/switch    | ease-in-out | `cubic-bezier(0.4, 0.0, 0.2, 1.0)` | Smooth transition between states |
| Emphasis         | ease-out   | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` | Quick attention grab, gentle settle |

### Exponential Curves

For motion that feels physical, use exponential curves (quart, quint, expo). These
mimic real-world deceleration where friction is non-linear.

```css
:root {
  /* Standard curves */
  --ease-out:      cubic-bezier(0.0, 0.0, 0.2, 1.0);
  --ease-in:       cubic-bezier(0.4, 0.0, 1.0, 1.0);
  --ease-in-out:   cubic-bezier(0.4, 0.0, 0.2, 1.0);

  /* Exponential curves — more dramatic deceleration */
  --ease-out-expo:  cubic-bezier(0.16, 1.0, 0.3, 1.0);
  --ease-in-expo:   cubic-bezier(0.7, 0.0, 0.84, 0.0);
  --ease-out-quint: cubic-bezier(0.22, 1.0, 0.36, 1.0);

  /* Spring-like (slight overshoot) — use sparingly */
  --ease-out-back:  cubic-bezier(0.34, 1.56, 0.64, 1.0);
}
```

### Custom Curves for Common Patterns

```css
/* Dropdown/popover opening */
.dropdown-enter {
  animation: dropdownIn 250ms cubic-bezier(0.0, 0.0, 0.2, 1.0);
}

/* Modal entrance */
.modal-enter {
  animation: modalIn 350ms cubic-bezier(0.16, 1.0, 0.3, 1.0);
}

/* Tooltip appear */
.tooltip-enter {
  animation: fadeScaleIn 150ms cubic-bezier(0.0, 0.0, 0.2, 1.0);
}
```

## Staggering

When multiple child elements enter the view, stagger their appearance with 30-50ms
delays. This creates a natural cascade rather than everything appearing simultaneously.

```css
.list-item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeSlideIn 300ms var(--ease-out) forwards;
}

.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 40ms; }
.list-item:nth-child(3) { animation-delay: 80ms; }
.list-item:nth-child(4) { animation-delay: 120ms; }
.list-item:nth-child(5) { animation-delay: 160ms; }

/* Cap the total stagger — beyond ~200ms total delay feels sluggish */
.list-item:nth-child(n+6) { animation-delay: 200ms; }
```

For dynamic lists, calculate delays in JavaScript:

```js
items.forEach((item, i) => {
  const delay = Math.min(i * 40, 200);
  item.style.animationDelay = `${delay}ms`;
});
```

## Reduced Motion

This is not optional. Approximately 35% of adults over 40 have some form of
vestibular disorder. Motion that is decorative for most users can cause nausea,
dizziness, or disorientation for others.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

A more nuanced approach: replace motion with crossfade.

```css
@media (prefers-reduced-motion: reduce) {
  .panel-enter {
    animation: fadeIn 200ms ease-out;  /* crossfade instead of slide */
  }

  .page-transition {
    animation: none;
    opacity: 1;  /* instant, no motion */
  }
}
```

**Key principle:** Reduced motion does not mean no feedback. State changes should
still be communicated — through opacity changes, color shifts, or instant
repositioning rather than spatial movement.

## Performance

### The Compositor-Only Rule

Animate only properties that can be handled by the GPU compositor without
triggering layout or paint:

| Safe to animate     | Triggers layout (avoid)         |
|--------------------|---------------------------------|
| `transform`        | `width`, `height`               |
| `opacity`          | `top`, `left`, `right`, `bottom`|
| `filter`           | `margin`, `padding`             |
| `clip-path`        | `border-width`, `font-size`     |

```css
/* Bad — triggers layout on every frame */
.slide-bad {
  transition: left 300ms ease-out;
  left: 0;
}
.slide-bad.open { left: 250px; }

/* Good — compositor only */
.slide-good {
  transition: transform 300ms var(--ease-out);
  transform: translateX(0);
}
.slide-good.open { transform: translateX(250px); }
```

### will-change

Use `will-change` to hint at upcoming animations, but apply it just before the
animation starts and remove it after.

```css
/* Apply via class before animation starts */
.will-animate {
  will-change: transform, opacity;
}

/* Do NOT leave will-change on permanently — it consumes GPU memory */
```

## Perceived Performance

The 80ms threshold: users perceive interactions under 80ms as instantaneous. If your
micro-interaction exceeds this, the interface feels laggy regardless of actual
performance.

### Preemptive Starts

Begin animations on `pointerdown` (or `touchstart`) rather than `click`. The click
event fires on release, adding 100-200ms of perceived delay.

```js
button.addEventListener('pointerdown', () => {
  button.classList.add('pressed');
});

button.addEventListener('pointerup', () => {
  button.classList.remove('pressed');
  // actual action happens here
});
```

### Optimistic UI

For low-stakes actions (starring, liking, toggling), update the UI immediately
before the server confirms. Reconcile if the server disagrees.

```js
async function toggleFavorite(item) {
  // Immediately update UI
  item.isFavorite = !item.isFavorite;
  renderItem(item);

  try {
    await api.toggleFavorite(item.id);
  } catch {
    // Revert on failure
    item.isFavorite = !item.isFavorite;
    renderItem(item);
    showToast('Could not update. Please try again.');
  }
}
```

## CSS vs JavaScript Animation

**Prefer CSS** for:
- Simple state transitions (hover, focus, active)
- Single-property animations
- Animations that map to a CSS class toggle

**Use Web Animations API** for:
- Coordinated multi-element sequences
- Dynamic values calculated at runtime
- Animations that need pause/resume/reverse control
- Scroll-driven animations (via `ScrollTimeline`)

```js
// Web Animations API — coordinated entrance
const items = document.querySelectorAll('.item');
items.forEach((item, i) => {
  item.animate(
    [
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    {
      duration: 300,
      delay: i * 40,
      easing: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
      fill: 'forwards'
    }
  );
});
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Bounce/elastic easing | Dated aesthetic, distracting | Use exponential ease-out curves |
| Animations longer than 1s | Feels slow, blocks interaction | Cap at 800ms for UI, 500ms for state changes |
| Animating layout properties | Jank, dropped frames | Use transform and opacity only |
| No reduced-motion support | Accessibility violation, causes harm | Always implement prefers-reduced-motion |
| Linear easing for UI | Robotic, unnatural feel | Use ease-out for entrances, ease-in for exits |
| All children enter at once | Abrupt, overwhelming | Stagger with 30-50ms delays |
| Permanent will-change | GPU memory waste | Apply only during animation |
| Animation on page load | Delays content access | Reserve for hero elements only |
