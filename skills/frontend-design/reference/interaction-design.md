<!--
Adapted from pbakaus/impeccable (Apache 2.0)
Source: https://github.com/pbakaus/impeccable
-->

# Interaction Design

## The 8 Interactive States

Every interactive element has eight possible states. All must be designed explicitly.
Leaving any state to browser defaults creates inconsistency.

| State    | Trigger                | Visual treatment                     |
|----------|------------------------|--------------------------------------|
| Default  | No interaction         | Base appearance                      |
| Hover    | Pointer over element   | Subtle shift: background, shadow, or color |
| Focus    | Keyboard navigation    | Visible ring or outline              |
| Active   | Being pressed/clicked  | Compressed/depressed visual          |
| Disabled | Not available          | Reduced opacity (0.4-0.5), no pointer events |
| Loading  | Awaiting response      | Spinner or skeleton, disabled input  |
| Error    | Validation failure     | Red border, error message            |
| Success  | Action completed       | Green indicator, checkmark           |

```css
.button {
  /* Default */
  background: var(--primary-500);
  color: white;
  transition: background 150ms var(--ease-out);
}

.button:hover {
  background: var(--primary-600);
}

.button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.button:active {
  background: var(--primary-700);
  transform: scale(0.98);
}

.button:disabled {
  opacity: 0.4;
  pointer-events: none;
  cursor: not-allowed;
}

.button[data-loading] {
  pointer-events: none;
  position: relative;
  color: transparent;  /* hide text, show spinner via ::after */
}

.button[data-state="error"] {
  background: var(--error);
}

.button[data-state="success"] {
  background: var(--success);
}
```

## Focus Indicators

Focus indicators are essential for keyboard users. The default browser outline is
often removed for aesthetic reasons, creating an accessibility barrier.

### Implementation

Use `:focus-visible` (not `:focus`) to show focus rings only for keyboard
navigation, not mouse clicks.

```css
/* Reset default, replace with custom */
:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: 2px;
}

/* High contrast variant for dark backgrounds */
.dark-section :focus-visible {
  outline-color: white;
  outline-offset: 3px;
}
```

### Requirements

- **Contrast**: Focus indicator must have at least 3:1 contrast against adjacent colors
- **Thickness**: 2-3px minimum — 1px outlines are hard to see
- **Offset**: 2-3px offset prevents the ring from being obscured by the element border
- **Never remove without replacement**: `outline: none` without a visible alternative
  is an accessibility violation

## Form Best Practices

### Visible Labels

Placeholder text is not a label. It disappears on input, leaving users without
context. Always use a visible `<label>` element.

```html
<div class="field">
  <label for="email">Email address</label>
  <input type="email" id="email" placeholder="you@example.com"
         aria-describedby="email-hint">
  <span id="email-hint" class="hint">We'll never share your email.</span>
</div>
```

### Validation Timing

Validate on blur (when the user leaves the field), not on every keystroke. Real-time
validation while typing is distracting and often shows errors prematurely.

```js
input.addEventListener('blur', () => {
  validateField(input);
});

// Re-validate on submit
form.addEventListener('submit', (e) => {
  const invalid = validateAll();
  if (invalid.length > 0) {
    e.preventDefault();
    invalid[0].focus();
  }
});
```

### Error Presentation

Connect errors to their fields via `aria-describedby`. Screen readers will announce
the error when the field receives focus.

```html
<input type="email" id="email" aria-describedby="email-error" aria-invalid="true">
<span id="email-error" class="error" role="alert">
  Please enter a valid email address including the @ symbol.
</span>
```

## Modern Browser APIs

### Native Dialog Element

The `<dialog>` element provides built-in focus trapping, backdrop, and `Escape` key
handling. Do not build custom modal focus traps when this exists.

```html
<dialog id="confirm-dialog">
  <h2>Delete this item?</h2>
  <p>This action cannot be undone.</p>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm" class="danger">Delete item</button>
  </form>
</dialog>
```

