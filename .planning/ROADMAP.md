# Roadmap: FormCheck

## Overview

Build a browser-based exercise form checker with real-time skeleton overlay and posture alerts.

## Milestones

- ✅ **v1.0 MVP** - [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) (Phases 1-4, shipped 2026-01-16)
- ✅ **v1.1 Recording History** - [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) (Phase 5, shipped 2026-01-16)
- ✅ **v2.0 Cloud Backup** - [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) (Phase 6, shipped 2026-01-16) ⚠️ Known limitation: requires backend for secure uploads
- 🚧 **v2.1 Continuous Cloud Recording** - Phases 7-9 (in progress)

## Completed Milestones

<details>
<summary>v1.0 MVP (Phases 1-4) — SHIPPED 2026-01-16</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-01-16
- [x] Phase 2: Pose Detection (2/2 plans) — completed 2026-01-16
- [x] Phase 3: Recording (2/2 plans) — completed 2026-01-16
- [x] Phase 4: Exercise Alerts (2/2 plans) — completed 2026-01-16

</details>

<details>
<summary>v1.1 Recording History (Phase 5) — SHIPPED 2026-01-16</summary>

- [x] Phase 5: Recording History (2/2 plans) — completed 2026-01-16

</details>

<details>
<summary>v2.0 Cloud Backup (Phase 6) — SHIPPED 2026-01-16</summary>

- [x] Phase 6: S3 Upload (2/2 plans) — completed 2026-01-16

</details>

### 🚧 v2.1 Continuous Cloud Recording (In Progress)

**Milestone Goal:** Continuous background recording with secure cloud uploads, efficient video format, and graceful page refresh handling. Manual recording coexists without interference.

#### Phase 7: Storage Migration ✅

**Goal**: Replace S3 with secure Cloudflare R2 using presigned URLs (credentials stay server-side)
**Depends on**: Phase 6 (S3 Upload foundation)
**Research**: Complete (07-RESEARCH.md)
**Plans**: 3 plans in 3 waves — completed 2026-01-20

Plans:
- [x] 07-01: Backend + Types Foundation (Pages Function, cloud types)
- [x] 07-02: Upload Infrastructure (cloudUpload utility, useCloudUpload hook)
- [x] 07-03: UI Integration (CloudConfigModal, wire into existing components)

#### Phase 8: Continuous Recording ✅

**Goal**: Background MediaRecorder with chunked uploads, page unload handling, efficient format (WebM/VP9)
**Depends on**: Phase 7
**Research**: Complete (08-RESEARCH.md)
**Plans**: 3 plans in 3 waves — completed 2026-01-21

Plans:
- [x] 08-01: Chunk Storage Infrastructure (types, chunkStorage.ts)
- [x] 08-02: useContinuousRecording Hook (MediaRecorder, visibilitychange, upload)
- [x] 08-03: UI Integration (toggle button, status indicator, human verification)

#### Phase 9: Dual Recording Mode

**Goal**: Manual record button for local clips with optional upload, independent from background stream
**Depends on**: Phase 8
**Research**: Unlikely (internal patterns, extends existing recording)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-01-16 |
| 2. Pose Detection | v1.0 | 2/2 | Complete | 2026-01-16 |
| 3. Recording | v1.0 | 2/2 | Complete | 2026-01-16 |
| 4. Exercise Alerts | v1.0 | 2/2 | Complete | 2026-01-16 |
| 5. Recording History | v1.1 | 2/2 | Complete | 2026-01-16 |
| 6. S3 Upload | v2.0 | 2/2 | Complete | 2026-01-16 |
| 7. Storage Migration | v2.1 | 3/3 | Complete | 2026-01-20 |
| 8. Continuous Recording | v2.1 | 3/3 | Complete | 2026-01-21 |
| 9. Dual Recording Mode | v2.1 | 0/? | Not started | - |
