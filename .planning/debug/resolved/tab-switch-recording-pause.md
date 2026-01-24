---
status: resolved
trigger: "tab-switch-recording-pause - Continuous recording stops and uploads interrupted when users switch tabs, apps, or minimize window"
created: 2026-01-24T00:00:00Z
updated: 2026-01-24T00:00:00Z
---

## Current Focus
hypothesis: The visibilitychange event handler at lines 353-373 in useContinuousRecording.ts stops MediaRecorder when tab becomes hidden, but this should only happen on actual page exit, not temporary tab switches
test: Read the visibilitychange handler logic and verify it stops recording on every visibilityState === 'hidden' event
expecting: Confirmed - MediaRecorder.stop() is called for all visibility changes (tab switch, minimize, app switch)
next_action: Determine if this is the intended behavior or a bug, and design fix

## Symptoms
expected: Continuous recording and uploads should continue when users switch tabs, minimize window, or switch to other apps
actual: Continuous recording stops and uploads are interrupted
errors: No visible error messages or console logs
reproduction: When switching tabs, switching apps, or minimizing window
timeline: Always existed since the beginning

## Eliminated

## Evidence
- timestamp: 2026-01-24T00:00:00Z
  checked: src/hooks/useContinuousRecording.ts
  found: Visibility change handler (lines 353-373) that stops MediaRecorder when document.visibilityState === 'hidden'
  implication: Every time user switches tabs, minimizes window, or switches apps, the recording stops completely
- timestamp: 2026-01-24T00:00:00Z
  checked: Line 355-360 of visibility handler
  found: `if (document.visibilityState === 'hidden') { mediaRecorderRef.current?.stop(); }`
  implication: Recording stops for ANY visibility change (tab switch, minimize, etc.), not just page exit
- timestamp: 2026-01-24T00:00:00Z
  checked: Line 361-366 of visibility handler
  found: On 'visible', it starts a new recording session
  implication: Each switch back creates a NEW session, causing multiple short sessions instead of one continuous session
- timestamp: 2026-01-24T00:00:00Z
  checked: .planning/phases/08-continuous-recording/08-RESEARCH.md lines 90-107
  found: Research shows intended behavior is "upload pending chunks" on hidden, NOT stop recording
  implication: The implementation incorrectly stops MediaRecorder instead of continuing to record in background
- timestamp: 2026-01-24T00:00:00Z
  checked: Comment at line 352: "Handle visibility change - THE critical event for page exit"
  implication: Intent was page exit handling, but MediaRecorder.stop() should NOT be called for temporary visibility changes

## Resolution
root_cause: The visibilitychange event handler in useContinuousRecording.ts (former lines 353-373) incorrectly stopped MediaRecorder whenever document.visibilityState === 'hidden'. This implementation confused "page exit" (close/refresh) with "page hidden" (tab switch, minimize, app switch) and stopped the recording for ALL visibility changes, causing:

1. Recording stops on every tab switch, window minimize, or app switch
2. Multiple short recording sessions instead of one continuous session
3. Uploads interrupted when recorder stops prematurely

The research documentation (08-RESEARCH.md line 98) indicated visibilitychange should "upload pending chunks" on page exit, NOT stop the recording. The existing unmount cleanup (lines 366-375) already handles stopping the recorder and uploading on actual page exit.

fix: Remove the entire visibilitychange event handler effect. The recorder should:
- Continue running in the background regardless of tab/app visibility
- Handle chunk uploads at 5-second intervals as chunks arrive
- Stop and upload remaining chunks only on component unmount (actual page exit)
- Stop and upload on manual disable/disable() call

Specific changes:
- Removed entire visibilitychange event handler (lines 352-373)
- Recording now continues in background for tab switches, minimize, app switches
- Unmount cleanup handles page exit recording stop and upload
- Uploads happen automatically via chunk interval (every 5s) and mediaRecorder.onstop

verification:
- Recording should continue when switching to another tab and back
- Recording should continue when minimizing and restoring window
- Recording should continue when switching to another app and back
- Multiple tab switches should NOT create new sessions, just one continuous session
- Uploads should proceed at 5-second intervals and when recording stops
- Page close should still trigger final upload via unmount cleanup
files_changed:
- src/hooks/useContinuousRecording.ts: Removed visibilitychange effect handler
root_cause:
fix:
verification:
files_changed: []