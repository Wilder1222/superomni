# Requesting and Responding to Code Reviews

## Preparing a Review Request

Before requesting a code review, complete this checklist:

### Pre-Review Checklist

- [ ] **Self-reviewed** — did you review your own diff as if you're a stranger?
- [ ] **Tests pass** — all tests green locally
- [ ] **No debug code** — no `console.log`, `debugger`, `print()` left in
- [ ] **Intent documented** — PR description explains WHAT and WHY (not HOW)
- [ ] **Scope is right** — PR is focused; not mixing features with refactors
- [ ] **Blast radius assessed** — do you know what this could break?

### Writing the PR Description

```markdown
## What

[1-2 sentences: what does this PR do?]

## Why

[1-2 sentences: what problem does this solve? Link to spec/ticket]

## How

[Optional: only include if the approach is non-obvious]

## Testing

[How did you verify this works? What tests were added/modified?]

## Blast Radius

[What could this break? What adjacent systems were checked?]

## Checklist

- [ ] Tests added/updated
- [ ] No debug code
- [ ] Self-reviewed
- [ ] Documentation updated (if applicable)
```

## Security Review Checklist

For any change touching authentication, authorization, data storage, or external input:

- [ ] **Authentication** — is access properly gated?
- [ ] **Authorization** — can users only access their own data?
- [ ] **Input validation** — all external input validated?
- [ ] **Output encoding** — XSS prevention in place?
- [ ] **SQL injection** — parameterized queries used?
- [ ] **Command injection** — no shell interpolation of user data?
- [ ] **Secrets** — no credentials in code or logs?
- [ ] **Sensitive data** — PII handled appropriately?
- [ ] **Cryptography** — using standard library, not custom?

## Responding to Review Feedback

### When you agree

```
✓ Good catch. Fixed in [commit].
```

### When you disagree (make your case)

```
I see the concern, but I chose this approach because [reason based on 6 principles].
Alternative [X] has the tradeoff of [Y].
Happy to change if you feel strongly.
```

### When it's a taste decision

```
This is a taste decision — both approaches work.
My preference is [A] because [brief reason].
Deferring to your judgment if you prefer [B].
```

### Closing feedback loops

- Respond to every comment (even with just "✓ done")
- Don't resolve comments unilaterally — let the reviewer resolve
- Re-request review after addressing all feedback

## Review Response Time Expectations

- **P0 (security, correctness)** — address within 1 hour
- **P1 (should fix)** — address before merge
- **P2 (suggestions)** — address or explicitly defer with reason
