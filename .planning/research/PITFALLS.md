# Pitfalls Research

**Domain:** Browser-based fitness/pose detection app
**Researched:** 2026-01-15
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Memory Leaks from MediaPipe WASM

**What goes wrong:**
Browser memory usage grows continuously, eventually causing tab crash or severe slowdown.

**Why it happens:**
MediaPipe uses WebAssembly with C++ memory management. Unlike JavaScript, WASM doesn't auto-garbage collect. Each frame's results allocate memory that must be explicitly freed.

**How to avoid:**
- Call `close()` on PoseLandmarker results after processing
- Call `close()` on the PoseLandmarker instance when component unmounts
- Use React cleanup functions in useEffect

**Warning signs:**
- Task Manager shows increasing memory for browser tab
- App gets progressively slower over time
- Browser tab eventually crashes

**Phase to address:** Phase 1 (Foundation) — build correct patterns from start

---

### Pitfall 2: Unstable Landmarks Near Frame Edges

**What goes wrong:**
Landmark coordinates jump erratically when user is too close to camera or body parts go out of frame.

**Why it happens:**
MediaPipe's tracking model loses confidence when it can't see the full body. It alternates between detection and tracking modes, causing coordinate instability.

**How to avoid:**
- Add logic to ignore frames when landmarks move too quickly (velocity threshold)
- Display "step back" warning when detection confidence is low
- Use `min_tracking_confidence` threshold (0.5-0.7 recommended)
- Require user to be 2-4 meters from camera

**Warning signs:**
- Skeleton jumps around when user moves to edge of frame
- Form alerts trigger falsely during normal movement
- User reports "glitchy" skeleton

**Phase to address:** Phase 2 (Pose Detection) — handle during implementation

---

### Pitfall 3: MediaRecorder MIME Type Incompatibility

**What goes wrong:**
Recording works in Chrome but fails silently in Safari or Firefox. Videos may be unplayable.

**Why it happens:**
- Chrome supports VP9/VP8, Firefox supports VP8 only, Safari doesn't support either
- Specifying a MIME type that browser doesn't support causes silent failure
- Safari only added MediaRecorder support in Safari 14

**How to avoid:**
- Use `MediaRecorder.isTypeSupported()` to check before recording
- Prefer letting browser choose default MIME type (omit the option)
- Test on all target browsers
- Provide fallback: `video/webm;codecs=vp8` → `video/webm` → browser default

**Warning signs:**
- Recording works in dev (Chrome) but not production (Safari)
- `ondataavailable` never fires
- Blob has zero size

**Phase to address:** Phase 3 (Recording) — implement with browser detection

---

### Pitfall 4: getUserMedia Permission UX Disaster

**What goes wrong:**
Users deny camera permission, can't figure out how to re-enable it, abandon app.

**Why it happens:**
- Browser permission prompts are confusing
- Once denied, re-enabling requires navigating browser settings
- App doesn't explain why camera is needed before asking

**How to avoid:**
- Explain why camera access is needed BEFORE triggering permission prompt
- Detect "denied" state and show clear instructions for each browser
- Use `navigator.permissions.query()` to check state before requesting
- Provide a "test camera" button that explains the flow

**Warning signs:**
- High bounce rate on landing page
- Support requests about "camera not working"
- Users on iOS Safari particularly confused

**Phase to address:** Phase 1 (Foundation) — handle permissions UX early

---

### Pitfall 5: S3 CORS Configuration Nightmare

**What goes wrong:**
S3 upload works locally, fails in production with opaque CORS errors.

**Why it happens:**
- S3 CORS must be configured on the bucket, not just in code
- Presigned URLs must match exact origin
- Different behavior between localhost and deployed domain

**How to avoid:**
- Document exact CORS configuration needed for user's bucket
- Test with actual deployed domain, not just localhost
- Include CORS troubleshooting in settings UI
- Use specific origin, not wildcard, in production

**Warning signs:**
- "No Access-Control-Allow-Origin header" in console
- Upload works on localhost but not deployed site
- Intermittent failures

**Phase to address:** Phase 4 (S3 Upload) — provide clear setup guide

---

### Pitfall 6: Mobile Camera Orientation Chaos

**What goes wrong:**
Video appears rotated, skeleton doesn't align with body, recording is sideways.

**Why it happens:**
- Mobile cameras report different orientations
- Landscape vs portrait affects video dimensions
- iOS and Android handle rotation differently

**How to avoid:**
- Lock to portrait mode for simplicity
- Read `videoTrack.getSettings().width/height` to detect orientation
- Apply CSS transforms if needed, not canvas transforms
- Test on actual devices, not just emulators

**Warning signs:**
- Video appears sideways on mobile
- Skeleton is offset or rotated
- Works on one phone but not another

