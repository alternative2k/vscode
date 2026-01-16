# Roadmap: FormCheck

## Overview

Build a browser-based exercise form checker with real-time skeleton overlay and posture alerts.

## Milestones

- ✅ **v1.0 MVP** - [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) (Phases 1-4, shipped 2026-01-16)
- ✅ **v1.1 Recording History** - [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) (Phase 5, shipped 2026-01-16)
- 🚧 **v2.0 Cloud Backup** - Phase 6 (in progress)

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

### 🚧 v2.0 Cloud Backup (In Progress)

**Milestone Goal:** Enable cloud backup of recordings to S3 with robust upload handling

#### Phase 6: S3 Upload

**Goal**: Direct browser-to-S3 uploads with progress UI and retry logic
**Depends on**: Phase 5 (Recording History)
**Research**: Likely (AWS S3 browser SDK, CORS configuration for public bucket)
**Research topics**: AWS SDK for browser, S3 CORS setup, presigned URLs vs public bucket
**Plans**: 2 plans

Plans:
- [x] 06-01: S3 upload foundation (types, upload service, hook) — completed 2026-01-16
- [ ] 06-02: UI integration (config modal, upload buttons, progress)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-01-16 |
| 2. Pose Detection | v1.0 | 2/2 | Complete | 2026-01-16 |
| 3. Recording | v1.0 | 2/2 | Complete | 2026-01-16 |
| 4. Exercise Alerts | v1.0 | 2/2 | Complete | 2026-01-16 |
| 5. Recording History | v1.1 | 2/2 | Complete | 2026-01-16 |
| 6. S3 Upload | v2.0 | 1/2 | In progress | - |
