<!-- Reference: frontend-design Phase 5 quality-gate protocol + 10-dimension scoring output. -->

# Frontend Design — Quality Gate

After implementation, run the **frontend-designer agent** for a full design review.

## Gate Protocol

1. Invoke the frontend-designer agent with the implementation
2. Receive scores on all 10 dimensions
3. **If all dimensions >= 7/10:** PASS — proceed to completion
4. **If any dimension < 7/10 (attempt 1):**
   - Read the frontend-designer's feedback for the failing dimensions
   - Load the relevant reference file(s) for guidance
   - Apply specific fixes
   - Re-run the frontend-designer agent
5. **If still < 7/10 (attempt 2):**
   - Apply different approach to failing dimensions
   - Re-run the frontend-designer agent
6. **If still < 7/10 (attempt 3):**
   - STOP — escalate to user
   - Present: "Design quality gate failed on [dimensions] after 2 auto-fix attempts. Scores: [list]. Options: A) Continue with current quality, B) Provide design guidance, C) Skip quality gate"

## Quality Gate Output

```
FRONTEND DESIGN — QUALITY GATE
════════════════════════════════════════
Attempt: [1/2/3]
Direction: [chosen aesthetic]

Dimension Scores:
  Information hierarchy:  [N]/10
  Missing states:         [N]/10
  Responsive strategy:    [N]/10
  Accessibility:          [N]/10
  Error recovery:         [N]/10
  AI Slop detection:      [N]/10
  Typography:             [N]/10
  Color system:           [N]/10
  Spatial rhythm:         [N]/10
  Motion quality:         [N]/10
  ─────────────────────────────────
  Overall:               [N]/10

Gate result: PASS | RETRY | ESCALATE
════════════════════════════════════════
```
