# Architecture Research

**Domain:** Browser-based fitness/pose detection app
**Researched:** 2026-01-15
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER APPLICATION                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   Camera    │  │   Canvas    │  │  Controls   │  │  Settings │  │
│  │  Component  │  │   Overlay   │  │    Panel    │  │   Panel   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                  │
├───────────────────────────────────┼──────────────────────────────────┤
│                           STATE LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     Zustand Store                            │    │
│  │  - poseData (landmarks)    - isRecording                    │    │
│  │  - alerts (form issues)    - s3Config                       │    │
│  │  - cameraReady             - recordedBlobs                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                          SERVICES LAYER                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │  PoseService  │  │RecordService  │  │ UploadService │           │
│  │  (MediaPipe)  │  │(MediaRecorder)│  │  (S3 Client)  │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
├─────────────────────────────────────────────────────────────────────┤
│                        BROWSER APIs                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │getUserMe-│  │  Canvas  │  │  Media   │  │  Fetch   │            │
│  │   dia    │  │  2D API  │  │ Recorder │  │   API    │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │     MediaPipe CDN           │  │      User's S3 Bucket       │  │
│  │  (WASM + Model files)       │  │    (presigned URL upload)   │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| CameraComponent | Manages getUserMedia stream, video element | react-webcam or custom hook |
| CanvasOverlay | Draws skeleton on top of video | Canvas 2D API, requestAnimationFrame |
| PoseService | Runs MediaPipe inference, returns landmarks | Singleton service, async initialization |
| FormAnalyzer | Calculates angles, detects bad form | Pure functions, no side effects |
| RecordService | Manages MediaRecorder, collects blobs | Class with start/stop/getData methods |
| UploadService | Handles S3 presigned URL uploads | Fetch API with progress tracking |
| ControlsPanel | Start/stop recording, download buttons | React component with store actions |
| SettingsPanel | S3 config input, camera selection | Form with localStorage persistence |

## Recommended Project Structure

```
src/
├── components/           # React UI components
│   ├── Camera/
│   │   ├── Camera.tsx           # Main camera + overlay component
│   │   ├── CameraControls.tsx   # Record/stop/download buttons
│   │   └── index.ts
│   ├── Overlay/
│   │   ├── SkeletonCanvas.tsx   # Canvas overlay for skeleton
│   │   ├── AlertBanner.tsx      # Form alert display
│   │   └── index.ts
│   ├── Settings/
│   │   ├── SettingsPanel.tsx    # S3 config, camera selection
│   │   └── index.ts
│   └── Layout/
│       ├── Header.tsx
│       ├── MainLayout.tsx
│       └── index.ts
├── services/             # Business logic, external APIs
│   ├── pose/
│   │   ├── poseService.ts       # MediaPipe initialization & detection
│   │   ├── drawingUtils.ts      # Skeleton drawing helpers
│   │   └── index.ts
│   ├── recording/
│   │   ├── recordService.ts     # MediaRecorder wrapper
│   │   └── index.ts
│   ├── upload/
│   │   ├── s3Service.ts         # S3 upload with presigned URLs
│   │   └── index.ts
│   └── form/
│       ├── angleCalculator.ts   # Joint angle math
│       ├── squatAnalyzer.ts     # Squat form rules
│       ├── pushupAnalyzer.ts    # Push-up form rules
│       └── index.ts
├── stores/               # Zustand state management
│   ├── usePoseStore.ts          # Pose data, alerts
│   ├── useRecordStore.ts        # Recording state
│   ├── useSettingsStore.ts      # S3 config, preferences
│   └── index.ts
├── hooks/                # Custom React hooks
│   ├── useCamera.ts             # Camera stream management
│   ├── usePoseDetection.ts      # MediaPipe integration
│   ├── useRecording.ts          # Recording logic
│   └── index.ts
├── types/                # TypeScript interfaces
│   ├── pose.ts                  # Landmark types
│   ├── recording.ts             # Recording types
│   ├── settings.ts              # Config types
│   └── index.ts
├── utils/                # Pure utility functions
│   ├── geometry.ts              # Angle calculations
│   ├── validation.ts            # Form validation
│   └── index.ts
├── constants/            # App constants
│   ├── poseConfig.ts            # MediaPipe config
│   ├── formRules.ts             # Squat/push-up thresholds
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

### Structure Rationale

- **components/:** Feature-grouped UI, each with own folder for related files
- **services/:** Isolated business logic, testable without React
- **stores/:** Separate stores per domain (pose, recording, settings)
- **hooks/:** Bridge between services and components
- **types/:** Shared TypeScript interfaces, co-located with related code

## Architectural Patterns

### Pattern 1: Dual Stream for Clean Recording

**What:** Capture two streams from camera — one for display (with overlay), one for recording (clean)

**When to use:** Always when overlay shouldn't be in recording

**Trade-offs:**
- Pro: Clean recordings, flexible post-processing
- Con: Slightly more memory usage (negligible)

**Example:**
```typescript
// Get single camera stream
const stream = await navigator.mediaDevices.getUserMedia({ video: true });

// Use same stream for both purposes
// Video element shows stream directly
videoElement.srcObject = stream;

// Canvas overlays skeleton ON TOP of video (not burned in)
// MediaRecorder captures from video element (clean, no canvas)
const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
```

### Pattern 2: Service Singleton with Lazy Init

**What:** Initialize heavy resources (MediaPipe) once, reuse across components

**When to use:** For expensive resources like ML models

**Trade-offs:**
- Pro: Fast subsequent access, single model load
- Con: Initial load time, careful cleanup needed

**Example:**
```typescript
// services/pose/poseService.ts
let poseLandmarker: PoseLandmarker | null = null;

