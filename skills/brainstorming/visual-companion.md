# Visual Companion — Diagram Formats for Brainstorming

Use these templates when visual representation helps clarify a design.

## ASCII Wireframe (UI)

```
┌─────────────────────────────────┐
│  Header / Nav                   │
├─────────────────────────────────┤
│  ┌──────────┐  ┌─────────────┐  │
│  │ Sidebar  │  │   Content   │  │
│  │          │  │             │  │
│  │  - Item  │  │  [Card]     │  │
│  │  - Item  │  │  [Card]     │  │
│  └──────────┘  └─────────────┘  │
├─────────────────────────────────┤
│  Footer                         │
└─────────────────────────────────┘
```

## Data Flow Diagram

```
[User Input] → [Validation] → [Business Logic] → [Persistence]
                   ↓                  ↓
              [Error Path]      [Side Effects]
                   ↓                  ↓
              [Error UI]        [Notifications]
```

## Component Hierarchy (React/UI)

```
<App>
  <Layout>
    <Header>
      <NavBar />
      <UserMenu />
    </Header>
    <Main>
      <FeaturePage>
        <FeatureList />
        <FeatureDetail />
      </FeaturePage>
    </Main>
  </Layout>
</App>
```

## Entity Relationship

```
User ──(has many)──> Sessions
  │
  └──(has many)──> Projects
                      │
                      └──(has many)──> Skills
```

## State Machine

```
[idle] ──(start)──> [loading]
                        │
              ┌─────────┴─────────┐
          (success)           (failure)
              │                   │
          [ready]             [error]
              │                   │
          (reset)             (retry)
              └───────────────────┘
                       │
                    [idle]
```

## Sequence Diagram

```
Client          API             DB
  │                │              │
  ├──POST /items──>│              │
  │                ├──INSERT──────>│
  │                │<─────────────┤
  │<──201 Created──┤              │
  │                │              │
```

## Guidelines

- Use ASCII diagrams in chat/code contexts
- Keep diagrams simple — if it needs a legend, it's too complex
- Focus on showing relationships, not every detail
- Prefer one clear diagram over multiple confusing ones
