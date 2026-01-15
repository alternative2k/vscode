# Stack Research

**Domain:** Browser-based fitness/pose detection app
**Researched:** 2026-01-15
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.x | UI Framework | Component-based architecture ideal for real-time video apps, excellent TypeScript support, large ecosystem |
| TypeScript | 5.x | Type Safety | Catches errors early, better IDE support, essential for complex pose detection logic |
| MediaPipe Tasks Vision | @mediapipe/tasks-vision | Pose Detection | Google's production-ready solution, runs at 60 FPS on modest hardware, 33 body landmarks, works in browser |
| Vite | 5.x | Build Tool | Fast HMR, excellent for development, simple static site output for free hosting |
| Tailwind CSS | 3.x | Styling | Rapid UI development, responsive design out of the box, small production bundle |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @aws-sdk/client-s3 | 3.x | S3 Upload | For presigned URL generation (if using Lambda) |
| @aws-sdk/s3-request-presigner | 3.x | Presigned URLs | Direct browser upload to S3 |
| react-webcam | 7.x | Camera Access | Simplified getUserMedia wrapper for React |
| zustand | 4.x | State Management | Lightweight, simple state for recording status, pose data |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Code Quality | Use with TypeScript parser |
| Prettier | Formatting | Consistent code style |
| MediaPipe Studio | Model Testing | Test pose detection before coding |

## Installation

```bash
# Core
npm create vite@latest formcheck -- --template react-ts
cd formcheck
npm install

# Pose Detection
npm install @mediapipe/tasks-vision

# UI
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Camera & State
npm install react-webcam zustand

# S3 Upload (optional - for presigned URL approach)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Dev dependencies
npm install -D @types/react @types/react-dom eslint prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| MediaPipe | TensorFlow.js PoseNet | Legacy projects, need multi-person detection |
| MediaPipe | OpenPose | Need highest accuracy, have GPU server |
| React | Vue 3 | Team preference, smaller bundle size priority |
| React | Vanilla JS | Absolute minimum bundle size, simple UI |
| Vite | Next.js | Need SSR (not needed for this static app) |
| Zustand | Redux | Complex state with time-travel debugging needs |
| Tailwind | Styled Components | Prefer CSS-in-JS, component-scoped styles |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| TensorFlow.js PoseNet | Older, less accurate, larger bundle, single-person only | MediaPipe Tasks Vision |
| Create React App | Deprecated, slow builds, no longer maintained | Vite |
| AWS SDK v2 | Larger bundle, older patterns | AWS SDK v3 (modular) |
| moment.js | Huge bundle for simple date formatting | date-fns or native Intl |
| jQuery | Unnecessary with React, adds bloat | Native DOM APIs |

## Stack Patterns by Variant

**If targeting older mobile devices:**
- Use MediaPipe Lite model (faster, less accurate)
- Reduce video resolution to 640x480
- Lower frame rate to 15-20 FPS

**If targeting desktop only:**
- Use MediaPipe Full or Heavy model
- Enable higher resolution (1080p)
- Target 30+ FPS

**If S3 credentials must stay client-side:**
- Use AWS Cognito Identity Pools
- Or implement simple presigned URL Lambda
- Never store raw AWS credentials in frontend code

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @mediapipe/tasks-vision@0.10.x | React 18.x | Requires WASM support in browser |
| react-webcam@7.x | React 18.x | Uses forwardRef pattern |
| Vite 5.x | Node 18+ | ESM-first, ensure Node version |

## Sources

- [MediaPipe Pose Landmarker Web Guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js) — Official Google documentation (HIGH confidence)
- [Google Developers Blog - 7 Dos and Don'ts of ML on Web](https://developers.googleblog.com/7-dos-and-donts-of-using-ml-on-the-web-with-mediapipe/) — Best practices (HIGH confidence)
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — Browser recording API (HIGH confidence)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html) — Official AWS docs (HIGH confidence)
- [Real-Time Body Tracking with MediaPipe](https://medium.com/@creativeaininja/real-time-body-tracking-in-your-browser-what-mediapipe-actually-does-and-how-to-use-it-b31aa96a5071) — Implementation patterns (MEDIUM confidence)

---
*Stack research for: Browser-based fitness/pose detection app*
*Researched: 2026-01-15*
