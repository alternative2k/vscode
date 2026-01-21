---
phase: 08-continuous-recording
plan: 02
subsystem: recording
tags: [mediarecorder, visibilitychange, hooks, continuous-recording]

# Dependency graph
requires:
  - phase: 08-01
    provides: chunkStorage utilities and chunk types
provides:
  - useContinuousRecording hook with full state management
  - uploadChunk function for session-organized uploads
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - visibilitychange for reliable page exit detection
    - Progressive chunk saving to IndexedDB (not memory)
    - Auto-resume on visibility return
    - 5-second timeslice for continuous chunks

key-files:
  created:
    - src/hooks/useContinuousRecording.ts
  modified:
    - src/utils/cloudUpload.ts

key-decisions:
  - "5000ms timeslice for chunks (balance between request frequency and data at risk)"
  - "visibilitychange is ONLY page exit signal used (no beforeunload)"
  - "New session on each visibility cycle (server can concatenate)"
  - "Upload pending chunks from previous sessions on mount"

patterns-established:
  - "Page lifecycle handling pattern for continuous operations"

# Metrics
duration: 8min
completed: 2026-01-21
verified: tsc
---

# Phase 8 Plan 02: useContinuousRecording Hook Summary

**Created hook for background MediaRecorder with visibilitychange handling and progressive uploads**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-21
- **Completed:** 2026-01-21
- **Tasks:** 2/2
- **Files created:** 1
- **Files modified:** 1

## Accomplishments

- Created useContinuousRecording hook with:
  - Auto-start when enabled with stream available
  - Progressive chunk saving to IndexedDB (not memory accumulation)
  - visibilitychange handling (stop/upload on hidden, resume on visible)
  - Session management with unique IDs
  - Duration tracking via Date.now() timer
  - Upload progress tracking
  - Error state management
  - Cleanup of previous session chunks on mount
- Added uploadChunk() function to cloudUpload.ts for session-organized uploads

## Files Created/Modified

**Created:**
- `src/hooks/useContinuousRecording.ts` - Full continuous recording hook

**Modified:**
- `src/utils/cloudUpload.ts` - Added uploadChunk function

## Hook Interface

```typescript
interface UseContinuousRecordingReturn {
  state: ContinuousRecordingState;  // 'idle' | 'recording' | 'paused' | 'uploading'
  isEnabled: boolean;
  sessionId: string | null;
  duration: number;
  chunkCount: number;
  uploadProgress: { uploaded: number; total: number };
  enable: () => void;
  disable: () => void;
  error: string | null;
}
```

## Key Behaviors

1. **Enable/Disable pattern:** User controls via enable()/disable()
2. **Auto-start:** Recording begins automatically when enabled + stream available
3. **5-second chunks:** Saved to IndexedDB immediately, never accumulated in memory
4. **Visibility handling:** Stops and uploads on hidden, resumes on visible
5. **Previous session cleanup:** Uploads any pending chunks from crashed sessions on mount

## Commits

- `c6ee6f4`: feat(08-02): create useContinuousRecording hook with visibilitychange handling
- `b6bfa98`: feat(08-02): add uploadChunk function for continuous recording

## Technical Notes

- Uses refs (isEnabledRef, sessionIdRef) to access current values in event handlers
- Chunks organized in R2 by session: `{sessionId}/chunk-0001.webm`
- Graceful degradation: continues recording even if save fails
- Sequential uploads to avoid overwhelming the server

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

---
*Phase: 08-continuous-recording*
*Completed: 2026-01-21*