**Phase to address:** Phase 2 (Pose Detection) — test on real devices

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip TypeScript strict mode | Faster initial dev | Bugs at runtime, refactoring pain | Never |
| Store all landmarks in state | Simple code | Memory issues, perf degradation | Never |
| Hardcode exercise thresholds | Quick form alerts | Doesn't work for all body types | MVP only, add calibration later |
| Skip loading states | Less code | Users think app is broken | Never |
| Use any S3 region | Simpler config | Slow uploads for users far from region | Acceptable with user warning |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| MediaPipe WASM | Loading from wrong CDN path | Use official jsdelivr CDN, verify path |
| getUserMedia | Not handling all rejection reasons | Check NotAllowedError, NotFoundError, OverconstrainedError |
| MediaRecorder | Starting before stream is ready | Wait for `loadedmetadata` event on video |
| S3 Presigned URL | URL expires before upload completes | Use longer expiry (1 hour), show progress |
| Canvas overlay | Drawing before video frame ready | Check `video.readyState >= 2` before drawing |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running detection at 60 FPS | High CPU, hot device | Throttle to 15-30 FPS | Immediately on mobile |
| Large video resolution | Slow detection, memory issues | Cap at 720p for pose detection | > 1080p on mobile |
| Keeping all blobs in memory | Memory grows during recording | Process blobs incrementally | > 2 min recording |
| Not using GPU delegate | Slow inference | Enable GPU in MediaPipe config | All devices |
| Re-creating PoseLandmarker | Repeated 2-3 second init | Singleton pattern, init once | Every mount/unmount |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing S3 secret key in frontend | Full bucket access to anyone | Use presigned URLs from Lambda, or Cognito |
| Exposing S3 bucket publicly | Data exposure, cost attack | Require auth, use presigned URLs only |
| Not validating S3 config input | Injection attacks | Sanitize bucket name, region inputs |
| Using HTTP for camera | Browser blocks camera | Always use HTTPS in production |
| Logging landmark data | Privacy concern | Don't log to external services |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading indicator for model | Users think app is frozen | Show progress bar, explain 2-3 second load |
| Immediate camera permission prompt | Users deny reflexively | Explain first, then request |
| Tiny skeleton on mobile | Can't see feedback | Scale skeleton, use thicker lines |
| Alerts without context | Confusing feedback | "Bend knees more" not just "Bad form" |
| No confirmation before recording | Accidental recordings | Show 3-2-1 countdown |
| Unclear S3 setup | Users give up on upload | Step-by-step guide with screenshots |

## "Looks Done But Isn't" Checklist

- [ ] **Camera access:** Works on iOS Safari (not just Chrome)?
- [ ] **Pose detection:** Handles partial body visibility gracefully?
- [ ] **Recording:** Tested on Safari, Firefox, AND Chrome?
- [ ] **S3 upload:** Tested with real S3 bucket, not just mock?
- [ ] **Form alerts:** Calibrated for different body sizes/types?
- [ ] **Mobile:** Tested portrait AND landscape orientation?
- [ ] **Performance:** Tested on 3-year-old phone, not just latest?
- [ ] **Memory:** Ran for 10+ minutes without memory growth?
- [ ] **Error handling:** Shows user-friendly errors, not console.error?
- [ ] **Offline:** Fails gracefully when CDN/network unavailable?

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Memory leak | MEDIUM | Add cleanup code, may need architecture refactor |
| Wrong MIME type | LOW | Add browser detection, change one line |
| CORS issues | LOW | Update S3 bucket config, not code change |
| Permission UX | MEDIUM | Add explanation UI, permission state handling |
| Mobile orientation | MEDIUM | Add orientation detection, CSS fixes |
| Landmark instability | HIGH | Add smoothing algorithm, velocity thresholds |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Memory leaks (WASM) | Phase 1 (Foundation) | Run 10 min, check memory stable |
| Landmark instability | Phase 2 (Pose Detection) | Test at frame edges, check smoothness |
| MIME type issues | Phase 3 (Recording) | Test on Safari, Firefox, Chrome |
| Permission UX | Phase 1 (Foundation) | User test permission flow |
| S3 CORS | Phase 4 (S3 Upload) | Test from deployed domain |
| Mobile orientation | Phase 2 (Pose Detection) | Test on real iOS and Android devices |

## Sources

- [Google Developers - 7 Dos and Don'ts of ML on Web](https://developers.googleblog.com/7-dos-and-donts-of-using-ml-on-the-web-with-mediapipe/) — Memory management (HIGH confidence)
- [MediaPipe Pose Documentation](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md) — Limitations (HIGH confidence)
- [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — Browser compatibility (HIGH confidence)
- [AddPipe MediaRecorder API](https://blog.addpipe.com/mediarecorder-api/) — Cross-browser issues (MEDIUM confidence)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html) — CORS considerations (HIGH confidence)
- [Fitness App with MediaPipe](https://dev.to/yoshan0921/fitness-app-development-with-real-time-posture-detection-using-mediapipe-38do) — Real-world issues (MEDIUM confidence)

---
*Pitfalls research for: Browser-based fitness/pose detection app*
*Researched: 2026-01-15*
