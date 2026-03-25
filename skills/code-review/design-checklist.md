# Design Review Checklist

Use this checklist when reviewing architectural or design-level decisions —
before or alongside a code review. Pair with `skills/code-review/SKILL.md`.

---

## API Design

- [ ] API surface is minimal — no unnecessary endpoints, methods, or options
- [ ] Naming is consistent with existing APIs in the project
- [ ] Contracts are explicit (input types, output shapes, error codes)

## Data Model

- [ ] Schema supports current requirements without over-engineering
- [ ] Relationships and constraints are clearly defined
- [ ] Migrations are backward-compatible or have a rollback plan

## Error Strategy

- [ ] Errors are categorized (transient vs. permanent, user vs. system)
- [ ] Error propagation follows a single, consistent pattern across layers

## Scalability

- [ ] Design handles 10× current load without a rewrite
- [ ] Bottlenecks are identified and have a mitigation path
- [ ] Stateless components are preferred where possible

## Dependency Management

- [ ] New external dependencies are justified and actively maintained
- [ ] Internal module boundaries are respected — no circular imports
