# Roadmap: FormCheck

## Overview

Build a browser-based exercise form checker with real-time skeleton overlay and posture alerts.

## Milestones

- ✅ **v1.0 MVP** - [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) (Phases 1-4, shipped 2026-01-16)
- ✅ **v1.1 Recording History** - [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) (Phase 5, shipped 2026-01-16)
- ✅ **v2.0 Cloud Backup** - [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) (Phase 6, shipped 2026-01-16) ⚠️ Known limitation: requires backend for secure uploads
- ✅ **v2.1 Continuous Cloud Recording** - [milestones/v2.1-ROADMAP.md](milestones/v2.1-ROADMAP.md) (Phases 7-9, shipped 2026-01-21)
- ✅ **v2.2 UX Polish** - [milestones/v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md) (Phases 10-11, shipped 2026-01-21)
- 🚧 **v2.3 Continuous Recording UX** - Phases 12-14 (in progress)

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

<details>
<summary>v2.1 Continuous Cloud Recording (Phases 7-9) — SHIPPED 2026-01-21</summary>

- [x] Phase 7: Storage Migration (3/3 plans) — completed 2026-01-20
- [x] Phase 8: Continuous Recording (3/3 plans) — completed 2026-01-21
- [x] Phase 9: Dual Recording Mode (1/1 plan) — completed 2026-01-21

</details>

<details>
<summary>v2.2 UX Polish (Phases 10-11) — SHIPPED 2026-01-21</summary>

- [x] Phase 10: Mobile UX (1/1 plan) — completed 2026-01-21
- [x] Phase 11: Alert System Overhaul (2/2 plans) — completed 2026-01-21

</details>

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
| 9. Dual Recording Mode | v2.1 | 1/1 | Complete | 2026-01-21 |
| 10. Mobile UX | v2.2 | 1/1 | Complete | 2026-01-21 |
| 11. Alert System Overhaul | v2.2 | 2/2 | Complete | 2026-01-21 |

### 🚧 v2.3 Continuous Recording UX (In Progress)

**Milestone Goal:** Seamless continuous recording that auto-starts on camera load with visual status indicator and resilient upload handling.

#### Phase 12: Auto-Start Recording

**Goal**: Auto-start continuous recording when camera preview loads, stop on close/refresh
**Depends on**: Phase 8 (Continuous Recording infrastructure)
**Research**: Unlikely (building on existing continuous recording)
**Plans**: 1/1 complete

Plans:
- [x] 12-01: Auto-start continuous recording (completed 2026-01-21)

#### Phase 13: Status Indicator

**Goal**: Replace continuous recording button with status icon (green=active, yellow=retrying, grey=inactive)
**Depends on**: Phase 12
**Research**: Unlikely (UI component work)
**Plans**: 1/1 complete

Plans:
- [x] 13-01: Status indicator component (completed 2026-01-21)

#### Phase 14: Resilient Upload

**Goal**: Auto-retry uploads with reconnection handling, organize by date folders (2026-01-21/session-abc/chunk-0001.webm)
**Depends on**: Phase 12
**Research**: Unlikely (extending existing upload logic)
**Plans**: 1/1 complete

Plans:
- [x] 14-01: Resilient upload with date folders and retry logic (completed 2026-01-21)

## Progress (v2.3)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 12. Auto-Start Recording | v2.3 | 1/1 | Complete | 2026-01-21 |
| 13. Status Indicator | v2.3 | 1/1 | Complete | 2026-01-21 |
| 14. Resilient Upload | v2.3 | 1/1 | Complete | 2026-01-21 |
