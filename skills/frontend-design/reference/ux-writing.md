<!--
Adapted from pbakaus/impeccable (Apache 2.0)
Source: https://github.com/pbakaus/impeccable
-->

# UX Writing

## Button Labels

Use specific verb-object combinations. Generic labels force users to interpret
context. Specific labels communicate exactly what will happen.

| Generic (avoid) | Specific (prefer) | Context |
|----------------|-------------------|---------|
| OK             | Save changes      | Settings form |
| Submit         | Create account    | Signup form |
| Yes            | Delete 5 items    | Confirmation dialog |
| Cancel         | Keep editing      | Discard changes prompt |
| Continue       | Go to checkout    | Shopping cart |
| Done           | Close preview     | Modal window |

```html
<!-- Vague -->
<button>Submit</button>

<!-- Clear -->
<button>Send message</button>
```

When the action affects multiple items, include the count:

```html
<button>Delete 3 selected files</button>
<button>Archive 12 conversations</button>
```

## Error Messages

Structure errors in three parts: what happened, why it happened, how to fix it.

| Bad | Good |
|-----|------|
| Invalid input | Email address isn't valid. Please include an @ symbol. |
| Error | Password must be at least 8 characters long. |
| Failed | Connection timed out. Check your internet connection and try again. |
| Cannot proceed | Please fill in all required fields before continuing. |

```html
<!-- Unhelpful -->
<span class="error">Error</span>

<!-- Helpful -->
<span class="error" role="alert">
  Email address isn't valid. Please include an @ symbol and a domain (like example.com).
</span>
```

### Avoid Blame

Frame errors as system limitations, not user failures.

| Blaming | Neutral |
|---------|---------|
| You entered an invalid date | This date is outside the allowed range (2020-2025) |
| You must accept the terms | Please accept the terms to continue |
| Your password is wrong | Password doesn't match. Try again or reset your password. |

## Empty States

Empty states are onboarding opportunities. Acknowledge the emptiness, explain the
value of filling it, and provide a clear next step.

```html
<div class="empty-state">
  <svg><!-- illustration --></svg>
  <h3>No projects yet</h3>
  <p>Projects help you organize your work and collaborate with your team.</p>
  <button>Create your first project</button>
</div>
```

Three-part structure:
1. **Acknowledge**: "No projects yet" (not "Nothing here")
2. **Explain value**: Why should the user care?
3. **Next step**: Clear action to resolve the empty state

## Voice vs Tone

**Voice** is your brand personality — consistent across all contexts. **Tone** adapts
to the user's emotional state and the situation.

| Situation | User emotion | Tone adjustment |
|-----------|--------------|-----------------|
| Successful action | Satisfied | Celebratory, brief |
| Error state | Frustrated | Empathetic, solution-focused |
| Onboarding | Uncertain | Encouraging, clear |
| Destructive action | Cautious | Serious, explicit |
| Loading state | Impatient | Reassuring, informative |

```html
<!-- Success: celebratory -->
<div class="toast success">
  Changes saved! Your profile is now live.
</div>

<!-- Error: empathetic, solution-focused -->
<div class="toast error">
  Couldn't save changes. Check your connection and try again.
</div>

<!-- Destructive action: serious, explicit -->
<dialog>
  <h2>Delete your account?</h2>
  <p>This will permanently delete all your data. This action cannot be undone.</p>
  <button value="cancel">Cancel</button>
  <button value="confirm" class="danger">Delete account</button>
</dialog>
```

**Never use humor when the user is frustrated.** A playful 404 page is fine. A
playful error message after data loss is insulting.

## Confirmation Dialogs

Minimize confirmation dialogs — they interrupt flow and train users to click through
without reading. When required, use specific action labels instead of Yes/No.

```html
<!-- Generic (forces user to re-read the question) -->
<dialog>
  <p>Delete this file?</p>
  <button>Yes</button>
  <button>No</button>
</dialog>

<!-- Specific (action is clear from button alone) -->
<dialog>
  <h2>Delete "Report_Q4.pdf"?</h2>
  <p>This file will be moved to trash. You can restore it within 30 days.</p>
  <button value="cancel">Cancel</button>
  <button value="confirm" class="danger">Delete file</button>
</dialog>
```

For truly destructive actions (delete account, publish to production), require typing
a confirmation phrase:

```html
<dialog>
  <h2>Delete your account?</h2>
  <p>This will permanently delete all your data. This action cannot be undone.</p>
  <label for="confirm">Type <strong>DELETE</strong> to confirm:</label>
  <input type="text" id="confirm" required pattern="DELETE">
  <button type="submit">Delete account</button>
</dialog>
```

