# Feature Research

**Domain:** Browser-based fitness/pose detection app
**Researched:** 2026-01-15
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live camera preview | Can't check form without seeing yourself | LOW | getUserMedia + video element |
| Real-time skeleton overlay | Core value proposition, visual feedback | MEDIUM | MediaPipe + canvas drawing |
| Start/stop recording | Basic recording functionality | LOW | MediaRecorder API |
| Local download of recordings | Users need to access their videos | LOW | Blob URL + download link |
| Mobile-responsive UI | Users work out with phones | LOW | Tailwind responsive classes |
| Camera switching (front/back) | Mobile users need front camera | LOW | facingMode constraint |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Exercise-specific form alerts | Squat depth, push-up alignment | MEDIUM | Angle calculations from landmarks |
| Audio/visual cues for bad form | Immediate feedback during exercise | LOW | Simple audio + visual flash |
| S3 cloud upload | Access recordings anywhere | MEDIUM | Presigned URLs, CORS setup |
| Recording history (local) | Review past sessions | LOW | IndexedDB or localStorage |
| Side-by-side comparison | Compare current form to reference | HIGH | Dual video playback, sync |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-person tracking | "I work out with friends" | MediaPipe single-person only, complex sync | Take turns, separate recordings |
| Burned-in overlay on video | "I want to see the skeleton later" | Doubles encoding complexity, larger files | Side-by-side playback with re-detection |
| Real-time cloud streaming | "Save directly to cloud" | Bandwidth issues, complexity, cost | Record locally, upload after |
| Rep counting | "Track my workout progress" | Prone to errors, scope creep | Focus on form first, add later |
| AI coaching voice | "Tell me what to fix" | Complex NLP, annoying if wrong | Simple text alerts on screen |

## Feature Dependencies

```
[Camera Access]
    └──requires──> [Browser Permissions]
                       └──requires──> [HTTPS/localhost]

[Skeleton Overlay]
    └──requires──> [Camera Access]
                       └──requires──> [MediaPipe Model Loaded]

[Form Alerts]
    └──requires──> [Skeleton Overlay]
                       └──requires──> [Angle Calculation Logic]

[Video Recording]
    └──requires──> [Camera Access]
    └──independent of──> [Skeleton Overlay] (clean recording)

[S3 Upload]
    └──requires──> [Video Recording]
                       └──requires──> [User S3 Config]
                                          └──requires──> [Settings UI]

[Local Save]
    └──requires──> [Video Recording]
```

### Dependency Notes

- **Skeleton Overlay requires Camera Access:** Can't detect pose without video feed
- **Form Alerts require Skeleton Overlay:** Need landmark positions to calculate angles
- **Video Recording independent of Skeleton Overlay:** Clean video uses separate stream
- **S3 Upload requires Settings UI:** Users must configure their bucket credentials

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] Camera access with live preview
- [x] Real-time skeleton overlay (33 landmarks)
- [x] Basic posture alerts (general bad form detection)
- [x] Video recording (clean, no overlay)
- [x] Local download of recordings
- [x] Mobile-responsive UI
- [x] Simple password protection (small group)

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Exercise-specific alerts (squat, push-up) — when basic alerts work reliably
- [ ] S3 upload with user config — when users request cloud storage
- [ ] Recording history (IndexedDB) — when users want to review sessions
- [ ] Audio feedback for alerts — when visual alerts prove useful

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Multiple exercise templates — requires significant training data
- [ ] Progress tracking over time — needs database, analytics
- [ ] Social features — completely different scope
- [ ] Wearable integration — requires native app or complex BLE

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Camera preview | HIGH | LOW | P1 |
| Skeleton overlay | HIGH | MEDIUM | P1 |
| Video recording | HIGH | LOW | P1 |
| Local download | HIGH | LOW | P1 |
| Mobile responsive | HIGH | LOW | P1 |
| General posture alerts | MEDIUM | MEDIUM | P1 |
| Squat form alerts | MEDIUM | MEDIUM | P2 |
| Push-up form alerts | MEDIUM | MEDIUM | P2 |
| S3 upload | MEDIUM | MEDIUM | P2 |
| Simple auth | MEDIUM | LOW | P1 |
| Recording history | LOW | MEDIUM | P3 |
| Audio feedback | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Tempo/Tonal (Premium) | Free Fitness Apps | Our Approach |
|---------|----------------------|-------------------|--------------|
| Pose detection | Custom hardware + ML | Basic or none | MediaPipe in-browser |
| Form feedback | Real-time + rep counting | Usually none | Real-time alerts only |
| Recording | Cloud with subscription | None or local | Local + user S3 |
| Exercise library | 1000+ exercises | Video tutorials | Focus on squat/push-up |
| Price | $500+ equipment + $39/mo | Free with ads | Free (user provides S3) |

**Our differentiation:** Free, privacy-focused (client-side only), works on any device with browser.

## Sources

- [PostureScreen App](https://www.postureanalysis.com/) — Professional posture analysis features (MEDIUM confidence)
- [AI App to Check Exercise Form 2025](https://thehumanprompts.com/ai-app-to-check-exercise-form/) — Consumer app landscape (MEDIUM confidence)
- [Fitness App with MediaPipe and React](https://dev.to/yoshan0921/fitness-app-development-with-real-time-posture-detection-using-mediapipe-38do) — Implementation reference (HIGH confidence)
- [Pose Trainer Paper](https://arxiv.org/abs/2006.11718) — Academic approach to form correction (HIGH confidence)
- [AI Posture Correction Advances 2025](https://yenra.com/ai20/posture-correction-fitness-apps/) — Industry trends (LOW confidence)

---
*Feature research for: Browser-based fitness/pose detection app*
*Researched: 2026-01-15*