export async function initPoseDetection(): Promise<PoseLandmarker> {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "pose_landmarker_lite.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });

  return poseLandmarker;
}
```

### Pattern 3: requestAnimationFrame Detection Loop

**What:** Run pose detection in sync with display refresh

**When to use:** For smooth real-time overlay rendering

**Trade-offs:**
- Pro: Smooth animation, efficient GPU usage
- Con: Must handle cleanup carefully

**Example:**
```typescript
function startDetectionLoop(
  video: HTMLVideoElement,
  onPoseDetected: (landmarks: NormalizedLandmark[]) => void
) {
  let animationId: number;

  const detect = async () => {
    if (video.readyState >= 2) {
      const result = poseLandmarker.detectForVideo(video, performance.now());
      if (result.landmarks[0]) {
        onPoseDetected(result.landmarks[0]);
      }
    }
    animationId = requestAnimationFrame(detect);
  };

  detect();

  return () => cancelAnimationFrame(animationId);
}
```

## Data Flow

### Video Pipeline

```
[Camera]
    │
    ▼
[getUserMedia Stream]
    │
    ├──────────────────────────────┐
    │                              │
    ▼                              ▼
[Video Element]              [MediaRecorder]
    │                              │
    ▼                              ▼
[PoseLandmarker.detectForVideo]   [Blob chunks]
    │                              │
    ▼                              ▼
[Landmarks Array]             [Final video Blob]
    │                              │
    ▼                              │
[FormAnalyzer]                     │
    │                              │
    ▼                              │
[Alerts]                           │
    │                              │
    ▼                              ▼
[Canvas Overlay] ◄─────────── [Download / S3 Upload]
```

### State Management

```
[User Action]
    │
    ▼
[React Component]
    │
    ▼
[Zustand Action] ──────────────────────────────────┐
    │                                              │
    ▼                                              │
[Store State Update]                               │
    │                                              │
    ├──────────────────────────────┐               │
    │                              │               │
    ▼                              ▼               │
[Component Re-render]    [Persist to localStorage] │
    │                              │               │
    ▼                              ▼               │
[Updated UI]             [Settings saved]          │
                                                   │
[Service Call] ◄───────────────────────────────────┘
    │
    ▼
[External API / Browser API]
```

### Key Data Flows

1. **Pose Detection Flow:** Camera → Video Element → MediaPipe → Landmarks → State → Canvas
2. **Recording Flow:** Camera → MediaRecorder → Blobs → Complete Video → Download/Upload
3. **Alert Flow:** Landmarks → Angle Calculator → Form Rules → Alert State → UI Banner
4. **Settings Flow:** User Input → Validation → Store → localStorage → Service Config

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 users | Current architecture is fine, static hosting sufficient |
| 10-100 users | May need CDN for MediaPipe WASM files if slow loads |
| 100+ users | Consider self-hosting WASM/models, add error tracking |

### Scaling Priorities

1. **First bottleneck:** Model loading time on slow connections — use loading states, cache aggressively
2. **Second bottleneck:** Mobile performance — offer quality/performance toggle, reduce resolution

## Anti-Patterns

### Anti-Pattern 1: Processing Every Frame

**What people do:** Run pose detection on every single video frame
**Why it's wrong:** Wastes CPU, causes jank, drains battery
**Do this instead:** Use requestAnimationFrame, skip frames if behind, throttle to 15-30 FPS

### Anti-Pattern 2: Storing Landmark History in State

**What people do:** Keep all historical landmark data in React state
**Why it's wrong:** Memory grows unbounded, causes re-renders
**Do this instead:** Only store current frame's landmarks, use refs for history if needed

### Anti-Pattern 3: Recording Canvas Instead of Video

**What people do:** Use canvas.captureStream() to record video with overlay
**Why it's wrong:** Lower quality, complex encoding, larger files
**Do this instead:** Record original stream, overlay is display-only

### Anti-Pattern 4: Synchronous Model Loading

**What people do:** Load MediaPipe model in component render
**Why it's wrong:** Blocks UI, causes hydration issues, poor UX
**Do this instead:** Load in useEffect with loading state, show skeleton/placeholder

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| MediaPipe CDN | Script/WASM load at init | Cache headers important, fallback if CDN fails |
| User's S3 Bucket | Presigned URL PUT request | User provides bucket, region, credentials for signing |
| AWS Cognito (optional) | Identity pool for temp creds | If users don't want to manage S3 credentials directly |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components ↔ Services | Hooks as bridge | Services return data, components dispatch actions |
| Services ↔ Browser APIs | Direct calls | Services encapsulate browser API complexity |
| Stores ↔ Components | Zustand selectors | Use selectors to prevent unnecessary re-renders |

## Sources

- [MediaPipe Pose Landmarker Web Guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js) — Official API reference (HIGH confidence)
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — Recording API (HIGH confidence)
- [React Architecture Best Practices 2024](https://www.sitepoint.com/react-architecture-best-practices/) — Structure patterns (MEDIUM confidence)
- [Fitness App with MediaPipe and React](https://dev.to/yoshan0921/fitness-app-development-with-real-time-posture-detection-using-mediapipe-38do) — Real implementation (HIGH confidence)
- [Building Real-Time Posture Monitoring](https://medium.com/@psr8084/building-a-real-time-posture-monitoring-application-with-mediapipe-and-react-a-comprehensive-guide-e7c7a8adc536) — Architecture patterns (MEDIUM confidence)

---
*Architecture research for: Browser-based fitness/pose detection app*
*Researched: 2026-01-15*
