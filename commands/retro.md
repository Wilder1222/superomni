# /retro

Trigger the **retro** skill.

Use this command when you want to:
- Review what was shipped in the last week (or custom period)
- Understand your work patterns and productive hours
- Track engineering metrics over time
- Compare progress to prior periods

## How to Use

```
/retro           — last 7 days
/retro 24h       — last 24 hours
/retro 14d       — last 14 days
/retro 30d       — last 30 days
/retro compare   — compare this period vs prior period
```

## What Happens

1. The retro skill activates
2. Commit history is fetched and analyzed
3. Metrics are calculated (commits, LOC, active days)
4. Work sessions are detected (45-min gap threshold)
5. Time distribution is shown as an hourly histogram
6. Commit types are classified (feat/fix/refactor/test)
7. Hotspot files are identified
8. Streak tracking is updated
9. Report is saved to `.context/retros/YYYY-MM-DD.md`

## Output

A structured retrospective report:
- Core metrics (commits, LOC, days, sessions)
- Ship of the week
- Peak productive hours
- Most-changed files
- Streak status
- [if compare] Delta vs prior period

## Skill Reference

See `skills/retro/SKILL.md` for the full protocol.
