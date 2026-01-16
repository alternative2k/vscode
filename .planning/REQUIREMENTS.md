# Requirements: FormCheck

**Defined:** 2026-01-15
**Core Value:** Real-time visual feedback on exercise form — the skeleton overlay and posture alerts must work reliably so users can self-correct during workouts.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Camera & Video

- [x] **CAM-01**: User can see live camera preview of themselves
- [x] **CAM-02**: User can switch between front and back camera on mobile
- [x] **CAM-03**: UI adapts to desktop and mobile screen sizes
- [x] **CAM-04**: User receives audio/visual cue when bad form is detected

### Pose Detection

- [x] **POSE-01**: Skeleton overlay displays 33 body landmarks on live video
- [x] **POSE-02**: System detects and alerts on obviously wrong postures
- [ ] **POSE-03**: System alerts on squat form issues (knee angle, back straightness, depth)
- [ ] **POSE-04**: System alerts on push-up form issues (body alignment, elbow angle, depth)

### Recording

- [ ] **REC-01**: User can start and stop video recording
- [ ] **REC-02**: User can download recorded video to local device

### Authentication

- [x] **AUTH-01**: App is protected by shared password for small group access

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Cloud Storage

- **CLOUD-01**: User can configure S3 bucket credentials
- **CLOUD-02**: User can upload recordings to their S3 bucket

### Recording

- **REC-03**: User can view list of past recordings (IndexedDB)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-person tracking | MediaPipe single-person only, complex sync |
| Burned-in overlay on video | User wants clean recordings |
| Real-time cloud streaming | Bandwidth issues, complexity, cost |
| Rep counting | Prone to errors, scope creep — focus on form first |
| AI coaching voice | Complex NLP, annoying if wrong |
| Progress tracking over time | Needs database, analytics — v2+ |
| Native mobile apps | Web app covers both platforms |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAM-01 | Phase 1 | Complete |
| CAM-02 | Phase 1 | Complete |
| CAM-03 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| POSE-01 | Phase 2 | Complete |
| POSE-02 | Phase 2 | Complete |
| CAM-04 | Phase 2 | Complete |
| REC-01 | Phase 3 | Pending |
| REC-02 | Phase 3 | Pending |
| POSE-03 | Phase 4 | Pending |
| POSE-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-01-15*
*Last updated: 2026-01-16 after Phase 2 completion*
