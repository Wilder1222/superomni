# /office-hours

Run YC-style product discovery before building anything.

## Usage

```
/office-hours              — start product discovery session
/office-hours startup      — startup mode (6 forcing questions)
/office-hours builder      — builder mode (side project / open source)
```

## What Happens

Loads `skills/office-hours/SKILL.md` and guides you through product discovery. Saves a `design-doc.md` that downstream planning skills can use.

## Startup vs Builder Mode

**Startup mode** — for products with real users and growth expectations:
- Demand reality check
- Status quo analysis
- Desperate specificity (find the beachhead user)
- Narrowest viable wedge
- Observation (have you talked to users?)
- Future-fit analysis

**Builder mode** — for side projects, hackathons, open source:
- Pain identification
- Existing solution gaps
- Unique angle
- 30-day success definition
- Minimum weekend scope

## Output

Saves `design-doc.md` in the project root. This feeds into:
- `/write-plan` — turns the design doc into an implementation plan
- `/review` with auto mode — runs the full CEO+Design+Eng review on the plan
