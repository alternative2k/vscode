# Project Research Summary

**Project:** FormCheck
**Domain:** Browser-based fitness/pose detection app
**Researched:** 2026-01-15
**Confidence:** HIGH

## Executive Summary

FormCheck is a browser-based exercise form checker using real-time pose detection. The technology landscape strongly favors MediaPipe Tasks Vision over alternatives like TensorFlow.js PoseNet — MediaPipe achieves 60 FPS on modest hardware, provides 33 body landmarks, and runs entirely client-side with no backend required.

The recommended approach is a React + TypeScript + Vite stack deployed to free static hosting (Vercel/Netlify). Video recording uses the native MediaRecorder API, with clean video captured separately from the skeleton overlay. S3 upload works via presigned URLs, requiring users to configure their own bucket but eliminating any backend storage costs.

Key risks center on browser compatibility (MediaRecorder MIME types vary), mobile camera orientation handling, and memory management with MediaPipe's WASM runtime. These are well-documented issues with established solutions.

## Key Findings

### Recommended Stack

React 18 + TypeScript + Vite provides the best developer experience for this type of real-time video application. MediaPipe Tasks Vision is the clear choice for pose detection — it's Google's production-ready solution that runs detection once then uses lightweight tracking, achieving smooth performance even on older hardware.

**Core technologies:**
- **MediaPipe Tasks Vision:** Pose detection with 33 landmarks, GPU-accelerated, 60 FPS capable
- **React 18 + TypeScript:** Component architecture ideal for video/canvas composition
- **Vite:** Fast builds, simple static output for free hosting
- **MediaRecorder API:** Native browser recording, no external dependencies

### Expected Features

**Must have (table stakes):**
- Live camera preview with skeleton overlay — core value proposition
- Start/stop recording with local download — basic functionality
- Mobile-responsive UI — users work out with phones

**Should have (competitive):**
- Exercise-specific form alerts (squat depth, push-up alignment)
- S3 upload with user configuration
- Audio/visual feedback for bad posture

**Defer (v2+):**
- Rep counting — prone to errors, scope creep
- Multiple exercise templates — requires training data
- Progress tracking — needs database

### Architecture Approach

A component-based React architecture with services layer for business logic. The key pattern is dual-stream handling: the camera stream feeds both a video element (for display + overlay) and MediaRecorder (for clean recording). Pose detection runs in a requestAnimationFrame loop, with results flowing through a lightweight Zustand store.

**Major components:**
1. **Camera + Overlay Layer:** React components, canvas for skeleton drawing
2. **Services Layer:** PoseService (MediaPipe), RecordService, UploadService
3. **State Layer:** Zustand stores for pose data, recording state, settings

### Critical Pitfalls

1. **Memory leaks from MediaPipe WASM** — Must call `close()` on results and instance. Solution: Proper cleanup in useEffect.

2. **MediaRecorder MIME type failures** — Safari doesn't support VP8/VP9. Solution: Let browser choose default, test on all browsers.

3. **Camera permission UX** — Users deny reflexively, can't re-enable. Solution: Explain before prompting, detect denied state.

4. **Mobile orientation chaos** — Video appears rotated on some devices. Solution: Lock to portrait, test on real devices.

5. **S3 CORS configuration** — Works locally, fails deployed. Solution: Document exact CORS setup, test from production domain.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** Must establish project structure, camera access, and permission UX before any features
**Delivers:** Working camera preview, proper cleanup patterns, responsive layout
**Addresses:** Camera access, mobile UI (from FEATURES.md)
**Avoids:** Permission UX disaster, memory leak patterns (from PITFALLS.md)

### Phase 2: Pose Detection
**Rationale:** Core value — skeleton overlay and basic form feedback
**Delivers:** Real-time skeleton overlay, general posture alerts
**Uses:** MediaPipe Tasks Vision, Canvas 2D API (from STACK.md)
**Implements:** PoseService singleton, detection loop (from ARCHITECTURE.md)

### Phase 3: Recording
**Rationale:** Recording is independent of overlay, can be built in parallel
**Delivers:** Video recording, local download
**Addresses:** Video recording, local save (from FEATURES.md)
**Avoids:** MIME type issues (from PITFALLS.md)

### Phase 4: Exercise-Specific Alerts
**Rationale:** Builds on basic pose detection, adds value
**Delivers:** Squat form alerts, push-up form alerts
**Uses:** Angle calculation from landmarks (from ARCHITECTURE.md)

### Phase 5: S3 Upload + Auth
**Rationale:** Optional enhancement, requires user configuration
**Delivers:** S3 upload capability, simple auth gate
**Avoids:** CORS nightmare, credential exposure (from PITFALLS.md)

### Phase Ordering Rationale

- **Foundation first:** Camera + permissions must work before anything else
- **Pose detection early:** Core value, validates technical approach
- **Recording parallel-friendly:** Independent of overlay complexity
- **S3 last:** Optional feature, requires most user configuration

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Exercise Alerts):** Need to define specific angle thresholds for squat/push-up form rules

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented React + camera patterns
- **Phase 3 (Recording):** MediaRecorder API is straightforward

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | MediaPipe is clearly the right choice, well-documented |
| Features | HIGH | Standard fitness app features, clear MVP definition |
| Architecture | HIGH | Established React patterns, MediaPipe examples available |
| Pitfalls | HIGH | Well-documented issues with known solutions |

**Overall confidence:** HIGH

### Gaps to Address

- **Exercise angle thresholds:** Need to research or experiment with specific angles for "good" vs "bad" squat/push-up form during Phase 4 planning
- **S3 user configuration UX:** May need to iterate on how users input their bucket credentials

## Sources

### Primary (HIGH confidence)
- [MediaPipe Pose Landmarker Web Guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js) — Official API
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — Recording API
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html) — Upload patterns
- [Google Developers - ML on Web](https://developers.googleblog.com/7-dos-and-donts-of-using-ml-on-the-web-with-mediapipe/) — Best practices

### Secondary (MEDIUM confidence)
- [Fitness App with MediaPipe and React](https://dev.to/yoshan0921/fitness-app-development-with-real-time-posture-detection-using-mediapipe-38do) — Implementation reference
- [React Architecture Best Practices 2024](https://www.sitepoint.com/react-architecture-best-practices/) — Structure patterns

### Tertiary (LOW confidence)
- [AI Posture Correction Advances 2025](https://yenra.com/ai20/posture-correction-fitness-apps/) — Industry trends

---
*Research completed: 2026-01-15*
*Ready for roadmap: yes*