## Loading States

Communicate what is happening, not just that something is happening. A spinner alone
provides no information.

| Generic | Specific |
|---------|----------|
| Loading... | Saving your changes... |
| Please wait | Uploading 3 files... |
| Processing | Generating your report... |

```html
<!-- Vague -->
<div class="spinner" aria-label="Loading"></div>

<!-- Clear -->
<div class="loading">
  <div class="spinner"></div>
  <p>Uploading 3 files... <span class="progress">2 of 3 complete</span></p>
</div>
```

For long operations, show progress:

```html
<div class="progress-bar" role="progressbar" aria-valuenow="67" aria-valuemin="0" aria-valuemax="100">
  <div class="progress-fill" style="width: 67%"></div>
</div>
<p>Processing images... 67% complete</p>
```

## Accessibility in Writing

### Meaningful Link Text

Screen readers often navigate by links. "Click here" provides no context when read
out of order.

| Bad | Good |
|-----|------|
| Click here to learn more | Learn more about pricing plans |
| Read more | Read the full privacy policy |
| Download | Download the 2024 annual report (PDF, 2.3 MB) |

```html
<!-- Context-free -->
<a href="/docs">Click here</a> for documentation.

<!-- Self-contained -->
<a href="/docs">Read the documentation</a> to get started.
```

### Descriptive Alt Text

Alt text should convey the information or function of the image, not describe its
appearance.

```html
<!-- Describes appearance -->
<img src="chart.png" alt="A bar chart with blue bars">

<!-- Conveys information -->
<img src="chart.png" alt="Revenue increased 23% from Q3 to Q4">

<!-- Decorative images -->
<img src="decorative-line.svg" alt="" role="presentation">
```

### Icon Button Labels

Icon-only buttons need accessible labels via `aria-label` or visually-hidden text.

```html
<!-- Inaccessible -->
<button><svg><!-- close icon --></svg></button>

<!-- Accessible -->
<button aria-label="Close dialog">
  <svg aria-hidden="true"><!-- close icon --></svg>
</button>

<!-- Or with visually-hidden text -->
<button>
  <svg aria-hidden="true"><!-- close icon --></svg>
  <span class="sr-only">Close dialog</span>
</button>
```

## Translation Readiness

If your product will be translated, write with internationalization in mind.

### Allow for Expansion

Text length varies significantly across languages. German is typically 30% longer
than English. Design layouts that accommodate expansion.

```css
/* Flexible button width */
.button {
  padding-inline: var(--space-md);
  min-width: 120px;  /* prevents squishing on short labels */
  width: fit-content;
}
```

### Keep Numbers Separate

Avoid embedding numbers in sentences. Different languages have different pluralization
rules.

```js
// Bad — hard to translate
const message = `You have ${count} new messages`;

// Good — use i18n library with pluralization
const message = t('messages.new', { count });
```

### Full Sentences as Translation Strings

Do not concatenate fragments. Sentence structure varies across languages.

```js
// Bad — assumes English word order
const message = t('you_have') + ' ' + count + ' ' + t('messages');

// Good — full sentence with placeholder
const message = t('messages.count', { count });
```

## Consistency

Pick one term and use it everywhere. Switching between synonyms creates confusion.

| Inconsistent | Consistent |
|--------------|------------|
| Delete / Remove / Erase | Delete (everywhere) |
| Settings / Preferences / Options | Settings (everywhere) |
| Sign in / Log in / Login | Sign in (everywhere) |

Create a terminology glossary for your product:

```
Archive (verb) — move to archive, not delete
Workspace — not "team", "organization", or "account"
Project — not "folder" or "collection"
Member — not "user" when referring to team members
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Placeholder-only labels | Disappear on input, inaccessible | Use visible label elements |
| "Click here" links | No context for screen readers | Use descriptive link text |
| "Error" without explanation | User doesn't know what to fix | Explain what happened and how to fix |
| Lorem ipsum in production | Placeholder text shipped to users | Write real copy before launch |
| Humorous error messages | Frustrating when user is already frustrated | Be empathetic and solution-focused |
| Yes/No confirmation buttons | Forces user to re-read question | Use specific action labels |
| Generic "Loading..." | No information about what's happening | Describe the action being performed |
| Inconsistent terminology | Confuses users, harder to learn | Pick one term per concept, use everywhere |
