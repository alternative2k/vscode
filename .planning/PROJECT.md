# FormCheck

## What This Is

A web app that uses your device camera to provide real-time exercise form feedback. Shows a skeleton overlay with severity-based visual highlighting and posture alerts for squats, push-ups, and general positioning. Works on laptops and mobile browsers with fullscreen support, orientation-aware layout, and recordings saved locally or to the cloud.

## Core Value

Real-time visual feedback on exercise form — the skeleton overlay and posture alerts must work reliably so users can self-correct during workouts.

## Current State

**Shipped:** v3.0 User Access Control (2026-01-22)

- 5,940 lines TypeScript across 32 files
- Tech stack: Vite, React, TypeScript, Tailwind CSS v4, MediaPipe Pose, Cloudflare Pages/R2/KV
- Deployable to Cloudflare Pages (requires KV namespace binding)

**Working features:**
- Camera access with front/back switching
- Real-time 33-landmark skeleton overlay
- General posture alerts (head tilt, shoulder alignment)
- Squat form detection (depth, knee cave, forward lean, asymmetry)
- Push-up form detection (depth, hip sag/pike, elbow flare)
- Video recording with local download
- Recording history with IndexedDB persistence
- Multi-user authentication with user identity (id, name, isAdmin)
- Admin-controlled app lock with Cloudflare KV persistence
- Per-user cloud storage folders (userId prefix in R2 paths)
- Responsive mobile-first layout
- Secure cloud uploads via Cloudflare R2 (presigned URLs, no client credentials)
- Continuous background recording with progressive chunk saving
- Automatic upload on page exit (visibilitychange handling)
- Manual recording works independently with direct upload option
- Fullscreen mode with orientation-aware layout for mobile workouts
- Severity-based skeleton highlighting (problem body parts glow yellow/red)
- Color-coded alert banners matching severity levels
- Auto-start continuous recording on camera load
- Status indicator showing recording/uploading/retrying states
- Date-based cloud folder organization with resilient retry uploads

## Requirements

### Validated

- ✓ Camera access with live video preview (laptop + mobile browsers) — v1.0
- ✓ Body tracking with skeleton overlay drawn on live video — v1.0
- ✓ Posture alerts for squat form (knee angle, back straightness, depth) — v1.0
- ✓ Posture alerts for push-up form (body alignment, elbow angle, depth) — v1.0
- ✓ General posture flagging for obviously wrong positions — v1.0
- ✓ Video recording (clean video without overlay burned in) — v1.0
- ✓ Local save of recordings — v1.0
- ✓ Recording history with persistence — v1.1
- ✓ Simple authentication for small group access — v1.0
- ✓ Modern, clean UI that works on desktop and mobile — v1.0
- ✓ Deployable to free/cheap static hosting — v1.0
- ✓ Secure cloud uploads (presigned URLs, no client credentials) — v2.1
- ✓ Continuous background recording with auto-upload — v2.1
- ✓ Manual recording independent of continuous mode — v2.1
- ✓ Fullscreen mode for immersive workout sessions — v2.2
- ✓ Orientation-aware layout for landscape mode — v2.2
- ✓ Severity-based visual feedback on skeleton overlay — v2.2
- ✓ Auto-start continuous recording on camera load — v2.3
- ✓ Status indicator for continuous recording state — v2.3
- ✓ Date-based folder organization for cloud uploads — v2.3
- ✓ Resilient upload with retry and network reconnection handling — v2.3

### Active

(None — all current requirements shipped)

**Validated in v3.0:**
- Multi-user authentication with user identity (id, name, isAdmin) — v3.0
- Admin-controlled app lock for blocking non-admin users — v3.0
- Per-user cloud storage folders in R2 — v3.0

### Out of Scope

- Client-side credential storage — presigned URLs keep credentials server-side
- Admin UI for user management — env var config sufficient for small group
- Overlay burned into recordings — user wants clean video files
- Rep counting or joint angle stats — posture alerts are the focus
- Native mobile apps — web app covers both platforms

