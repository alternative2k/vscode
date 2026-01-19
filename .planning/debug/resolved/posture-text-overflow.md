---
status: resolved
trigger: "the writing which shows correct posture depending on phone and screen size can go below the buttons and become unreadable"
created: 2026-01-19T12:00:00Z
updated: 2026-01-19T12:00:00Z
---

## Current Focus

hypothesis: Alert text overlaps with exercise mode selector on small screens
test: Fix AlertOverlay positioning to account for top-right controls
expecting: Alert stays visible and readable on all screen sizes
next_action: Implement responsive positioning fix in AlertOverlay.tsx

## Symptoms

expected: Text repositions responsively - should move to a visible location based on screen size
actual: Text goes behind/below buttons - gets hidden underneath the control buttons
errors: None - console is clean, just a visual/layout issue
reproduction: Small phone screen (portrait) - happens on narrow mobile screens
started: Always been this way - never worked correctly on small screens

## Eliminated

[none yet]

## Evidence

1. AlertOverlay.tsx line 22: Alert positioned at `top-0 left-0 right-0` spanning full width
2. CameraPreview.tsx line 180: Exercise mode selector at `top-4 right-4` with stacked elements
3. CameraPreview.tsx lines 215-233: Additional indicators (squat/pushup detected + hints) stack below mode selector
4. On small screens: Alert text (centered, full-width) competes with stacked right-side controls
5. Alert text has `p-4` padding (16px) placing it at same vertical position as exercise controls
6. The alert container spans left-0 to right-0, potentially overlapping with right-side controls

## Resolution

root_cause: AlertOverlay positioned at top-0 without z-index or responsive adjustments, causing text to overlap with exercise mode selector controls on small mobile screens. The alert used full-width positioning and unconstrained text that could wrap excessively.

fix: Updated AlertOverlay.tsx with responsive positioning:
- Added z-10 to ensure alert appears above other controls
- Changed mobile positioning to top-14 (below the exercise controls area)
- Constrained alert width with max-w-[90%] on mobile, max-w-md on larger screens
- Reduced mobile text size to text-xs for better fit
- Added leading-tight for tighter line spacing
- Added left-4/right-4 margins on mobile

verification: Build passes (npm run build), no TypeScript errors. Layout now positions alert in clear area below mode selector on mobile.

files_changed: [src/components/AlertOverlay.tsx]
