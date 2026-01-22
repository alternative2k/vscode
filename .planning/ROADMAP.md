# Roadmap: FormCheck

## Overview

Build a browser-based exercise form checker with real-time skeleton overlay and posture alerts.

## Milestones

- ✅ **v1.0 MVP** - [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) (Phases 1-4, shipped 2026-01-16)
- ✅ **v1.1 Recording History** - [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) (Phase 5, shipped 2026-01-16)
- ✅ **v2.0 Cloud Backup** - [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) (Phase 6, shipped 2026-01-16) ⚠️ Known limitation: requires backend for secure uploads
- ✅ **v2.1 Continuous Cloud Recording** - [milestones/v2.1-ROADMAP.md](milestones/v2.1-ROADMAP.md) (Phases 7-9, shipped 2026-01-21)
- ✅ **v2.2 UX Polish** - [milestones/v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md) (Phases 10-11, shipped 2026-01-21)
- ✅ **v2.3 Continuous Recording UX** - [milestones/v2.3-ROADMAP.md](milestones/v2.3-ROADMAP.md) (Phases 12-14, shipped 2026-01-21)
- 🚧 **v3.0 User Access Control** - Phases 15-17 (in progress)

## Current Milestone: v3.0 User Access Control

**Milestone Goal:** Multi-user authentication with admin-controlled app lock and per-user cloud storage folders.

### Phase 15: Multi-User Auth

**Goal:** Replace single shared password with multi-user system supporting user identity (id, name, password, isAdmin role)
**Depends on:** Previous milestone complete
**Research:** Complete ([15-RESEARCH.md](phases/15-user-access-control/15-RESEARCH.md))
**Plans:** TBD

Plans:
- [ ] 15-01: TBD (run /gsd:plan-phase 15 to break down)

### Phase 16: Admin App Lock

**Goal:** Add Cloudflare KV-based global lock that admin can toggle to block all non-admin users
**Depends on:** Phase 15
**Research:** Unlikely (simple API + KV integration)
**Plans:** TBD

Plans:
- [ ] 16-01: TBD (run /gsd:plan-phase 16 to break down)

### Phase 17: User Cloud Folders

**Goal:** Add userId prefix to all cloud upload paths for per-user organization in R2
**Depends on:** Phase 16
**Research:** Unlikely (path string modification)
**Plans:** TBD

Plans:
- [ ] 17-01: TBD (run /gsd:plan-phase 17 to break down)

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

<details>
<summary>v2.3 Continuous Recording UX (Phases 12-14) — SHIPPED 2026-01-21</summary>

- [x] Phase 12: Auto-Start Recording (1/1 plan) — completed 2026-01-21
- [x] Phase 13: Status Indicator (1/1 plan) — completed 2026-01-21
- [x] Phase 14: Resilient Upload (1/1 plan) — completed 2026-01-21

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
| 12. Auto-Start Recording | v2.3 | 1/1 | Complete | 2026-01-21 |
| 13. Status Indicator | v2.3 | 1/1 | Complete | 2026-01-21 |
| 14. Resilient Upload | v2.3 | 1/1 | Complete | 2026-01-21 |
| 15. Multi-User Auth | v3.0 | 0/? | Not started | - |
| 16. Admin App Lock | v3.0 | 0/? | Not started | - |
| 17. User Cloud Folders | v3.0 | 0/? | Not started | - |
