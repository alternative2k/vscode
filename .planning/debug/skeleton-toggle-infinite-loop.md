---
status: resolved
trigger: "the skeleton toggle button doesnt work"
created: 2026-01-19T13:00:00Z
updated: 2026-01-19T13:00:00Z
---

## Current Focus

hypothesis: confirmed - infinite re-render loop in useExerciseAlerts
test: fix applied, build verified
expecting: skeleton toggle works, no console errors
next_action: commit fix

## Symptoms

expected: Skeleton overlay shows/hides when toggle button clicked
actual: Button changes appearance but skeleton doesn't toggle; console shows "Maximum update depth exceeded"
errors: "Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect"
reproduction: Click skeleton toggle button, observe console spam
started: After skeleton toggle feature was added

## Eliminated

[none]

## Evidence

1. Console error clearly shows "Maximum update depth exceeded" in CameraPreview.tsx
2. The getAlert callback in useExerciseAlerts was calling setIsExercising() directly inside useCallback
3. This caused setState during render, triggering re-render, which called getAlert again = infinite loop

## Resolution

root_cause: The `getAlert` callback in `useExerciseAlerts.ts` was calling `setIsExercising()` directly inside the callback body (lines 112, 125, 137). This caused a state update during the render phase, which triggered a re-render, which called `getAlert` again, causing an infinite loop.

fix:
1. Renamed `getAlert` to `getAlertAndExerciseState`
2. Changed it to return both alert and exercising state as an object instead of calling setState
3. Moved the `setIsExercising()` call into the useEffect that processes the results

verification: Build passes with no TypeScript errors. HMR reloaded successfully.

files_changed:
- src/hooks/useExerciseAlerts.ts: Refactored getAlert to not call setState during callback execution
