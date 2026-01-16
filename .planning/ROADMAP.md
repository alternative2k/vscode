# Roadmap: FormCheck

## Overview

Build a browser-based exercise form checker in 4 phases: start with camera access and basic UI, add pose detection with skeleton overlay, implement video recording, then add exercise-specific form alerts for squats and push-ups.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Camera access, responsive UI, password protection
- [x] **Phase 2: Pose Detection** - Skeleton overlay and general posture alerts
- [x] **Phase 3: Recording** - Video capture and local download
- [x] **Phase 4: Exercise Alerts** - Squat and push-up form detection

## Phase Details

### Phase 1: Foundation
**Goal**: Working camera preview with responsive layout and basic auth
**Depends on**: Nothing (first phase)
**Requirements**: CAM-01, CAM-02, CAM-03, AUTH-01
**Research**: Unlikely (established React + camera patterns)
**Plans**: TBD

Plans:
- [x] 01-01: Project setup (Vite + React + TypeScript + Tailwind)
- [x] 01-02: Camera access with permission UX
- [x] 01-03: Password gate and responsive layout

### Phase 2: Pose Detection
**Goal**: Real-time skeleton overlay with general posture alerts
**Depends on**: Phase 1
**Requirements**: POSE-01, POSE-02, CAM-04
**Research**: Unlikely (MediaPipe well-documented)
**Plans**: TBD

Plans:
- [x] 02-01: MediaPipe integration and skeleton drawing
- [x] 02-02: General posture detection and audio/visual alerts

### Phase 3: Recording
**Goal**: Video recording with local download
**Depends on**: Phase 1 (camera access)
**Requirements**: REC-01, REC-02
**Research**: Unlikely (MediaRecorder API straightforward)
**Plans**: TBD

Plans:
- [x] 03-01: MediaRecorder integration with start/stop
- [x] 03-02: Local download functionality

### Phase 4: Exercise Alerts
**Goal**: Specific form alerts for squats and push-ups
**Depends on**: Phase 2 (pose detection)
**Requirements**: POSE-03, POSE-04
**Research**: Likely (angle thresholds for form rules)
**Research topics**: Squat angle thresholds (knee, back), push-up alignment rules, form detection algorithms
**Plans**: TBD

Plans:
- [x] 04-01: Squat form detection (knee angle, back, depth)
- [x] 04-02: Push-up form detection (alignment, elbow, depth)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-16 |
| 2. Pose Detection | 2/2 | Complete | 2026-01-16 |
| 3. Recording | 2/2 | Complete | 2026-01-16 |
| 4. Exercise Alerts | 2/2 | Complete | 2026-01-16 |
