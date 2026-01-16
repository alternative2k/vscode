# Roadmap: FormCheck

## Overview

Build a browser-based exercise form checker with real-time skeleton overlay and posture alerts.

## Milestones

- ✅ **v1.0 MVP** - [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) (Phases 1-4, shipped 2026-01-16)
- ✅ **v1.1 Recording History** - Phase 5 (complete)

## Completed Milestones

<details>
<summary>v1.0 MVP (Phases 1-4) — SHIPPED 2026-01-16</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-01-16
- [x] Phase 2: Pose Detection (2/2 plans) — completed 2026-01-16
- [x] Phase 3: Recording (2/2 plans) — completed 2026-01-16
- [x] Phase 4: Exercise Alerts (2/2 plans) — completed 2026-01-16

</details>

### ✅ v1.1 Recording History (Complete)

**Milestone Goal:** Local recording management with IndexedDB persistence — view past recordings and delete to free space.

#### Phase 5: Recording History

**Goal**: Persist recordings to IndexedDB, display list with metadata, enable deletion
**Depends on**: Phase 4 (Exercise Alerts complete)
**Research**: Unlikely (IndexedDB is standard browser API, internal UI patterns)
**Plans**: 2 plans

Plans:
- [x] 05-01: Storage Foundation — IndexedDB utils, extended types, useRecordingHistory hook
- [x] 05-02: UI Integration — RecordingList component, app integration (depends: 05-01)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-01-16 |
| 2. Pose Detection | v1.0 | 2/2 | Complete | 2026-01-16 |
| 3. Recording | v1.0 | 2/2 | Complete | 2026-01-16 |
| 4. Exercise Alerts | v1.0 | 2/2 | Complete | 2026-01-16 |
| 5. Recording History | v1.1 | 2/2 | Complete | 2026-01-16 |
