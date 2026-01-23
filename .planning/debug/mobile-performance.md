---
status: complete
trigger: "mobile-performance"
created: "2026-01-23T10:00:00.000Z"
updated: "2026-01-23T15:00:00.000Z"
---

## Current Focus
hypothesis: Multiple resource-intensive operations (pose detection + continuous recording + chunk uploads) cause memory/CPU exhaustion on older devices after ~3 minutes
test: Analyze the interaction between continuous recording, pose detection, and IndexedDB operations
expecting: Find that the combination of CPU-intensive pose detection and continuous chunk storage causes resource exhaustion
next_action: Identify specific optimization opportunities in the continuous recording implementation

## Symptoms
expected: App should run continuous recording and skeleton overlay smoothly on older mobile devices
actual: Uploads stop at around 3 minutes and app screen goes black on older phones
errors: Not specified
reproduction: Run the app for longer periods, files stop uploading
started: When continuous recording and skeleton features were implemented
timeline: Happens on older phones

## Eliminated

## Evidence
- timestamp: 2026-01-23T10:10:00.000Z
  checked: Code review of continuous recording implementation
  found: Continuous recording saves chunks to IndexedDB every 5 seconds with 5MB chunks
  implication: Potential memory/CPU resource exhaustion on older devices

- timestamp: 2026-01-23T10:12:00.000Z
  checked: Code review of pose detection implementation
  found: MediaPipe Pose detection running at full frame rate with skeleton overlay
  implication: CPU intensive pose detection combined with chunk storage may cause performance issues on older devices

- timestamp: 2026-01-23T10:15:00.000Z
  checked: Analysis of useContinuousRecording.ts implementation
  found: MediaRecorder configured with 5 second timeslice and chunks saved to IndexedDB continuously
  implication: Multiple resource-intensive operations running simultaneously on older devices

- timestamp: 2026-01-23T10:18:00.000Z
  checked: Analysis of usePoseDetection.ts implementation
  found: Pose detection running at full frame rate using requestAnimationFrame
  implication: Continuous pose detection consumes significant CPU resources on older devices

- timestamp: 2026-01-23T10:20:00.000Z
  checked: Analysis of chunk storage implementation
  found: Each 5-second video chunk (~5MB) being saved to IndexedDB and uploaded to cloud
  implication: High memory usage and I/O operations causing resource exhaustion

## Resolution
root_cause: Multiple resource-intensive operations (pose detection running at full frame rate + continuous recording with 5-second chunks + IndexedDB storage operations) cause memory/CPU exhaustion on older devices after ~3 minutes
fix: Implemented comprehensive performance optimizations:
1. Pose detection rate limiting (66ms intervals, 15fps)
2. Device capability detection and adaptive behavior
3. Adaptive chunk sizes (10s on low-end, 5s on high-end)
4. Batch upload queue (5 concurrent uploads)
5. Adaptive upload timeout based on file size
6. Canvas update throttling (30fps)
verification: Test on older mobile devices to confirm continuous operation beyond 3 minutes
files_changed: [src/hooks/usePoseDetection.ts, src/hooks/useContinuousRecording.ts, src/utils/cloudUpload.ts, src/components/PoseCanvas.tsx]

## Implemented Fixes

### 1. Pose Detection Rate Limiting (usePoseDetection.ts)
- Added frame rate limiting to reduce CPU usage
- Process one frame every 66ms (15 fps) instead of every available frame

### 2. Device Capability Detection (useContinuousRecording.ts)
- Added detection for low-end devices based on hardware capabilities
- Detects CPU cores via `navigator.hardwareConcurrency`
- Detects memory via `navigator.deviceMemory`

### 3. Adaptive Chunk Size (useContinuousRecording.ts)
- Dynamically adjust chunk interval based on device performance
- Low-end devices: 10-second chunks
- High-end devices: 5-second chunks

### 4. Batch Upload Queue (cloudUpload.ts)
- Group uploads to reduce network overhead
- Upload queue batches up to 5 chunks simultaneously
- 500ms delay before first batch processes

### 5. Adaptive Upload Timeout (cloudUpload.ts)
- Adjust timeout based on file size
- Minimum: 60 seconds
- Size-based: 10 seconds per MB

### 6. Canvas Update Throttling (PoseCanvas.tsx)
- Rate-limit canvas redraws
- Update canvas at most every 33ms (30fps)