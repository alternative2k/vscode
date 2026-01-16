# Project Milestones: FormCheck

## v1.1 Recording History (Shipped: 2026-01-16)

**Delivered:** Local recording management with IndexedDB persistence — view past recordings and delete to free space.

**Phases completed:** 5 (2 plans total)

**Key accomplishments:**

- IndexedDB storage layer with native API wrappers
- Extended recording types for persistence (StoredRecording, SavedRecording)
- useRecordingHistory hook with CRUD operations and storage stats
- RecordingList modal with date/duration/size display
- Delete functionality with confirmation dialog
- Save button and History button with badge in UI

**Stats:**

- 3 files created, 3 modified
- 675 lines added (2,774 total TypeScript)
- 1 phase, 2 plans, 6 tasks
- Same day as v1.0

**Git range:** `feat(05-01)` → `feat(05-02)`

**What's next:** S3 upload integration (v2.0)

---

## v1.0 MVP (Shipped: 2026-01-16)

**Delivered:** Browser-based exercise form checker with real-time skeleton overlay and posture alerts for squats, push-ups, and general positioning.

**Phases completed:** 1-4 (9 plans total)

**Key accomplishments:**

- Camera access with front/back switching and responsive mobile-first layout
- Real-time 33-landmark skeleton overlay using MediaPipe Pose
- General posture alerts with audio/visual feedback (head tilt, shoulder alignment)
- Squat form detection (knee angle, back position, depth, asymmetry)
- Push-up form detection (body alignment, elbow angle, hip sag/pike)
- Video recording with local download functionality

**Stats:**

- 16 files created
- 2,099 lines of TypeScript
- 4 phases, 9 plans
- 2 days from project start to ship

**Git range:** `feat(01-01)` → `feat(04-02)`

**What's next:** S3 upload integration, recording history

---