## Context

Target users are a small group who want to check their exercise form during workouts. The app runs in-browser using the device camera, with body pose detection handled client-side via MediaPipe Pose.

S3 upload (deferred to v2) means users would configure their own bucket credentials, keeping the app fully static with no backend costs.

## Constraints

- **Hosting**: Must run on free tier static hosting (Vercel, Netlify, GitHub Pages)
- **Storage**: No backend storage — users provide S3 credentials
- **Browser compatibility**: Must work on modern Chrome, Safari, Firefox on desktop and mobile
- **Client-side processing**: All pose detection runs in browser (no server-side ML)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tailwind CSS v4 with @tailwindcss/vite | Native Vite integration, no PostCSS config | ✓ Good |
| CDN-hosted MediaPipe models | Smaller bundle size, faster initial load | ✓ Good |
| Custom hooks pattern | Encapsulates media APIs (useCamera, usePoseDetection, useRecording, useExerciseAlerts) | ✓ Good |
| Mirror video for front camera | Natural selfie-style view for form checking | ✓ Good |
| 500ms debounce on alerts | Prevents flicker without feeling laggy | ✓ Good |
| 100° thresholds for squat/pushup depth | Balances sensitivity with false positives | ✓ Good |
| Side-view recommendation for push-ups | Better body line detection from side angle | ✓ Good |
| Cloudflare R2 with presigned URLs | Server-side credentials, no client exposure | ✓ Good |
| aws4fetch for signing in Workers | AWS SDK v3 not compatible with Workers runtime | ✓ Good |
| 5-second chunk timeslice | Balance between request frequency and data at risk | ✓ Good |
| visibilitychange for page exit | More reliable than beforeunload | ✓ Good |
| Separate IndexedDB for chunks | Isolates continuous recording from manual recordings | ✓ Good |
| Live overlay only, clean recordings | Simpler implementation, more flexible output | ✓ Good |
| CSS media queries for orientation | More performant than JS state tracking | ✓ Good |
| Hide unsupported fullscreen button | Better UX than disabled state or error | ✓ Good |
| Yellow warnings, red errors on skeleton | Clear visual severity escalation | ✓ Good |
| Glow effect for highlighted landmarks | Visibility against any background | ✓ Good |
| Fallback polling for video dimensions | Cross-browser reliability | ✓ Good |
| Auto-start continuous recording | Seamless UX, no manual toggle | ✓ Good |
| Options object for hook config | Future extensibility | ✓ Good |
| Orange for retry state | Visual distinction from regular upload | ✓ Good |
| Max 5 retries per chunk | Balance persistence vs infinite loops | ✓ Good |
| Window online event for reconnection | Standard browser API | ✓ Good |
| Date folder format (YYYY-MM-DD) | Easy organization and browsing | ✓ Good |
| Client-side pose detection | No backend needed, free hosting, privacy | ✓ Good |
| Web app over native | Single codebase covers laptop + mobile | ✓ Good |
| Native IndexedDB API (no wrapper) | Simple use case, fewer dependencies | ✓ Good |
| Auto-increment id for recordings | Simplifies storage layer | ✓ Good |
| Modal overlay with click-to-close | Intuitive UX for recording history | ✓ Good |
| Store User object in localStorage | Session persistence across refreshes | ✓ Good |
| VITE_USERS JSON env var | Simple multi-user config without database | ✓ Good |
| VITE_APP_PASSWORD fallback | Backward compatibility with single-user | ✓ Good |
| Cloudflare KV for app lock | Global state persistence, serverless | ✓ Good |
| 30-second polling for lock state | Balance freshness vs API calls | ✓ Good |
| Admins immune to lock | Admin always has access to manage | ✓ Good |
| userId prefix in R2 paths | Per-user organization without database | ✓ Good |

---
*Last updated: 2026-01-22 after v3.0 milestone*
