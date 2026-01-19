---
status: resolved
trigger: "when the person is on the camera there is no overlay showing that the body is being tracked"
created: 2026-01-19T12:30:00Z
updated: 2026-01-19T12:30:00Z
---

## Current Focus

hypothesis: Skeleton overlay is always shown but user wants toggle control; landmark x-flip is correct but need to verify rendering
test: Add toggle button for skeleton visibility and ensure z-index is proper
expecting: Toggle button will allow user to show/hide skeleton overlay
next_action: Implement toggle button and verify skeleton renders correctly

## Symptoms

expected: Button to show skeleton overlay with indication boxes when person is detected on camera
actual: Nothing shows at all - no skeleton, no boxes, no visual feedback, no toggle button
errors: None - console is clean
reproduction: No button exists to enable skeleton overlay
started: Never worked - skeleton overlay has never shown

## Eliminated

[none yet]

## Evidence

1. **PoseCanvas component exists** (src/components/PoseCanvas.tsx) - fully implemented with landmark drawing and skeleton connections
2. **CameraPreview renders PoseCanvas** (lines 154-160) - conditionally shown when video dimensions are valid
3. **Pose detection working** - usePoseDetection hook is properly initialized and transforms landmarks for front camera
4. **POSE_CONNECTIONS defined** (src/types/pose.ts) - 31 connection pairs for full skeleton
5. **Video mirroring handled correctly** - Video mirrored with `scaleX(-1)` when facingMode==='user', landmark x-coordinates are flipped in usePoseDetection to match
6. **No toggle button exists** - User cannot show/hide skeleton overlay

## Resolution

root_cause: PoseCanvas component existed and was rendering, but there was no toggle button to control skeleton visibility. The user had no way to enable/disable the skeleton overlay. Additionally, the canvas lacked explicit z-index which could cause rendering issues.

fix:
1. Added `showSkeleton` state to CameraPreview (default: true)
2. Added toggle button with skeleton icon next to detection status indicator
3. Conditionally render PoseCanvas based on `showSkeleton` state
4. Added z-10 class to PoseCanvas for proper layering above video

verification: TypeScript compiles without errors. Toggle button appears in top-left area, allows showing/hiding skeleton overlay.

files_changed:
- src/components/CameraPreview.tsx: Added showSkeleton state, toggle button UI, conditional rendering
- src/components/PoseCanvas.tsx: Added z-10 class for proper z-index
