# Project Milestones: FormCheck

## v2.2 UX Polish (Shipped: 2026-01-21)

**Delivered:** Mobile-optimized workout experience with fullscreen mode, orientation-aware layout, and severity-based visual feedback on skeleton overlay.

**Phases completed:** 10-11 (3 plans total)

**Key accomplishments:**

- Fullscreen mode with cross-browser Fullscreen API hook and graceful degradation
- Orientation-aware CSS layout for landscape workout sessions
- Alert interfaces extended with affectedLandmarks for body part targeting
- Severity-based skeleton highlighting (yellow warnings, red errors with glow effects)
- Color-coded alert banners with dynamic styling by severity
- Video dimension fallback polling for cross-browser compatibility

**Stats:**

- 17 files modified
- 5,467 total lines of TypeScript
- 2 phases, 3 plans, ~9 tasks
- 11 days (2026-01-10 → 2026-01-21)

**Git range:** `feat(10-01)` → `docs(11)`

**What's next:** TBD

---

## v2.1 Continuous Cloud Recording (Shipped: 2026-01-21)

**Delivered:** Continuous background recording with secure cloud uploads — video chunks saved progressively and uploaded automatically when leaving page. Manual recording works independently with direct upload option.

**Phases completed:** 7-9 (7 plans total)

**Key accomplishments:**

- Secure cloud uploads via Cloudflare R2 with presigned URLs (no client-side credentials)
- Cloudflare Pages Function for server-side credential management
- Continuous background recording with 5-second chunks saved to IndexedDB
- Automatic upload on page exit via visibilitychange handling
- Manual recording coexists independently with continuous background
- Direct upload button (purple) for manual clips with success/error feedback

**Stats:**

- 8 files created, 6 modified
- 5,104 total lines of TypeScript
- 3 phases, 7 plans, ~14 tasks
- 2 days (2026-01-20 → 2026-01-21)

**Git range:** `feat(07-01)` → `feat(09-01)`

**What's next:** TBD

---

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
