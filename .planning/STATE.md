# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-15)

**Core value:** Real-time visual feedback on exercise form — skeleton overlay and posture alerts must work reliably
**Current focus:** Phase 4 — Exercise Alerts

## Current Position

Phase: 4 of 4 (Exercise Alerts)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-01-16 — Completed 04-02-PLAN.md

Progress: ██████████ 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 9 min
- Total execution time: 1.37 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 28 min | 9 min |
| 02-pose-detection | 2/2 | 20 min | 10 min |
| 03-recording | 2/2 | 16 min | 8 min |
| 04-exercise-alerts | 2/2 | 18 min | 9 min |

**Recent Trend:**
- Last 5 plans: 03-01 (8 min), 03-02 (8 min), 04-01 (8 min), 04-02 (10 min)
- Trend: Stable

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Used Tailwind CSS v4 with @tailwindcss/vite plugin for native Vite integration
- CSS-in-JS via Tailwind utilities instead of separate CSS files
- Custom hooks pattern for media API encapsulation (useCamera, useAuth, usePoseDetection, usePostureAlerts)
- Mirror video horizontally for front camera only
- localStorage flag for simple auth persistence (formcheck_authed)
- Mobile-first design with 70vh camera height on small screens
- CDN-hosted MediaPipe models for smaller bundle size
- Flip x-coordinates in detection hook for mirrored camera
- Visibility threshold of 0.5 to filter low-confidence landmarks
- 500ms debounce on posture alerts to avoid flicker
- 2s throttle on audio alerts to prevent rapid beeping
- 440Hz sine wave at 0.3 volume for alert beep
- webm MIME type with mp4 fallback for recording
- useRecording hook for MediaRecorder lifecycle management
- 1000ms timeslice for periodic recording chunks
- Filename format formcheck-YYYY-MM-DD-HHmmss.webm for downloads
- RecordingControls component for separation of concerns
- 100 degrees knee angle threshold for proper squat depth
- 150 degrees knee angle to detect squat stance vs standing
- 45 degrees forward lean threshold for torso angle warning
- 15 degrees asymmetry threshold between left/right knee angles
- ExerciseMode type for routing alerts to appropriate form checker
- 100 degrees elbow angle threshold for proper push-up depth
- 15 degrees hip deviation threshold for push-up sag/pike detection
- Side-view camera positioning recommended for best push-up detection

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-16
Stopped at: Completed 04-02-PLAN.md (Push-up form detection)
Resume file: None
