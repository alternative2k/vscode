---
phase: 11-alert-system
plan: 01
subsystem: alerts
tags: [landmarks, skeleton, form-feedback, typescript]

# Dependency graph
requires:
  - phase: 04-exercise-alerts
    provides: PostureAlert, SquatFormAlert, PushupFormAlert interfaces and check functions
provides:
  - affectedLandmarks array on all alert types
  - useExerciseAlerts hook exposes affectedLandmarks directly
affects: [11-02, skeleton-rendering, pose-canvas]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Alert interfaces include body part targeting data"

key-files:
  created: []
  modified:
    - src/utils/postureRules.ts
    - src/utils/squatRules.ts
    - src/utils/pushupRules.ts
    - src/hooks/useExerciseAlerts.ts

key-decisions:
  - "Return appropriate landmark indices per alert type based on which body parts have issues"
  - "Expose affectedLandmarks as convenience accessor in hook return value"

patterns-established:
  - "Alert interfaces include affectedLandmarks: number[] for UI highlighting"

# Metrics
duration: 5min
completed: 2026-01-21
---

# Phase 11 Plan 01: Add affectedLandmarks to Alert Types Summary

**Extended all alert interfaces with affectedLandmarks arrays so skeleton overlay can highlight problem body parts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-21T10:00:00Z
- **Completed:** 2026-01-21T10:05:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added affectedLandmarks: number[] to PushupFormAlert interface
- Updated checkSquatForm() to return landmark indices for each alert type (asymmetric, depth, knee-cave, forward-lean)
- Updated checkPushupForm() to return landmark indices for each alert type (hip-sag, hip-pike, depth, elbow-flare)
- Extended useExerciseAlerts hook with affectedLandmarks convenience accessor

## Task Commits

Each task was committed atomically:

1. **Task 1: Add affectedLandmarks to all alert interfaces** - `b88b8c7` (feat)
2. **Task 2: Update useExerciseAlerts to expose affectedLandmarks** - `27a71ec` (feat)

## Files Created/Modified

- `src/utils/postureRules.ts` - PostureAlert interface already had affectedLandmarks (no change needed)
- `src/utils/squatRules.ts` - Added affectedLandmarks to each return statement in checkSquatForm()
- `src/utils/pushupRules.ts` - Added affectedLandmarks to PushupFormAlert interface and each return statement
- `src/hooks/useExerciseAlerts.ts` - Added affectedLandmarks to return interface and value

## Decisions Made

- **Landmark selection per alert type:** Each alert returns the landmarks most relevant to the issue:
  - Squat asymmetric: all leg landmarks (hips, knees, ankles on both sides)
  - Squat depth: hips and knees
  - Squat knee-cave: knees and ankles
  - Forward lean: shoulders and hips
  - Pushup hip issues: hips and shoulders
  - Pushup depth: elbows and shoulders
  - Elbow flare: affected arm only (elbow, shoulder, wrist)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All alert types now include body part targeting information
- useExerciseAlerts exposes affectedLandmarks for easy consumption
- Ready for Plan 11-02 to implement skeleton highlighting based on these landmarks

---
*Phase: 11-alert-system*
*Completed: 2026-01-21*
