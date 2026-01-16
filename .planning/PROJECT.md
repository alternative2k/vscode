# FormCheck

## What This Is

A web app that uses your device camera to provide real-time exercise form feedback. Shows a skeleton overlay with posture alerts for squats, push-ups, and general positioning. Works on laptops and mobile browsers, with recordings saved locally.

## Core Value

Real-time visual feedback on exercise form — the skeleton overlay and posture alerts must work reliably so users can self-correct during workouts.

## Current State

**Shipped:** v1.0 MVP (2026-01-16)

- 2,099 lines TypeScript across 16 files
- Tech stack: Vite, React, TypeScript, Tailwind CSS v4, MediaPipe Pose
- Deployable as static site to Vercel/Netlify/GitHub Pages

**Working features:**
- Camera access with front/back switching
- Real-time 33-landmark skeleton overlay
- General posture alerts (head tilt, shoulder alignment)
- Squat form detection (depth, knee cave, forward lean, asymmetry)
- Push-up form detection (depth, hip sag/pike, elbow flare)
- Video recording with local download
- Password protection for small group access
- Responsive mobile-first layout

## Requirements

### Validated

- ✓ Camera access with live video preview (laptop + mobile browsers) — v1.0
- ✓ Body tracking with skeleton overlay drawn on live video — v1.0
- ✓ Posture alerts for squat form (knee angle, back straightness, depth) — v1.0
- ✓ Posture alerts for push-up form (body alignment, elbow angle, depth) — v1.0
- ✓ General posture flagging for obviously wrong positions — v1.0
- ✓ Video recording (clean video without overlay burned in) — v1.0
- ✓ Local save of recordings — v1.0
- ✓ Simple authentication for small group access — v1.0
- ✓ Modern, clean UI that works on desktop and mobile — v1.0
- ✓ Deployable to free/cheap static hosting — v1.0

### Active

- [ ] Upload to user-configured S3 storage

### Out of Scope

- Backend storage (users provide their own S3) — keeps hosting costs zero
- Complex user management (simple auth only) — small group doesn't need it
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
| User-configured S3 for uploads | Zero storage costs, users own their data | — Deferred to v2 |
| Live overlay only, clean recordings | Simpler implementation, more flexible output | ✓ Good |
| Client-side pose detection | No backend needed, free hosting, privacy | ✓ Good |
| Web app over native | Single codebase covers laptop + mobile | ✓ Good |

---
*Last updated: 2026-01-16 after v1.0 milestone*
