# Code Review Checklist

A comprehensive checklist for thorough code reviews. Use alongside the
`code-review` skill (`skills/code-review/SKILL.md`).

---

## Correctness

- [ ] Code implements the stated requirements / acceptance criteria
- [ ] All logical branches produce the correct result
- [ ] Boundary conditions are handled (empty input, zero, max values)
- [ ] Off-by-one errors are absent in loops and indexing
- [ ] Null / undefined values are checked before use
- [ ] Type coercions are intentional and correct
- [ ] Concurrency or race conditions are addressed (if applicable)
- [ ] Return values are used or explicitly discarded
- [ ] State mutations happen in the intended order
- [ ] Feature flags or environment-dependent paths work in all modes

## Security

- [ ] No hardcoded secrets, tokens, or credentials in source
- [ ] User input is validated and sanitized before use
- [ ] SQL queries use parameterized statements (no string concatenation)
- [ ] Shell commands do not interpolate unsanitized input
- [ ] Authentication is enforced on all protected endpoints
- [ ] Authorization checks verify the *current* user's permissions
- [ ] Sensitive data is excluded from logs and error messages
- [ ] Dependencies are pinned and free of known vulnerabilities
- [ ] CORS, CSP, and other HTTP security headers are configured correctly
- [ ] Cryptographic functions use current, recommended algorithms

## Testing

- [ ] New code has corresponding tests
- [ ] Tests verify *behavior*, not implementation details
- [ ] Edge cases and error paths have dedicated tests
- [ ] Tests are deterministic — no flaky reliance on timing or order
- [ ] Mocks and stubs are minimal and clearly scoped
- [ ] Test names describe the scenario and expected outcome
- [ ] Existing tests still pass after the change
- [ ] Integration or end-to-end tests cover critical user flows

## Performance

- [ ] No unnecessary allocations inside hot loops
- [ ] Database queries are indexed and avoid N+1 patterns
- [ ] Large collections are paginated or streamed, not loaded entirely
- [ ] Caching is used where data is expensive to compute and stable
- [ ] Asynchronous work is non-blocking where expected
- [ ] No unbounded growth of in-memory data structures

## Error Handling

- [ ] Errors are caught at the appropriate layer (not too early, not too late)
- [ ] Error messages are actionable and include relevant context
- [ ] Retries have backoff and a maximum attempt limit
- [ ] Partial failures leave the system in a consistent state
- [ ] External service failures are handled gracefully (timeouts, fallbacks)
- [ ] Panics / uncaught exceptions do not leak internal details to users

## Code Quality

- [ ] Names are descriptive, accurate, and consistent with the codebase
- [ ] Functions do one thing and are short enough to read in one screen
- [ ] No dead code, commented-out blocks, or leftover debug statements
- [ ] Duplication is extracted into shared utilities where it aids clarity
- [ ] Complex logic has explanatory comments for *why*, not *what*
- [ ] Public APIs have clear contracts (types, docs, or both)
- [ ] Code follows the project's existing style and conventions
- [ ] Magic numbers and strings are replaced with named constants

## Documentation

- [ ] Public functions and modules have doc comments or docstrings
- [ ] README or project docs are updated if behavior changes
- [ ] Breaking changes are noted in the changelog or migration guide
- [ ] API documentation (OpenAPI, GraphQL schema, etc.) reflects the change