```js
const dialog = document.getElementById('confirm-dialog');
dialog.showModal();  // modal with backdrop and focus trap

dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'confirm') {
    deleteItem();
  }
});
```

### Popover API

For non-modal overlays (tooltips, menus, popovers), use the Popover API. It handles
light-dismiss (click outside to close) and top-layer rendering.

```html
<button popovertarget="menu">Options</button>
<div id="menu" popover>
  <button>Edit</button>
  <button>Duplicate</button>
  <button>Delete</button>
</div>
```

### CSS Anchor Positioning

Position dropdowns and tooltips relative to their trigger element without JavaScript
positioning libraries.

```css
.trigger {
  anchor-name: --trigger;
}

.dropdown {
  position: fixed;
  position-anchor: --trigger;
  top: anchor(bottom);
  left: anchor(left);
  position-try-fallbacks: flip-block;  /* flip above if no space below */
}
```

## Keyboard Navigation

### Roving Tabindex

Within a component group (toolbar, menu, tab list), only one item should be in the
tab order. Arrow keys move focus within the group.

```js
const items = toolbar.querySelectorAll('[role="button"]');
let currentIndex = 0;

toolbar.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    items[currentIndex].setAttribute('tabindex', '-1');
    currentIndex = (currentIndex + 1) % items.length;
    items[currentIndex].setAttribute('tabindex', '0');
    items[currentIndex].focus();
  }
  if (e.key === 'ArrowLeft') {
    items[currentIndex].setAttribute('tabindex', '-1');
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    items[currentIndex].setAttribute('tabindex', '0');
    items[currentIndex].focus();
  }
});
```

### Skip Links

Provide a skip link as the first focusable element for keyboard users to bypass
navigation.

```html
<a href="#main-content" class="skip-link">Skip to main content</a>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: var(--z-tooltip);
  padding: var(--space-sm) var(--space-md);
}
.skip-link:focus {
  top: var(--space-sm);
}
</style>
```

## Touch Targets

Minimum interactive area is 44x44px. This applies to the tappable region, not
necessarily the visual size. Adjacent targets need adequate spacing to prevent
mis-taps.

```css
/* Visual size 32px, touch target 44px */
.icon-button {
  width: 32px;
  height: 32px;
  padding: 6px;
  min-width: 44px;
  min-height: 44px;
  display: grid;
  place-items: center;
}

/* Ensure spacing between adjacent targets */
.button-group {
  gap: var(--space-2);  /* 8px minimum between touchable elements */
}
```

## Undo Over Confirm

Confirmation dialogs interrupt flow and train users to click "OK" without reading.
For reversible actions, allow the action to proceed and offer an undo toast.

```js
function deleteItem(item) {
  // Remove from UI immediately
  hideItem(item);

  // Show undo toast with timeout
  const toast = showToast({
    message: `Deleted "${item.name}"`,
    action: 'Undo',
    duration: 8000,
    onAction: () => restoreItem(item),
    onDismiss: () => api.delete(item.id)  // actually delete after toast expires
  });
}
```

Reserve confirmation dialogs for truly irreversible, high-stakes actions (deleting
an account, publishing to production).

## Skeleton Screens Over Spinners

Spinners communicate "something is happening" but provide no information about what
will appear. Skeleton screens maintain the layout shape and reduce perceived wait time.

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Removing focus outline without replacement | Keyboard users cannot navigate | Use :focus-visible with visible ring |
| z-index: 9999 | Stacking context chaos | Use semantic z-index tokens |
| Confirm dialogs for reversible actions | Interrupts flow, users click through | Use undo with rollback toast |
| Placeholder-only form labels | Disappear on input, inaccessible | Always use visible label elements |
| Custom modal focus traps | Error-prone, fragile | Use native dialog element |
| Hover as the only interaction cue | Fails on touch devices | Provide visible affordances by default |
| position:absolute inside overflow:hidden | Dropdowns get clipped | Use Popover API or Floating UI |
| Spinners for content loading | No layout context, jarring appearance | Use skeleton screens matching content shape |
